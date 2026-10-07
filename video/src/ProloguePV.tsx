import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';
import {Align, Cam, Caption, FilmLook, Flash, KenBurns, Shade} from './components';
import {C} from './theme';
import TL from './timeline.json';
import {sans, serif} from './fonts';

type ShotDef = {
  img: string;
  label: string;
  lines: string[];
  body?: string;
  align: Align;
  from: Cam;
  to: Cam;
  size?: number;
  shake?: number;
  punch?: boolean;
  flash?: boolean;
};

const shots: Record<string, ShotDef> = {
  morning: {
    img: 'bg_special_S01_twins_throne.png',
    label: 'SCENE 01 / MORNING',
    lines: ['魔王なのに、', '納豆が嫌い。'],
    body: '魔力補給のための、いつもの朝食。姉のルビナにとっては、今日も最悪の時間だった。',
    align: 'left',
    from: {s: 1.12, x: 2, y: 0},
    to: {s: 1.02, x: -1, y: 0},
  },
  natto: {
    img: 'bg_special_S01_natto_closeup.png',
    label: 'SCENE 01 / NATTO',
    lines: ['「くさい。', '絶対やだもん。」'],
    body: '不人気でも、魔力を補うためには必要。それが、この世界での納豆だった。',
    align: 'right',
    from: {s: 1.05, x: 0, y: 0},
    to: {s: 1.2, x: 1.5, y: 1},
  },
  magic: {
    img: 'bg_special_S02_magic_clash.png',
    label: 'SCENE 02 / MAGIC',
    lines: ['いつもの喧嘩が、', '少しだけ大きくなった。'],
    align: 'left',
    from: {s: 1.08, x: 0, y: 0},
    to: {s: 1.18, x: 0, y: -1},
    shake: 1.1,
  },
  onigiri: {
    img: 'bg_special_S03_onigiri_falls.png',
    label: 'SCENE 03 / UNKNOWN',
    lines: ['その瞬間。', '天井から、白い三角。'],
    body: 'この世界には存在しないはずの食べものが、光の中から現れた。',
    align: 'left',
    from: {s: 1.22, x: 0, y: -3},
    to: {s: 1.04, x: 0, y: 1},
    flash: true,
  },
  lunge: {
    img: 'bg_special_S04_rubina_lunge.png',
    label: 'SCENE 04 / FIRST CONTACT',
    lines: ['「それ、', 'ルビナの！」'],
    align: 'left',
    from: {s: 1.06, x: 0, y: 0},
    to: {s: 1.14, x: -1, y: 0},
    size: 120,
    punch: true,
  },
  eating: {
    img: 'bg_special_S05_rubina_eating.png',
    label: 'SCENE 05 / FIRST BITE',
    lines: ['一口で、', '世界の常識が変わる。'],
    body: '米が身体に入った瞬間、ルビナの中を未知の感覚が駆け抜ける。',
    align: 'left',
    from: {s: 1.0, x: 0, y: 0},
    to: {s: 1.14, x: 2, y: 0},
  },
  koharu: {
    img: 'bg_special_S06_koharu_arrival.png',
    label: 'SCENE 06 / ARRIVAL',
    lines: ['そして次に、', '人まで落ちてきた。'],
    body: '土と稲穂を抱えた女性。その存在が、魔族と食文化の歴史を大きく動かしていく。',
    align: 'right',
    from: {s: 1.16, x: 0, y: -2.5},
    to: {s: 1.03, x: 0, y: 0.5},
  },
};

const Shot: React.FC<{d: ShotDef}> = ({d}) => (
  <AbsoluteFill>
    <KenBurns src={d.img} from={d.from} to={d.to} shake={d.shake} punch={d.punch} />
    <Shade align={d.align} />
    {d.flash ? <Flash at={0} len={18} /> : null}
    <Caption
      label={d.label}
      lines={d.lines}
      body={d.body}
      align={d.align}
      size={d.size}
      delay={d.flash ? 14 : 6}
    />
  </AbsoluteFill>
);

