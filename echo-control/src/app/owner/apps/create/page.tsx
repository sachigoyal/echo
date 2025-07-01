'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Check, Copy } from 'lucide-react';
import { GitHubSearchComponent } from '../../../../components/GitHubSearchComponent';
import { GitHubUser, GitHubRepo } from '../../../../lib/github-api';

type AuthMethod = 'jwt' | 'apikey';

interface FormData {
  authMethod: AuthMethod;
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

const authMethodStep: StepConfig = {
  key: 'authMethod',
  prompt: 'How do you want users to authenticate with your app?',
  placeholder: '',
  required: true,
  type: 'select' as const,
  options: [
    { value: 'jwt', label: 'JWT Authentication (OAuth Flow)' },
    { value: 'apikey', label: 'API Key Authentication' },
  ],
  helpText: "Choose the authentication method that best fits your app's needs.",
};

const commonSteps: StepConfig[] = [
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
];

const jwtSpecificSteps: StepConfig[] = [
  {
    key: 'callbackUrl',
    prompt: 'What is your production callback URL? (optional)',
    placeholder: 'https://yourdomain.com',
    required: false,
    type: 'text' as const,
    helpText:
      'Enter the URL where users will be redirected after signing in with Echo from your production app. Localhost URLs (like http://localhost:3000) are automatically allowed for development.',
  },
];

const githubStep: StepConfig = {
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
};

const configurationStep: StepConfig = {
  key: 'configuration',
  prompt: 'Review your configuration',
  placeholder: '',
  required: false,
  type: 'code' as const,
};

const jwtTestingStep: StepConfig = {
  key: 'testing',
  prompt: 'Test your integration',
  placeholder: '',
  required: false,
  type: 'verification' as const,
};

const apiKeyTestingStep: StepConfig = {
  key: 'apiKeyTesting',
  prompt: 'Your app is ready!',
  placeholder: '',
  required: false,
  type: 'verification' as const,
};

function getStepsForAuthMethod(authMethod: AuthMethod): StepConfig[] {
  const baseSteps = [authMethodStep, ...commonSteps];

  if (authMethod === 'jwt') {
    return [
      ...baseSteps,
      ...jwtSpecificSteps,
      githubStep,
      configurationStep,
      jwtTestingStep,
    ];
  } else {
    return [...baseSteps, githubStep, configurationStep, apiKeyTestingStep];
  }
}

function CreateApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    authMethod: 'jwt',
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

  // Get current steps based on auth method
  const steps = getStepsForAuthMethod(formData.authMethod);

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

    if (formData.authMethod === 'jwt') {
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
    } else {
      // API Key configuration
      return `import { OpenAI } from 'openai';

// Initialize the Echo client with your app ID
const echo = new OpenAI({
  apiKey: process.env.ECHO_API_KEY,
  baseURL: 'https://echo.router.merit.systems',
});

// Your users will need to provide their own API key
async function makeRequest(userApiKey: string, prompt: string) {
  const response = await echo.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });
  
  return response;
}

export { echo, makeRequest };`;
    }
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

  const shouldSkipStep = useCallback(
    (stepIndex: number): boolean => {
      const step = steps[stepIndex];
      if (!step) return false;

      // Skip callback URL step for API key authentication
      if (step.key === 'callbackUrl' && formData.authMethod === 'apikey') {
        return true;
      }

      // Don't skip any other steps - let users verify their GitHub selection
      return false;
    },
    [steps, formData.authMethod]
  );

