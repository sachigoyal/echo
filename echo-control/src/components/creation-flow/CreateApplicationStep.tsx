import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { BaseStepProps } from './types';

interface CreateApplicationStepProps extends BaseStepProps {
  appName: string;
  setCurrentAppName: (name: string) => void;
  isCreating: boolean;
  error: string | null;
}

const CreateApplicationStep = ({
  onError,
  appName,
  setCurrentAppName,
  isCreating,
  error,
}: CreateApplicationStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Report hook errors to parent
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div>
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <ChevronRight className="h-5 w-5 text-secondary" />
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          What would you like to name your application?
        </h2>
      </div>

      {/* Input Field */}
      <div className="relative mb-6 sm:mb-8">
        <div className="space-y-6">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={appName}
              onChange={e => setCurrentAppName(e.target.value)}
              placeholder="My Echo App"
              disabled={isCreating}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isCreating && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateApplicationStep;
