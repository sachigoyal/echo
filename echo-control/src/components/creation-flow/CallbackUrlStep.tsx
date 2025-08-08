import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { BaseStepProps } from './types';

interface CallbackUrlStepProps extends BaseStepProps {
  callbackUrl: string;
  setCallbackUrl: (url: string) => void;
  isUpdating: boolean;
  error: string | null;
}

const CallbackUrlStep = ({
  isTransitioning,
  onError,
  callbackUrl,
  setCallbackUrl,
  isUpdating,
  error,
}: CallbackUrlStepProps) => {
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

  // Step configuration for the callback URL step
  const stepConfig = {
    key: 'callbackUrl',
    prompt: 'What is your production callback URL? (optional)',
    placeholder: 'https://yourdomain.com',
    required: false,
    type: 'text' as const,
    helpText:
      'Enter the URL where users will be redirected after signing in with Echo from your production app. Localhost URLs (like http://localhost:3000) are automatically allowed for development.',
  };

  return (
    <div
      className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}
    >
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <ChevronRight className="h-5 w-5 text-secondary" />
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          {stepConfig.prompt}
        </h2>
      </div>

      {/* Input Field */}
      <div className="relative mb-6 sm:mb-8">
        <div className="space-y-6">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={callbackUrl}
              onChange={e => setCallbackUrl(e.target.value)}
              placeholder={stepConfig.placeholder}
              disabled={isUpdating}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-secondary focus:border-secondary outline-hidden transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isUpdating && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Text */}
      {stepConfig.helpText && (
        <div className="mb-6 text-sm text-muted-foreground">
          {stepConfig.helpText}
        </div>
      )}
    </div>
  );
};

export default CallbackUrlStep;
