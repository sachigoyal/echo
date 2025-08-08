import { ExternalLink, Globe, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EchoApp } from '@/lib/types/apps';

interface AppHomepageCardProps {
  app: EchoApp;
  title?: string;
}

export function AppHomepageCard({
  app,
  title = 'Homepage',
}: AppHomepageCardProps) {
  const homepageUrl = app.homepageUrl;

  const getDomainName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleVisitHomepage = () => {
    if (homepageUrl) {
      window.open(homepageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!homepageUrl) {
    return (
      <Card className="bg-card/50 backdrop-blur-xs border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="text-center py-8">
            <Globe className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No homepage URL available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xs border border-border/50 hover:border-border transition-colors h-80 flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {/* URL Display */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-foreground">
                {getDomainName(homepageUrl)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {homepageUrl}
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleVisitHomepage}
            variant="outline"
            size="sm"
            className="w-full bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400 hover:text-blue-300"
          >
            <span>Visit Homepage</span>
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
