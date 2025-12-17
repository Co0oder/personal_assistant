/**
 * Result from intent extraction
 */
export interface IntentResult {
  /** Whether this is an event to be scheduled */
  is_event: boolean;

  /** Event summary (only if is_event is true) */
  summary?: string;

  /** Event start time in ISO 8601 format (only if is_event is true) */
  start?: string;

  /** Event end time in ISO 8601 format (only if is_event is true) */
  end?: string;

  /** Chat reply (only if is_event is false) */
  reply?: string;
}
