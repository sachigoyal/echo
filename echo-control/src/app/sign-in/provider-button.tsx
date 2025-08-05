import { Button } from '@/components/ui/button';
import { OAuthProvider } from '@/auth/types';

import { SiGoogle, SiGithub } from '@icons-pack/react-simple-icons';

export const ProviderButton = ({ provider }: { provider: OAuthProvider }) => {
  return (
    <Button
      type="submit"
      name="provider"
      value={provider.id}
      className="w-full"
    >
      <ProviderIcon provider={provider} />
      {provider.name}
    </Button>
  );
};

const ProviderIcon = ({ provider }: { provider: OAuthProvider }) => {
  switch (provider.id) {
    case 'google':
      return <SiGoogle />;
    case 'github':
      return <SiGithub />;
    default:
      return null;
  }
};
