'use client';

// React imports
import { useState, useRef, useEffect } from 'react';

// UI component imports
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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

// Local imports
import { ImageHistory, type GeneratedImage } from './image-history';
import { blobToBase64 } from '@/lib/utils';

// ===== CONSTANTS =====

const models = [
  { id: 'openai' as const, name: 'GPT Image' },
  { id: 'gemini' as const, name: 'Gemini Flash Image' },
] as const;

export type ModelOption = typeof models[number]['id'];

// ===== TYPES =====
interface GenerateImageRequest {
  prompt: string;
  model: ModelOption;
}

interface EditImageRequest {
  prompt: string;
  imageUrl: string;
}

interface ImageResponse {
  imageUrl: {
    base64Data: string;
    mediaType: string;
  };
}

// ===== API FUNCTIONS =====
async function generateImage(request: GenerateImageRequest): Promise<ImageResponse> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function editImage(request: EditImageRequest): Promise<ImageResponse> {
  const response = await fetch('/api/edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

// ===== MAIN COMPONENT =====
export default function ImageGenerator() {
  const [model, setModel] = useState<ModelOption>('gemini');
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const promptInputRef = useRef<HTMLFormElement>(null);
  const attachmentActionsRef = useRef<{
    addFiles: (files: File[]) => void;
    clear: () => void;
  } | null>(null);

  const handleAddToInput = (files: File[]) => {
    attachmentActionsRef.current?.addFiles(files);
  };

  const clearForm = () => {
    promptInputRef.current?.reset();
    attachmentActionsRef.current?.clear();
  };

  // Component to manage file input from within PromptInput context
  function FileInputManager() {
    const attachments = usePromptInputAttachments();
    
    useEffect(() => {
      attachmentActionsRef.current = {
        addFiles: (files: File[]) => attachments.add(files),
        clear: () => attachments.clear(),
      };
      
      return () => {
        attachmentActionsRef.current = null;
      };
    }, [attachments]);
    
    return null;
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    const isEdit = hasAttachments;
    const prompt = message.text?.trim() || '';
    
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
    try {
      let imageUrl: ImageResponse['imageUrl'];

      if (isEdit) {
        const imageFile = message.files?.find(file => 
          file.mediaType?.startsWith('image/') || file.type === 'file'
        );
        
        if (!imageFile?.url) {
          throw new Error('No image file found in attachments');
        }

        try {
          const response = await fetch(imageFile.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch image file: ${response.status}`);
          }
          
          const blob = await response.blob();
          const dataUrl = await blobToBase64(blob);
          
          const result = await editImage({ prompt, imageUrl: dataUrl });
          imageUrl = result.imageUrl;
        } catch (error) {
          console.error('Error processing image file:', error);
          throw error; // Re-throw all errors as-is
        }
      } else {
        const result = await generateImage({ prompt, model });
        imageUrl = result.imageUrl;
      }
      
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
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update the placeholder entry with error state
      setImageHistory(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { 
                ...img, 
                isLoading: false, 
                error: errorMessage
              }
            : img
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <PromptInput 
        ref={promptInputRef}
        onSubmit={handleSubmit} 
        className="relative" 
        globalDrop 
        multiple 
        accept="image/*"
      >
        <FileInputManager />
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearForm}
              className="h-9 w-9 p-0"
            >
              <X size={16} />
            </Button>
            <PromptInputSubmit />
          </div>
        </PromptInputToolbar>
      </PromptInput>

      <ImageHistory 
        imageHistory={imageHistory} 
        onAddToInput={handleAddToInput}
      />
    </div>
  );
}