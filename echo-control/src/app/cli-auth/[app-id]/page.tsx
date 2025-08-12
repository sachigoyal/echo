import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';

export default async function CliAuthAppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  const app = await api.apps.public.get(appId);

  if (!app) {
    return notFound();
  }

  const isMember = await api.apps.member.get(appId);

  const handleAppIdFromUrl = useCallback(
    async (appId: string) => {
      setIsEnrolling(true);
      setEnrollmentError('');

      try {
        // First, check if the user already has access to this app
        const response = await fetch('/api/apps');
        if (response.ok) {
          const data = await response.json();
          const existingApp = data.apps.find(
            (app: EchoApp) => app.id === appId
          );

          if (existingApp) {
            // User already has access, just set it as selected
            setSelectedAppId(appId);
            setIsEnrolling(false);
            return;
          }
        }

        // User doesn't have access, try to enroll them as a customer
        const enrollResponse = await fetch(
          `/api/owner/apps/${appId}/customers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // Empty body means enroll current user
          }
        );

        if (enrollResponse.ok) {
          // Successfully enrolled, now refetch all apps to include the newly joined app
          await fetchApps();
          setSelectedAppId(appId);
        } else {
          const errorData = await enrollResponse.json();
          if (enrollResponse.status === 404) {
            setEnrollmentError('App not found or inactive');
          } else {
            setEnrollmentError(errorData.error || 'Failed to join app');
          }
        }
      } catch (error) {
        console.error('Failed to handle app enrollment:', error);
        setEnrollmentError('Failed to join app');
      } finally {
        setIsEnrolling(false);
      }
    },
    [fetchApps]
  );

  const generateApiKey = async () => {
    if (!selectedAppId) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          echoAppId: selectedAppId,
          name: apiKeyName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedApiKey(data.apiKey.key);
      } else {
        console.error('Failed to generate API key');
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <p>
        You are generating an API key for CLI access to the Echo app{' '}
        <span className="font-bold">{app.name}</span>.
      </p>
    </div>
  );
}
