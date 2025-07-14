'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Carousel from '@/components/Carousel';
import MyApps from '@/components/MyApps';
import PopularApps from '@/components/PopularApps';
import MemberApps from '@/components/MemberApps';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { PublicEchoApp } from '@/lib/types/apps';
import Link from 'next/link';
import { GlassButton } from '@/components/glass-button';

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [publicApps, setPublicApps] = useState<PublicEchoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicApps = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/apps/public');

        if (!response.ok) {
          throw new Error(`Failed to fetch public apps: ${response.status}`);
        }

        const data = await response.json();

        setPublicApps(data.apps as PublicEchoApp[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load public apps'
        );
        setPublicApps([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchPublicApps();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-background py-5 px-6">
        <div className="max-w-6xl mx-auto">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <Image
                src={
                  resolvedTheme === 'dark'
                    ? '/logo/dark.svg'
                    : '/logo/light.svg'
                }
                alt="Echo Logo"
                width={240}
                height={100}
                className="h-12 w-auto"
                priority
              />
              Echo
            </CardTitle>
            <CardDescription className="text-lg md:text-2xl">
              Seamless drop-in integration to charge users for your LLM
              application.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 mt-8">
            <div className="bg-muted rounded-lg p-4 border max-w-md mx-auto">
              <pre className="text-sm font-mono text-foreground overflow-x-auto">
                <code>{`const { signIn } = useEcho();\nconst { openai } = useEchoOpenAI();`}</code>
              </pre>
            </div>
          </CardContent>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/owner/apps/create">
            <GlassButton className="scale-150">Create an app</GlassButton>
          </Link>
        </div>
      </section>

      {/* App Categories Section */}
      <section className="px-6 mt-12">
        <div className="max-w-6xl mx-auto">
          <PopularApps />
        </div>
      </section>
    </div>
  );
}
