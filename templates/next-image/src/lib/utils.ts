import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Blob to a base64 data URL
 * @param blob - The blob to convert
 * @returns Promise resolving to data URL string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts base64 data to a Uint8Array
 * @param base64Data - Base64 encoded string (without data URL prefix)
 * @returns Uint8Array of decoded bytes
 */
export function base64ToBytes(base64Data: string): Uint8Array {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a File object from base64 image data
 * @param base64Data - Base64 encoded string (without data URL prefix)
 * @param mediaType - MIME type of the image
 * @param filename - Name for the file
 * @returns File object
 */
export function createFileFromBase64(
  base64Data: string,
  mediaType: string,
  filename: string
): File {
  const bytes = base64ToBytes(base64Data);
  return new File([bytes], filename, { type: mediaType });
}

/**
 * Downloads an image from base64 data
 * @param base64Data - Base64 encoded string (without data URL prefix)
 * @param mediaType - MIME type of the image
 * @param filename - Name for the downloaded file
 */
export function downloadImageFromBase64(
  base64Data: string,
  mediaType: string,
  filename: string
): void {
  const dataUrl = `data:${mediaType};base64,${base64Data}`;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies an image to the clipboard from base64 data
 * @param base64Data - Base64 encoded string (without data URL prefix)
 * @param mediaType - MIME type of the image
 * @returns Promise that resolves when copy is complete
 */
export async function copyImageToClipboard(
  base64Data: string,
  mediaType: string
): Promise<void> {
  const bytes = base64ToBytes(base64Data);
  const blob = new Blob([bytes], { type: mediaType });

  await navigator.clipboard.write([
    new ClipboardItem({
      [mediaType]: blob,
    }),
  ]);
}

/**
 * Generates a filename for a generated image
 * @param imageId - Unique identifier for the image
 * @param mediaType - MIME type of the image
 * @returns Filename string
 */
export function generateImageFilename(
  imageId: string,
  mediaType: string
): string {
  const extension = mediaType.split('/')[1] || 'png';
  return `generated-image-${imageId}.${extension}`;
}
