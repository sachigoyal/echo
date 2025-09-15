/**
 * Types for the Next.js Image Generation Template
 * This file consolidates all type definitions used across the application
 */

/**
 * Available AI models for image generation
 */
export type ModelOption = 'openai' | 'gemini';

/**
 * Model configuration with display names
 */
export interface ModelConfig {
  id: ModelOption;
  name: string;
}

/**
 * Base64 encoded image data with metadata
 */
export interface ImageData {
  base64Data: string;
  mediaType: string;
}

/**
 * File attachment metadata  
 */
export interface AttachmentData {
  filename: string;
  url: string;
  mediaType: string;
}

/**
 * Complete generated image record with all metadata
 */
export interface GeneratedImage {
  /** Unique identifier for the image */
  id: string;
  /** The actual image data (undefined if still loading or error) */
  imageUrl?: ImageData;
  /** User prompt that generated this image */
  prompt: string;
  /** AI model used for generation */
  model?: ModelOption;
  /** When the image was generated */
  timestamp: Date;
  /** Source images used for editing (if any) */
  attachments?: AttachmentData[];
  /** Whether this was an edit operation (vs. new generation) */
  isEdit: boolean;
  /** Whether the image is still being generated */
  isLoading?: boolean;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Request payload for image generation API
 */
export interface GenerateImageRequest {
  prompt: string;
  model: ModelOption;
}

/**
 * Request payload for image editing API  
 */
export interface EditImageRequest {
  prompt: string;
  imageUrl: string; // Data URL or regular URL
}

/**
 * Response from image generation/editing APIs
 */
export interface ImageResponse {
  imageUrl: ImageData;
}

/**
 * Error response from APIs
 */
export interface ErrorResponse {
  error: string;
}

/**
 * Props for components that handle image actions
 */
export interface ImageActionHandlers {
  onAddToInput: (files: File[]) => void;
  onImageClick?: (image: GeneratedImage) => void;
}

/**
 * Common props for image-related components
 */
export interface ImageComponentProps extends ImageActionHandlers {
  image: GeneratedImage;
}