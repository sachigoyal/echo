import { api } from '@/trpc/server';
import { AppCard } from '../_components/apps/card';

export default async function DashboardPage() {
  const apps = await api.apps.owner.list();

  return (
    <div className="flex flex-col gap-4 container">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage your apps and API keys
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map(app => (
            <AppCard key={app.id} {...app} />
          ))}
        </div>
      </div>
    </div>
  );
}
