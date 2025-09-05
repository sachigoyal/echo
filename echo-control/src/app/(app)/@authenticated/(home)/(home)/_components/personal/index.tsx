import { Section } from '../utils';

import { Apps, LoadingAppsSection } from './apps';
import { Feed, LoadingFeed } from './feed';
import { Earnings, LoadingEarnings } from './earnings';

import { api } from '@/trpc/server';
import { cn } from '@/lib/utils';

export const PersonalOverview = () => {
  const userApps = api.apps.list.owner({
    page_size: 3,
  });
  const numAppsPromise = userApps.then(apps => apps.total_count);

  const feedPromise = api.user.feed.list({
    cursor: new Date(),
    limit: 5,
    numHours: 4,
  });

  return (
    <Section title="Your Personal Overview">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-full w-full">
        <ColumnContainer className="md:col-span-5 lg:col-span-4">
          <Apps userApps={userApps} />
          <Feed numAppsPromise={numAppsPromise} feedPromise={feedPromise} />
        </ColumnContainer>
        <ColumnContainer className="md:col-span-7 lg:col-span-8">
          <Earnings numAppsPromise={numAppsPromise} />
        </ColumnContainer>
      </div>
    </Section>
  );
};

export const LoadingPersonalOverview = () => {
  return (
    <PersonalOverviewContainer>
      <ColumnContainer className="md:col-span-5 lg:col-span-4">
        <LoadingAppsSection />
        <LoadingFeed />
      </ColumnContainer>
      <ColumnContainer className="md:col-span-7 lg:col-span-8">
        <LoadingEarnings />
      </ColumnContainer>
    </PersonalOverviewContainer>
  );
};

const PersonalOverviewContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Section title="Your Personal Overview">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-full w-full">
        {children}
      </div>
    </Section>
  );
};

const ColumnContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 overflow-hidden shrink-0 py-2',
        className
      )}
    >
      {children}
    </div>
  );
};
