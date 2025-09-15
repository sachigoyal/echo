'use client';

import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Download, Copy } from 'lucide-react';
import type { GeneratedImage } from './image-history';

interface ImageDetailsDialogProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onAddToInput: (files: File[]) => void;
}

export function ImageDetailsDialog({ image, onClose, onAddToInput }: ImageDetailsDialogProps) {
  if (!image) return null;

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
    onClose();
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
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {image.isEdit ? 'Edited Image' : 'Generated Image'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Full size image */}
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {image.error ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 p-6">
                <div className="text-red-500 text-lg">⚠️ Generation failed</div>
                <div className="text-sm text-gray-500 text-center">{image.error}</div>
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
          
          {/* Details */}
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">"{image.prompt}"</p>
            <div className="text-sm text-gray-500">
              {image.model === 'openai' ? 'GPT Image' : 'Gemini Flash Image'} • {' '}
              {image.timestamp.toLocaleString()} • {' '}
              {image.isEdit ? 'Edited Image' : 'Generated Image'}
            </div>
            
            {/* Attachment previews */}
            {image.attachments && image.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Source Images</h4>
                <div className="flex gap-2 flex-wrap">
                  {image.attachments.map((attachment, index) => (
                    <div 
                      key={index} 
                      className="relative w-16 h-16 rounded border overflow-hidden bg-gray-100"
                    >
                      {attachment.mediaType.startsWith('image/') ? (
                        <NextImage
                          src={attachment.url}
                          alt={attachment.filename}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500">
                          File
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {image.attachments.map(a => a.filename).join(', ')}
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleCopy}
              disabled={!image.imageUrl}
              className="flex items-center gap-2"
            >
              <Copy size={16} />
              Copy
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!image.imageUrl}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </Button>
            <Button
              onClick={handleAddToInput}
              disabled={!image.imageUrl}
              className="flex items-center gap-2"
            >
              <Edit size={16} />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}