'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { api } from '@/trpc/client';
import { Check, ChevronsLeftRightEllipsis } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEMPLATES } from './data';
import { TemplateGroup } from './template-group';
import { OptionButtons } from './option-buttons';

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
    useState<string>(TEMPLATES[0].id);

  const selectedTemplateGroup = TEMPLATES.find(
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
        <OptionButtons
          title="Framework"
          options={TEMPLATES}
          selectedId={selectedTemplateGroupId}
          setSelectedId={setSelectedTemplateGroupId}
        />
        {selectedTemplateGroup && (
          <TemplateGroup
            templateGroup={selectedTemplateGroup}
            key={selectedTemplateGroupId}
            appId={appId}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
