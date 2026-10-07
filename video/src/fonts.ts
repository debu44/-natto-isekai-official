import '@fontsource/noto-serif-jp/700.css';
import '@fontsource/noto-serif-jp/900.css';
import '@fontsource/noto-sans-jp/700.css';
import '@fontsource/noto-sans-jp/900.css';
import {continueRender, delayRender} from 'remotion';
import {GLYPHS} from './glyphs';

export const serif = '"Noto Serif JP", serif';
export const sans = '"Noto Sans JP", sans-serif';

// Japanese fonts are split by unicode-range. Load every subset the video uses
// up front so no frame renders with a fallback font.
if (typeof document !== 'undefined') {
  const handle = delayRender('Loading Noto JP fonts');
  const loads = ['"Noto Serif JP"', '"Noto Sans JP"'].flatMap((fam) =>
    ['700', '900'].map((w) => document.fonts.load(`${w} 40px ${fam}`, GLYPHS)),
  );
  Promise.all(loads)
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}
