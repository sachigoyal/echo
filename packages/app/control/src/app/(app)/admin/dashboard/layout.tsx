import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-[240px] lg:sticky lg:top-0">
          <div className="w-full flex flex-col gap-2">
            <Link href="/admin/dashboard/user-earnings">
              <Button variant="ghost" className="w-full justify-start text-base">
                User Earnings
              </Button>
            </Link>
            <Link href="/admin/dashboard/user-spending">
              <Button variant="ghost" className="w-full justify-start text-base">
                User Spending
              </Button>
            </Link>
            <Link href="/admin/dashboard/app-earnings">
              <Button variant="ghost" className="w-full justify-start text-base">
                App Earnings
              </Button>
            </Link>
            <Link href="/admin/dashboard/payments">
              <Button variant="ghost" className="w-full justify-start text-base">
                Payment History
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}
