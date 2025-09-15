/**
 * Image parsing utilities for edit-image API route
 */

export interface ImageInput {
  data: string | URL;
  mediaType: string;
}

/**
 * Parses image input (data URL or regular URL)
 */
export function parseImageInput(imageUrl: string): ImageInput {
  if (imageUrl.startsWith('data:')) {
    // Extract media type from data URL
    const matches = imageUrl.match(/^data:([^;]+);base64,/);
    if (!matches) {
      throw new Error('Invalid image data format');
    }
    const mediaType = matches[1];

    // Validate that it's an image type
    if (!mediaType.startsWith('image/')) {
      throw new Error('Only image files can be edited');
    }

    return { data: imageUrl, mediaType };
  } else {
    // Regular URL - validate format
    try {
      const url = new URL(imageUrl);
      return { data: url, mediaType: 'image/jpeg' };
    } catch {
      throw new Error('Invalid image URL format');
    }
  }
}

/**
 * Converts a data URL to a File object
 */
export function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Converts any image URL/data to a File object
 */
export async function toFile(
  imageUrl: string,
  filename = 'image.png'
): Promise<File> {
  if (imageUrl.startsWith('data:')) {
    return dataURLtoFile(imageUrl, filename);
  } else {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }
}
