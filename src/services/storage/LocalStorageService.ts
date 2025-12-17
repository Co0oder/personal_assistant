import fs from 'fs/promises';
import { existsSync } from 'fs';
import { IStorageService } from './IStorageService';
import { Logger } from '../../utils/Logger';
import { ErrorHandler, StorageError } from '../../utils/ErrorHandler';

/**
 * Local file system implementation of storage service
 */
export class LocalStorageService implements IStorageService {
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor() {
    this.logger = new Logger('LocalStorageService');
    this.errorHandler = new ErrorHandler('LocalStorageService');
  }

  /**
   * Delete a file from local storage
   */
  async deleteFile(filePath: string): Promise<void> {
    this.logger.info(`Deleting file: ${filePath}`);

    try {
      const exists = await this.fileExists(filePath);
      if (!exists) {
        this.logger.warn(`File does not exist: ${filePath}`);
        return;
      }

      await fs.unlink(filePath);
      this.logger.info(`File deleted successfully: ${filePath}`);
    } catch (error) {
      const wrappedError = this.errorHandler.wrap(
        StorageError,
        error as Error,
        `Failed to delete file: ${filePath}`
      );
      this.errorHandler.handle(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      // Using synchronous check for simplicity
      return existsSync(filePath);
    } catch (error) {
      this.logger.warn(`Error checking file existence: ${filePath}`, error);
      return false;
    }
  }
}
