// Enhanced README analysis and summarization with AI
export async function createGitHubSummaryChain(readmeContent, repositoryUrl) {
  try {
    // Parse the README content properly
    const lines = readmeContent.split('\n');
    
    // Debug: Log first few lines to see what we're working with
    console.log('First 5 lines of README:', lines.slice(0, 5));
    
    // Use AI model for better analysis
    const aiResult = await analyzeWithAI(readmeContent, repositoryUrl);
    
    if (aiResult.success) {
      return aiResult;
    } else {
      // Fallback to text-based analysis if AI fails
      console.log('AI analysis failed, using text-based fallback');
      return await createTextBasedSummary(readmeContent, repositoryUrl);
    }

  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      success: false,
      error: 'SUMMARIZATION_ERROR',
      message: 'Failed to generate summary',
      details: error.message
    };
  }
}

// AI-powered analysis using Google Gemini
async function analyzeWithAI(readmeContent, repositoryUrl) {
  try {
    // Check if Google API key is available
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not found in environment variables');
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // Use gemini-1.5-flash for better performance
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Analyze this GitHub repository README and provide a comprehensive summary.
    
    Repository URL: ${repositoryUrl}
    README Content:
    ${readmeContent.substring(0, 8000)} // Limit content to avoid token limits
    
    Please provide a JSON response with the following structure:
    {
      "summary": "A comprehensive summary of the repository in 2-3 sentences",
      "cool_facts": [
        "Interesting fact 1 about the repository",
        "Interesting fact 2 about the repository", 
        "Interesting fact 3 about the repository",
        "Interesting fact 4 about the repository",
        "Interesting fact 5 about the repository"
      ]
    }
    
    Make the summary informative and the cool facts genuinely interesting and relevant to the repository.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          summary: parsed.summary || 'AI-generated summary',
          cool_facts: parsed.cool_facts || ['AI analysis completed']
        };
      }
    } catch (parseError) {
      console.log('Failed to parse AI response as JSON:', parseError);
    }
    
    // If JSON parsing fails, extract summary from text
    const lines = text.split('\n');
    const summary = lines.find(line => line.includes('summary') || line.length > 20) || 'AI-generated summary';
    const cool_facts = lines.filter(line => line.includes('fact') || line.includes('•') || line.includes('-')).slice(0, 5);
    
    return {
      success: true,
      summary: summary,
      cool_facts: cool_facts.length > 0 ? cool_facts : ['AI analysis completed successfully']
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      success: false,
      error: 'AI_ANALYSIS_ERROR',
      message: 'Failed to analyze with AI',
      details: error.message
    };
  }
}

// Text-based analysis (fallback)
async function createTextBasedSummary(readmeContent, repositoryUrl) {
  const lines = readmeContent.split('\n');
  
  const title = extractTitle(lines);
  const description = extractDescription(lines);
  const features = extractFeatures(lines);
  const technologies = extractTechnologies(lines);
  const installation = extractInstallation(lines);
  const usage = extractUsage(lines);
  
  // Debug: Log extracted information
  console.log('Extracted title:', title);
  console.log('Extracted description:', description);
  
  // Generate a comprehensive summary
  const summary = `${title} ${description}. ${features.length > 0 ? `Key features include: ${features.slice(0, 3).join(', ')}.` : ''} ${technologies.length > 0 ? `Built with ${technologies.slice(0, 3).join(', ')}.` : ''} ${installation ? 'Includes installation and setup instructions.' : ''} ${usage ? 'Provides usage examples and documentation.' : ''}`;
  
  // Generate meaningful cool facts
  const cool_facts = [];
  
  // Basic repository info
  cool_facts.push(`Repository: ${title}`);
  cool_facts.push(`README size: ${readmeContent.length} characters`);
  cool_facts.push(`Lines of documentation: ${lines.length}`);
  
  // Technology insights
  if (technologies.length > 0) {
    cool_facts.push(`Technologies used: ${technologies.slice(0, 3).join(', ')}`);
  }
  
  // Feature insights
  if (features.length > 0) {
    cool_facts.push(`Key features: ${features.length} documented features`);
  }
  
  // Documentation quality
  if (installation && usage) {
    cool_facts.push(`Well-documented with installation and usage guides`);
  } else if (installation) {
    cool_facts.push(`Includes installation instructions`);
  } else if (usage) {
    cool_facts.push(`Provides usage examples`);
  }
  
  // GitHub specific facts
  cool_facts.push(`Open source project on GitHub`);
  
  return {
    success: true,
    summary: summary,
    cool_facts: cool_facts
  };
}

