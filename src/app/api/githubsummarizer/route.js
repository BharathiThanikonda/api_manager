import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { createGitHubSummaryChain, createFallbackSummaryChain } from '../../../lib/langchain';

// Function to get README.md content from GitHub
async function getGitHubReadme(repositoryUrl) {
  try {
    // Parse the GitHub URL to extract owner and repo
    const urlParts = repositoryUrl.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];
    
    if (!owner || !repo) {
      throw new Error('Invalid GitHub repository URL');
    }

    // GitHub API endpoint for README content
    const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
    
    // Make request to GitHub API
    const response = await fetch(readmeUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'API-Manager-App'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: 'README.md not found in this repository',
          error: 'README_NOT_FOUND'
        };
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Decode the content from base64
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    
    return {
      success: true,
      message: 'README.md retrieved successfully',
      data: {
        content: content,
        size: data.size,
        sha: data.sha,
        url: data.url,
        downloadUrl: data.download_url
      }
    };

  } catch (error) {
    console.error('Error fetching README:', error);
    return {
      success: false,
      message: 'Failed to fetch README.md',
      error: 'FETCH_ERROR',
      details: error.message
    };
  }
}

export async function POST(request) {
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

    // Update last_used timestamp and increment usage
    await supabase
      .from('api_keys')
      .update({ 
        last_used: new Date().toISOString(),
        usage: (keyData.usage || 0) + 1
      })
      .eq('id', keyData.id);

    // Get README content from GitHub
    const readmeResult = await getGitHubReadme(repositoryUrl);

    // Generate summary using LangChain
    let summaryResult;
    if (readmeResult.success && readmeResult.data.content) {
      summaryResult = await createGitHubSummaryChain(readmeResult.data.content, repositoryUrl);
    } else {
      summaryResult = await createFallbackSummaryChain(repositoryUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'GitHub repository summarized successfully',
      data: {
        repositoryUrl,
        summaryType: summaryType || 'general',
        readme: readmeResult,
        summary: summaryResult,
        keyId: keyData.id,
        keyName: keyData.name,
        usage: keyData.usage + 1,
        lastUsed: new Date().toISOString()
      }
    });

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

    // Get README content from GitHub
    const readmeResult = await getGitHubReadme(repositoryUrl);

    // Generate summary using LangChain
    let summaryResult;
    if (readmeResult.success && readmeResult.data.content) {
      summaryResult = await createGitHubSummaryChain(readmeResult.data.content, repositoryUrl);
    } else {
      summaryResult = await createFallbackSummaryChain(repositoryUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'GitHub repository summarized successfully',
      data: {
        repositoryUrl,
        summaryType,
        readme: readmeResult,
        summary: summaryResult,
        keyId: keyData.id,
        keyName: keyData.name,
        usage: keyData.usage,
        lastUsed: keyData.last_used
      }
    });

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
