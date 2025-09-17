import { userOrRedirect } from '@/auth/user-or-redirect';

export default async function AdminToolsPage(props: PageProps<'/admin/tools'>) {
  await userOrRedirect('/admin/tools', props);

  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Tools</h1>
        <p className="text-muted-foreground mt-2">
          Search users, manage credits, and view user-specific data
        </p>
      </div>
    </div>
  );
}
