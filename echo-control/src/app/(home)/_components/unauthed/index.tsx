import { Hero } from './1_hero';
import { Features } from './2_features';
import { End } from './lib/section';

export const Unauthed = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <End />
      <Hero />
      <Features />
      <End className="border-t" />
    </div>
  );
};
