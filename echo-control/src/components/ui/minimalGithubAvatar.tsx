import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '@/lib/utils';
import { Github } from 'lucide-react';

export const MinimalGithubAvatar = memo(function MinimalGithubAvatar({
  srcUrl,
  alt,
  className,
  style,
}: {
  srcUrl: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Avatar
      className={cn(
        'size-10 rounded-lg overflow-hidden border border-border',
        className
      )}
      style={style}
    >
      <AvatarImage src={srcUrl} alt={alt} className="object-cover" />
      <AvatarFallback className="bg-muted dark:bg-muted p-2 rounded-none">
        <Github className="size-full opacity-60" />
      </AvatarFallback>
    </Avatar>
  );
});
