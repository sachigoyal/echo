import { ChevronRight, Check } from 'lucide-react';
import { Button } from '../ui/button';

interface StepCanProceedProps {
  onClick: () => Promise<void>; // Fix: Make this async
  isSubmitting?: boolean;
  isLastStep: boolean;
}

export default function StepCanProceed({
  onClick,
  isSubmitting = false,
  isLastStep,
}: StepCanProceedProps) {
  const handleClick = async () => {
    try {
      await onClick();
    } catch (error) {
      console.error('Error in StepCanProceed onClick:', error);
      // Error handling is done by the parent components
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isSubmitting}
      variant="secondary"
      size="lg"
    >
      {isSubmitting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary-foreground border-t-transparent"></div>
          <span>Creating...</span>
        </>
      ) : isLastStep ? (
        <>
          <Check className="h-4 w-4" />
          <span>Done</span>
        </>
      ) : (
        <>
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
