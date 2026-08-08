# 納豆が異世界最強魔術ってマジですか？！ 公式サイト試作版

GitHub Pagesでそのまま公開できる、HTML / CSS / JavaScriptのみの静的サイトです。

## ファイル
- `index.html` : ページ本体・文章・各セクション
- `styles.css` : レイアウト、色、レスポンシブ、アニメーション
- `script.js` : スマホメニュー、スクロール表示演出
- `assets/` : 今後キービジュアル・キャラクター画像・サムネイル等を置く場所

## GitHub Pages公開手順
1. GitHubで新しいリポジトリを作成
2. このフォルダの中身をリポジトリ直下へアップロード
3. GitHubの `Settings` → `Pages`
4. `Build and deployment` の Source を `Deploy from a branch`
5. Branchを `main` / `(root)` にして `Save`
6. 数分後に `https://ユーザー名.github.io/リポジトリ名/` で公開

## 画像差し替え
現在は、キャラクター画像・キービジュアルが手元の添付ファイルに存在しないため、CSSで仮ビジュアルを作っています。
完成素材を `assets/` に追加した後、`index.html` 内の `hero-visual` や `character-art` を `<img>` に置き換えます。
