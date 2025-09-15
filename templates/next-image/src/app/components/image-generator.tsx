'use client';

import { useState, useRef, useEffect } from 'react';
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
import { X } from 'lucide-react';
import { ImageHistory, type GeneratedImage, type ModelOption } from './image-history';


export default function ImageGenerator() {
  const [model, setModel] = useState<ModelOption>('gemini');
  const [loading, setLoading] = useState(false);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const addToInputRef = useRef<((files: File[]) => void) | null>(null);
  const clearFormRef = useRef<(() => void) | null>(null);

  const models = [
    { id: 'openai' as const, name: 'GPT Image' },
    { id: 'gemini' as const, name: 'Gemini Flash Image' },
  ];

  const handleAddToInput = (files: File[]) => {
    if (addToInputRef.current) {
      addToInputRef.current(files);
    }
  };

  // Component to manage file input from within PromptInput context
  function FileInputManager() {
    const attachments = usePromptInputAttachments();
    
    useEffect(() => {
      addToInputRef.current = (files: File[]) => {
        attachments.add(files);
      };
      
      clearFormRef.current = () => {
        attachments.clear();
      };
      
      return () => {
        addToInputRef.current = null;
        clearFormRef.current = null;
      };
    }, [attachments]);
    
    return null;
  }

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

    // Clear the form
    if (clearFormRef.current) {
      clearFormRef.current();
    }
  };

  return (
    <div className="space-y-6">
      <PromptInput 
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
              onClick={() => clearFormRef.current?.()}
              className="h-9 w-9 p-0"
            >
              <X size={16} />
            </Button>
            <PromptInputSubmit 
              disabled={loading} 
              status={loading ? 'streaming' : 'ready'} 
            />
          </div>
        </PromptInputToolbar>
      </PromptInput>

      {/* Image History - Now properly outside PromptInput */}
      <ImageHistory 
        imageHistory={imageHistory} 
        onAddToInput={handleAddToInput}
      />
    </div>
  );
}