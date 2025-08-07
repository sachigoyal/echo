import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OwnerEchoApp } from '../../../lib/apps/types';

interface StepConfig {
  key: string;
  prompt: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'github-search' | 'code' | 'verification';
  helpText?: string;
}

interface StepState {
  canGoNext: boolean;
  update: () => Promise<void | string | OwnerEchoApp>;
  error: string | null;
}

interface UseCreationFlowNavigationReturn {
  currentStep: number;
  isTransitioning: boolean;
  error: string | null;
  currentStepData: StepConfig | null;
  isLastStep: boolean;
  app: OwnerEchoApp | null;
  goToNext: (stepState: StepState) => Promise<void>;
  goToBack: () => Promise<void>;
  setTransitioning: (isTransitioning: boolean) => void;
  setError: (error: string | null) => void;
  setApp: (app: OwnerEchoApp) => void;
}

export function useCreationFlowNavigation(
  steps: StepConfig[],
  initialStep: number = 0
): UseCreationFlowNavigationReturn {
  const router = useRouter();
  const [app, setApp] = useState<OwnerEchoApp | null>(null);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStepData = steps[currentStep] || null;
  const isLastStep = currentStep === steps.length - 1;

  const goToNext = useCallback(
    async (stepState: StepState) => {
      // Check if current step can proceed
      if (!stepState.canGoNext) {
        return;
      }

      try {
        setError(null);
        setIsTransitioning(true);

        // Call the step's update method
        const result = await stepState.update();

        // If the result is a DetailedEchoApp (from createApp), store it
        if (result && typeof result === 'object' && 'id' in result) {
          setApp(result as OwnerEchoApp);
        }

        if (isLastStep) {
          if (app?.id) {
            router.push(`/owner/${app.id}/settings`);
          } else {
            router.push(`/`);
          }
        } else {
          setCurrentStep(prev => prev + 1);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setIsTransitioning(false);
      }
    },
    [isLastStep, app?.id, router]
  );

  const goToBack = useCallback(async () => {
    if (currentStep === 0) return;

    setCurrentStep(prev => prev - 1);
    setError(null);
  }, [currentStep]);

  const setTransitioningCallback = useCallback((transitioning: boolean) => {
    setIsTransitioning(transitioning);
  }, []);

  const handleSetError = useCallback((error: string | null) => {
    setError(error);
  }, []);

  const handleSetApp = useCallback((app: OwnerEchoApp) => {
    setApp(app);
  }, []);

  return {
    currentStep,
    isTransitioning,
    error,
    currentStepData,
    isLastStep,
    app,
    goToNext,
    goToBack,
    setTransitioning: setTransitioningCallback,
    setError: handleSetError,
    setApp: handleSetApp,
  };
}
