import { useEffect } from 'react';

interface UseStepValidationProps {
  canProceed: boolean;
  onValidationChange?: (canProceed: boolean) => void;
}

/**
 * Reusable hook for step components to communicate their validation state to parent components.
 * This ensures that parent components can properly manage UI elements like "Next" buttons.
 *
 * @param canProceed - Whether the current step can proceed (form is valid)
 * @param onValidationChange - Optional callback to notify parent of validation state changes
 */
export function useStepValidation({
  canProceed,
  onValidationChange,
}: UseStepValidationProps) {
  // Communicate validation state changes to parent
  useEffect(() => {
    onValidationChange?.(canProceed);
  }, [canProceed, onValidationChange]);
}
