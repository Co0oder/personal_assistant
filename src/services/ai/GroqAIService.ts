import Groq from 'groq-sdk';
import { IAIService } from './IAIService';
import { IntentResult } from '../../models/IntentResult';
import { Logger } from '../../utils/Logger';
import { ErrorHandler, AIServiceError } from '../../utils/ErrorHandler';

/**
 * Configuration for Groq AI service
 */
export interface GroqAIConfig {
  apiKey: string;
  model?: string;
}

/**
 * Groq implementation of AI service for intent extraction
 */
export class GroqAIService implements IAIService {
  private client: Groq;
  private model: string;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(config: GroqAIConfig) {
    this.client = new Groq({ apiKey: config.apiKey });
    this.model = config.model || 'llama-3.1-8b-instant';
    this.logger = new Logger('GroqAIService');
    this.errorHandler = new ErrorHandler('GroqAIService');
  }

  /**
   * Extract user intent from text using Groq LLM
   */
  async extractIntent(
    text: string,
    context: Record<string, any>
  ): Promise<IntentResult> {
    this.logger.info(`Extracting intent from text: "${text}"`);

    try {
      const systemPrompt = this.buildSystemPrompt(context);

      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        model: this.model,
        response_format: { type: 'json_object' },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      const result: IntentResult = JSON.parse(content);
      this.logger.info('Intent extracted successfully', { is_event: result.is_event });

      return result;
    } catch (error) {
      const wrappedError = this.errorHandler.wrap(
        AIServiceError,
        error as Error,
        'Failed to extract intent'
      );
      this.errorHandler.handle(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Build system prompt with current context
   */
  private buildSystemPrompt(context: Record<string, any>): string {
    const currentDate = context.currentDate
      ? new Date(context.currentDate)
      : new Date();

    return `
You are a smart personal assistant.
Current Date/Time: ${currentDate.toISOString()} (${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}).

If the user's input is a command to schedule an event (e.g., "meeting tomorrow", "remind me to"),
you must output a JSON object strictly matching this schema:
{
  "is_event": true,
  "summary": "Short Event Title",
  "start": "ISO 8601 String (e.g. 2025-12-12T14:00:00)",
  "end": "ISO 8601 String (default to 1 hour after start if not specified)"
}

If the user is just chatting (e.g., "Hello", "What time is it?"), output JSON:
{
  "is_event": false,
  "reply": "Your conversational reply here."
}
    `.trim();
  }
}
