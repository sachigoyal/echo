/**
 * Shared image action handlers for download, copy, and file conversion operations
 * Used by both ImageHistoryItem and ImageDetailsDialog components
 */

import {
  dataUrlToFile,
  downloadDataUrl,
  copyDataUrlToClipboard,
  generateFilename,
} from './image-utils';
import type { GeneratedImage } from './types';

/**
 * Downloads an image to the user's device
 */
export function handleImageDownload(imageUrl: string, imageId: string): void {
  const filename = generateFilename(imageId);
  downloadDataUrl(imageUrl, filename);
}

/**
 * Copies an image to the system clipboard
 */
export async function handleImageCopy(imageUrl: string): Promise<void> {
  try {
    await copyDataUrlToClipboard(imageUrl);
  } catch (error) {
    console.error('Failed to copy image:', error);
    throw error;
  }
}

/**
 * Converts image data to a File object for adding to input
 */
export function handleImageToFile(imageUrl: string, imageId: string): File {
  const filename = generateFilename(imageId);
  return dataUrlToFile(imageUrl, filename);
}

/**
 * Checks if an image is available for actions (not loading, not error)
 */
export function isImageActionable(image: GeneratedImage): boolean {
  return !image.isLoading && !image.error && !!image.imageUrl;
}

/**
 * Gets the display text for a model
 */
export function getModelDisplayName(model?: string): string {
  switch (model) {
    case 'openai':
      return 'GPT Image 1';
    case 'gemini':
      return 'Gemini Flash Image 2.5';
    default:
      return 'Unknown Model';
  }
}
