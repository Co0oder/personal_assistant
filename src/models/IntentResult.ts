/**
 * Types of content that can be extracted from user input
 */
export type ContentType = 'event' | 'problem' | 'idea' | 'decision' | 'toDo' | 'chat';

/**
 * Result from intent extraction
 */
export interface IntentResult {
  /** Type of content extracted */
  teg: ContentType;

  /** Title/summary of the content */
  title?: string;

  /** Date/time in ISO 8601 format (for events and todos) */
  date?: string;

  /** Body/description of the content */
  body?: string;

  /** Event end time in ISO 8601 format (only for events) */
  end?: string;

  /** Chat reply (only for chat type) */
  reply?: string;
}
