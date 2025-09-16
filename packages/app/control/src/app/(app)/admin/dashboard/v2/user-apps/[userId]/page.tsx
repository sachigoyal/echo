import UserAppsTable from '@/app/(app)/admin/_components/v2/UserApps'
import { UserAppsOverview } from '@/app/(app)/admin/_components'

interface UserAppsPageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function UserAppsPage({ params }: UserAppsPageProps) {
  const { userId } = await params
  
  return (
    <div className="space-y-6">
      <UserAppsOverview userId={userId} />
      <UserAppsTable userId={userId} />
    </div>
  )
}