  const getNextStep = useCallback(
    (currentStepIndex: number): number => {
      let nextStep = currentStepIndex + 1;
      while (nextStep < steps.length && shouldSkipStep(nextStep)) {
        nextStep++;
      }
      return nextStep;
    },
    [shouldSkipStep, steps.length]
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
    steps,
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
    steps,
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
    <div className="min-h-screen bg-background">
      {/* Background Pattern - Fixed to cover full screen */}
      <div className="fixed inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(var(--border)/0.3)_25px,rgba(var(--border)/0.3)_26px,transparent_27px,transparent_74px,rgba(var(--border)/0.3)_75px,rgba(var(--border)/0.3)_76px,transparent_77px),linear-gradient(rgba(var(--border)/0.3)_24px,transparent_25px,transparent_26px,rgba(var(--border)/0.3)_27px,rgba(var(--border)/0.3)_74px,transparent_75px,transparent_76px,rgba(var(--border)/0.3)_77px)] bg-[length:100px_100px] pointer-events-none"></div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          {/* Main Content Container */}
          <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border shadow-lg min-h-[500px] flex flex-col p-6 sm:p-8 lg:p-12">
            {/* Progress Bar */}
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-500 ease-out"
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
                  <div className="text-destructive font-mono text-sm mb-4">
                    Invalid step configuration
                  </div>
                  <button
                    onClick={() => router.push('/owner')}
                    className="px-4 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground hover:bg-muted/70 transition-colors"
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
                    <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                      <ChevronRight className="h-5 w-5 text-secondary" />
                      <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                        {currentStepData.dynamicPrompt
                          ? currentStepData.dynamicPrompt(
                              formData,
                              searchParams
                            )
                          : currentStepData.prompt}
                      </h2>
                    </div>

                    {/* Input Field */}
                    <div
                      className="relative mb-6 sm:mb-8"
                      onKeyDown={handleKeyPress}
                    >
                      <div className="space-y-6">
                        {currentStepData.type === 'verification' ? (
                          <div className="space-y-8">
                            {currentStepData.key === 'apiKeyTesting' ? (
                              /* API Key Success State */
                              <div className="text-center space-y-6 py-8">
                                <div className="text-6xl">✅</div>
                                <div className="space-y-3">
                                  <h3 className="text-2xl font-bold text-foreground">
                                    App Created Successfully!
                                  </h3>
                                  <p className="text-muted-foreground">
                                    Your Echo app is ready for API key
                                    authentication.
                                  </p>
                                </div>
                                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-6 text-left max-w-lg mx-auto">
                                  <h4 className="text-lg font-semibold text-foreground mb-4">
                                    Next Steps:
                                  </h4>
                                  <div className="space-y-2 text-muted-foreground text-sm">
                                    <p>
                                      1. Users will need to create Echo API keys
                                      at echo.merit.systems
                                    </p>
                                    <p>
                                      2. They can then use those keys with your
                                      app
                                    </p>
                                    <p>
                                      3. Configure your app using the code from
                                      the previous step
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => router.push('/owner')}
                                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                                >
                                  Go to Dashboard
                                </button>
                              </div>
                            ) : !integrationVerified ? (
                              <>
                                {/* JWT Testing Instructions */}
                                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-6 backdrop-blur-sm">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                                    <h3 className="text-xl font-semibold text-foreground">
                                      🚀 Test Your Integration
                                    </h3>
                                    <button
                                      onClick={handleBack}
                                      className="flex items-center space-x-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground hover:bg-muted/70 transition-colors text-sm"
                                    >
                                      <ChevronRight className="h-4 w-4 rotate-180" />
                                      <span>Back to Configuration</span>
                                    </button>
                                  </div>
                                  <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
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
                                <div className="bg-card border border-border rounded-lg p-6 backdrop-blur-sm">
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    {isPolling ? (
                                      <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary border-t-transparent mx-auto sm:mx-0"></div>
                                        <span className="text-muted-foreground text-center sm:text-left">
                                          Waiting for your test login...
                                        </span>
                                      </>
                                    ) : createdAppId ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            startPolling(createdAppId)
                                          }
                                          className="px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary hover:bg-secondary/20 transition-colors"
                                        >
                                          Start Monitoring
                                        </button>
                                        <span className="text-muted-foreground text-center sm:text-left">
                                          Click to start monitoring for test
                                          login
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-destructive text-center">
                                        App not created yet
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Success State */
                              <div className="text-center space-y-6 py-8">
                                <div className="text-6xl">🎉</div>
                                <div className="space-y-3">
                                  <h3 className="text-2xl font-bold text-foreground">
                                    Integration Successful!
                                  </h3>
                                  <p className="text-muted-foreground">
                                    Your Echo app is now configured and working
                                    properly.
                                  </p>
                                </div>
                                <button
                                  onClick={() => router.push('/owner')}
                                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                                >
                                  Go to Dashboard
                                </button>
                              </div>
                            )}
                          </div>
                        ) : currentStepData.type === 'code' ? (
                          <div className="space-y-6 w-full">
                            {!createdAppId ? (
                              /* Loading State */
                              <div className="bg-card border border-border rounded-lg p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent mx-auto mb-4"></div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                  Creating your Echo app...
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  Please wait while we generate your
                                  configuration
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-6 w-full">
                                {/* Configuration Code Block */}
                                <div className="bg-card border border-border rounded-lg p-6 w-full">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                                    <h3 className="text-lg font-semibold text-foreground">
                                      {formData.authMethod === 'jwt'
                                        ? 'React Configuration'
                                        : 'TypeScript Configuration'}
                                    </h3>
                                    <button
                                      onClick={() => {
                                        const code = generateConfigCode();
                                        navigator.clipboard.writeText(code);
                                      }}
                                      className="flex items-center space-x-2 px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary hover:bg-secondary/20 transition-colors text-sm"
                                    >
                                      <Copy className="h-4 w-4" />
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                                      <code>{generateConfigCode()}</code>
                                    </pre>
                                  </div>
                                </div>

                                {/* Installation Instructions */}
                                <div className="bg-card border border-border rounded-lg p-6 w-full">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                                    <h3 className="text-lg font-semibold text-foreground">
                                      Installation
                                    </h3>
                                    <button
                                      onClick={() => {
                                        const installCmd =
                                          formData.authMethod === 'jwt'
                                            ? 'npm install @zdql/echo-react-sdk'
                                            : 'npm install @zdql/echo-typescript-sdk';
                                        navigator.clipboard.writeText(
                                          installCmd
                                        );
                                      }}
                                      className="flex items-center space-x-2 px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary hover:bg-secondary/20 transition-colors text-sm"
                                    >
                                      <Copy className="h-4 w-4" />
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <div className="bg-muted/30 rounded-lg p-4">
                                    <code className="text-sm text-foreground font-mono">
                                      {formData.authMethod === 'jwt'
                                        ? 'npm install @zdql/echo-react-sdk'
                                        : 'npm install @zdql/echo-typescript-sdk'}
                                    </code>
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
                        ) : currentStepData.type === 'select' ? (
                          <div className="space-y-4">
                            {currentStepData.options?.map(option => (
                              <button
                                key={option.value}
                                onClick={() => setCurrentValue(option.value)}
                                className={`w-full p-6 rounded-lg border text-left transition-all duration-200 ${
                                  currentValue === option.value
                                    ? 'border-secondary bg-secondary/10 text-secondary'
                                    : 'border-border bg-card hover:border-secondary/50 hover:bg-secondary/5 text-foreground'
                                }`}
                              >
                                <div className="font-semibold text-lg mb-2">
                                  {option.label}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {option.value === 'jwt'
                                    ? 'Users sign in through OAuth flow with automatic token management. Best for web apps that need user sessions.'
                                    : 'Users authenticate with API keys they manage themselves. Best for server applications, CLI tools, or when you need direct API access.'}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              ref={focusCallback}
                              type="text"
                              value={currentValue}
                              onChange={e => setCurrentValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              placeholder={currentStepData.placeholder}
                              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Help Text */}
                    {(currentStepData.helpText ||
                      currentStepData.dynamicHelpText) && (
                      <div className="mb-6 text-sm text-muted-foreground">
                        {currentStepData.dynamicHelpText
                          ? currentStepData.dynamicHelpText(
                              formData,
                              searchParams
                            )
                          : currentStepData.helpText}
                      </div>
                    )}

                    {/* Validation Errors */}
                    {currentStepData.key === 'callbackUrl' &&
                      currentValue.trim() &&
                      !isValidUrl(currentValue.trim()) && (
                        <div className="mb-4 text-sm text-destructive">
                          Please enter a valid URL (must start with http:// or
                          https://)
                        </div>
                      )}

                    {currentStepData.type === 'github-search' &&
                      currentValue.trim() &&
                      !githubVerified && (
                        <div className="mb-4 text-sm text-destructive">
                          Please verify the GitHub user or repository before
                          proceeding
                        </div>
                      )}

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                        <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-muted-foreground">
                          <span>Press</span>
                          <kbd
                            className="px-3 py-1.5 text-xs bg-muted/50 rounded border border-border text-foreground cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() =>
                              canProceed && currentStepData && handleNext()
                            }
                          >
                            Enter
                          </kbd>
                          <span>to continue</span>
                        </div>

                        <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-muted-foreground">
                          <span>Press</span>
                          <kbd
                            className="px-3 py-1.5 text-xs bg-muted/50 rounded border border-border text-foreground cursor-pointer hover:bg-muted/70 transition-colors"
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
                          className="flex items-center justify-center space-x-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            {/* Step History */}
            <div className="mt-8 pt-6 border-t border-border">
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
                      className="flex items-start sm:items-center space-x-3 text-sm"
                    >
                      <Check className="h-4 w-4 text-secondary mt-0.5 sm:mt-0 flex-shrink-0" />
                      <span className="text-muted-foreground flex-shrink-0">
                        {step.prompt}
                      </span>
                      <span className="text-secondary break-all">
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
    </div>
  );
}

export default function CreateApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border shadow-lg p-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-secondary border-t-transparent"></div>
              <span className="text-foreground">Loading...</span>
            </div>
          </div>
        </div>
      }
    >
      <CreateApplicationForm />
    </Suspense>
  );
}
