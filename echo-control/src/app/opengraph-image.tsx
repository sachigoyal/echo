import { baseOgImage } from './_og/base';
import { baseUrl } from './_og/base-url';

// Image metadata
export const alt = 'About Acme';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return baseOgImage(
    <div tw="flex flex-col w-full flex-1 justify-center items-center pb-8">
      <img src={`${baseUrl}/logo/light.svg`} alt="Echo" tw="w-24 h-24" />
      <h1
        tw="m-0 mb-4 text-8xl"
        style={{
          fontWeight: 800,
          background:
            'linear-gradient(to bottom, rgb(1, 154, 174) 0%, rgba(1, 154, 174, 0.7) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Echo
      </h1>
      <h2 tw="m-0 text-4xl font-medium text-neutral-700">
        Monetize AI Apps in Minutes
      </h2>
    </div>
  );
}
