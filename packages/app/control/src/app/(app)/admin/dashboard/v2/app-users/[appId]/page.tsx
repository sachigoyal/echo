import AppUsersTable from '@/app/(app)/admin/_components/v2/AppUsers'

interface AppUsersPageProps {
  params: Promise<{
    appId: string
  }>
}

export default async function AppUsersPage({ params }: AppUsersPageProps) {
  const { appId } = await params
  
  return (
    <div className="space-y-6">
      <AppUsersTable appId={appId} />
    </div>
  )
}
