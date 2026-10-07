import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C} from './theme';
import {sans, serif} from './fonts';

export type Cam = {s: number; x: number; y: number};

/** Slow pan / zoom over a still image (Ken Burns). */
export const KenBurns: React.FC<{
  src: string;
  from: Cam;
  to: Cam;
  shake?: number;
  punch?: boolean;
  dim?: number;
  blur?: number;
}> = ({src, from, to, shake = 0, punch = false, dim = 0, blur = 0}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateRight: 'clamp',
  });
  let s = interpolate(t, [0, 1], [from.s, to.s]);
  const x = interpolate(t, [0, 1], [from.x, to.x]);
  const y = interpolate(t, [0, 1], [from.y, to.y]);
  if (punch) {
    const p = spring({frame, fps, config: {damping: 14, stiffness: 180}});
    s += interpolate(p, [0, 1], [0.18, 0]);
  }
  const decay = interpolate(frame, [0, 24], [1, 0.15], {extrapolateRight: 'clamp'});
  const sx = shake ? Math.sin(frame * 2.7) * shake * decay : 0;
  const sy = shake ? Math.cos(frame * 3.3) * shake * decay : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: C.ink}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(${x + sx}%, ${y + sy}%) scale(${s})`,
          filter: `${blur ? `blur(${blur}px) ` : ''}brightness(${1 - dim})`,
        }}
      />
    </AbsoluteFill>
  );
};

export type Align = 'left' | 'right' | 'center';

const gradientFor = (align: Align) =>
  align === 'center'
    ? 'radial-gradient(ellipse at 50% 55%, rgba(10,7,9,.55) 0%, rgba(10,7,9,.15) 60%, rgba(10,7,9,.45) 100%)'
    : `linear-gradient(0deg, rgba(10,7,9,.92) 0%, rgba(10,7,9,.25) 48%, rgba(10,7,9,0) 75%),
       linear-gradient(${align === 'left' ? '90deg' : '270deg'}, rgba(10,7,9,.55) 0%, rgba(10,7,9,0) 55%)`;

export const Shade: React.FC<{align: Align}> = ({align}) => (
  <AbsoluteFill style={{background: gradientFor(align)}} />
);

/** Label + staggered headline lines + optional body, styled like the site's cinema shots. */
export const Caption: React.FC<{
  label: string;
  lines: string[];
  body?: string;
  align: Align;
  size?: number;
  delay?: number;
  highlightLast?: boolean;
}> = ({label, lines, body, align, size = 92, delay = 6, highlightLast = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = frame - delay;
  const labelIn = interpolate(f, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rule = interpolate(f, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const bodyStart = 10 + lines.length * 8 + 6;
  const bodyIn = interpolate(f, [bodyStart, bodyStart + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const justify = align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end';
  return (
    <AbsoluteFill
      style={{
        justifyContent: align === 'center' ? 'center' : 'flex-end',
        alignItems: justify,
        padding: align === 'center' ? '0 160px' : '0 150px 150px',
        textAlign: align,
        color: C.white,
        textShadow: '0 4px 30px rgba(0,0,0,.55)',
      }}
    >
      <div style={{maxWidth: 1400}}>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: '0.32em',
            color: C.gold,
            opacity: labelIn,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            justifyContent: justify,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 70 * rule,
              height: 2,
              background: C.gold,
              order: align === 'right' ? 2 : 0,
            }}
          />
          <span>{label}</span>
        </div>
        <div style={{marginTop: 22}}>
          {lines.map((line, i) => {
            const p = spring({frame: f - 10 - i * 8, fps, config: {damping: 200}});
            const isHl = highlightLast && i === lines.length - 1;
            return (
              <div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
                <div
                  style={{
                    fontFamily: serif,
                    fontWeight: 900,
                    fontSize: size,
                    lineHeight: 1.22,
                    letterSpacing: '0.02em',
                    color: isHl ? C.pink : C.white,
                    transform: `translateY(${interpolate(p, [0, 1], [110, 0])}%)`,
                    opacity: p,
                  }}
                >
                  {line}
                </div>
              </div>
            );
          })}
        </div>
        {body ? (
          <div
            style={{
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1.8,
              marginTop: 26,
              maxWidth: 1240,
              marginLeft: align === 'left' ? 0 : 'auto',
              marginRight: align === 'right' ? 0 : 'auto',
              opacity: bodyIn,
              transform: `translateY(${(1 - bodyIn) * 16}px)`,
              color: 'rgba(255,255,255,.92)',
            }}
          >
            {body}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** White burst used when the onigiri appears. */
export const Flash: React.FC<{at?: number; len?: number}> = ({at = 0, len = 14}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + len], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{background: '#fffaf0', opacity: o, mixBlendMode: 'screen'}} />;
};

/** Film-like overlays: letterbox, vignette, animated grain. */
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)'}}
      />
      <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 54, background: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 54, background: '#000'}} />
    </AbsoluteFill>
  );
};
