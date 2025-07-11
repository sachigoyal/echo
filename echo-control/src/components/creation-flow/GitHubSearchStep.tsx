'use client';

import { GitHubSearchComponent } from '../GitHubSearchComponent';
import { GitHubUser, GitHubRepo } from '../../lib/github-api';

interface GitHubSearchStepProps {
  value: string;
  onChange: (
    value: string,
    verified: boolean,
    metadata?: GitHubUser | GitHubRepo,
    detectedType?: 'user' | 'repo'
  ) => void;
  placeholder: string;
  githubVerified: boolean;
}

export function GitHubSearchStep({
  value,
  onChange,
  placeholder,
  githubVerified,
}: GitHubSearchStepProps) {
  return (
    <div className="space-y-4">
      <GitHubSearchComponent
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      {/* Validation Error */}
      {value.trim() && !githubVerified && (
        <div className="text-sm text-destructive">
          Please verify the GitHub user or repository before proceeding
        </div>
      )}
    </div>
  );
}