const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const pre = interpolate(frame, [8, 24, 44, 56], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bgIn = interpolate(frame, [0, 60], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: bgIn}}>
        <KenBurns
          src="bg_special_S01_twins_throne.png"
          from={{s: 1.3, x: 0, y: 2}}
          to={{s: 1.15, x: 0, y: 0}}
          dim={0.55}
          blur={6}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: '0.5em',
          color: C.gold,
          opacity: pre,
        }}
      >
        NATTO ISEKAI PROJECT
      </AbsoluteFill>
      <Sequence from={56} layout="none">
        <Caption
          label="PROLOGUE / EPISODE 00"
          lines={['魔王城の朝、', '落ちてきた三角。']}
          align="center"
          size={104}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const montage = [
  {img: 'bg_special_S09_look_down.png', name: 'RUBINA', sub: '双子魔王・姉', from: {s: 1.15, x: 0, y: 0}, to: {s: 1.05, x: 0, y: 0}},
  {img: 'bg_special_S10_rivil_jump.png', name: 'RIVIL', sub: '双子魔王', from: {s: 1.05, x: 1, y: 1}, to: {s: 1.15, x: -1, y: -1}},
  {img: 'bg_special_S20_iteku_re.png', name: 'WORLD', sub: '食べることは、魔力を得ること。', from: {s: 1.12, x: -1, y: 0}, to: {s: 1.04, x: 1, y: 0}},
  {img: 'bg_special_S06_koharu_arrival.png', name: 'KOHARU', sub: '空から落ちてきた女性', from: {s: 1.3, x: -3, y: 0}, to: {s: 1.2, x: 2, y: 0}},
];
const CUT = TL.montageCut;

const MontageCard: React.FC<{name: string; sub: string}> = ({name, sub}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 16, stiffness: 160}});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 150px 130px'}}>
      <div
        style={{
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 28,
          color: C.gold,
          letterSpacing: '0.2em',
          opacity: p,
        }}
      >
        {sub}
      </div>
      <div
        style={{
          fontFamily: serif,
          fontWeight: 900,
          fontSize: 170,
          lineHeight: 1,
          color: C.white,
          letterSpacing: '0.08em',
          textShadow: '0 6px 40px rgba(0,0,0,.6)',
          transform: `translateX(${interpolate(p, [0, 1], [-80, 0])}px)`,
          opacity: p,
        }}
      >
        {name}
      </div>
    </AbsoluteFill>
  );
};

