import React from 'react';
import {Composition} from 'remotion';
import {ProloguePV, PV_DURATION} from './ProloguePV';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ProloguePV"
    component={ProloguePV}
    durationInFrames={PV_DURATION}
    fps={30}
    width={1920}
    height={1080}
  />
);
