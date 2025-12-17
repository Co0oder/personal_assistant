import { google, calendar_v3 } from 'googleapis';
import { ICalendarService } from './ICalendarService';
import { CalendarEvent, CalendarEventResult } from '../../models/CalendarEvent';
import { Logger } from '../../utils/Logger';
import { ErrorHandler, CalendarServiceError } from '../../utils/ErrorHandler';

/**
 * Configuration for Google Calendar service
 */
export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
  calendarId?: string;
}

/**
 * Google Calendar implementation of calendar service
 */
export class GoogleCalendarService implements ICalendarService {
  private calendar: calendar_v3.Calendar;
  private calendarId: string;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(config: GoogleCalendarConfig) {
    this.logger = new Logger('GoogleCalendarService');
    this.errorHandler = new ErrorHandler('GoogleCalendarService');

    // Setup OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret
    );

    // Only set credentials if refresh token exists
    if (config.refreshToken) {
      oauth2Client.setCredentials({
        refresh_token: config.refreshToken,
      });
      this.logger.info('Google Calendar authenticated with refresh token');
    } else {
      this.logger.warn('No refresh token provided - calendar operations may fail');
    }

    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    this.calendarId = config.calendarId || 'primary';
    this.logger.info(`Using calendar: ${this.calendarId}`);
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent): Promise<CalendarEventResult> {
    this.logger.info(`Creating calendar event: ${event.summary}`);

    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: {
          summary: event.summary,
          start: {
            dateTime: event.start,
            timeZone: event.timeZone || 'UTC',
          },
          end: {
            dateTime: event.end,
            timeZone: event.timeZone || 'UTC',
          },
          description: event.description,
        },
      });

      if (!response.data.id || !response.data.htmlLink) {
        throw new Error('Invalid response from Google Calendar API');
      }

      this.logger.info(`Event created successfully: ${response.data.id}`);

      return {
        id: response.data.id,
        link: response.data.htmlLink,
      };
    } catch (error) {
      const wrappedError = this.errorHandler.wrap(
        CalendarServiceError,
        error as Error,
        'Failed to create calendar event'
      );
      this.errorHandler.handle(wrappedError);
      throw wrappedError;
    }
  }
}
