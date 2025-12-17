/**
 * Calendar event to be created
 */
export interface CalendarEvent {
  /** Event title/summary */
  summary: string;

  /** Start time in ISO 8601 format */
  start: string;

  /** End time in ISO 8601 format */
  end: string;

  /** Event description (optional) */
  description?: string;

  /** Timezone (optional, defaults to UTC) */
  timeZone?: string;
}

/**
 * Result after creating a calendar event
 */
export interface CalendarEventResult {
  /** Unique event ID */
  id: string;

  /** Link to view the event */
  link: string;
}
