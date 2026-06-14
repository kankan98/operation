import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env file and parse it manually to ensure .env values take precedence
const envPath = path.resolve(process.cwd(), '.env');
const envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envConfig[key] = value;
    }
  });
}

// Helper function: prioritize .env file over process.env
const getEnv = (key: string, defaultValue: string = ''): string => {
  return envConfig[key] || process.env[key] || defaultValue;
};

export const config = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '3001'), 10),
  databasePath: getEnv('DATABASE_PATH', './data/ecommerce.db'),
  logLevel: getEnv('LOG_LEVEL', 'info'),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),

  // AI Provider Configuration
  aiProvider: (getEnv('AI_PROVIDER', 'anthropic')) as 'anthropic' | 'openai',

  // Anthropic Protocol (Claude, DeepSeek-Anthropic)
  anthropic: {
    apiKey: getEnv('ANTHROPIC_API_KEY') || getEnv('ANTHROPIC_AUTH_TOKEN'),
    baseURL: getEnv('ANTHROPIC_BASE_URL') || undefined,
    model: getEnv('ANTHROPIC_MODEL', 'claude-opus-4-8'),
  },

  // OpenAI Protocol (OpenAI, DeepSeek-OpenAI)
  openai: {
    apiKey: getEnv('OPENAI_API_KEY'),
    baseURL: getEnv('OPENAI_BASE_URL') || undefined,
    model: getEnv('OPENAI_MODEL', 'gpt-4'),
  },
} as const;

export function validateConfig() {
  const required = ['DATABASE_PATH'];
  const missing = required.filter(key => !envConfig[key] && !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate AI provider configuration (only if AI_PROVIDER is set)
  const aiProvider = getEnv('AI_PROVIDER');
  if (aiProvider) {
    if (config.aiProvider === 'anthropic' && !config.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
    }

    if (config.aiProvider === 'openai' && !config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
    }
  }
}
