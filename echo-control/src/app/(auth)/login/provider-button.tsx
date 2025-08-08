import { Button } from '@/components/ui/button';
import { OAuthProvider } from '@/auth/types';

import { SiGoogle, SiGithub } from '@icons-pack/react-simple-icons';

export const ProviderButton = ({ provider }: { provider: OAuthProvider }) => {
  return (
    <div className="w-full md:w-auto md:flex-1 bg-background rounded-xl">
      <Button
        type="submit"
        name="provider"
        value={provider.id}
        className="border-2 border-border/40 bg-input/60 hover:bg-input/80 rounded-xl size-fit px-5 py-3 font-bold flex-1 w-full"
        variant="unstyled"
      >
        <ProviderIcon provider={provider} />
        Login with {provider.name}
      </Button>
    </div>
  );
};

const ProviderIcon = ({ provider }: { provider: OAuthProvider }) => {
  const getIcon = () => {
    switch (provider.id) {
      case 'google':
        return SiGoogle;
      case 'github':
        return SiGithub;
      default:
        return null;
    }
  };

  const Icon = getIcon();

  if (!Icon) {
    return null;
  }

  return <Icon className="size-4" />;
};
