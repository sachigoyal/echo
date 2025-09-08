import {
  ArrowLeft,
  CheckCircle,
  X,
  Users,
  Eye,
  ExternalLink,
  User as UserIcon,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { CommitChart } from '@/components/activity-chart/chart';
import { DotPattern } from '@/components/ui/dot-background';
import { GlassButton } from '@/components/glass-button';
import { EchoApp } from '@/lib/types/apps';
import { AppRole } from '@/lib/permissions/types';

// Add GitHub API imports
import { githubApi, GitHubUser, GitHubRepo } from '@/lib/github-api';
import { useState, useEffect } from 'react';
import { Route } from 'next';

// Helper functions
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString();
};

const transformActivityData = (data: number[] | undefined) => {
  if (!data || data.length === 0) {
    return [];
  }
  return data.map((count, index) => ({
    index,
    count,
    date: new Date(
      Date.now() - (data.length - 1 - index) * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));
};

// App Profile Section
interface AppProfileProps {
  app: EchoApp;
  userRole: AppRole | null;
  roleLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

// Add GitHubUserInfo component
interface GitHubUserInfoProps {
  githubId: string;
  githubType: 'user' | 'repo';
}

function GitHubUserInfo({ githubId, githubType }: GitHubUserInfoProps) {
  const [githubData, setGithubData] = useState<GitHubUser | GitHubRepo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        setLoading(true);
        setError(false);

        let data: GitHubUser | GitHubRepo | null = null;

        if (githubType === 'user') {
          data = await githubApi.verifyUserById(githubId);
        } else if (githubType === 'repo') {
          data = await githubApi.verifyRepoById(githubId);
        }

        setGithubData(data);
        setError(data === null);
      } catch (err) {
        console.error('Error fetching GitHub data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [githubId, githubType]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
        <span className="text-sm">Loading GitHub info...</span>
      </div>
    );
  }

  if (error || !githubData) {
    return null; // Don't show anything if GitHub data couldn't be fetched
  }

  const isUser = 'login' in githubData;
  const displayName = isUser
    ? githubData.name || githubData.login
    : githubData.full_name;
  const username = isUser ? `@${githubData.login}` : githubData.full_name;
  const avatarUrl = isUser
    ? githubData.avatar_url
    : githubData.owner.avatar_url;

  return (
    <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
      <Image
        src={avatarUrl}
        alt={displayName}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {isUser ? (
            <UserIcon className="h-3 w-3 text-primary shrink-0" />
          ) : (
            <GitBranch className="h-3 w-3 text-primary shrink-0" />
          )}
          <span className="text-foreground text-sm font-medium truncate">
            {displayName}
          </span>
        </div>
        <p className="text-muted-foreground text-xs truncate">
          {isUser ? username : githubData.description || 'No description'}
        </p>
      </div>
      <a
        href={githubData.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 transition-colors"
        title={`View on GitHub`}
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
