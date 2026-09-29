# Cloudflare Pay per Crawl／Pay per Use ベータ申込文（送信はオーナー）

2026-09-29 作成。2026-09 時点ではプライベートベータで、申込フォームから送る形式です（個人・日本居住者が対象になるかは未確認）。
**前提:** [03_Cloudflare移行提案.md](03_Cloudflare移行提案.md) の移行が済み、サイトが Cloudflare のプロキシ経由になっていること。
フォームの項目名は変わることがあるので、近い欄に下の文をそのまま貼ってください。英語のフォームなので英文を用意しています。

## よくある項目と記入例

| 項目 | 記入 |
|---|---|
| Name | （オーナーの氏名。本人が入力） |
| Email | （Cloudflare アカウントのメールアドレス） |
| Company / Organization | Engineer Toolbox (engineer-toolbox.jp) — individual publisher |
| Website / Domain | engineer-toolbox.jp |
| Country | Japan |
| Monthly page views | （移行時点の GA4 の月間表示回数。本部が kpi.csv から記入例を用意する） |
| Type of content | Free browser-based calculators and converters for infrastructure/IT engineers and everyday Japanese date/age calculations |
| Interested in | Pay per Crawl, Pay per Use |

## 自由記述欄（Why are you interested? など）

```
Engineer Toolbox (https://engineer-toolbox.jp/) is an independent Japanese site with 80+ free, client-side tools
(subnet/CIDR calculators, cron and systemd timer decoders, certificate and JWT decoders, Japanese era/age
calculators, etc.). Each page documents the underlying standard (RFC numbers, statutes, official docs),
the date the source was checked, and common mistakes, so the pages are frequently useful as grounding
material for AI answers.

We already publish RSL terms (https://engineer-toolbox.jp/license.xml): search and AI answer retrieval are
allowed with attribution, AI training is prohibited. We would like to join the Pay per Crawl / Pay per Use
beta to offer paid access for AI crawlers and agents that use our content in generated answers, while keeping
search indexing free. We are a small publisher and are happy to provide feedback on the setup for
individual sites outside the US.
```

## 送信後

- 返信（承認・保留・不可）が来たら、本部に一言ください。承認なら Cloudflare 側の価格設定（1回あたり $0.001 から）を一緒に決めます。
- 収入が発生した場合、Cloudflare からの支払いは海外からの雑所得（または事業所得）になります。年20万円を超えるかどうかは、他の副業収入と合わせて判断してください。
