import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Key, Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { CustomerEchoApp } from '@/lib/types/apps';

interface CustomerApiKeysCardProps {
  app: CustomerEchoApp;
  hasCreatePermission: boolean;
  hasManagePermission: boolean;
  onCreateApiKey?: () => void;
  onArchiveApiKey?: (id: string) => void;
  deletingKeyId?: string | null;
}

export function CustomerApiKeysCard({
  app,
  hasCreatePermission,
  hasManagePermission,
  onCreateApiKey,
  onArchiveApiKey,
  deletingKeyId,
}: CustomerApiKeysCardProps) {
  return (
    <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50 h-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white">
            <Key className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold">API Keys</h3>
        </div>
        {hasCreatePermission && onCreateApiKey && (
          <Button onClick={onCreateApiKey} className="!h-8 !w-8 !p-0">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      <div className="flex-1 overflow-y-auto">
        {app.stats?.personalApiKeys && app.stats?.personalApiKeys.length > 0 ? (
          <div className="space-y-2">
            {app.stats?.personalApiKeys.map(key => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {key.name || 'Unnamed Key'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {hasManagePermission && onArchiveApiKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onArchiveApiKey(key.id)}
                    disabled={deletingKeyId === key.id}
                    className="!h-8 !w-8 !p-0 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No API keys yet.{' '}
              {hasCreatePermission
                ? 'Click the + button to create one.'
                : "You don't have permission to create API keys."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
