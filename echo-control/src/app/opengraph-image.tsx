import { baseOgImage, borderColor, dashWidth, xPadding } from './_og/base';
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
    <div tw="flex flex-col flex-1">
      <div
        tw="flex justify-center items-center"
        style={{
          borderBottom: `${dashWidth} dashed ${borderColor}`,
        }}
      >
        <hr
          tw="flex-1"
          style={{
            borderTop: `${dashWidth} dashed ${borderColor}`,
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            marginLeft: `-${xPadding * 4}`,
          }}
        />
        <div tw="flex flex-col relative justify-center items-center">
          <div
            tw="flex flex-col relative justify-center items-center"
            style={{
              position: 'absolute',
              background: '#009dc8',
              marginTop: '-16px',
              marginBottom: '-16px',
              clipPath: ' polygon(-50% 50%,50% 100%,150% 50%,50% 0)',
              height: '240px',
              width: '208px',
              boxShadow: '0 0 24px 12px rgba(0,157,200,0.5)',
            }}
          />

          <div
            tw="flex flex-col relative justify-center items-center"
            style={{
              background: 'white',
              marginTop: '-16px',
              marginBottom: '-16px',
              clipPath: 'polygon(-50% 50%,50% 100%,150% 50%,50% 0)',
              height: '220px',
              width: '190px',
              boxShadow: '0 0 16px 8px rgba(0,157,200,0.5)',
              zIndex: 10,
            }}
          >
            <img
              src={`${baseUrl}/logo/light.svg`}
              alt="Echo"
              height={180}
              width={180}
            />
          </div>
        </div>
        <hr
          tw="flex-1"
          style={{
            borderTop: `${dashWidth} dashed ${borderColor}`,
            marginLeft: '10px',
            marginRight: `-${xPadding * 4}`,
          }}
        />
      </div>
      <div tw="flex flex-col justify-center items-center flex-1">
        <h1
          tw="text-8xl font-extrabold m-0 mb-3"
          style={{
            background:
              'linear-gradient(to bottom, #009dc8 0%, rgba(0,157,200,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Echo
        </h1>
        <h2
          tw="m-0 text-5xl font-bold mb-12"
          style={{
            opacity: 0.7,
          }}
        >
          Monetize AI Apps in Minutes
        </h2>
        <h3 tw="m-0 text-2xl">
          <span style={{ fontWeight: 500 }}> Merit</span>
          <span tw="font-light">Systems</span>
        </h3>
      </div>
    </div>
  );
}
