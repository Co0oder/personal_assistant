import { IntentResult } from '../../models/IntentResult';

/**
 * Interface for AI/LLM services
 * Any AI provider must implement this interface
 */
export interface IAIService {
  /**
   * Extract user intent from text
   * @param text - The text to analyze
   * @param context - Additional context (current date, user preferences, etc.)
   * @returns IntentResult indicating whether it's an event or chat
   */
  extractIntent(text: string, context: Record<string, any>): Promise<IntentResult>;
}
