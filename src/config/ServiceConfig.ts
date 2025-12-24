import { IAIService } from '../services/ai/IAIService';
import { ITranscriptionService } from '../services/transcription/ITranscriptionService';
import { ICalendarService } from '../services/calendar/ICalendarService';
import { IStorageService } from '../services/storage/IStorageService';
import { INotesService } from '../services/notes/INotesService';
import { GroqAIService } from '../services/ai/GroqAIService';
import { GroqTranscriptionService } from '../services/transcription/GroqTranscriptionService';
import { GoogleCalendarService } from '../services/calendar/GoogleCalendarService';
import { LocalStorageService } from '../services/storage/LocalStorageService';
import { JsonNotesService } from '../services/notes/JsonNotesService';

/**
 * Service container interface
 */
export interface Services {
  transcriptionService: ITranscriptionService;
  aiService: IAIService;
  calendarService: ICalendarService;
  storageService: IStorageService;
  notesService: INotesService;
}

/**
 * Create and configure all services
 * This is the single place to change service implementations
 */
export function createServices(): Services {
  // Validate required environment variables
  const groqApiKey = process.env.GROQ_API_KEY;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY environment variable is required');
  }

  if (!googleClientId || !googleClientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
  }

  // Create transcription service
  const transcriptionService = new GroqTranscriptionService({
    apiKey: groqApiKey,
    model: process.env.TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo',
  });

  // Create AI service
  const aiService = new GroqAIService({
    apiKey: groqApiKey,
    model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
  });

  // Create calendar service
  const calendarService = new GoogleCalendarService({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    calendarId: process.env.CALENDAR_ID || 'primary',
  });

  // Create storage service
  const storageService = new LocalStorageService();

  // Create notes service
  const notesService = new JsonNotesService({
    storageDir: process.env.NOTES_DIR || '/tmp/notes',
    fileName: 'notes.json',
  });

  return {
    transcriptionService,
    aiService,
    calendarService,
    storageService,
    notesService,
  };
}
