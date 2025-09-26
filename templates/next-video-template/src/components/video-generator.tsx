'use client';

import {
  PromptInput,
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
} from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import type {
  GeneratedVideo,
  GenerateVideoRequest,
  VideoModelConfig,
  VideoModelOption,
  VideoResponse,
} from '@/lib/types';
import { VideoHistory } from './video-history';

/**
 * Available AI models for video generation
 * These models integrate with the Echo SDK to provide different video generation capabilities
 */
const models: VideoModelConfig[] = [{ id: 'veo-3', name: 'Veo 3 Fast' }];

/**
 * API functions for video generation
 * These functions communicate with the Echo SDK backend routes
 */

// ===== API FUNCTIONS =====
async function generateVideo(
  request: GenerateVideoRequest
): Promise<VideoResponse> {
  const response = await fetch('/api/generate-video', {
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
  const [model, setModel] = useState<VideoModelOption>('veo-3');
  const [durationSeconds, setDurationSeconds] = useState<number>(4);
  const [videoHistory, setVideoHistory] = useState<GeneratedVideo[]>([]);
  const promptInputRef = useRef<HTMLFormElement>(null);

  const clearForm = useCallback(() => {
    promptInputRef.current?.reset();
  }, []);

  /**
   * Handles form submission for video generation
   * - Text-only: generates new video using selected model and duration
   */
  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const hasText = Boolean(message.text?.trim());

      // Require text prompt
      if (!hasText) {
        return;
      }

      const prompt = message.text?.trim() || '';

      // Generate unique ID for this request
      const videoId = `vid_${Date.now()}`;

      // Create placeholder entry immediately for optimistic UI
      const placeholderVideo: GeneratedVideo = {
        id: videoId,
        prompt,
        model: model,
        durationSeconds,
        timestamp: new Date(),
        isLoading: true,
      };

      // Add to history immediately for responsive UI
      setVideoHistory(prev => [placeholderVideo, ...prev]);

      try {
        const result = await generateVideo({
          prompt,
          model,
          durationSeconds,
        });

        // Update the existing placeholder entry with the result
        setVideoHistory(prev =>
          prev.map(vid =>
            vid.id === videoId
              ? {
                  ...vid,
                  videoUrl: result.videoUrl,
                  operationName: result.operationName,
                  isLoading: false,
                }
              : vid
          )
        );
      } catch (error) {
        console.error('Error generating video:', error);

        // Update the placeholder entry with error state
        setVideoHistory(prev =>
          prev.map(vid =>
            vid.id === videoId
              ? {
                  ...vid,
                  isLoading: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Failed to generate video',
                }
              : vid
          )
        );
      }
    },
    [model, durationSeconds]
  );

  return (
    <div className="space-y-6">
      <PromptInput
        ref={promptInputRef}
        onSubmit={handleSubmit}
        className="relative"
      >
        <PromptInputBody>
          <PromptInputTextarea placeholder="Describe the video you want to generate..." />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputModelSelect
              onValueChange={value => {
                setModel(value as VideoModelOption);
              }}
              value={model}
            >
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map(model => (
                  <PromptInputModelSelectItem key={model.id} value={model.id}>
                    {model.name}
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
                value={[durationSeconds]}
                onValueChange={([value]) => setDurationSeconds(value)}
                min={1}
                max={8}
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
