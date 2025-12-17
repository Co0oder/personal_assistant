import { CalendarEvent, CalendarEventResult } from '../../models/CalendarEvent';

/**
 * Interface for calendar services
 * Any calendar provider must implement this interface
 */
export interface ICalendarService {
  /**
   * Create a new calendar event
   * @param event - The event to create
   * @returns CalendarEventResult with event ID and link
   */
  createEvent(event: CalendarEvent): Promise<CalendarEventResult>;
}
