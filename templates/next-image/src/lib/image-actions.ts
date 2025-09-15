/**
 * Shared image action handlers for download, copy, and file conversion operations
 * Used by both ImageHistoryItem and ImageDetailsDialog components
 */

import {
  createFileFromBase64,
  downloadImageFromBase64,
  copyImageToClipboard,
  generateImageFilename,
} from './utils';
import type { ImageData, GeneratedImage } from './types';

/**
 * Downloads an image to the user's device
 */
export function handleImageDownload(
  imageUrl: ImageData,
  imageId: string
): void {
  const filename = generateImageFilename(imageId, imageUrl.mediaType);
  downloadImageFromBase64(imageUrl.base64Data, imageUrl.mediaType, filename);
}

/**
 * Copies an image to the system clipboard
 */
export async function handleImageCopy(imageUrl: ImageData): Promise<void> {
  try {
    await copyImageToClipboard(imageUrl.base64Data, imageUrl.mediaType);
  } catch (error) {
    console.error('Failed to copy image:', error);
    throw error;
  }
}

/**
 * Converts image data to a File object for adding to input
 */
export function handleImageToFile(imageUrl: ImageData, imageId: string): File {
  const filename = generateImageFilename(imageId, imageUrl.mediaType);
  return createFileFromBase64(
    imageUrl.base64Data,
    imageUrl.mediaType,
    filename
  );
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
      return 'GPT Image';
    case 'gemini':
      return 'Gemini Flash Image';
    default:
      return 'Unknown Model';
  }
}
