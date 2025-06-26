'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Check, Copy } from 'lucide-react';
import { GitHubSearchComponent } from '../../../../components/GitHubSearchComponent';
import { GitHubUser, GitHubRepo } from '../../../../lib/github-api';

interface FormData {
  name: string;
  description: string;
  callbackUrl: string;
  githubType: 'user' | 'repo';
  githubId: string;
  githubVerified: boolean;
  githubMetadata?: GitHubUser | GitHubRepo;
}

interface StepConfig {
  key: string;
  prompt: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'github-search' | 'code' | 'verification' | 'select';
  helpText?: string;
  options?: { value: string; label: string }[];
  dynamicPrompt?: (formData: FormData, searchParams: URLSearchParams) => string;
  dynamicHelpText?: (
    formData: FormData,
    searchParams: URLSearchParams
  ) => string;
}

const steps: StepConfig[] = [
  {
    key: 'name',
    prompt: 'What would you like to name your application?',
    placeholder: 'My Echo App',
    required: true,
    type: 'text' as const,
  },
  {
    key: 'description',
    prompt: 'Describe what this app does (optional)',
    placeholder: 'A powerful AI application built with Echo',
    required: false,
    type: 'text' as const,
  },
  {
    key: 'callbackUrl',
    prompt: 'What is your production callback URL? (optional)',
    placeholder: 'https://yourdomain.com',
    required: false,
    type: 'text' as const,
    helpText:
      'Enter the URL where users will be redirected after signing in with Echo from your production app. Localhost URLs (like http://localhost:3000) are automatically allowed for development.',
  },
  {
    key: 'githubId',
    prompt: 'Who should receive proceeds from this app? (optional)',
    placeholder: 'Search for a GitHub user or repository...',
    required: false,
    type: 'github-search' as const,
    helpText:
      'Select a GitHub user or repository to receive payment proceeds from your Echo app. This determines who gets paid when users purchase tokens through your app.',
    dynamicPrompt: (formData: FormData, searchParams: URLSearchParams) => {
      const hasPrePopulated =
        searchParams.get('githubId') ||
        searchParams.get('repoId') ||
        searchParams.get('userId');
      if (hasPrePopulated) {
        return 'Confirm who should receive proceeds from this app (optional)';
      }
      return 'Who should receive proceeds from this app? (optional)';
    },
    dynamicHelpText: (formData: FormData, searchParams: URLSearchParams) => {
      const hasPrePopulated =
        searchParams.get('githubId') ||
        searchParams.get('repoId') ||
        searchParams.get('userId');
      if (hasPrePopulated) {
        return "We've pre-selected a GitHub user or repository for you. Please verify this is correct, or search for a different one. This determines who gets paid when users purchase tokens through your app.";
      }
      return 'Select a GitHub user or repository to receive payment proceeds from your Echo app. This determines who gets paid when users purchase tokens through your app.';
    },
  },
  {
    key: 'configuration',
    prompt: 'Review your configuration',
    placeholder: '',
    required: false,
    type: 'code' as const,
  },
  {
    key: 'testing',
    prompt: 'Test your integration',
    placeholder: '',
    required: false,
    type: 'verification' as const,
  },
];

function CreateApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    callbackUrl: '',
    githubType: 'user',
    githubId: '',
    githubVerified: false,
    githubMetadata: undefined,
  });
  const [currentValue, setCurrentValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [integrationVerified, setIntegrationVerified] = useState(false);
  const [githubVerified, setGithubVerified] = useState(false);

  const handleGithubChange = (
    value: string,
    verified: boolean,
    metadata?: GitHubUser | GitHubRepo,
    detectedType?: 'user' | 'repo'
  ) => {
    // Use a single update to prevent multiple re-renders
    setCurrentValue(value);
    setGithubVerified(verified);

    // Batch the form data update
    setFormData(prev => {
      // Only update if values have actually changed
      if (
        prev.githubId === value &&
        prev.githubVerified === verified &&
        prev.githubMetadata === metadata
      ) {
        return prev;
      }

      return {
        ...prev,
        githubId: value,
        githubVerified: verified,
        githubMetadata: metadata,
        githubType: detectedType || prev.githubType,
      };
    });
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = (() => {
    // Safety check: ensure currentStepData exists
    if (!currentStepData) return false;

    if (
      currentStepData.type === 'code' ||
      currentStepData.type === 'verification'
    )
      return true;
    if (!currentStepData.required && !currentValue.trim()) return true;
    if (currentStepData.required && !currentValue.trim()) return false;

    // Special validation for callback URL - only validate if a value is provided
    if (currentStepData.key === 'callbackUrl' && currentValue.trim()) {
      return isValidUrl(currentValue.trim());
    }

    // For GitHub search, require verification if a value is provided
    if (currentStepData.type === 'github-search' && currentValue.trim()) {
      return githubVerified;
    }

    return true;
  })();

  const generateConfigCode = () => {
    if (!createdAppId) {
      return 'Loading configuration...';
    }

    const callbackUrl = formData.callbackUrl || 'http://localhost:3000';

    return `import { EchoProvider } from '@zdql/echo-react-sdk';
import App from './App';

const echoConfig = {
  appId: '${createdAppId}',
  apiUrl: 'https://echo.merit.systems',
  redirectUri: '${callbackUrl}',
  // Use your production URL or localhost for development
};

function Root() {
  return (
    <EchoProvider config={echoConfig}>
      <App />
    </EchoProvider>
  );
}

export default Root;`;
  };

  const createApp = useCallback(async () => {
    try {
      console.log('formData', formData);

      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          authorizedCallbackUrls: formData.callbackUrl
            ? [formData.callbackUrl]
            : [],
          githubType:
            formData.githubId && formData.githubVerified
              ? formData.githubType
              : undefined,
          githubId:
            formData.githubId && formData.githubVerified
              ? formData.githubId
              : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create echo app');
      }

      console.log('data', data);

      setCreatedAppId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating app:', error);
      setError(error instanceof Error ? error.message : 'Failed to create app');
      throw error;
    }
  }, [formData, setCreatedAppId, setError]);

  const checkForRefreshToken = async (appId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/owner/apps/${appId}/refresh-tokens`);
      const data = await response.json();

      // Check if there are any active refresh tokens for this app
      return data.hasActiveTokens || false;
    } catch (error) {
      console.error('Error checking refresh token:', error);
      return false;
    }
  };

  const startPolling = useCallback((appId: string) => {
    setIsPolling(true);
    const interval = setInterval(async () => {
      const hasTokens = await checkForRefreshToken(appId);
      if (hasTokens) {
        setIntegrationVerified(true);
        setIsPolling(false);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 300000);
  }, []);

  const focusCallback = (
    element: HTMLInputElement | HTMLSelectElement | null
  ) => {
    if (element) {
      const timer = setTimeout(() => {
        element.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    // Initialize form data from query parameters
    const githubId =
      searchParams.get('githubId') ||
      searchParams.get('repoId') ||
      searchParams.get('userId');

    if (githubId) {
      // Infer type from the parameter name
      const inferredType = searchParams.get('repoId')
        ? 'repo'
        : searchParams.get('userId')
          ? 'user'
          : (searchParams.get('githubType') as 'user' | 'repo') || 'user';
      setFormData(prev => ({
        ...prev,
        githubType: inferredType,
        githubId,
        githubVerified: false, // Will need to verify again
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    // This effect will trigger after each step change
    // The actual focusing is handled by the callback ref
  }, [currentStep]);

  useEffect(() => {
    // Auto-start polling when reaching the verification step
    if (
      currentStepData.type === 'verification' &&
      createdAppId &&
      !isPolling &&
      !integrationVerified
    ) {
      startPolling(createdAppId);
    }
  }, [
    currentStep,
    createdAppId,
    currentStepData.type,
    isPolling,
    integrationVerified,
    startPolling,
  ]);

  useEffect(() => {
    // Set current value from form data when step changes
    const stepKey = currentStepData.key as keyof FormData;
    const value = formData[stepKey];

    // Only set string values as currentValue
    if (typeof value === 'string') {
      setCurrentValue(value || '');
    } else {
      setCurrentValue('');
    }
  }, [currentStep, formData, currentStepData.key]);

  const shouldSkipStep = useCallback((stepIndex: number): boolean => {
    const step = steps[stepIndex];
    if (!step) return false;

    // Don't skip any steps - let users verify their GitHub selection
    return false;
  }, []);

  const getNextStep = useCallback(
    (currentStepIndex: number): number => {
      let nextStep = currentStepIndex + 1;
      while (nextStep < steps.length && shouldSkipStep(nextStep)) {
        nextStep++;
      }
      return nextStep;
    },
    [shouldSkipStep]
  );

  const handleNext = useCallback(async () => {
    // Safety check: ensure we have valid step data
    if (!currentStepData || !canProceed) return;

    setError(null);

    // Update form data
    let updatedFormData = {
      ...formData,
      [currentStepData.key]: currentValue.trim(),
    };

    // Special handling for GitHub search step - reset GitHub fields if no selection made
    if (currentStepData.type === 'github-search' && !currentValue.trim()) {
      updatedFormData = {
        ...updatedFormData,
        githubId: '',
        githubVerified: false,
        githubMetadata: undefined,
      };
    }

    setFormData(updatedFormData);

    if (isLastStep) {
      // On the final step (verification), complete the flow
      router.push('/owner');
    } else {
      // Get the next step, skipping any that should be skipped
      const nextStep = getNextStep(currentStep);

      // Safety check: ensure next step is valid
      if (nextStep >= steps.length) {
        router.push('/owner');
        return;
      }

      const nextStepData = steps[nextStep];

      if (nextStepData?.key === 'configuration' && !createdAppId) {
        // Create the app before showing the configuration step
        setIsSubmitting(true);
        try {
          await createApp();
          // Move to configuration step after creating app
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentStep(nextStep);
            setCurrentValue('');
            setIsTransitioning(false);
          }, 150);
        } catch {
          // Error is already handled in createApp
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // Normal step transition
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentStep(nextStep);
          setCurrentValue('');
          setIsTransitioning(false);
        }, 150);
      }
    }
  }, [
    currentStepData,
    canProceed,
    formData,
    currentValue,
    isLastStep,
    router,
    createApp,
    getNextStep,
    currentStep,
    createdAppId,
    setIsSubmitting,
    setFormData,
    setError,
    setIsTransitioning,
    setCurrentStep,
    setCurrentValue,
  ]);

  const getPreviousStep = useCallback(
    (currentStepIndex: number): number => {
      let prevStep = currentStepIndex - 1;
      while (prevStep >= 0 && shouldSkipStep(prevStep)) {
        prevStep--;
      }
      return prevStep;
    },
    [shouldSkipStep]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canProceed && currentStepData) {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleBack();
    }
  };

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      // On first step, go back to main screen
      router.push('/owner');
    } else {
      // Go back to previous step, skipping any that should be skipped
      const prevStep = getPreviousStep(currentStep);
      if (prevStep < 0) {
        router.push('/owner');
        return;
      }

      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prevStep);
        // Set the current value to the previous step's data
        const previousStepKey = steps[prevStep].key as keyof FormData;
        const previousValue = formData[previousStepKey];

        // Only set string values as currentValue
        if (typeof previousValue === 'string') {
          setCurrentValue(previousValue || '');
        } else {
          setCurrentValue('');
        }
        setIsTransitioning(false);
      }, 150);
    }
  }, [
    currentStep,
    router,
    getPreviousStep,
    formData,
    setIsTransitioning,
    setCurrentStep,
    setCurrentValue,
  ]);

  // Add document-level key handling for all steps
  useEffect(() => {
    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      // Only handle if we have valid step data
      if (!currentStepData) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (canProceed && currentStepData) {
          handleNext();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleBack();
      }
    };

    // Add listener for all steps to ensure consistent keyboard navigation
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [currentStepData, canProceed, handleNext, handleBack]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-3 sm:p-6">
      {/* Terminal Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.02)_25px,rgba(255,255,255,0.02)_26px,transparent_27px,transparent_74px,rgba(255,255,255,0.02)_75px,rgba(255,255,255,0.02)_76px,transparent_77px),linear-gradient(rgba(255,255,255,0.02)_24px,transparent_25px,transparent_26px,rgba(255,255,255,0.02)_27px,rgba(255,255,255,0.02)_74px,transparent_75px,transparent_76px,rgba(255,255,255,0.02)_77px)] bg-[length:100px_100px]"></div>

      <div className="relative w-full max-w-4xl mx-auto">
        {/* Floating Content Container */}
        <div className="bg-gradient-to-br from-gray-900/20 to-black/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-12 border border-white/5 shadow-2xl min-h-[500px] flex flex-col">
          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="w-full bg-white/5 rounded-full h-0.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Safety check: only render if we have valid step data */}
            {!currentStepData ? (
              <div className="text-center">
                <div className="text-red-400 font-mono text-sm mb-4">
                  Invalid step configuration
                </div>
                <button
                  onClick={() => router.push('/owner')}
                  className="px-4 py-2 bg-gray-600/20 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-600/30 transition-colors font-mono text-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Prompt */}
                <div
                  className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}
                >
                  <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                    <span className="text-lg sm:text-xl font-mono text-gray-200">
                      {currentStepData.dynamicPrompt
                        ? currentStepData.dynamicPrompt(formData, searchParams)
                        : currentStepData.prompt}
                    </span>
                  </div>

                  {/* Input Field */}
                  <div
                    className="relative mb-4 sm:mb-6 lg:mb-8"
                    onKeyDown={handleKeyPress}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      {currentStepData.type !== 'code' && (
                        <span className="text-blue-400 font-mono text-base sm:text-lg">
                          $
                        </span>
                      )}
                      <div className="flex-1 relative">
                        {currentStepData.type === 'verification' ? (
                          <div className="space-y-8">
                            {!integrationVerified ? (
                              <>
                                {/* Instructions */}
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                                    <h3 className="text-lg sm:text-xl font-mono text-white">
                                      🚀 Test Your Integration
                                    </h3>
                                    <button
                                      onClick={handleBack}
                                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-600/20 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-600/30 transition-colors text-xs sm:text-sm font-mono"
                                    >
                                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180" />
                                      <span>Back to Configuration</span>
                                    </button>
                                  </div>
                                  <div className="space-y-2 sm:space-y-3 text-gray-300 text-xs sm:text-sm font-mono leading-relaxed">
                                    <p>
                                      1. Copy the configuration code from the
                                      previous step
                                    </p>
                                    <p>
                                      2. Set up your React app with the
                                      EchoProvider
                                    </p>
                                    <p>
                                      3. Add the EchoSignIn component to your
                                      app
                                    </p>
                                    <p>
                                      4. Run your app and click &quot;Sign In
                                      with Echo&quot;
                                    </p>
                                    <p>5. Complete the OAuth flow</p>
                                  </div>
                                </div>

                                {/* Polling Status */}
                                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                                    {isPolling ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-400 mx-auto sm:mx-0"></div>
                                        <span className="text-gray-300 font-mono text-xs sm:text-sm text-center sm:text-left">
                                          Waiting for your test login...
                                        </span>
                                      </>
                                    ) : createdAppId ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            startPolling(createdAppId)
                                          }
                                          className="px-3 sm:px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors text-xs sm:text-sm"
                                        >
                                          Start Monitoring
                                        </button>
                                        <span className="text-gray-400 font-mono text-xs sm:text-sm text-center sm:text-left">
                                          Click to start monitoring for test
                                          login
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-red-400 font-mono text-xs sm:text-sm text-center">
                                        App not created yet
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Success State */
                              <div className="text-center space-y-4 sm:space-y-6">
                                <div className="text-4xl sm:text-6xl">🎉</div>
                                <div className="space-y-2">
                                  <h3 className="text-lg sm:text-2xl font-mono text-green-400">
                                    Integration Successful!
                                  </h3>
                                  <p className="text-gray-300 font-mono text-xs sm:text-sm">
                                    Your Echo app is now configured and working
                                    properly.
                                  </p>
                                </div>
                                <button
                                  onClick={() => router.push('/owner')}
                                  className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 hover:bg-green-600/30 transition-colors font-mono text-xs sm:text-sm"
                                >
                                  Go to Dashboard
                                </button>
                              </div>
                            )}
                          </div>
                        ) : currentStepData.type === 'code' ? (
                          <div className="space-y-4 sm:space-y-6 max-w-full">
                            {!createdAppId ? (
                              /* Loading State */
                              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg sm:rounded-xl p-6 sm:p-8 backdrop-blur-sm text-center mx-auto max-w-md">
                                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                                <h3 className="text-base sm:text-lg font-mono text-white mb-2">
                                  Creating your Echo app...
                                </h3>
                                <p className="text-gray-400 font-mono text-xs sm:text-sm">
                                  Please wait while we generate your
                                  configuration
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center space-y-4 sm:space-y-6 w-full">
                                {/* Configuration Code Block */}
                                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm w-full max-w-4xl">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                                    <h3 className="text-base sm:text-lg font-mono text-white text-center sm:text-left">
                                      React Configuration
                                    </h3>
                                    <button
                                      onClick={() => {
                                        const code = generateConfigCode();
                                        navigator.clipboard.writeText(code);
                                      }}
                                      className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors text-xs sm:text-sm mx-auto sm:mx-0"
                                    >
                                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <div className="w-full">
                                    <div className="bg-black/20 rounded p-3 sm:p-4 overflow-hidden">
                                      <pre className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words w-full">
                                        <code className="block w-full">
                                          {generateConfigCode()}
                                        </code>
                                      </pre>
                                    </div>
                                  </div>
                                </div>

                                {/* Installation Instructions */}
                                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm w-full max-w-4xl">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                                    <h3 className="text-base sm:text-lg font-mono text-white text-center sm:text-left">
                                      Installation
                                    </h3>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          'npm install @zdql/echo-react-sdk'
                                        );
                                      }}
                                      className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors text-xs sm:text-sm mx-auto sm:mx-0"
                                    >
                                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <div className="w-full">
                                    <div className="bg-black/20 rounded p-3 sm:p-4 overflow-hidden">
                                      <pre className="text-xs sm:text-sm text-gray-300 font-mono whitespace-pre-wrap break-words w-full">
                                        <code className="block w-full">
                                          npm install @zdql/echo-react-sdk
                                        </code>
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : currentStepData.type === 'github-search' ? (
                          <GitHubSearchComponent
                            value={currentValue}
                            onChange={handleGithubChange}
                            placeholder={currentStepData.placeholder}
                          />
                        ) : (
                          <input
                            ref={focusCallback}
                            type="text"
                            value={currentValue}
                            onChange={e => setCurrentValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={currentStepData.placeholder}
                            className="w-full bg-transparent border-none outline-none text-lg sm:text-xl font-mono text-white placeholder-gray-500 pb-3"
                            style={{
                              borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
                              transition: 'border-color 0.3s ease',
                            }}
                            onFocus={e => {
                              e.target.style.borderBottom =
                                '1px solid rgba(59, 130, 246, 0.6)';
                            }}
                            onBlur={e => {
                              e.target.style.borderBottom =
                                '1px solid rgba(75, 85, 99, 0.3)';
                            }}
                          />
                        )}

                        {/* Animated cursor - only show for input fields */}
                        {currentStepData.type !== 'code' &&
                          currentStepData.type !== 'github-search' && (
                            <div className="absolute right-0 bottom-3 w-0.5 h-6 bg-blue-400 animate-pulse"></div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Help Text */}
                  {(currentStepData.helpText ||
                    currentStepData.dynamicHelpText) && (
                    <div className="mt-3 sm:mt-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-400 font-mono">
                      {currentStepData.dynamicHelpText
                        ? currentStepData.dynamicHelpText(
                            formData,
                            searchParams
                          )
                        : currentStepData.helpText}
                    </div>
                  )}

                  {/* URL Validation Error */}
                  {currentStepData.key === 'callbackUrl' &&
                    currentValue.trim() &&
                    !isValidUrl(currentValue.trim()) && (
                      <div className="mt-2 mb-3 sm:mb-4 text-xs sm:text-sm text-red-400 font-mono">
                        Please enter a valid URL (must start with http:// or
                        https://)
                      </div>
                    )}

                  {/* GitHub Verification Error */}
                  {currentStepData.type === 'github-search' &&
                    currentValue.trim() &&
                    !githubVerified && (
                      <div className="mt-2 mb-3 sm:mb-4 text-xs sm:text-sm text-red-400 font-mono">
                        Please verify the GitHub user or repository before
                        proceeding
                      </div>
                    )}

                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 sm:mt-8 space-y-4 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                      <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs sm:text-sm text-gray-400 font-mono">
                        <span>Press</span>
                        <kbd
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-700/40 rounded-md border border-gray-600/40 text-gray-300 cursor-pointer hover:bg-gray-600/40 hover:text-white transition-colors"
                          onClick={() =>
                            canProceed && currentStepData && handleNext()
                          }
                        >
                          Enter
                        </kbd>
                        <span>to continue</span>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs sm:text-sm text-gray-500 font-mono">
                        <span>Press</span>
                        <kbd
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-700/40 rounded-md border border-gray-600/40 text-gray-400 cursor-pointer hover:bg-gray-600/40 hover:text-gray-300 transition-colors"
                          onClick={handleBack}
                        >
                          Esc
                        </kbd>
                        <span>
                          to {currentStep === 0 ? 'cancel' : 'go back'}
                        </span>
                      </div>
                    </div>

                    {canProceed && (
                      <button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs sm:text-sm w-full sm:w-auto"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                            <span>Creating...</span>
                          </>
                        ) : isLastStep ? (
                          <>
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <span>Next</span>
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-500/50 rounded-lg sm:rounded-xl">
              <div className="text-xs sm:text-sm text-red-300 font-mono">
                {error}
              </div>
            </div>
          )}

          {/* Step History */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700/50">
            <div className="space-y-2">
              {steps.slice(0, currentStep).map(step => {
                const value = formData[step.key as keyof FormData];

                // Convert non-string values to displayable strings
                let displayValue: string;
                if (typeof value === 'string') {
                  displayValue = value || '<skipped>';
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else if (value && typeof value === 'object') {
                  // For GitHub metadata, show the name/login
                  if ('login' in value) {
                    displayValue = `@${value.login}`;
                  } else if ('full_name' in value) {
                    displayValue = value.full_name;
                  } else {
                    displayValue = '<configured>';
                  }
                } else {
                  displayValue = '<skipped>';
                }

                return (
                  <div
                    key={step.key}
                    className="flex items-start sm:items-center space-x-3 text-xs sm:text-sm font-mono"
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mt-0.5 sm:mt-0 flex-shrink-0" />
                    <span className="text-gray-400 flex-shrink-0">
                      {step.prompt}
                    </span>
                    <span className="text-blue-300 break-all">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <div className="text-white font-mono">Loading...</div>
        </div>
      }
    >
      <CreateApplicationForm />
    </Suspense>
  );
}
