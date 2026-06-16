import { config } from '../config';
import { AIProvider } from './aiProvider';
import { AnthropicProvider } from './anthropicProvider';
import { OpenAIProvider } from './openaiProvider';
import { logger } from '../utils/logger';

/**
 * AI Provider Factory
 * Creates the appropriate provider based on configuration
 */
export function createAIProvider(): AIProvider {
  const providerType = config.aiProvider;

  logger.info({ providerType }, 'Creating AI provider');

  switch (providerType) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unsupported AI provider: ${String(providerType)}`);
  }
}

// Export singleton instance
export const aiProvider = createAIProvider();
