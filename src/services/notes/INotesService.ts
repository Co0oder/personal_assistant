import { IntentResult } from '../../models/IntentResult';

/**
 * Note stored in the system
 */
export interface Note {
  teg: string;
  title: string;
  date: string;
  body: string;
}

/**
 * Interface for notes service
 */
export interface INotesService {
  /**
   * Save a note
   * @param note - The note to save
   * @returns The saved note
   */
  saveNote(note: IntentResult): Promise<Note>;

  /**
   * Get all notes
   * @returns Array of all notes
   */
  getAllNotes(): Promise<Note[]>;

  /**
   * Get notes by type
   * @param teg - The type of notes to retrieve
   * @returns Array of notes of the specified type
   */
  getNotesByType(teg: string): Promise<Note[]>;
}
