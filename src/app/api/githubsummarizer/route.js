import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { createGitHubSummaryChain, createFallbackSummaryChain } from '../../../lib/langchain';
import { checkRateLimit, updateApiUsage, getRateLimitHeaders } from '../../../lib/rateLimit';

// Function to get repository information from GitHub
async function getGitHubRepoInfo(repositoryUrl) {
  try {
    // Parse the GitHub URL to extract owner and repo
    const urlParts = repositoryUrl.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];
    
    if (!owner || !repo) {
      throw new Error('Invalid GitHub repository URL');
    }

    // Make parallel requests to GitHub API
    const [repoResponse, releaseResponse, readmeResponse] = await Promise.allSettled([
      // Repository info
      fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'API-Manager-App'
        }
      }),
      // Latest release
      fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'API-Manager-App'
        }
      }),
      // README content
      fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'API-Manager-App'
        }
      })
    ]);

    // Handle repository info
    if (repoResponse.status === 'rejected' || !repoResponse.value.ok) {
      if (repoResponse.value?.status === 404) {
        return {
          success: false,
          message: 'Repository not found',
          error: 'REPO_NOT_FOUND'
        };
      }
      throw new Error(`GitHub API error: ${repoResponse.value?.status || 'Network error'}`);
    }

    const repoData = await repoResponse.value.json();

    // Handle latest release (optional - don't fail if missing)
    let latestRelease = null;
    if (releaseResponse.status === 'fulfilled' && releaseResponse.value.ok) {
      try {
        const releaseData = await releaseResponse.value.json();
        latestRelease = {
          tag_name: releaseData.tag_name,
          name: releaseData.name,
          published_at: releaseData.published_at,
          html_url: releaseData.html_url
        };
      } catch (error) {
        console.log('Error parsing release data:', error.message);
      }
    }

    // Handle README content (optional - don't fail if missing)
    let readmeContent = null;
    if (readmeResponse.status === 'fulfilled' && readmeResponse.value.ok) {
      try {
        const readmeData = await readmeResponse.value.json();
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      } catch (error) {
        console.log('Error parsing README data:', error.message);
      }
    }
    
    return {
      success: true,
      message: 'Repository information retrieved successfully',
      data: {
        repository: {
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description,
          language: repoData.language,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          watchers: repoData.watchers_count,
          open_issues: repoData.open_issues_count,
          created_at: repoData.created_at,
          updated_at: repoData.updated_at,
          homepage: repoData.homepage,
          html_url: repoData.html_url,
          clone_url: repoData.clone_url,
          default_branch: repoData.default_branch,
          size: repoData.size,
          archived: repoData.archived,
          disabled: repoData.disabled,
          private: repoData.private,
          license: repoData.license
        },
        latest_release: latestRelease,
        readme_content: readmeContent
      }
    };

  } catch (error) {
    console.error('Error fetching repository information:', error);
    return {
      success: false,
      message: 'Failed to fetch repository information',
      error: 'FETCH_ERROR',
      details: error.message
    };
  }
}

