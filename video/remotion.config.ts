import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null); // e.g. /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
