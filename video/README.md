# PV（Remotion）

プロローグ「魔王城の朝、落ちてきた三角。」の約50秒PVを、React製の動画ツール Remotion で生成するプロジェクトです。

## 作り方

```bash
cd video
npm install
npm run assets   # 背景画像をpublic/へコピー、BGM・効果音・ボイスをミックス、使用文字を収集
npm run studio   # ブラウザでプレビュー・調整
npm run render   # out/natto-isekai-prologue-pv.mp4 を書き出し
```

レンダリング用のChromeを自動ダウンロードできない環境では、手元のheadless shellを指定します。

```bash
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
```

## ファイル

- `src/ProloguePV.tsx` — シーン構成、尺、テロップ、効果音の配置
- `src/components.tsx` — ズーム・パン、テロップ、フラッシュ、フィルム風の質感
- `src/timeline.json` — 各シーンの尺とボイスの差し込み位置。映像と音楽の両方がここを読む
- `make-audio.py` — コミカルなBGMと効果音をシーンに合わせて作曲し、ボイスと1本にミックス（オリジナル音源）
- `scripts-glyphs.mjs` — テロップに使う文字を集めて、日本語フォントを事前読み込みさせる

テロップを変えたら `node scripts-glyphs.mjs` を実行してください。

## ボイス（VOICEPEAKなど）

`video/voice/` に次の名前で音声ファイルを置き、`npm run assets` → `npm run render` で自動的に入ります。WAV / MP3 / M4A に対応。セリフ中はBGMが自動で下がります。

| ファイル名 | 場面 | 話者 | セリフ |
|---|---|---|---|
| opening.wav | オープニング | ナレーション（男性3） | 魔王城の朝、落ちてきた三角。 |
| natto.wav | 納豆アップ | ルビナ（女の子） | くさい。絶対やだもん。 |
| lunge.wav | おにぎりに飛びつく | ルビナ（女の子） | それ、ルビナの！ |
| koharu.wav | こはる落下 | こはる（女性2） | （驚く声） |
| title.wav | タイトル | ルビナ または ナレーション | 納豆が異世界最強魔術ってマジですか！？ |

ないファイルは飛ばされます。差し込むタイミングは `src/timeline.json` の `at`（シーン開始からのフレーム数、30で1秒）で調整できます。
