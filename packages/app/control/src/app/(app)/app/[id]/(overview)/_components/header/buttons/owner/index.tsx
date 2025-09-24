import { useAppConnectionSetup } from '@/app/(app)/app/[id]/_hooks/use-app-setup';
import { useAppDetailsSetup } from '@/app/(app)/app/[id]/_hooks/use-app-setup';
import { useEffect, useState } from 'react';
import { SetupApp } from './setup-app';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { HomepageUrl } from './homepage-url';

interface Props {
  appId: string;
}

export const OwnerButtons: React.FC<Props> = ({ appId }) => {
  const { isConnectionComplete } = useAppConnectionSetup(appId);

  const { allStepsCompleted } = useAppDetailsSetup(appId);

  const [isSetupVisible, setIsSetupVisible] = useState(
    isConnectionComplete && !allStepsCompleted
  );

  const onSetupFinish = () => {
    setIsSetupVisible(false);
  };

  useEffect(() => {
    if (isConnectionComplete) {
      setIsSetupVisible(prev => {
        if (prev) {
          return prev;
        }

        return isConnectionComplete && !allStepsCompleted;
      });
    }
  }, [isConnectionComplete, allStepsCompleted]);

  return (
    <>
      {isConnectionComplete ? (
        isSetupVisible ? (
          <SetupApp appId={appId} onFinish={onSetupFinish} />
        ) : (
          <HomepageUrl appId={appId} />
        )
      ) : null}
      <Link href={`/app/${appId}/settings/general`}>
        <Button variant="outline">
          <Settings className="size-4" />
          App Settings
        </Button>
      </Link>
    </>
  );
};
