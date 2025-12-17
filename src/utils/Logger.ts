/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Simple logger utility with different log levels
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;

    if (data) {
      if (data instanceof Error) {
        console.log(logMessage);
        console.error(data);
      } else {
        console.log(logMessage, data);
      }
    } else {
      console.log(logMessage);
    }
  }
}
