import { Section } from '../lib/section';
import {
  FeatureCard,
  FeatureCardComponent,
  FeatureCardDescription,
  FeatureCardFooter,
  FeatureCardTitle,
} from './feature-card';

import { AnyModel } from './features/any-model';
import { Billing } from './features/billing';
import { FreeOss } from './features/free-oss';

import { cn } from '@/lib/utils';
import { Login } from './features/login';

export const Features = () => {
  return (
    <Section id="features">
      <div className={cn('flex flex-col lg:flex-row lg:overflow-x-auto lg:h-[300px] scrollbar-hide')}>

        <FeatureCard>
          <FeatureCardComponent>
            <Login />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Managed Auth</FeatureCardTitle>
            <FeatureCardDescription>
              Drop-in auth components with login, balance and top-ups
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        <FeatureCard>
          <FeatureCardComponent>
            <Billing />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Zero-cost Infra</FeatureCardTitle>
            <FeatureCardDescription>
              Users pay usage, Echo settles costs and returns your share
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        <FeatureCard>
          <FeatureCardComponent>
            <AnyModel />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Unified Gateway</FeatureCardTitle>
            <FeatureCardDescription>
              Echo SDK serves all frontier models behind a single gateway
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        <FeatureCard>
          <FeatureCardComponent>
            <FreeOss />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Free & OSS</FeatureCardTitle>
            <FeatureCardDescription>
              Open Source, transparent and built by the community
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

      </div>
    </Section>
  );
};
