import { Activity } from './activity';
import { OverviewCard } from './overview-card';
import { Users } from './users';

interface Props {
  appId: string;
}

export const Overview = ({ appId }: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <Activity appId={appId} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OverviewCard title="Users" link={`/app/${appId}/users`}>
          <Users appId={appId} />
        </OverviewCard>
      </div>
    </div>
  );
};
