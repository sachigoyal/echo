import { Avatar, AvatarFallback, AvatarImage } from '@/registry/echo/ui/avatar';
import { Button } from '@/registry/echo/ui/button';
import { PopoverContent } from '@/registry/echo/ui/popover';
import { useEcho } from '@merit-systems/echo-react-sdk';
import { LogOut, MessageSquare } from 'lucide-react';
import EchoBalance from '../balance';
import { EchoTopUpButton } from '../top-up-button';

export function EchoAccountButtonPopover() {
  const { user } = useEcho();
  return (
    <PopoverContent className="w-[380px] p-0" align="end">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto p-2 -ml-2 hover:bg-accent"
          onClick={() =>
            window.open('https://echo.merit.systems/dashboard', '_blank')
          }
        >
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.picture} />
              <AvatarFallback>
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-left">
            <h4 className="font-medium text-sm">
              {user?.name || user?.email || 'Account'}
            </h4>
            <p className="text-xs text-muted-foreground/80">{user?.id}</p>
          </div>
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Balance */}
      <div className="p-4 border-b">
        <EchoBalance />
      </div>

      {/* Add Credits Button */}
      <div className="p-4 border-b">
        <EchoTopUpButton />
      </div>
    </PopoverContent>
  );
}
