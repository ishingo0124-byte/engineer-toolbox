# 提案: engineer-toolbox.jp を Cloudflare 経由にする（任意・オーナー判断）

2026-09-29 作成。根拠は `../../お金稼ぎ検討部隊/新規事業候補_v2_資産型_2026-09-29.md` §3 と `調査メモ_2026-09-29/r7_ai_addons.md`。

## 結論

- **やる価値:** AI ボットがどれだけ来ているかが見えるようになり（AI Crawl Control）、将来 Pay per Crawl／Pay per Use が使えるようになった時に、すぐ課金を始められる土台になります。
- **いまの収入への効果:** ほぼゼロです。AI の読み取りにお金を払う企業は、2026年9月時点ではまだごく少数です。
- **費用:** 無料（Cloudflare Free プラン）。
- **リスク:** 設定を1か所間違えると、SSL エラーでサイトが見られなくなります。下の手順どおりなら避けられます。
- **判断:** 急ぎません。AdSense の審査結果が出た後、落ち着いたときで構いません。

## 構成（移行後）

```
閲覧者・AI ボット → Cloudflare（プロキシ・オレンジ雲）→ GitHub Pages（今と同じ）
```

サイトのホスティングは GitHub Pages のままです。Cloudflare は前に立つだけで、ビルドや公開の流れ（git push で自動公開）は変わりません。

## オーナーの作業（約20分）

1. **Cloudflare のアカウントを作る**（https://dash.cloudflare.com/sign-up 、無料）。
2. 「サイトを追加」で `engineer-toolbox.jp` を追加し、**Free プラン**を選ぶ。既存の DNS レコード（A×4 と www の CNAME）が自動で読み込まれるので、内容が下と一致するか確認する。
   | 種類 | 名前 | 値 | プロキシ |
   |---|---|---|---|
   | A | @ | 185.199.108.153 | オン（オレンジ） |
   | A | @ | 185.199.109.153 | オン |
   | A | @ | 185.199.110.153 | オン |
   | A | @ | 185.199.111.153 | オン |
   | CNAME | www | ishingo0124-byte.github.io | オン |
3. Cloudflare が表示する **ネームサーバー2つ** を、お名前.com の「ネームサーバーの設定」で `01〜04.dnsv.jp` から置き換える（反映に最大24〜72時間）。
4. Cloudflare の「SSL/TLS」→ 暗号化モードを **Full** にする。
   - **Flexible にしない**（GitHub Pages の HTTPS 強制とループする）。**Full (strict) も避ける**（GitHub Pages との組み合わせで 525 エラーの事例あり）。
5. 「AI Crawl Control」（または「ボット」→ AI ボット）を開き、次のように設定する。
   - **Search（検索）: 許可**
   - **Agent（ユーザーの代わりに読むエージェント）: 許可**
   - **Training（学習）: ブロック**
   - **注意:** 2026-09-15 から、Cloudflare は「広告のあるページ」に対して Training と Agent を**初期設定でブロック**します。このサイトは AdSense を入れているので、**Agent を手動で「許可」に戻す**必要があります。戻さないと、ChatGPT などが回答のためにページを読めなくなります。
6. 「Pay per Crawl」の項目が表示されていれば、ベータの申込へ（申込文は [04_PayPerCrawl申込文.md](04_PayPerCrawl申込文.md)）。

## 移行後に本部が確認すること（オーナー作業なし）

- [ ] https://engineer-toolbox.jp/ と www、http→https のリダイレクトが正常（curl で 200／301）。
- [ ] `ads.txt`・`license.xml`・`robots.txt`・`sitemap.xml`・Search Console の確認用 HTML が今までどおり返る。
- [ ] **AdSense:** コードが配信され、AdSense の「サイト」画面で ads.txt のステータスが「承認済み」のまま。Cloudflare の「Rocket Loader」「Auto Minify」は **オフ**（広告スクリプトを書き換えて表示されなくなることがあるため）。
- [ ] **Search Console:** 所有権（HTML ファイル方式）が維持されている。URL 検査で「公開 URL をテスト」が成功する。数日後にクロールエラーが増えていない。
- [ ] GitHub Pages の HTTPS 証明書の更新が止まっていない（Cloudflare 経由でも GitHub 側の証明書は更新される。Pages 設定画面で確認）。
- [ ] AI Crawl Control で、AI ボットの種類と量が見えている → `data/kpi.csv` に列を足す。

## 戻し方（問題が出たとき）

お名前.com でネームサーバーを `01.dnsv.jp〜04.dnsv.jp` に戻せば、今の状態に戻ります（DNS レコードはお名前.com 側に残してあるため）。
