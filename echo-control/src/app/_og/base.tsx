import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const backgroundColor = '#fcfcfc';
export const borderColor = '#d4d4d4';
export const dashWidth = '1px';
export const strokeDasharray = '1 4';
export const xPadding = 16;
const yPadding = 16;
const circleSize = 16;

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
        tw="flex flex-col relative"
        style={{
          background: backgroundColor,
          height: '100%',
          width: '100%',
        }}
      >
        {/* Top border */}
        <div
          tw={`h-${yPadding} w-full px-${xPadding} flex items-center`}
          style={{
            borderBottom: `${dashWidth} dashed ${borderColor}`,
            strokeDasharray,
          }}
        >
          <div
            tw="flex-1 h-full"
            style={{
              borderLeft: `${dashWidth} dashed ${borderColor}`,
              borderRight: `${dashWidth} dashed ${borderColor}`,
            }}
          />
        </div>
        <div
          tw="top-0 left-0 right-0 z-10 h-4 absolute"
          style={{
            zIndex: 10,
            background: `linear-gradient(to bottom, ${backgroundColor} 0%, rgba(252, 252, 252, 0) 100%)`,
          }}
        />
        <div
          tw={`absolute top-${yPadding - circleSize / 2} left-${xPadding - circleSize / 2} z-10 rounded-full h-${circleSize} w-${circleSize}`}
          style={{
            border: `${dashWidth} dashed ${borderColor}`,
          }}
        />
        <div
          tw={`absolute bottom-${yPadding - circleSize / 2} right-${xPadding - circleSize / 2} z-10 rounded-full h-${circleSize} w-${circleSize}`}
          style={{
            border: `${dashWidth} dashed ${borderColor}`,
          }}
        />

        {/* Content */}
        <div tw="flex-1 w-full flex">
          <div tw={`w-${xPadding} h-full`} />
          <div
            tw="flex-1 flex flex-col"
            style={{
              borderLeft: `${dashWidth} dashed ${borderColor}`,
              borderRight: `${dashWidth} dashed ${borderColor}`,
            }}
          >
            <div
              tw="flex-1 w-full flex flex-col"
              style={{
                background: backgroundColor,
                zIndex: 11,
              }}
            >
              {component}
            </div>
          </div>
          <div tw={`w-${xPadding} h-full`} />
        </div>

        {/* Bottom border */}
        <div
          tw={`h-${yPadding} w-full px-${xPadding} flex items-center`}
          style={{
            borderTop: `${dashWidth} dashed ${borderColor}`,
          }}
        >
          <div
            tw="flex-1 h-full"
            style={{
              borderLeft: `${dashWidth} dashed ${borderColor}`,
              borderRight: `${dashWidth} dashed ${borderColor}`,
            }}
          />
        </div>

        {/* Side gradients */}
        <div
          tw="bottom-0 top-0 left-0 w-4 flex items-center z-10 absolute"
          style={{
            background: `linear-gradient(to right, ${backgroundColor} 0%, rgba(252, 252, 252, 0) 100%)`,
          }}
        />
        <div
          tw="bottom-0 top-0 right-0 w-4 flex items-center z-10 absolute"
          style={{
            background: `linear-gradient(to left, ${backgroundColor} 0%, rgba(252, 252, 252, 0) 100%)`,
          }}
        />
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
