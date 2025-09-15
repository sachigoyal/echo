'use client';

import NextImage from 'next/image';
import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, X } from 'lucide-react';

type ModelOption = 'openai' | 'gemini';

interface GeneratedImage {
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

// Interface for the PromptInput ref
interface PromptInputRef {
  addAttachment: (files: File[]) => void;
}

// Wrapper component that exposes attachment methods
const PromptInputWithRef = forwardRef<PromptInputRef, {
  onSubmit: (message: PromptInputMessage) => void;
  text: string;
  setText: (text: string) => void;
  model: ModelOption;
  setModel: (model: ModelOption) => void;
  loading: boolean;
  models: Array<{ id: ModelOption; name: string }>;
}>(({ onSubmit, text, setText, model, setModel, loading, models }, ref) => {
  // Internal component that accesses the hook
  function AttachmentManager() {
    const attachments = usePromptInputAttachments();
    
    useImperativeHandle(ref, () => ({
      addAttachment: (files: File[]) => {
        attachments.add(files);
      }
    }), [attachments]);
    
    return null;
  }

  // Clear button component that has access to the attachments context
  function ClearButton() {
    const attachments = usePromptInputAttachments();
    
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setText('');
          attachments.clear();
        }}
        className="h-9 w-9 p-0"
      >
        <X size={16} />
      </Button>
    );
  }

  return (
    <PromptInput onSubmit={onSubmit} className="relative" globalDrop multiple accept="image/*">
      <AttachmentManager />
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => setText(e.target.value)}
          value={text}
          placeholder="Describe the image you want to generate, or attach an image and describe how to edit it..."
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputModelSelect
            onValueChange={(value) => {
              setModel(value as ModelOption);
            }}
            value={model}
          >
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {models.map((model) => (
                <PromptInputModelSelectItem key={model.id} value={model.id}>
                  {model.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>
        <div className="flex items-center gap-2">
          <ClearButton />
          <PromptInputSubmit 
            disabled={!text && loading} 
            status={loading ? 'streaming' : 'ready'} 
          />
        </div>
      </PromptInputToolbar>
    </PromptInput>
  );
});

PromptInputWithRef.displayName = 'PromptInputWithRef';

// Component that uses the attachment function passed as prop
function ImageHistoryItem({ 
  image, 
  onAddToInput,
  timerTick // Force re-render for timer updates
}: { 
  image: GeneratedImage;
  onAddToInput: (files: File[]) => void;
  timerTick?: number;
}) {

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
            {image.timestamp.toLocaleString()} • {image.model === 'openai' ? 'GPT Image' : 'Google Gemini'} 
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

// Component that renders image history outside PromptInput
function ImageHistory({ 
  imageHistory, 
  onAddToInput,
  timerTick
}: { 
  imageHistory: GeneratedImage[];
  onAddToInput: (files: File[]) => void;
  timerTick: number;
}) {
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
            timerTick={timerTick}
          />
        ))}
      </div>
    </div>
  );
}

export default function ImageGenerator() {
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<ModelOption>('openai');
  const [loading, setLoading] = useState(false);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [timerTick, setTimerTick] = useState(0);
  const promptInputRef = useRef<PromptInputRef>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const models = [
    { id: 'openai' as const, name: 'GPT Image' },
    { id: 'gemini' as const, name: 'Google Gemini Flash Image' },
  ];

  const handleAddToInput = (files: File[]) => {
    promptInputRef.current?.addAttachment(files);
  };

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

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    const isEdit = hasAttachments;
    const prompt = message.text || 'Image processing request';
    
    // Generate unique ID for this request
    const imageId = Date.now().toString();
    
    // Create placeholder entry immediately
    const placeholderImage: GeneratedImage = {
      id: imageId,
      prompt,
      model: isEdit ? 'gemini' : model,
      timestamp: new Date(),
      attachmentRefs: message.files?.map(f => f.filename || 'attachment'),
      isEdit,
      isLoading: true,
    };

    setImageHistory(prev => [placeholderImage, ...prev]);
    setLoading(true);
    try {
      let endpoint: string;
      let body: any;

      if (isEdit) {
        // Use edit-image endpoint when there are attachments
        endpoint = '/api/edit-image';
        // Get the first image attachment
        console.log('Message files:', message.files); // Debug log
        const imageFile = message.files?.find(file => 
          file.mediaType?.startsWith('image/') || file.type === 'file'
        );
        
        if (imageFile && imageFile.url) {
          // The PromptInput provides a URL to the file, we need to convert it to base64
          try {
            // Fetch the blob from the object URL
            const response = await fetch(imageFile.url);
            const blob = await response.blob();
            
            // Convert blob to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error('Failed to convert blob to base64'));
                }
              };
              reader.onerror = reject;
            });
            
            reader.readAsDataURL(blob);
            const dataUrl = await base64Promise;
            
            body = { prompt, imageUrl: dataUrl };
          } catch (error) {
            console.error('Error converting image file:', error);
            throw new Error('Failed to process image attachment');
          }
        } else {
          throw new Error('No image attachment found');
        }
      } else {
        // Use generate-image endpoint for text-only prompts
        endpoint = '/api/generate-image';
        body = { prompt, model };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEdit ? 'edit' : 'generate'} image`);
      }

      const { imageUrl } = await response.json();
      
      // Update the existing placeholder entry with the result
      setImageHistory(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, imageUrl, isLoading: false }
            : img
        )
      );
    } catch (error) {
      console.error(`Error ${isEdit ? 'editing' : 'generating'} image:`, error);
      
      // Update the placeholder entry with error state
      setImageHistory(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { 
                ...img, 
                isLoading: false, 
                error: `Failed to ${isEdit ? 'edit' : 'generate'} image`
              }
            : img
        )
      );
    } finally {
      setLoading(false);
    }

    setText('');
  };

  return (
    <div className="space-y-6">
      <PromptInputWithRef
        ref={promptInputRef}
        onSubmit={handleSubmit}
        text={text}
        setText={setText}
        model={model}
        setModel={setModel}
        loading={loading}
        models={models}
      />

      {/* Image History - Now properly outside PromptInput */}
      <ImageHistory 
        imageHistory={imageHistory} 
        onAddToInput={handleAddToInput}
        timerTick={timerTick}
      />
    </div>
  );
}