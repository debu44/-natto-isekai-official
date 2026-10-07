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

`video/voice/` に次の名前で音声ファイルを置き、`npm run assets` → `npm run render` で自動的に入ります。WAV / MP3 / M4A に対応。前後の無音は自動でカットし、話している部分の音量をそろえます。セリフ中はBGMが自動で下がります。

セリフは原文マスター（第零章）から。番号は原文でそのキャラが話す順番です。

| ファイル名 | 場面 | セリフ |
|---|---|---|
| rubina_01 | 朝の食卓 | ルビナ1番目「ワタシ、これ嫌い。くさいもん。ね、リヴィル」 |
| rivil_01 | 朝の食卓（直後） | リヴィル1番目「……うん。くさい」 |
| rubina_03 | 納豆アップ | ルビナ3番目「こんなの食べるよりだったら、倒れた方がマシよ！」 |
| butler_03 | おにぎりに飛びつく | 執事3番目「ルビナ様！」 |
| rubina_14 | 一口食べる | ルビナ14番目「……うまい」 |
| koharu_01 | こはる落下 | こはる1番目「あ、私のおにぎり……って」 |
| koharu_02 | こはる落下（直後） | こはる2番目「……って、ここ、どこ？」 |

ないファイルは飛ばされます。タイミングは `src/timeline.json` の `at`（シーン開始からのフレーム数、30で1秒）か、`after`（前のセリフの直後）で調整できます。
