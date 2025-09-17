'use client';

import { Input } from '@/components/ui/input';

import { AppField } from './field';

export const AppHomepage = () => {
  return (
    <AppField name="homepageUrl">
      {field => (
        <Input
          {...field}
          placeholder="https://example.com"
          onPaste={e => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            field.onChange(text);
          }}
        />
      )}
    </AppField>
  );
};
