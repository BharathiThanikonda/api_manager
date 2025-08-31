import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

// Create the output parser for structured output
const outputParser = StructuredOutputParser.fromNamesAndDescriptions({
  summary: 'A comprehensive summary of the GitHub repository based on the README content',
  coolFacts: 'An array of interesting facts about the repository, technology, or project'
});

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert GitHub repository analyzer. Based on the README content provided, create a comprehensive summary and identify cool facts about the repository.

README Content:
{readmeContent}

Repository URL: {repositoryUrl}

Please analyze this repository and provide:

1. A comprehensive summary (2-3 paragraphs) that covers:
   - What the project does
   - Key features and technologies
   - Target audience or use cases
   - Overall impact or significance

2. Cool facts about the repository (3-5 interesting points) such as:
   - Unique technical approaches
   - Notable technologies used
   - Community metrics
   - Interesting implementation details
   - Historical significance

{format_instructions}
`);

// Function to initialize LLM
function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-pro',
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

// Create the chain
export async function createGitHubSummaryChain(readmeContent, repositoryUrl) {
  try {
    // Initialize LLM only when needed
    const llm = getLLM();
    
    // Get the format instructions from the parser
    const formatInstructions = outputParser.getFormatInstructions();

    // Create the prompt with the actual content
    const prompt = await promptTemplate.format({
      readmeContent: readmeContent,
      repositoryUrl: repositoryUrl,
      format_instructions: formatInstructions,
    });

    // Invoke the LLM
    const response = await llm.invoke(prompt);

    // Parse the structured output
    const parsedOutput = await outputParser.parse(response.content);

    return {
      success: true,
      data: {
        summary: parsedOutput.summary,
        coolFacts: parsedOutput.coolFacts,
        repositoryUrl: repositoryUrl,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('LangChain summarization error:', error);
    return {
      success: false,
      error: 'SUMMARIZATION_ERROR',
      message: 'Failed to generate summary using LangChain',
      details: error.message
    };
  }
}

// Alternative function for when README is not available
export async function createFallbackSummaryChain(repositoryUrl) {
  try {
    // Initialize LLM only when needed
    const llm = getLLM();
    
    const fallbackPrompt = PromptTemplate.fromTemplate(`
You are an expert GitHub repository analyzer. Based on the repository URL provided, create a summary and identify potential cool facts about the repository.

Repository URL: {repositoryUrl}

Since we don't have access to the README content, please provide:

1. A general summary based on the repository name and URL structure
2. Potential cool facts that might be interesting about this type of repository

{format_instructions}
`);

    const formatInstructions = outputParser.getFormatInstructions();
    const prompt = await fallbackPrompt.format({
      repositoryUrl: repositoryUrl,
      format_instructions: formatInstructions,
    });

    const response = await llm.invoke(prompt);
    const parsedOutput = await outputParser.parse(response.content);

    return {
      success: true,
      data: {
        summary: parsedOutput.summary,
        coolFacts: parsedOutput.coolFacts,
        repositoryUrl: repositoryUrl,
        timestamp: new Date().toISOString(),
        note: 'Summary generated without README content'
      }
    };

  } catch (error) {
    console.error('LangChain fallback summarization error:', error);
    return {
      success: false,
      error: 'SUMMARIZATION_ERROR',
      message: 'Failed to generate fallback summary using LangChain',
      details: error.message
    };
  }
}
