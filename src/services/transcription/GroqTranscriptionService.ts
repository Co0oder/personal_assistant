import Groq from 'groq-sdk';
import fs from 'fs';
import { ITranscriptionService } from './ITranscriptionService';
import { TranscriptionResult } from '../../models/TranscriptionResult';
import { Logger } from '../../utils/Logger';
import { ErrorHandler, TranscriptionError } from '../../utils/ErrorHandler';

/**
 * Configuration for Groq transcription service
 */
export interface GroqTranscriptionConfig {
  apiKey: string;
  model?: string;
}

/**
 * Groq implementation of transcription service using Whisper
 */
export class GroqTranscriptionService implements ITranscriptionService {
  private client: Groq;
  private model: string;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(config: GroqTranscriptionConfig) {
    this.client = new Groq({ apiKey: config.apiKey });
    this.model = config.model || 'whisper-large-v3-turbo';
    this.logger = new Logger('GroqTranscriptionService');
    this.errorHandler = new ErrorHandler('GroqTranscriptionService');
  }

  /**
   * Transcribe audio file using Groq Whisper API
   */
  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    this.logger.info(`Transcribing audio file: ${audioFilePath}`);

    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: this.model,
        response_format: 'json',
      });

      this.logger.info('Transcription completed successfully');

      return {
        text: transcription.text,
        // Note: Groq's Whisper API may not return duration and language in all responses
        duration: undefined,
        language: undefined,
      };
    } catch (error) {
      const wrappedError = this.errorHandler.wrap(
        TranscriptionError,
        error as Error,
        'Failed to transcribe audio'
      );
      this.errorHandler.handle(wrappedError);
      throw wrappedError;
    }
  }
}
