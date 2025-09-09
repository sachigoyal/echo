import { baseOgImage } from './base';
import { baseUrl } from './base-url';

export const dynamicOgImage = (component: React.ReactNode) => {
  return baseOgImage(
    <>
      <div tw="flex flex-col w-full flex-1 text-white px-12 pt-16 pb-12">
        {component}
      </div>
      <div tw="flex flex-col w-full py-6 px-12 border-t-4 border-neutral-600">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${baseUrl}/logo/dark_horizontal.svg`}
          alt="Echo Logo"
          width={222}
          height={80}
        />
      </div>
    </>
  );
};
