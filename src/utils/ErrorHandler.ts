import { Logger } from './Logger';

/**
 * Custom error types for better error handling
 */
export class TranscriptionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export class AIServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class CalendarServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'CalendarServiceError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  private logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  /**
   * Handle and log error
   */
  handle(error: Error, customMessage?: string): void {
    const message = customMessage || error.message;
    this.logger.error(message, error);
  }

  /**
   * Wrap error with custom error type
   */
  wrap<T extends Error>(
    ErrorClass: new (message: string, originalError?: Error) => T,
    error: Error,
    customMessage?: string
  ): T {
    const message = customMessage || error.message;
    return new ErrorClass(message, error);
  }
}
