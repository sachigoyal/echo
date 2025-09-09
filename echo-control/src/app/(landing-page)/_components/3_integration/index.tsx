import { Section } from '../lib/section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { integrations } from './data';
import { Card } from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { Check } from 'lucide-react';

export const IntegrationSection = () => {
  return (
    <Section id="integration">
      <div className="p-4 md:p-8 flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-2xl font-bold text-center">
            Start Earning in Seconds
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Integrate Echo in your app in seconds
          </p>
        </div>
        <Tabs
          className="flex flex-col items-center gap-4 justify-center w-full"
          defaultValue="Next.js"
        >
          <TabsList>
            {integrations.map(integration => (
              <TabsTrigger key={integration.name} value={integration.name}>
                {integration.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            {integrations.map(integration => (
              <TabsContent
                key={integration.name}
                value={integration.name}
                className="w-full"
              >
                <Card
                  key={integration.name}
                  className="flex w-full overflow-hidden"
                >
                  <div className="flex flex-col justify-center p-4 gap-4 bg-muted/50 border-r flex-1">
                    <div className="flex flex-col justify-center">
                      <h1 className="text-2xl font-bold">{integration.name}</h1>
                      <p className="text-sm text-muted-foreground">
                        LLM billing made easy in {integration.name}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                      {[
                        'Serve LLM Inference risk-free',
                        "Monitor your users' balances and usage",
                        'Sponsor free tier for new users',
                      ].map(feature => (
                        <div key={feature} className="flex gap-2 items-center">
                          <Check className="size-4 text-green-600" />
                          <p
                            key={feature}
                            className="text-sm text-muted-foreground"
                          >
                            {feature}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <Code value={integration.content} lang="tsx" />
                  </div>
                </Card>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </Section>
  );
};
