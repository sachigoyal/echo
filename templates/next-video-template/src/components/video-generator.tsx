'use client';

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useVideoGeneration } from '@/lib/hooks/useVideoGeneration';
import { useVideoHistory } from '@/lib/hooks/useVideoHistory';
import { useVideoOperations } from '@/lib/hooks/useVideoOperations';
import type { VideoModelConfig, VideoModelOption } from '@/lib/types';
import { X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { FileInputManager } from './FileInputManager';
import { VideoHistory } from './video-history';

const models: VideoModelConfig[] = [
  { id: 'veo-3.0-fast-generate-preview', name: 'Veo 3 Fast' },
  { id: 'veo-3.0-generate-preview', name: 'Veo 3' },
];

/**
 * Main VideoGenerator component
 *
 * This component demonstrates how to integrate Echo SDK with AI video generation:
 * - Uses PromptInput for unified input handling
 * - Supports text-to-video generation with duration control
 * - Maintains history of all generated videos
 * - Provides seamless model switching between available video models
 */
export default function VideoGenerator() {
  const [model, setModel] = useState<VideoModelOption>(
    'veo-3.0-fast-generate-preview'
  );
  const [durationSeconds, setDurationSeconds] = useState<4 | 6 | 8>(4);
  const promptInputRef = useRef<HTMLFormElement>(null);

  const allowedDurations = [4, 6, 8] as const;

  const { videoHistory, isInitialized, addVideo, updateVideo } =
    useVideoHistory();

  useVideoOperations({
    isInitialized,
    onOperationComplete: updateVideo,
  });

  const { handleSubmit } = useVideoGeneration({
    model,
    durationSeconds,
    onVideoAdded: addVideo,
    onVideoUpdated: updateVideo,
  });

  const clearForm = useCallback(() => {
    promptInputRef.current?.reset();
    window.__promptInputActions?.clear();
  }, []);

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
            {attachment => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea placeholder="Describe the video you want to generate, or attach an image..." />
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
              onValueChange={value => setModel(value as VideoModelOption)}
              value={model}
            >
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map(m => (
                  <PromptInputModelSelectItem key={m.id} value={m.id}>
                    {m.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>

            <div className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg bg-white">
              <Label
                htmlFor="duration-slider"
                className="text-sm font-medium whitespace-nowrap"
              >
                Duration: {durationSeconds}s
              </Label>
              <Slider
                id="duration-slider"
                value={[allowedDurations.indexOf(durationSeconds)]}
                onValueChange={([index]) =>
                  setDurationSeconds(allowedDurations[index])
                }
                min={0}
                max={allowedDurations.length - 1}
                step={1}
                className="w-20"
              />
            </div>
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

      <VideoHistory videoHistory={videoHistory} />
    </div>
  );
}
