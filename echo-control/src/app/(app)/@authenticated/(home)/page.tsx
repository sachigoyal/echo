import { api } from '@/trpc/server';

export default async function DashboardPage() {
  const apps = await api.apps.owner.list();

  return (
    <div className="flex flex-col gap-4 h-[2000px]">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {apps.map(app => (
          <div key={app.id}>
            <h2>{app.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
