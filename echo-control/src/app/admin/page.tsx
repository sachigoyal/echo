import { AdminGuard } from '@/components/server/AdminGuard';
import { AdminDashboard } from '@/components/admin';

export default function AdminPage() {
  return (
    <AdminGuard>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, search apps, and mint credits
          </p>
        </div>
        <AdminDashboard />
      </div>
    </AdminGuard>
  );
}
