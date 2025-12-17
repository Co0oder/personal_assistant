/**
 * Interface for file storage services
 * Any storage provider must implement this interface
 */
export interface IStorageService {
  /**
   * Delete a file
   * @param filePath - Path to the file to delete
   */
  deleteFile(filePath: string): Promise<void>;

  /**
   * Check if a file exists
   * @param filePath - Path to the file
   * @returns true if file exists, false otherwise
   */
  fileExists(filePath: string): Promise<boolean>;
}
