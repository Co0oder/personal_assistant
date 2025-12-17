import { TranscriptionResult } from '../../models/TranscriptionResult';

/**
 * Interface for audio transcription services
 * Any transcription provider must implement this interface
 */
export interface ITranscriptionService {
  /**
   * Transcribe audio file to text
   * @param audioFilePath - Path to the audio file
   * @returns TranscriptionResult containing text and metadata
   */
  transcribe(audioFilePath: string): Promise<TranscriptionResult>;
}
