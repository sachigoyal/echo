import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const baseOgImage = async (component: React.ReactNode) => {
  const [
    helveticaNowDisplayBlack,
    helveticaNowDisplayExtraBold,
    helveticaNowDisplayRegular,
    helveticaNowDisplayMedium,
    helveticaNowDisplayExtraLight,
  ] = await Promise.all([
    readFile(
      join(process.cwd(), `public/fonts/HelveticaNowDisplay-Black.woff`)
    ),
    readFile(
      join(process.cwd(), `public/fonts/HelveticaNowDisplay-ExtraBold.woff`)
    ),
    readFile(
      join(process.cwd(), `public/fonts/HelveticaNowDisplay-Regular.woff`)
    ),
    readFile(
      join(process.cwd(), `public/fonts/HelveticaNowDisplay-Medium.woff`)
    ),
    readFile(
      join(process.cwd(), `public/fonts/HelveticaNowDisplay-ExtLt.woff`)
    ),
  ]);

  return new ImageResponse(
    (
      <div
        className="h-full w-full flex flex-col justify-center items-center"
        style={{
          background: 'white',
        }}
      >
        {component}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'HelveticaNowDisplay',
          data: helveticaNowDisplayBlack,
          weight: 900,
          style: 'normal',
        },
        {
          name: 'HelveticaNowDisplay',
          data: helveticaNowDisplayExtraBold,
          weight: 800,
          style: 'normal',
        },
        {
          name: 'HelveticaNowDisplay',
          data: helveticaNowDisplayRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'HelveticaNowDisplay',
          data: helveticaNowDisplayMedium,
          weight: 500,
          style: 'normal',
        },
        {
          name: 'HelveticaNowDisplay',
          data: helveticaNowDisplayExtraLight,
          weight: 200,
          style: 'normal',
        },
      ],
    }
  );
};
