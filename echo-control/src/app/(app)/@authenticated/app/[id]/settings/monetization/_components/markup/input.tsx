'use client';

import { useState } from 'react';

import { Percent } from 'lucide-react';

import { useFormContext } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

import { ProfitChart } from './chart';
import { FormField } from '@/components/ui/form';

export const MarkupInput = () => {
  const form = useFormContext();

  const [selectedMarkupLabel, setSelectedMarkupLabel] =
    useState<string>('Medium');

  return (
    <FormField
      control={form.control}
      name="markup"
      render={({ field }) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 w-full">
            {[
              {
                label: 'Low',
                value: 2,
              },
              {
                label: 'Medium',
                value: 4,
              },
              {
                label: 'High',
                value: 8,
              },
              {
                label: 'Custom',
                value: field.value,
              },
            ].map(({ label, value }) => (
              <Button
                key={label}
                variant={label === selectedMarkupLabel ? 'turbo' : 'outline'}
                size="sm"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedMarkupLabel(label);
                  if (label !== 'Custom') {
                    field.onChange(value);
                  }
                }}
                className="flex-1 flex-col gap-0 h-full p-2 justify-start"
              >
                <span className="text-sm font-bold">{label}</span>
                {label === 'Custom' ? (
                  <span className="text-xs opacity-60">Enter a Value</span>
                ) : (
                  <span className="text-xs opacity-80">
                    {(value - 1) * 100}%
                  </span>
                )}
              </Button>
            ))}
          </div>
          {selectedMarkupLabel === 'Custom' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  value={((field.value - 1) * 100).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                  onChange={e => field.onChange(Number(e.target.value) / 100)}
                  className="w-18 pr-6"
                />
                <Percent className="size-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2" />
              </div>
              <Slider
                min={1}
                max={10}
                step={0.01}
                value={[field.value]}
                onValueChange={value => field.onChange(value[0])}
              />
            </div>
          )}
          <div className="w-full mt-4">
            <ProfitChart markup={form.watch('markup') - 1} />
          </div>
        </div>
      )}
    />
  );
};
