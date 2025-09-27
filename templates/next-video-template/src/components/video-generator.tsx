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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  GeneratedVideo,
  GenerateVideoRequest,
  VideoModelConfig,
  VideoModelOption,
  VideoOperation,
} from '@/lib/types';
import { GenerateVideosOperation } from '@google/genai';
import { videoOperationsStorage } from '@/lib/video-operations';
import { videoHistoryStorage } from '@/lib/video-history';
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
): Promise<GenerateVideosOperation> {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json(); // Return the SDK operation directly
}

async function checkVideoStatus(operation: GenerateVideosOperation): Promise<GenerateVideosOperation> {
  const response = await fetch('/api/check-video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName: operation.name }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json(); // Return the updated SDK operation directly
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
  const queryClient = useQueryClient();
  // Load existing history on mount
  useEffect(() => {
    const existing = videoHistoryStorage.getAll();
    if (existing.length > 0) {
      setVideoHistory(existing);
    }
  }, []);

  // Persist history on change
  useEffect(() => {
    if (videoHistory.length >= 0) {
      videoHistoryStorage.setAll(videoHistory);
    }
  }, [videoHistory]);


  const clearForm = useCallback(() => {
    promptInputRef.current?.reset();
  }, []);

  // Use TanStack Query to poll pending operations
  const { data: operationStatuses } = useQuery({
    queryKey: ['video-operations'],
    queryFn: async () => {
      // Get fresh pending operations each time
      const pendingOperations = videoOperationsStorage.getPending();

      if (pendingOperations.length === 0) {
        return [];
      }

      const results = await Promise.allSettled(
        pendingOperations.map(async (op) => {
          const result = await checkVideoStatus(op.operation);
          return { operationId: op.id, result };
        })
      );
      return results;
    },
    enabled: true, // Always enable, but return early if no pending ops
    refetchInterval: 5000,
  });

  // Update video history based on operation status changes
  useEffect(() => {
    if (!operationStatuses) return;

    let hasUpdates = false;
    const updates: Array<{ id: string; updates: Partial<GeneratedVideo> }> = [];

    operationStatuses.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { operationId, result: opResult } = result.value;

        // Handle any completed operation (done = true)
        if (opResult.done) {
          // Always update the operation in storage to mark it as done
          videoOperationsStorage.update(operationId, {
            operation: opResult,
          });

          const video = opResult.response?.generatedVideos?.[0]?.video;
          if (video && (video.uri || video.videoBytes)) {
            // Video completed successfully - handle both URI and bytes
            let videoUrl: string;

            if (video.videoBytes) {
              // Convert base64 bytes to data URL
              videoUrl = `data:video/mp4;base64,${video.videoBytes}`;
            } else if (video.uri) {
              // Use URI directly
              videoUrl = video.uri;
            } else {
              videoUrl = '';
            }

            updates.push({
              id: operationId,
              updates: { videoUrl, isLoading: false, error: undefined }
            });

            videoOperationsStorage.update(operationId, {
              videoUrl,
              error: undefined, // Clear any previous error
              operation: opResult,
            });
          } else {
            // Operation done but no video (failed, filtered, etc.)
            let errorMsg = 'Video generation failed';

            // Check for RAI filtering
            if (opResult.response?.raiMediaFilteredCount && opResult.response.raiMediaFilteredCount > 0) {
              const filterReasons = opResult.response.raiMediaFilteredReasons || [];
              errorMsg = filterReasons.length > 0 ? filterReasons[0] : 'Content was filtered by safety policies';
            } else if (opResult.error) {
              errorMsg = typeof opResult.error === 'string' ? opResult.error : 'Video generation failed';
            }

            updates.push({
              id: operationId,
              updates: { error: errorMsg, isLoading: false }
            });

            videoOperationsStorage.update(operationId, {
              error: errorMsg,
              operation: opResult,
            });
          }
          hasUpdates = true;
        }
      }
    });

    if (hasUpdates) {
      setVideoHistory(prev =>
        prev.map(video => {
          const update = updates.find(u => u.id === video.id);
          return update ? { ...video, ...update.updates } : video;
        })
      );
    }
  }, [operationStatuses]);


  // Recover operations on mount
  useEffect(() => {
    const savedOperations = videoOperationsStorage.getPending();

    if (savedOperations.length > 0) {
      const historyVideos: GeneratedVideo[] = savedOperations.map(operation => ({
        id: operation.id,
        prompt: operation.prompt,
        model: operation.model,
        durationSeconds: operation.durationSeconds,
        timestamp: operation.timestamp,
        isLoading: !operation.operation.done,
        videoUrl: operation.videoUrl,
        error: operation.error,
        operationName: operation.operation.name,
      }));

      setVideoHistory(prev => {
        // Avoid duplicating entries by id
        const existingIds = new Set(prev.map(v => v.id));
        const merged = [...historyVideos.filter(v => !existingIds.has(v.id)), ...prev];
        return merged;
      });
    }
  }, []);

  /**
   * Handles form submission for video generation
   * - Initiates async video generation and starts polling
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

        const video = result.response?.generatedVideos?.[0]?.video;
        if (result.done && video && (video.uri || video.videoBytes)) {
          // Video is already complete (unlikely but possible)
          let videoUrl: string;

          if (video.videoBytes) {
            // Convert base64 bytes to data URL
            videoUrl = `data:video/mp4;base64,${video.videoBytes}`;
          } else if (video.uri) {
            // Use URI directly
            videoUrl = video.uri;
          } else {
            videoUrl = '';
          }

          setVideoHistory(prev =>
            prev.map(vid =>
              vid.id === videoId
                ? {
                    ...vid,
                    videoUrl,
                    operationName: result.name,
                    isLoading: false,
                    error: undefined, // Clear any previous error
                  }
                : vid
            )
          );
        } else if (result.done && result.error) {
          // Handle immediate failure
          setVideoHistory(prev =>
            prev.map(vid =>
              vid.id === videoId
                ? {
                    ...vid,
                    isLoading: false,
                    error: typeof result.error === 'string' ? result.error : 'Video generation failed',
                  }
                : vid
            )
          );
        } else {
          // Create operation for polling
          const operation: VideoOperation = {
            id: videoId,
            prompt,
            model,
            durationSeconds,
            timestamp: new Date(),
            operation: result,
          };

          // Store operation in localStorage
          videoOperationsStorage.store(operation);

          // Invalidate queries to start polling
          queryClient.invalidateQueries({ queryKey: ['video-operations'] });

          // Update video history with operation name
          setVideoHistory(prev =>
            prev.map(vid =>
              vid.id === videoId
                ? {
                    ...vid,
                    operationName: result.name,
                  }
                : vid
            )
          );
        }
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
    [model, durationSeconds, queryClient]
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

      <VideoHistory
        videoHistory={videoHistory}
        onAppendVideo={video => setVideoHistory(prev => [video, ...prev])}
        onUpdateVideo={(id, updates) =>
          setVideoHistory(prev => prev.map(v => (v.id === id ? { ...v, ...updates } : v)))
        }
      />
    </div>
  );
}
