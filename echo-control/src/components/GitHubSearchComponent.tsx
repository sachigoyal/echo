'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, GitBranch, ExternalLink, Check, X } from 'lucide-react';
import {
  githubApi,
  GitHubUser,
  GitHubRepo,
  GitHubSearchResult,
} from '../lib/github-api';
import Image from 'next/image';

interface GitHubSearchComponentProps {
  value: string;
  onChange: (
    value: string,
    verified: boolean,
    metadata?: GitHubUser | GitHubRepo,
    detectedType?: 'user' | 'repo'
  ) => void;
  placeholder?: string;
}

export function GitHubSearchComponent({
  value,
  onChange,
  placeholder,
}: GitHubSearchComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GitHubSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    data?: GitHubUser | GitHubRepo;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [lastVerifiedValue, setLastVerifiedValue] = useState<string>('');

  const verifyCurrentValue = useCallback(
    async (currentValue: string) => {
      if (!currentValue.trim()) {
        setVerificationResult(null);
        setLastVerifiedValue('');
        return;
      }

      // Skip verification if we just verified this value
      if (currentValue === lastVerifiedValue && verificationResult) {
        return;
      }

      setIsVerifying(true);
      try {
        let result = null;
        let detectedType: 'user' | 'repo' | undefined;

        if (/^\d+$/.test(currentValue)) {
          // Try both user and repo by ID
          result = await githubApi.verifyUserById(currentValue);
          if (result) {
            detectedType = 'user';
          } else {
            result = await githubApi.verifyRepoById(currentValue);
            if (result) {
              detectedType = 'repo';
            }
          }
        } else {
          // Try parsing as repo path first
          const parsed = githubApi.parseRepoPath(currentValue);
          if (parsed) {
            result = await githubApi.searchRepoByPath(
              parsed.owner,
              parsed.repo
            );
            if (result) {
              detectedType = 'repo';
            }
          }

          // If not a repo path, try as username
          if (!result) {
            result = await githubApi.searchUserByUsername(currentValue);
            if (result) {
              detectedType = 'user';
            }
          }
        }

        const isValid = result !== null;
        setVerificationResult({ isValid, data: result || undefined });
        setLastVerifiedValue(currentValue);

        // Only call onChange if this is a new verification or the result changed
        if (
          currentValue !== lastVerifiedValue ||
          !verificationResult ||
          verificationResult.isValid !== isValid
        ) {
          onChange(currentValue, isValid, result || undefined, detectedType);
        }
      } catch (error) {
        console.error('Error verifying GitHub ID:', error);
        setVerificationResult({ isValid: false });
        setLastVerifiedValue(currentValue);

        // Only call onChange if this is a new verification or the result changed
        if (
          currentValue !== lastVerifiedValue ||
          !verificationResult ||
          verificationResult.isValid !== false
        ) {
          onChange(currentValue, false, undefined, undefined);
        }
      } finally {
        setIsVerifying(false);
      }
    },
    [onChange, lastVerifiedValue, verificationResult]
  );

  // Verify the current value when it changes
  useEffect(() => {
    if (value) {
      verifyCurrentValue(value);
    } else {
      setVerificationResult(null);
      setLastVerifiedValue('');
    }
  }, [value, verifyCurrentValue]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await githubApi.searchAll(query);
      // Show all results (both users and repos)
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching GitHub:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleSelectResult = (result: GitHubSearchResult) => {
    const data = result.data;
    const idValue = data.id.toString();

    // Set verification result immediately to prevent flicker
    setVerificationResult({ isValid: true, data });
    setLastVerifiedValue(idValue);
    setSearchQuery('');
    setShowResults(false);

    // Call onChange after setting local state
    onChange(idValue, true, data, result.type);
  };

  const getDisplayName = (data: GitHubUser | GitHubRepo) => {
    if ('login' in data) {
      return data.name || data.login;
    } else {
      return data.full_name;
    }
  };

  const getDescription = (data: GitHubUser | GitHubRepo) => {
    if ('login' in data) {
      return `@${data.login}`;
    } else {
      return data.description || 'No description';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-3">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={placeholder || 'Search for users or repositories...'}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-colors"
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Delay hiding results to allow clicking
              setTimeout(() => setShowResults(false), 200);
            }}
          />
          {isSearching && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
          )}
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            {searchResults.map(result => {
              const data = result.data;
              return (
                <button
                  key={`${result.type}-${data.id}`}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-b-0"
                >
                  <Image
                    src={
                      'avatar_url' in data
                        ? data.avatar_url
                        : data.owner.avatar_url
                    }
                    alt={getDisplayName(data)}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {result.type === 'user' ? (
                        <User className="h-3 w-3 text-secondary flex-shrink-0" />
                      ) : (
                        <GitBranch className="h-3 w-3 text-secondary flex-shrink-0" />
                      )}
                      <span className="text-foreground text-sm font-medium truncate">
                        {getDisplayName(data)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs truncate">
                      {getDescription(data)}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Value Verification */}
      {value && (
        <div className="mt-4">
          <div className="flex items-start space-x-3 p-4 bg-card border border-border rounded-lg">
            {isVerifying ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent mt-0.5 flex-shrink-0"></div>
            ) : verificationResult?.isValid ? (
              <Check className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              {isVerifying ? (
                <p className="text-muted-foreground text-sm">Verifying...</p>
              ) : verificationResult?.isValid && verificationResult.data ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        'avatar_url' in verificationResult.data
                          ? verificationResult.data.avatar_url
                          : verificationResult.data.owner.avatar_url
                      }
                      alt={getDisplayName(verificationResult.data)}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">
                        {getDisplayName(verificationResult.data)}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {getDescription(verificationResult.data)}
                      </p>
                    </div>
                    <a
                      href={verificationResult.data.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-secondary/80 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-secondary text-xs">
                    ✓ Verified{' '}
                    {'login' in verificationResult.data ? 'user' : 'repository'}{' '}
                    (ID: {verificationResult.data.id})
                  </p>
                </div>
              ) : verificationResult?.isValid === false ? (
                <div className="space-y-1">
                  <p className="text-destructive text-sm">
                    ✗ User or repository not found
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Please check the username, repository path, or ID
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
