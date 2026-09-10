# エンジニアの道具箱 (engineer-toolbox)

インフラ・開発の現場で毎日使う計算・変換ツールを、登録なし・広告控えめ・ブラウザ内処理で提供する静的サイトです。

- すべてのツールは JavaScript だけで動き、入力内容はサーバーへ送信されません。
- 各ツールに「仕組み・根拠（RFC / POSIX / 公式ドキュメント）」と「現場の落とし穴」の解説を付けています。

## ビルド

```bash
pip install -r requirements.txt
python site/build.py          # → site/dist/
python site/build.py --check  # 検証のみ
```

ローカル確認: `python -m http.server 8765 --directory site/dist`

## 構成

- `site/tools/<slug>/` — 1ツール = `tool.json` / `body.html` / `script.js` / `guide.md`（仕様は `site/TOOL_SPEC.md`）
- `site/pages/` — 固定ページ（about / privacy）
- `site/templates/base.html`, `site/assets/` — 共通レイアウト・CSS・JS
- `site/config.json` — サイト名・URL・解析/広告 ID

## デプロイ

GitHub Pages: `.github/workflows/pages.yml` が push のたびにビルド・公開します（Settings → Pages → Source: GitHub Actions）。
Cloudflare Pages: ビルドコマンド `python site/build.py`、出力ディレクトリ `site/dist`。

## ライセンス

ツールのソースコードは MIT License。解説文・サイト名・ロゴの権利は運営者に帰属します。
