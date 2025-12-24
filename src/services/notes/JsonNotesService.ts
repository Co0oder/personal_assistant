import * as fs from 'fs';
import * as path from 'path';
import { INotesService, Note } from './INotesService';
import { IntentResult } from '../../models/IntentResult';
import { Logger } from '../../utils/Logger';
import { ErrorHandler, StorageError } from '../../utils/ErrorHandler';

/**
 * Configuration for JSON notes service
 */
export interface JsonNotesConfig {
  storageDir: string;
  fileName?: string;
}

/**
 * JSON file-based implementation of notes service
 */
export class JsonNotesService implements INotesService {
  private filePath: string;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(config: JsonNotesConfig) {
    this.filePath = path.join(
      config.storageDir,
      config.fileName || 'notes.json'
    );
    this.logger = new Logger('JsonNotesService');
    this.errorHandler = new ErrorHandler('JsonNotesService');

    // Ensure directory exists
    this.ensureDirectoryExists(config.storageDir);
  }

  /**
   * Save a note to the JSON file
   */
  async saveNote(note: IntentResult): Promise<Note> {
    try {
      this.logger.info(`Saving note of type: ${note.teg}`);

      const newNote: Note = {
        teg: note.teg,
        title: note.title || 'Untitled',
        date: note.date || new Date().toISOString(),
        body: note.body || '',
      };

      const notes = await this.getAllNotes();
      notes.push(newNote);

      await this.writeNotesToFile(notes);
      this.logger.info('Note saved successfully');

      return newNote;
    } catch (error) {
      const wrappedError = this.errorHandler.wrap(
        StorageError,
        error as Error,
        'Failed to save note'
      );
      this.errorHandler.handle(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Get all notes from the JSON file
   */
  async getAllNotes(): Promise<Note[]> {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.logger.info('Notes file does not exist, returning empty array');
        return [];
      }

      const data = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);

      return parsed.notes || [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      const wrappedError = this.errorHandler.wrap(
        StorageError,
        error as Error,
        'Failed to read notes'
      );
      this.errorHandler.handle(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Get notes by type
   */
  async getNotesByType(teg: string): Promise<Note[]> {
    try {
      const allNotes = await this.getAllNotes();
      return allNotes.filter((note) => note.teg === teg);
    } catch (error) {
      const wrappedError = this.errorHandler.wrap(
        StorageError,
        error as Error,
        `Failed to get notes of type: ${teg}`
      );
      this.errorHandler.handle(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Write notes array to file
   */
  private async writeNotesToFile(notes: Note[]): Promise<void> {
    const data = JSON.stringify({ notes }, null, 2);
    fs.writeFileSync(this.filePath, data, 'utf-8');
  }

  /**
   * Ensure the directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
