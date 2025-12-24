import { IAIService } from '../services/ai/IAIService';
import { ITranscriptionService } from '../services/transcription/ITranscriptionService';
import { ICalendarService } from '../services/calendar/ICalendarService';
import { IStorageService } from '../services/storage/IStorageService';
import { INotesService } from '../services/notes/INotesService';
import { Logger } from '../utils/Logger';

/**
 * Result from processing an audio request
 */
export interface ProcessResult {
  /** The transcribed text */
  transcript: string;

  /** The reply from the assistant */
  reply: string;

  /** The action taken */
  action: 'event' | 'note' | 'chat';

  /** Type of content (problem, idea, decision, toDo, event, chat) */
  teg: string;

  /** Link to calendar event (only if action is event) */
  link?: string;

  /** Saved note data (only if action is note) */
  note?: {
    teg: string;
    title: string;
    date: string;
    body: string;
  };
}

/**
 * Main facade that orchestrates all services
 * This is the entry point for the personal assistant workflow
 */
export class AssistantFacade {
  private transcription: ITranscriptionService;
  private ai: IAIService;
  private calendar: ICalendarService;
  private storage: IStorageService;
  private notes: INotesService;
  private logger: Logger;

  constructor(services: {
    transcriptionService: ITranscriptionService;
    aiService: IAIService;
    calendarService: ICalendarService;
    storageService: IStorageService;
    notesService: INotesService;
  }) {
    this.transcription = services.transcriptionService;
    this.ai = services.aiService;
    this.calendar = services.calendarService;
    this.storage = services.storageService;
    this.notes = services.notesService;
    this.logger = new Logger('AssistantFacade');
  }

  /**
   * Main workflow: audio → transcript → intent → action
   * @param audioFilePath - Path to the audio file to process
   * @returns ProcessResult with transcript, reply, and action taken
   */
  async processAudioRequest(audioFilePath: string): Promise<ProcessResult> {
    this.logger.info('Starting audio request processing');

    try {
      // Step 1: Transcribe audio to text
      this.logger.info('Step 1: Transcribing audio');
      const transcription = await this.transcription.transcribe(audioFilePath);
      this.logger.info(`Transcription: "${transcription.text}"`);

      // Step 2: Extract intent from text
      this.logger.info('Step 2: Extracting intent');
      const intent = await this.ai.extractIntent(transcription.text, {
        currentDate: new Date().toISOString(),
      });

      // Step 3: Execute action based on intent
      this.logger.info(`Step 3: Executing action (teg: ${intent.teg})`);
      let result: ProcessResult;

      if (intent.teg === 'event' && intent.title && intent.date && intent.end) {
        // Create calendar event
        this.logger.info(`Creating calendar event: ${intent.title}`);
        const eventResult = await this.calendar.createEvent({
          summary: intent.title,
          start: intent.date,
          end: intent.end,
        });

        const startDate = new Date(intent.date);
        result = {
          transcript: transcription.text,
          reply: `I've scheduled "${intent.title}" for ${startDate.toLocaleString()}.`,
          action: 'event',
          teg: 'event',
          link: eventResult.link,
        };
      } else if (
        intent.teg === 'problem' ||
        intent.teg === 'idea' ||
        intent.teg === 'decision' ||
        intent.teg === 'toDo'
      ) {
        // Save note
        this.logger.info(`Saving ${intent.teg} note: ${intent.title}`);
        const savedNote = await this.notes.saveNote(intent);

        result = {
          transcript: transcription.text,
          reply: `I've saved your ${intent.teg}: "${intent.title}".`,
          action: 'note',
          teg: intent.teg,
          note: savedNote,
        };
      } else {
        // Chat response
        result = {
          transcript: transcription.text,
          reply: intent.reply || 'I understand.',
          action: 'chat',
          teg: 'chat',
        };
      }

      this.logger.info('Audio request processed successfully');
      return result;
    } finally {
      // Always cleanup the audio file
      this.logger.info('Cleaning up audio file');
      try {
        await this.storage.deleteFile(audioFilePath);
      } catch (error) {
        this.logger.warn('Failed to cleanup audio file', error);
      }
    }
  }
}
