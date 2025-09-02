// Model Configuration
export const MODEL_CONFIG = {
  // AI Model Options
  AI_MODELS: {
    GEMINI: 'gemini-1.5-flash',
    GEMINI_PRO: 'gemini-pro',
    GEMINI_PRO_VISION: 'gemini-pro-vision'
  },
  
  // Text-based analysis (no AI)
  TEXT_ONLY: 'text-only',
  
  // Current model to use
  CURRENT_MODEL: 'gemini-1.5-flash', // Change this to switch models
  
  // API Keys
  REQUIRED_KEYS: {
    GEMINI: 'GOOGLE_API_KEY'
  }
};

// Function to get current model
export function getCurrentModel() {
  return MODEL_CONFIG.CURRENT_MODEL;
}

// Function to check if AI is enabled
export function isAIEnabled() {
  return MODEL_CONFIG.CURRENT_MODEL !== MODEL_CONFIG.TEXT_ONLY;
}
