import { UserAvatar } from '@/components/utils/user-avatar';
import { Body, Heading } from '../../../_components/layout/page-utils';
import { Code } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingOverview } from './_components/overview';

export default function LoadingAppPage() {
  return (
    <div>
      <Heading
        title={<Skeleton className="w-24 h-8" />}
        icon={
          <UserAvatar
            src={undefined}
            className="size-12 shrink-0"
            fallback={<Code className="size-8" />}
          />
        }
      />
      <Body className="gap-0">
        <LoadingOverview />
      </Body>
    </div>
  );
}
