import { Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  homepageUrl: string;
}

export const UseAppButton: React.FC<Props> = ({ homepageUrl }) => {
  return (
    <a href={homepageUrl} target="_blank">
      <Button variant="turbo">
        <Zap className="size-4" />
        Use App
      </Button>
    </a>
  );
};
