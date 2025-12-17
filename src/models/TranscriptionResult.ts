/**
 * Result from audio transcription
 */
export interface TranscriptionResult {
  /** The transcribed text */
  text: string;

  /** Duration of the audio in seconds (optional) */
  duration?: number;

  /** Detected language (optional) */
  language?: string;
}
