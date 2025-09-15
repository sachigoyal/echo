'use client';

import NextImage from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Download, Copy } from 'lucide-react';
import type { ModelOption } from './image-generator';
import { ImageDetailsDialog } from './image-details-dialog';


export interface GeneratedImage {
  id: string;
  imageUrl?: {
    base64Data: string;
    mediaType: string;
  };
  prompt: string;
  model?: ModelOption;
  timestamp: Date;
  attachments?: {
    filename: string;
    url: string;
    mediaType: string;
  }[];
  isEdit: boolean;
  isLoading?: boolean;
  error?: string;
}

interface ImageHistoryItemProps {
  image: GeneratedImage;
  onAddToInput: (files: File[]) => void;
  onImageClick: (image: GeneratedImage) => void;
}

function ImageHistoryItem({ image, onAddToInput, onImageClick }: ImageHistoryItemProps) {
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

  const handleImageClick = () => {
    onImageClick(image);
  };

  const handleDownload = () => {
    if (!image.imageUrl) return;
    
    const base64Data = image.imageUrl.base64Data;
    const mediaType = image.imageUrl.mediaType;
    
    // Create download link
    const dataUrl = `data:${mediaType};base64,${base64Data}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `generated-image-${image.id}.${mediaType.split('/')[1] || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!image.imageUrl) return;
    
    try {
      const base64Data = image.imageUrl.base64Data;
      const mediaType = image.imageUrl.mediaType;
      
      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mediaType });
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [mediaType]: blob
        })
      ]);
    } catch (error) {
      console.error('Failed to copy image:', error);
    }
  };

  return (
    <div 
      onClick={handleImageClick}
      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-pointer hover:shadow-lg transition-all duration-100 animate-in fade-in slide-in-from-left-4 duration-500"
    >
      {image.isLoading ? (
        <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="text-xs text-gray-500 font-mono">{getElapsedTime()}</div>
        </div>
      ) : image.error ? (
        <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
          <div className="text-red-500 text-sm">⚠️ Failed</div>
          <div className="text-xs text-gray-500 text-center">{image.error}</div>
        </div>
      ) : image.imageUrl ? (
        <>
          <NextImage
            src={`data:${image.imageUrl.mediaType};base64,${image.imageUrl.base64Data}`}
            alt={image.prompt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg text-gray-700 hover:text-gray-900 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150"
              disabled={image.isLoading || !image.imageUrl}
            >
              <Copy size={14} />
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg text-gray-700 hover:text-gray-900 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150"
              disabled={image.isLoading || !image.imageUrl}
            >
              <Download size={14} />
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToInput();
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg text-gray-700 hover:text-gray-900 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150"
              disabled={image.isLoading || !image.imageUrl}
            >
              <Edit size={14} />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No image
        </div>
      )}
    </div>
  );
}

interface ImageHistoryProps {
  imageHistory: GeneratedImage[];
  onAddToInput: (files: File[]) => void;
}

export function ImageHistory({ imageHistory, onAddToInput }: ImageHistoryProps) {
  const [timerTick, setTimerTick] = useState(0);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-all duration-300 ease-out">
        {imageHistory.map((image) => (
          <ImageHistoryItem 
            key={image.id} 
            image={image} 
            onAddToInput={onAddToInput}
            onImageClick={setSelectedImage}
          />
        ))}
      </div>
      
      <ImageDetailsDialog 
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onAddToInput={onAddToInput}
      />
    </div>
  );
}