const Montage: React.FC = () => (
  <AbsoluteFill>
    {montage.map((m, i) => (
      <Sequence key={m.name} from={i * CUT} durationInFrames={CUT}>
        <KenBurns src={m.img} from={m.from} to={m.to} />
        <Shade align="left" />
        <Flash at={0} len={6} />
        <MontageCard name={m.name} sub={m.sub} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const Tagline: React.FC = () => (
  <AbsoluteFill>
    <KenBurns
      src="bg_special_S01_natto_closeup.png"
      from={{s: 1.1, x: 0, y: 0}}
      to={{s: 1.2, x: 0, y: 0}}
      dim={0.72}
      blur={5}
    />
    <Caption
      label="FOOD → MAGIC"
      lines={['臭くて、粘って、嫌われて。', 'それでも、', '世界を変える。']}
      align="center"
      size={96}
      highlightLast
    />
  </AbsoluteFill>
);

const STAMP_AT = TL.stampAt;
const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const line = (start: number) =>
    spring({frame: frame - start, fps, config: {damping: 200}});
  const stamp = spring({frame: frame - STAMP_AT, fps, config: {damping: 9, stiffness: 220, mass: 0.7}});
  const after = interpolate(frame, [70, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const titleLine = (text: string, start: number) => {
    const p = line(start);
    return (
      <div style={{overflow: 'hidden'}}>
        <div style={{transform: `translateY(${interpolate(p, [0, 1], [105, 0])}%)`, opacity: p}}>
          {text}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: out}}>
        <KenBurns
          src="bg_special_S03_onigiri_falls.png"
          from={{s: 1.06, x: 0, y: 0}}
          to={{s: 1.14, x: 0, y: 0}}
        />
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(90deg, rgba(15,9,12,.92) 0%, rgba(15,9,12,.7) 42%, rgba(15,9,12,.18) 72%, rgba(15,9,12,.05) 100%)',
          }}
        />
        <AbsoluteFill style={{justifyContent: 'center', padding: '0 150px', color: C.white}}>
          <div
            style={{
              fontFamily: sans,
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: '0.3em',
              color: C.gold,
              opacity: line(0),
              marginBottom: 26,
            }}
          >
            異世界 × 食文化 × 魔法
          </div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 900,
              fontSize: 132,
              lineHeight: 1.16,
              textShadow: '0 4px 34px rgba(0,0,0,.5)',
            }}
          >
            {titleLine('納豆が異世界', 6)}
            {titleLine('最強魔術って', 16)}
            <div
              style={{
                color: C.pink,
                transform: `scale(${interpolate(stamp, [0, 1], [1.8, 1])}) rotate(${interpolate(stamp, [0, 1], [-6, -2])}deg)`,
                transformOrigin: 'left center',
                opacity: interpolate(stamp, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
                display: 'inline-block',
              }}
            >
              マジですか？！
            </div>
          </div>
          <div
            style={{
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,.7)',
              marginTop: 24,
              opacity: after,
            }}
          >
            NATTO GA ISEKAI SAIKYO MAJUTSU TTE MAJI DESUKA?!
          </div>
          <div
            style={{
              marginTop: 54,
              opacity: after,
              transform: `translateY(${(1 - after) * 14}px)`,
              display: 'flex',
              alignItems: 'baseline',
              gap: 28,
            }}
          >
            <span
              style={{
                fontFamily: sans,
                fontWeight: 900,
                fontSize: 24,
                letterSpacing: '0.2em',
                color: C.ink,
                background: C.gold,
                padding: '8px 18px',
              }}
            >
              EPISODE 00
            </span>
            <span style={{fontFamily: serif, fontWeight: 700, fontSize: 42}}>
              魔王城の朝、落ちてきた三角。
            </span>
          </div>
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            padding: '0 80px 84px',
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,.6)',
            opacity: after,
          }}
        >
          © 2026 NATTO ISEKAI PROJECT
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type Step = {id: string; dur: number; next?: {kind: string; len: number}};

const NODES: Record<string, React.ReactNode> = {
  opening: <Opening />,
  morning: <Shot d={shots.morning} />,
  natto: <Shot d={shots.natto} />,
  magic: <Shot d={shots.magic} />,
  onigiri: <Shot d={shots.onigiri} />,
  lunge: <Shot d={shots.lunge} />,
  eating: <Shot d={shots.eating} />,
  koharu: <Shot d={shots.koharu} />,
  montage: <Montage />,
  tagline: <Tagline />,
  title: <TitleCard />,
};

const steps: Step[] = TL.steps;

const overlap = (s: Step) => (s.next && s.next.kind !== 'cut' ? s.next.len : 0);

export const PV_DURATION = steps.reduce((sum, s) => sum + s.dur - overlap(s), 0);

/** Frame at which each step starts in the final timeline (used to sync sound). */
const START: Record<string, number> = {};
steps.reduce((at, s) => {
  START[s.id] = at;
  return at + s.dur - overlap(s);
}, 0);

/** Music, sound effects and any VOICEPEAK lines, pre-mixed in sync by make-audio.py. */
const Soundtrack: React.FC = () => <Html5Audio src={staticFile('soundtrack.wav')} />;

export const ProloguePV: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <TransitionSeries>
      {steps.flatMap((s, i) => {
        const items = [
          <TransitionSeries.Sequence key={`s${i}`} durationInFrames={s.dur}>
            {NODES[s.id]}
          </TransitionSeries.Sequence>,
        ];
        if (s.next && s.next.kind !== 'cut') {
          items.push(
            <TransitionSeries.Transition
              key={`t${i}`}
              presentation={
                (s.next.kind === 'wipe'
                  ? wipe({direction: 'from-right'})
                  : fade()) as TransitionPresentation<Record<string, unknown>>
              }
              timing={linearTiming({durationInFrames: s.next.len})}
            />,
          );
        }
        return items;
      })}
    </TransitionSeries>
    <FilmLook />
    <Soundtrack />
  </AbsoluteFill>
);
