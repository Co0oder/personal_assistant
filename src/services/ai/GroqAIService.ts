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
      this.logger.info('Intent extracted successfully', { teg: result.teg });

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
You are a smart personal assistant that classifies user input into different types.
Current Date/Time: ${currentDate.toISOString()} (${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}).

Classify the user's input into ONE of these types and respond with appropriate JSON:

1. EVENT - Scheduling something with a specific date/time:
{
  "teg": "event",
  "title": "Short Event Title",
  "date": "ISO 8601 start time (e.g. 2024-10-05T12:00:00)",
  "end": "ISO 8601 end time (default to 1 hour after start if not specified)",
  "body": "Brief description of the event"
}

2. PROBLEM - Describing an issue with a solution:
{
  "teg": "problem",
  "title": "Brief problem title",
  "date": "${currentDate.toISOString()}",
  "body": "Problem: [description of the problem], Solution: [description of the solution]"
}

3. IDEA - Concept, app idea, or creative thought:
{
  "teg": "idea",
  "title": "Brief idea title",
  "date": "${currentDate.toISOString()}",
  "body": "Detailed description of the idea"
}

4. DECISION - Personal rule, decision, or statement about behavior:
{
  "teg": "decision",
  "title": "Brief decision title",
  "date": "${currentDate.toISOString()}",
  "body": "Description of the decision or rule"
}

5. TODO - Routine or personal task to do soon:
{
  "teg": "toDo",
  "title": "Brief task title",
  "date": "${currentDate.toISOString()}",
  "body": "Task description"
}

6. CHAT - Conversational message or greeting:
{
  "teg": "chat",
  "reply": "Your conversational reply here"
}

Rules:
- If there's a specific date/time mentioned, use "event"
- For problems, structure the body as "Problem: X, Solution: Y"
- Use current date/time for problem, idea, decision, and toDo types
- Only use "chat" for greetings and questions
- Always extract meaningful title and body from user input
    `.trim();
  }
}
