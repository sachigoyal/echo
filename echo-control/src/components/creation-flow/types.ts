export interface StepComponentInterface {
  canGoNext: boolean;
  update: () => Promise<void>;
}

export interface BaseStepProps {
  isTransitioning: boolean;
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
}
