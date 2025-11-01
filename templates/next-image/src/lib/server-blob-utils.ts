/**
 * Server-side Vercel Blob utilities
 * 
 * This module handles downloading images from Vercel Blob storage on the server
 * and converting them to base64 for AI model consumption.
 * 
 * IMPORTANT: Blobs are deleted after download to ensure user privacy.
 */

import { del } from '@vercel/blob';

export function isBlobUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export async function downloadBlobToDataUrl(
  blobUrl: string,
  deleteAfter: boolean = true
): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Delete the blob immediately after download for privacy
    if (deleteAfter && isBlobUrl(blobUrl)) {
      try {
        await del(blobUrl);
        console.log('Deleted blob after download:', blobUrl);
      } catch (deleteError) {
        console.error('Failed to delete blob:', deleteError);
        // Don't throw - the image was downloaded successfully
      }
    }
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error downloading blob:', error);
    throw new Error(
      `Failed to download image from blob storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function downloadBlobsToDataUrls(
  blobUrls: string[],
  deleteAfter: boolean = true
): Promise<string[]> {
  return Promise.all(blobUrls.map(url => downloadBlobToDataUrl(url, deleteAfter)));
}

export async function processImageUrls(
  imageUrls: string[],
  deleteAfter: boolean = true
): Promise<string[]> {
  return Promise.all(
    imageUrls.map(async url => {
      // If it's already a data URL, return as-is
      if (url.startsWith('data:')) {
        return url;
      }
      
      // If it's a blob URL, download, convert, and delete
      if (isBlobUrl(url)) {
        return downloadBlobToDataUrl(url, deleteAfter);
      }
      
      // For any other URL type, try to download it (but don't delete)
      return downloadBlobToDataUrl(url, false);
    })
  );
}

