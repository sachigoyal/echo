import { Avatar, AvatarFallback, AvatarImage } from '@/registry/echo/ui/avatar';
import { Button } from '@/registry/echo/ui/button';
import { PopoverContent } from '@/registry/echo/ui/popover';
import { useEcho } from '@merit-systems/echo-react-sdk';
import { Bot, Image, LogOut, MessageSquare, PlusCircle } from 'lucide-react';
import EchoBalance from '../balance';
import { EchoTopUpButton } from '../top-up-button';

export function EchoAccountButtonPopover({
  showAllApps = false,
}: {
  showAllApps?: boolean;
}) {
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

      {/* Apps Usage */}
      {showAllApps && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-sm">Recent Apps</h5>
            <Button variant="ghost" size="sm" className="h-7">
              <PlusCircle className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>
          <div className="space-y-3">
            <AppUsageRow
              name="Chat Assistant"
              icon={MessageSquare}
              usage="2,405 messages"
              date="Last used 2h ago"
            />
            <AppUsageRow
              name="Image Generator"
              icon={Image}
              usage="156 images"
              date="Last used yesterday"
            />
            <AppUsageRow
              name="Code Assistant"
              icon={Bot}
              usage="890 conversations"
              date="Last used 3d ago"
            />
          </div>
        </div>
      )}
    </PopoverContent>
  );
}

function AppUsageRow({
  name,
  icon: Icon,
  usage,
  date,
}: {
  name: string;
  icon: typeof MessageSquare;
  usage: string;
  date: string;
}) {
  return (
    <div className="flex items-center justify-between group hover:bg-muted/50 -mx-4 px-4 py-2 rounded-lg cursor-pointer transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{usage}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          {date}
        </p>
      </div>
    </div>
  );
}
