import React from 'react';

import { User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

interface Props {
  src: string | null | undefined;
  fallback?: React.ReactNode;
  className?: string;
}

export const UserAvatar: React.FC<Props> = ({ src, fallback, className }) => {
  return (
    <Avatar className={cn('rounded-md overflow-hidden', className)}>
      {src ? <AvatarImage src={src} className="size-full" /> : <AvatarImage />}
      <AvatarFallback className="bg-transparent size-full flex items-center justify-center">
        {fallback || <User className="size-4" />}
      </AvatarFallback>
    </Avatar>
  );
};
