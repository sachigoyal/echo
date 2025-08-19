import { Hero } from './1_hero';
import { Features } from './2_features';
import { IntegrationSection } from './3_integration';
import { End } from './lib/section';
import { Navbar } from './navbar';

export const Unauthed = () => {
  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <End />
        <Hero />
        <Features />
        <IntegrationSection />
        <End className="border-t" />
      </div>
    </div>
  );
};
