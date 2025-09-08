import { patterns } from './patterns';
import { NOISE_IMAGE } from './noise';
import {
  canvasDefault,
  backgroundDefault,
  BackgroundParams,
  CanvasParams,
  toBackgroundShorthand,
} from './parameters';

export type BasicOGTemplateParams = {
  canvas?: CanvasParams;
  background?: BackgroundParams;
  children?: React.ReactNode;
};

export const OgComponent: React.FC<BasicOGTemplateParams> = props => {
  const canvas = props.canvas ?? canvasDefault;
  const background = props.background ?? backgroundDefault;

  return (
    <div
      tw="flex flex-col"
      style={{
        width: canvas.width,
        height: canvas.height,
        background: toBackgroundShorthand(background),
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          inset: 0,
          filter: 'brightness(100%) contrast(150%)',
          opacity: background.noise,
          backgroundImage: NOISE_IMAGE,
          backgroundRepeat: 'repeat',
        }}
      ></div>

      {background.gridOverlay && (
        <div
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            backgroundImage: `url('${patterns[
              background.gridOverlay.pattern
            ].svg({
              color: background.gridOverlay.color,
              opacity: background.gridOverlay.opacity,
            })}')`,
            maskImage:
              background.gridOverlay.blurRadius > 0
                ? `radial-gradient(rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) ${
                    100 - background.gridOverlay.blurRadius
                  }%)`
                : 'none',
          }}
        ></div>
      )}
      {props.children}
    </div>
  );
};
