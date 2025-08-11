'use client';

import React, { useActionState } from 'react';

import Link from 'next/link';

import { AuthorizeParams } from '@/app/(oauth)/_lib/authorize';

import { authorize } from '../_actions/authorize';
import { Button } from '@/components/ui/button';
import { TurboButton } from '@/components/ui/turbo-button';

interface Props {
  params: AuthorizeParams;
}

export const AuthorizeButtons: React.FC<Props> = ({ params }) => {
  const [state, action, pending] = useActionState(
    () => authorize(params),
    null
  );

  const denyUrl = new URL(params.redirect_uri);
  denyUrl.searchParams.set('error', 'access_denied');
  denyUrl.searchParams.set('error_description', 'User denied authorization');
  if (params.state) {
    denyUrl.searchParams.set('state', params.state);
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex gap-2 w-full">
        <Link href={denyUrl.toString()} className="flex-1">
          <Button variant="outline" className="w-full" disabled={pending}>
            Cancel
          </Button>
        </Link>
        <form action={action} className="flex-1">
          <Button
            type="submit"
            variant="turbo"
            disabled={pending}
            className="w-full"
          >
            {pending ? 'Authorizing...' : 'Authorize'}
          </Button>
        </form>
      </div>
      {state?.error && (
        <div className="text-red-500">{state.error_description}</div>
      )}
    </div>
  );
};
