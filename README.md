# 納豆が異世界最強魔術ってマジですか？！ 公式サイト

GitHub Pages向けの公式作品サイトです。

## デザイン方針

単なる作品紹介ページではなく、訪問者が第零章の事件に入り込む「作品体験型」の構成です。

- キービジュアル主導のファーストビュー
- スクロールに連動した「おにぎり落下」プロローグ
- キャラクターを画面の主役にした大型プロフィール
- 食文化と魔力を整理するWORLDセクション
- EPISODE / SPECIALを後から拡張できる構造
- PC / スマートフォン対応
- `prefers-reduced-motion` 対応

## ファイル

- `index.html` — ページ構造・作品情報
- `styles.css` — レイアウト・レスポンシブ・作品世界のビジュアル
- `script.js` — メニュー、スクロール演出、キャラクター切替
- `assets/` — 正式キャラクター画像・キービジュアル等

## 正式キャラクター画像

以下の透過PNGを `assets/` に置くと自動で表示されます。

- `assets/rubina.png`
- `assets/rivil.png`
- `assets/koharu.png`

未配置の場合はサイトが壊れず、キャラクターカラーのフォールバック表示になります。

推奨仕様：透過PNG / 全身立ち絵 / 余白少なめ / 長辺 1600px 以上。

## GitHub Pages

公開元は `main` ブランチのリポジトリルートを想定しています。

GitHub: Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`

静的HTML/CSS/JavaScriptのみなのでビルド工程は不要です。
