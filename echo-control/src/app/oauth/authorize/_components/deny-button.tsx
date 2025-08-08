import { GlassButton } from '@/components/glass-button';
import Link from 'next/link';

interface Props {
  redirectUrl: string;
}

export const DenyButton: React.FC<Props> = ({ redirectUrl }) => {
  return (
    <Link href={redirectUrl.toString()}>
      <GlassButton
        onClick={handleDeny}
        disabled={isAuthorizing}
        variant="secondary"
        className="flex-1"
      >
        Deny
      </GlassButton>
    </Link>
  );
};