// Helper functions to extract information from README
function extractTitle(lines) {
  // Look for the main title (usually starts with #)
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();
    
    // Check for main title with single #
    if (line.startsWith('# ')) {
      const title = line.replace('# ', '').replace(/[\[\]()]/g, '').trim();
      if (title.length > 0 && title.length < 100) {
        return title;
      }
    }
    
    // Check for title with multiple # (##, ###)
    if (line.match(/^#{1,3}\s+/)) {
      const title = line.replace(/^#{1,3}\s+/, '').replace(/[\[\]()]/g, '').trim();
      if (title.length > 0 && title.length < 100) {
        return title;
      }
    }
  }
  
  // If no title found, try to extract from first meaningful line
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('[') && !line.startsWith('!') && !line.startsWith('---') && line.length > 0 && line.length < 50) {
      return line.replace(/[\[\]()]/g, '').trim();
    }
  }
  
  return 'Unknown Repository';
}

function extractDescription(lines) {
  // Look for description after title
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('[') && !line.startsWith('!') && !line.startsWith('---') && line.length > 10 && line.length < 200) {
      // Skip lines that are just links or badges
      if (!line.includes('http') && !line.includes('badge') && !line.includes('shields')) {
        return line;
      }
    }
  }
  return 'A software project';
}

function extractFeatures(lines) {
  const features = [];
  
  // Look for bullet points and feature descriptions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for bullet points with ** (bold text often indicates features)
    if (line.includes('**') && (line.includes('•') || line.includes('*') || line.includes('-') || line.startsWith('*'))) {
      const feature = line.replace(/\*\*/g, '').replace(/^[•*\-]\s*/, '').trim();
      if (feature.length > 5 && feature.length < 100 && !feature.includes('http')) {
        features.push(feature);
      }
    }
    
    // Look for lines that start with bold text (common feature format)
    if (line.match(/^\*\*[^*]+\*\*/)) {
      const feature = line.replace(/\*\*/g, '').trim();
      if (feature.length > 5 && feature.length < 100) {
        features.push(feature);
      }
    }
    
    // Look for lines that mention "feature" or "key"
    if ((line.toLowerCase().includes('feature') || line.toLowerCase().includes('key')) && line.includes('**')) {
      const feature = line.replace(/\*\*/g, '').replace(/^[•*\-]\s*/, '').trim();
      if (feature.length > 5 && feature.length < 100) {
        features.push(feature);
      }
    }
  }
  
  // If no features found, look for any meaningful bullet points
  if (features.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if ((line.startsWith('* ') || line.startsWith('• ') || line.startsWith('- ')) && line.length > 10 && line.length < 100) {
        const feature = line.replace(/^[•*\-]\s*/, '').trim();
        if (!feature.includes('http') && !feature.includes('license')) {
          features.push(feature);
        }
      }
    }
  }
  
  return features.slice(0, 5); // Limit to 5 features
}

function extractTechnologies(lines) {
  const technologies = [];
  const techKeywords = ['React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST', 'API'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    for (const tech of techKeywords) {
      if (line.includes(tech.toLowerCase()) && !technologies.includes(tech)) {
        technologies.push(tech);
      }
    }
  }
  return technologies.slice(0, 5); // Limit to 5 technologies
}

function extractInstallation(lines) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('## installation') || line.includes('## install') || line.includes('### installation') || line.includes('### install')) {
      return true;
    }
  }
  return false;
}

function extractUsage(lines) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('## usage') || line.includes('## example') || line.includes('### usage') || line.includes('### example')) {
      return true;
    }
  }
  return false;
}

// Alternative function for when README is not available
export async function createFallbackSummaryChain(repositoryUrl) {
  try {
    // Extract repository name from URL
    const urlParts = repositoryUrl.split('/');
    const repoName = urlParts[urlParts.length - 1] || 'Unknown';
    const owner = urlParts[urlParts.length - 2] || 'Unknown';
    
    const summary = `${repoName} is a repository owned by ${owner}. This appears to be a software project hosted on GitHub.`;
    
    const cool_facts = [
      `Repository: ${repoName}`,
      `Owner: ${owner}`,
      `Hosted on GitHub`,
      `Public repository`,
      `Available for collaboration`
    ];
    
    return {
      success: true,
      summary: summary,
      cool_facts: cool_facts
    };

  } catch (error) {
    console.error('Fallback summary error:', error);
    return {
      success: false,
      error: 'SUMMARIZATION_ERROR',
      message: 'Failed to generate fallback summary',
      details: error.message
    };
  }
}
