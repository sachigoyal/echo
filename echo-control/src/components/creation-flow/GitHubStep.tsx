import { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { GitHubSearchComponent } from '../GitHubSearchComponent';
import { GitHubRepo, GitHubUser } from '@/lib/github-api';
import { BaseStepProps } from './types';

interface GitHubStepProps extends BaseStepProps {
  githubId: string;
  githubType: 'user' | 'repo';
  setGithubId: (id: string) => void;
  setGithubType: (type: 'user' | 'repo') => void;
  isUpdating: boolean;
  error: string | null;
}

const GitHubStep = ({
  isTransitioning,
  onError,
  githubId,
  setGithubId,
  setGithubType,
  isUpdating,
  error,
}: GitHubStepProps) => {
  const searchParams = useSearchParams();

  // Initialize from URL parameters if available
  useEffect(() => {
    const urlGithubId =
      searchParams.get('githubId') ||
      searchParams.get('repoId') ||
      searchParams.get('userId');

    if (urlGithubId) {
      // Infer type from the parameter name
      const inferredType = searchParams.get('repoId')
        ? 'repo'
        : searchParams.get('userId')
          ? 'user'
          : (searchParams.get('githubType') as 'user' | 'repo') || 'user';

      setGithubId(urlGithubId);
      setGithubType(inferredType);
    }
  }, [searchParams, setGithubId, setGithubType]);

  // Report hook errors to parent
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Step configuration for the GitHub step
  const getStepConfig = () => {
    const hasPrePopulated =
      searchParams.get('githubId') ||
      searchParams.get('repoId') ||
      searchParams.get('userId');

    return {
      key: 'githubId',
      prompt: hasPrePopulated
        ? 'Confirm who should receive proceeds from this app (optional)'
        : 'Who should receive proceeds from this app? (optional)',
      placeholder: 'Search for a GitHub user or repository...',
      required: false,
      type: 'github-search' as const,
      helpText: hasPrePopulated
        ? "We've pre-selected a GitHub user or repository for you. Please verify this is correct, or search for a different one. This determines who gets paid when users purchase tokens through your app."
        : 'Select a GitHub user or repository to receive payment proceeds from your Echo app. This determines who gets paid when users purchase tokens through your app.',
    };
  };

  const stepConfig = getStepConfig();

  const handleGithubChange = (
    value: string,
    verified: boolean,
    metadata?: GitHubUser | GitHubRepo,
    detectedType?: 'user' | 'repo'
  ) => {
    setGithubId(value);
    if (detectedType) {
      setGithubType(detectedType);
    }
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
          <GitHubSearchComponent
            value={githubId}
            onChange={handleGithubChange}
            placeholder={stepConfig.placeholder}
          />
          {isUpdating && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary border-t-transparent"></div>
            </div>
          )}
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
export default GitHubStep;
