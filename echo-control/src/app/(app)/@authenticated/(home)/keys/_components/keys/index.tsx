import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { LoadingKeysTable } from '@/app/(app)/@authenticated/_components/keys/table/table';
import { KeysCard } from '@/app/(app)/@authenticated/_components/keys/table/card';

import { KeysTable } from './table';

export const Keys = () => {
  return (
    <KeysCard title="API Keys">
      <ErrorBoundary fallback={<div>Error loading keys</div>}>
        <Suspense fallback={<LoadingKeysTable />}>
          <KeysTable />
        </Suspense>
      </ErrorBoundary>
    </KeysCard>
  );
};

export const LoadingKeys = () => {
  return (
    <KeysCard title="API Keys">
      <LoadingKeysTable />
    </KeysCard>
  );
};
