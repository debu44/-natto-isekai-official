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

`video/voice/` に音声ファイルを置き、`npm run assets` → `npm run render` で自動的に入ります。WAV / MP3 / M4A に対応。前後の無音は自動でカットし、話している部分の音量をそろえ、セリフ中はBGMを下げます。`maxGap` を付けたセリフは、途中の長い間を詰めます。

音声ファイルは公開リポジトリに入れないため、git管理外です。

現在の割り当て（VOICEPEAK書き出しのルビナ00〜17から選択。ファイル名は `rubina_番号.wav`）:

| ファイル | 場面 | セリフ |
|---|---|---|
| rubina_03 | 朝の食卓 | 朝食の言い合い（「こんなの食べるより…マシよ！」と推定） |
| rubina_00 | 納豆アップ | ワタシ、これ嫌い。くさいもん。ね、リヴィル（画面テロップと一致） |
| rubina_01 | 喧嘩 | 短い言い返し（「うっさい」と推定） |
| rubina_05 | 一口食べる | 「ほぅ！このもちもちとした…」と推定 |
| rubina_15 | モンタージュのRUBINA | 「どうだ」と推定 |

割り当てとタイミングは `src/timeline.json` の `voices` で変えられます。`at` はシーン開始からのフレーム数（30で1秒）、`after` は前のセリフの直後に続けます。
