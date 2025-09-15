import AppUsersTable from '@/app/(app)/admin/_components/v2/AppUsers'

interface AppUsersPageProps {
  params: {
    appId: string
  }
}

export default function AppUsersPage({ params }: AppUsersPageProps) {
  return (
    <div className="space-y-6">
      <div className="px-6">
        <h1 className="text-2xl font-bold text-gray-900">App Users</h1>
        <p className="text-gray-600">View users, their token usage, and spending data for this app</p>
      </div>
      <AppUsersTable appId={params.appId} />
    </div>
  )
}
