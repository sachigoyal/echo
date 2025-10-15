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
import { UniversalBalance } from './features/universal-balance';

import { cn } from '@/lib/utils';
import { Login } from './features/login';

export const Features = () => {
  return (
    <Section id="features">
      <div className={cn('grid md:grid-cols-3')}>

        <FeatureCard>
          <FeatureCardComponent>
            <Login />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Managed Auth</FeatureCardTitle>
            <FeatureCardDescription>
              Prebuilt components for login, balance and top-ups
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        <FeatureCard>
          <FeatureCardComponent>
            <AnyModel />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Any Model Provider</FeatureCardTitle>
            <FeatureCardDescription>
              Serve any model with maximum rate limits and minimum latency
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        <FeatureCard>
          <FeatureCardComponent>
            <Billing />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Zero-Risk Billing</FeatureCardTitle>
            <FeatureCardDescription>
              Every token your users consume is profit, Echo is responsible for costs
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        {/* <FeatureCard>
          <FeatureCardComponent>
            <UniversalBalance />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Universal Balance</FeatureCardTitle>
            <FeatureCardDescription>
              Echo credits can be used on any app in our network
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard> */}


      </div>
    </Section>
  );
};
