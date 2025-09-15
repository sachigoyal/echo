'use client';

import NextImage from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit } from 'lucide-react';
import type { ModelOption } from './image-generator';


export interface GeneratedImage {
  id: string;
  imageUrl?: {
    base64Data: string;
    mediaType: string;
  };
  prompt: string;
  model?: ModelOption;
  timestamp: Date;
  attachmentRefs?: string[];
  isEdit: boolean;
  isLoading?: boolean;
  error?: string;
}

interface ImageHistoryItemProps {
  image: GeneratedImage;
  onAddToInput: (files: File[]) => void;
}

function ImageHistoryItem({ image, onAddToInput }: ImageHistoryItemProps) {
  // Calculate elapsed time for loading images
  const getElapsedTime = () => {
    if (!image.isLoading) return '';
    const elapsed = (Date.now() - image.timestamp.getTime()) / 1000;
    return `${elapsed.toFixed(1)}s`;
  };

  const handleAddToInput = () => {
    if (!image.imageUrl) return;
    
    // Convert the base64 image back to a File object
    const base64Data = image.imageUrl.base64Data;
    const mediaType = image.imageUrl.mediaType;
    
    // Create a Uint8Array from base64
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a proper File object
    const filename = `generated-image-${image.id}.${mediaType.split('/')[1] || 'png'}`;
    const file = new File([bytes], filename, { type: mediaType });

    // Add to attachments via prop
    onAddToInput([file]);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">
            {image.isEdit ? 'Edited Image' : 'Generated Image'}
          </p>
          <p className="text-xs text-gray-500">
            {image.timestamp.toLocaleString()} • {image.model === 'openai' ? 'GPT Image' : 'Gemini Flash Image'} 
            {image.attachmentRefs && (
              <> • Attachments: {image.attachmentRefs.join(', ')}</>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleAddToInput}
          className="ml-4"
          disabled={image.isLoading || !image.imageUrl}
        >
          <Edit size={16} />
        </Button>
      </div>
      
      <div className="relative h-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {image.isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 p-6">
            <Skeleton className="h-32 w-32 rounded-lg" />
            <Skeleton className="h-4 w-24" />
            <div className="text-xs text-gray-500 font-mono">{getElapsedTime()}</div>
          </div>
        ) : image.error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 p-6">
            <div className="text-red-500 text-sm">⚠️ Generation failed</div>
            <div className="text-xs text-gray-500">{image.error}</div>
          </div>
        ) : image.imageUrl ? (
          <NextImage
            src={`data:${image.imageUrl.mediaType};base64,${image.imageUrl.base64Data}`}
            alt={image.prompt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image available
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-700 italic">"{image.prompt}"</p>
    </div>
  );
}

interface ImageHistoryProps {
  imageHistory: GeneratedImage[];
  onAddToInput: (files: File[]) => void;
}

export function ImageHistory({ imageHistory, onAddToInput }: ImageHistoryProps) {
  const [timerTick, setTimerTick] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect to update loading durations
  useEffect(() => {
    const hasLoadingImages = imageHistory.some(img => img.isLoading);
    
    if (hasLoadingImages && !timerRef.current) {
      // Start timer
      timerRef.current = setInterval(() => {
        setTimerTick(tick => tick + 1);
      }, 100); // Update every 100ms for single decimal precision
    } else if (!hasLoadingImages && timerRef.current) {
      // Stop timer
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [imageHistory]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (imageHistory.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Generated Images</h3>
      <div className="space-y-4">
        {imageHistory.map((image) => (
          <ImageHistoryItem 
            key={image.id} 
            image={image} 
            onAddToInput={onAddToInput}
          />
        ))}
      </div>
    </div>
  );
}