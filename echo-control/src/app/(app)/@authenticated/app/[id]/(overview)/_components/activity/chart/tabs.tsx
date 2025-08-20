'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('flex w-full border-b bg-muted', className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  label,
  amount,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  label: string;
  value: string;
  amount: string;
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'flex flex-col gap-2 p-4 transition-all duration-200 min-w-56 group',
        'border-r border-r-border',
        'data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-card',
        'cursor-pointer hover:bg-card/50',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1 text-left">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-muted-foreground group-data-[state=active]:text-foreground">
          {amount}
        </p>
      </div>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
