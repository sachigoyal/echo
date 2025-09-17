'use client';

import { AppField } from './field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const AppVisibility = () => {
  return (
    <AppField name="isPublic">
      {field => (
        <div className="flex items-center gap-2">
          <Switch checked={field.value} onCheckedChange={field.onChange} />
          <Label>{field.value ? 'Public' : 'Private'}</Label>
        </div>
      )}
    </AppField>
  );
};
