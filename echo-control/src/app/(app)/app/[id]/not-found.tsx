'use client';

import { ErrorScreen } from '@/components/error/screen';
import { Button } from '@/components/ui/button';

import type { NextErrorProps } from '@/types/next-error';
import Link from 'next/link';
import { AppGroupNotFound } from '../../_components/not-found';

export default function AppNotFound(props: NextErrorProps) {
  return (
    <AppGroupNotFound
      title="App Not Found"
      description="The app you are looking for does not exist."
    />
  );
}