export async function POST(request) {
  const startTime = Date.now();
  let apiKeyId = null;

  try {
    const apiKey = request.headers.get('x-apikey-header');
    const { repositoryUrl, summaryType } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key is required in x-apikey-header',
          error: 'MISSING_API_KEY'
        }, 
        { status: 400 }
      );
    }

    if (!repositoryUrl) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Repository URL is required',
          error: 'MISSING_REPOSITORY_URL'
        }, 
        { status: 400 }
      );
    }

    // Validate the API key first
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('status', 'active')
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid API key',
          error: 'INVALID_API_KEY'
        }, 
        { status: 401 }
      );
    }

    apiKeyId = keyData.id;

    // Check rate limits
    const rateLimitResult = await checkRateLimit(apiKeyId);
    
    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(
        rateLimitResult.currentUsage || { minute: 0, hour: 0, day: 0, month: 0 },
        rateLimitResult.builtinLimits || { minute: 1, hour: 10, day: 100, month: 1000 },
        rateLimitResult.userLimits || {}
      );
      
      return NextResponse.json(
        {
          success: false,
          message: 'Rate limit exceeded',
          error: 'RATE_LIMIT_EXCEEDED',
          details: {
            reason: rateLimitResult.reason,
            limitType: rateLimitResult.limitType,
            period: rateLimitResult.period,
            limit: rateLimitResult.limit,
            current: rateLimitResult.current,
            resetTime: rateLimitResult.resetTime
          }
        },
        { 
          status: 429,
          headers: headers
        }
      );
    }

    // Get repository information from GitHub
    const repoInfoResult = await getGitHubRepoInfo(repositoryUrl);

    // Generate summary using LangChain
    let summaryResult;
    if (repoInfoResult.success && repoInfoResult.data.readme_content) {
      summaryResult = await createGitHubSummaryChain(repoInfoResult.data.readme_content, repositoryUrl);
    } else {
      summaryResult = await createFallbackSummaryChain(repositoryUrl);
    }

    const responseTime = Date.now() - startTime;

    // Update API usage
    await updateApiUsage(apiKeyId);

    const headers = getRateLimitHeaders(
      rateLimitResult.currentUsage,
      rateLimitResult.builtinLimits,
      rateLimitResult.userLimits
    );

    return NextResponse.json({
      success: true,
      message: 'GitHub repository summarized successfully',
      summary: summaryResult.summary,
      cool_facts: summaryResult.cool_facts,
      stars: repoInfoResult.success ? repoInfoResult.data.repository.stars : null,
      latest_version: repoInfoResult.success && repoInfoResult.data.latest_release ? repoInfoResult.data.latest_release.tag_name : null,
      website_url: repoInfoResult.success ? repoInfoResult.data.repository.homepage : null,
      license: repoInfoResult.success ? repoInfoResult.data.repository.license?.name : null,
      response_time: responseTime
    }, { headers });

  } catch (error) {
    console.error('GitHub summarizer error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const startTime = Date.now();
  let apiKeyId = null;

  const apiKey = request.headers.get('x-apikey-header');
  const { searchParams } = new URL(request.url);
  const repositoryUrl = searchParams.get('repositoryUrl');
  const summaryType = searchParams.get('summaryType') || 'general';

  if (!apiKey) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'API key is required in x-apikey-header',
        error: 'MISSING_API_KEY'
      }, 
      { status: 400 }
    );
  }

  if (!repositoryUrl) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Repository URL is required. Use ?repositoryUrl=your_repo_url',
        error: 'MISSING_REPOSITORY_URL'
      }, 
      { status: 400 }
    );
  }

  try {
    // Validate the API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('status', 'active')
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid API key',
          error: 'INVALID_API_KEY'
        }, 
        { status: 401 }
      );
    }

    apiKeyId = keyData.id;

    // Check rate limits
    const rateLimitResult = await checkRateLimit(apiKeyId);
    
    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(
        rateLimitResult.currentUsage || { minute: 0, hour: 0, day: 0, month: 0 },
        rateLimitResult.builtinLimits || { minute: 1, hour: 10, day: 100, month: 1000 },
        rateLimitResult.userLimits || {}
      );
      
      return NextResponse.json(
        {
          success: false,
          message: 'Rate limit exceeded',
          error: 'RATE_LIMIT_EXCEEDED',
          details: {
            reason: rateLimitResult.reason,
            limitType: rateLimitResult.limitType,
            period: rateLimitResult.period,
            limit: rateLimitResult.limit,
            current: rateLimitResult.current,
            resetTime: rateLimitResult.resetTime
          }
        },
        { 
          status: 429,
          headers: headers
        }
      );
    }

    // Get repository information from GitHub
    const repoInfoResult = await getGitHubRepoInfo(repositoryUrl);

    // Generate summary using LangChain
    let summaryResult;
    if (repoInfoResult.success && repoInfoResult.data.readme_content) {
      summaryResult = await createGitHubSummaryChain(repoInfoResult.data.readme_content, repositoryUrl);
    } else {
      summaryResult = await createFallbackSummaryChain(repositoryUrl);
    }

    const responseTime = Date.now() - startTime;

    // Update API usage
    await updateApiUsage(apiKeyId);

    const headers = getRateLimitHeaders(
      rateLimitResult.currentUsage,
      rateLimitResult.builtinLimits,
      rateLimitResult.userLimits
    );

    return NextResponse.json({
      success: true,
      message: 'GitHub repository summarized successfully',
      summary: summaryResult.summary,
      cool_facts: summaryResult.cool_facts,
      stars: repoInfoResult.success ? repoInfoResult.data.repository.stars : null,
      latest_version: repoInfoResult.success && repoInfoResult.data.latest_release ? repoInfoResult.data.latest_release.tag_name : null,
      website_url: repoInfoResult.success ? repoInfoResult.data.repository.homepage : null,
      license: repoInfoResult.success ? repoInfoResult.data.repository.license?.name : null,
      response_time: responseTime
    }, { headers });

  } catch (error) {
    console.error('GitHub summarizer error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  }
}
