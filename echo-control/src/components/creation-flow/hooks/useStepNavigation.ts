import { useEffect, useCallback } from 'react';

interface UseStepNavigationProps {
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
  autoFocus?: boolean;
  focusDelay?: number;
}

export function useStepNavigation({
  canProceed,
  onNext,
  onBack,
  autoFocus = true,
  focusDelay = 300,
}: UseStepNavigationProps) {
  // Focus callback for input elements
  const focusCallback = useCallback(
    (element: HTMLInputElement | null) => {
      if (element && autoFocus) {
        const timer = setTimeout(() => {
          element.focus();
        }, focusDelay);
        return () => clearTimeout(timer);
      }
    },
    [autoFocus, focusDelay]
  );

  // Handle keyboard events
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (canProceed) {
          onNext();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    },
    [canProceed, onNext, onBack]
  );

  // Document-level keyboard handling
  useEffect(() => {
    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (canProceed) {
          onNext();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [canProceed, onNext, onBack]);

  return {
    focusCallback,
    handleKeyPress,
  };
}
