'use client';

import React, { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { Check, ChevronsLeftRightEllipsis } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { TemplateGroup } from './template-group';
import { OptionButtons } from './option-buttons';

import { TEMPLATES } from './data';

import { api } from '@/trpc/client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface Props {
  appId: string;
}

export const Connection: React.FC<Props> = ({ appId }) => {
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const [numTokens] = api.apps.app.getNumTokens.useSuspenseQuery(
    { appId },
    {
      refetchInterval: shouldRefetch ? 2500 : undefined,
    }
  );
  const [numApiKeys] = api.user.apiKeys.count.useSuspenseQuery({ appId });

  const isConnected = useMemo(() => {
    return numTokens > 0 || numApiKeys > 0;
  }, [numTokens, numApiKeys]);

  useEffect(() => {
    setShouldRefetch(!isConnected);
  }, [isConnected]);

  const [selectedTemplateGroupId, setSelectedTemplateGroupId] =
    useState<string>();

  const selectedTemplateGroup = TEMPLATES.options.find(
    template => template.id === selectedTemplateGroupId
  );

  return (
    <AccordionItem value="connection" className="border-none">
      <AccordionTrigger className="text-lg font-semibold pt-0">
        <div
          className={cn(
            'flex items-center gap-2',
            isConnected && 'text-primary'
          )}
        >
          {isConnected ? (
            <Check className="size-4" />
          ) : (
            <ChevronsLeftRightEllipsis className="size-4" />
          )}
          Create your App
        </div>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-2 md:gap-4">
        <Card>
          <CardHeader className="border-b space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Guided Setup</CardTitle>
              <Badge variant="glass" className="rounded-full">
                Recommended
              </Badge>
            </div>
            <CardDescription>
              Use one of our starter templates to get started with your app.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <TemplateGroup templateGroup={TEMPLATES} appId={appId} index={0} />
          </CardContent>
        </Card>
        <div className="flex gap-2 items-center">
          <Separator className="flex-1" />
          <p className="text-muted-foreground">or</p>
          <Separator className="flex-1" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom Setup</CardTitle>
            <CardDescription>
              Visit our{' '}
              <Link
                href="/docs/getting-started/temmplates"
                className="text-primary underline font-medium"
              >
                docs
              </Link>{' '}
              to build your app from scratch.
            </CardDescription>
          </CardHeader>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
};
