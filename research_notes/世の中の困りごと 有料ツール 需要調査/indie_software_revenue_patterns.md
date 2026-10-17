# 個人・小規模開発者の小さなソフトウェア製品：何が売れ、いくらで、AI時代に何が変わったか（2026年10月時点）

調査日：2026-10-17。全体の注意点を先に書きます。
- 公開されている収益データのほとんどは「自己申告」「Stripe 連携で検証済みだが、登録するかどうかは本人次第」「インストール数などからの推計」のどれかです。**監査済みの母集団データはほぼありません。**
- 成功例（Starter Story、Indie Hackers のインタビュー、X の収益スクショ）は**生存者バイアス**が強いです。下の分布データでも、登録・回答する人は平均より成功している側に寄っていると考えるのが妥当です。
- 古いデータには年を付けています。

---

## 1. 収益分布：$0 の割合、月 $1k 未満、月 $10k 超はどれくらいか

### Takeaway
どのデータでも、**多くの製品は $0 かほぼ $0、中央値は月 $100〜200 前後、月 $10k を超えるのは数%** です。最大規模のデータ（RevenueCat 2026、11.5万アプリ）では、新規アプリのうち2年以内に月 $1k に届くのは 17.3%、月 $10k は 4.6%。公開1年後の月収の中央値は約 $72 でした。

### Cited Findings
**サブスクアプリ（モバイル中心。最大のデータ）**
- RevenueCat「State of Subscription Apps 2026」（対象期間は2025年、11.5万超のアプリ、総収益 $16B 超）。新規アプリが2年以内に**月 $1k に届く割合は 17.3%、月 $10k は 4.6%**。月 $1k に届いたアプリの約75%は $10k に届かない。月 $1k 到達までの中央値は58日（Business カテゴリは113日） — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)
- 同レポート：**公開1年後の月収の中央値は約 $72**。上位25%の下限は $429、上位10%の下限は $2,574。カテゴリ別の中央値は最高が Photo & Video の $124、最低が Travel の $35 — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)
- カテゴリ別：Business は月 $1k 到達 14.7%、月 $10k 到達 1.6%。Photo & Video は 21.4% / 7.3%、Gaming は 20.0% / 8.9% — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)
- 成長は上位に集中。前年比 MRR は上位10%が +306%、上位25%が +80%、中央値が +5.3%、下位25%が −33% — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)／[ContentGrip（2026-03-18）](https://www.contentgrip.com/subscription-app-market-2026-growth/)
- サブスク収益の69%は2020年より前に公開されたアプリが稼いでいる。2025年以降に公開されたアプリの取り分は3% — [ContentGrip（RevenueCat 2026 の引用）](https://www.contentgrip.com/subscription-app-market-2026-growth/)
- 注意：最低インストール数・最低収益に届かないアプリは集計から除外されている。そのため実際の $0 の割合はもっと高い — [RevenueCat（方法論）](https://www.revenuecat.com/state-of-subscription-apps)

**Indie Hackers / Stripe 検証済みデータ（Web SaaS 中心）**
- 2022年の Indie Hackers の分析（Stripe 検証済み 937製品）：**54%超が収益 $0**、月 ~$8,333（年 $100k）を超えるのは約5% — [Changelog による要約](https://changelog.com/news/9llJ)／[Indie Hackers 原文](https://www.indiehackers.com/post/how-much-money-do-indie-hackers-products-make-74db9631f0)
- 単独創業者だけの集計（970製品）：**80.9% が MRR $500 未満**、6.4% が MRR $5,000 超 — [Indie Hackers「Making bank as a solo founder seems to be rare」](https://www.indiehackers.com/post/making-bank-as-a-solo-founder-seems-to-be-rare-3f1ef6ee3e)
- 998製品で集計した IH の別の投稿では「$0 は 48.7%」。投稿の特定と原文の確認はできておらず、検索要約の数字 — [Indie Hackers](https://www.indiehackers.com/post/holy-heck-maybe-this-isnt-that-hard-f8b4e64536)（要原文確認）
- IH のコメント欄でも「成功するほど数字を公開するリスクが増える」「IH に登録するのは特定の層だけ」と、選択バイアスが指摘されている — [Indie Hackers](https://www.indiehackers.com/post/how-much-money-do-indie-hackers-products-make-74db9631f0)
- TrustMRR（Stripe 連携で MRR を公開するサイト）の 5,079製品を分析した投稿：**半数は月 $169 未満** — [Indie Hackers「I analyzed 5,079 Stripe-verified startups」](https://www.indiehackers.com/post/i-analyzed-5-079-stripe-verified-startups-f0f6bd053f)（403 で本文は取得できず、検索スニペットのみ）
- TrustMRR を運営する BigIdeasDB の2026-07-08 付レポート：8,699社で**MRR の中央値は $145**。カテゴリ別の中央値は Productivity の約 $45 から Sales の約 $640 まで。AI カテゴリ（941社）は $200。同社の別ページには「3,478社で $136」「中央値 $7」と矛盾する数字もある。**運営元自身の資料で、独立した検証はない** — [BigIdeasDB](https://bigideasdb.com/saas-revenue-benchmarks-by-category-2026)

**MicroConf「State of Independent SaaS 2024」（既に軌道に乗った bootstrapped SaaS が中心）**
- 回答は約700件、収集は2023年後半。**MRR $1,000 未満が 17.7% で最大の層**（母集団が既に売上のある SaaS 創業者なので、分布は IH より上に寄る） — [MicroConf](https://microconf.com/saas-this-year)（検索要約経由。全区分の表は stateofindiesaas.com の原本にある）
- 約30%が月 1〜4% の成長、さらに約30%が横ばいか縮小 — [MicroConf](https://microconf.com/saas-this-year)（検索要約経由）
- 約70%が単独創業者（司会者も確信はないと発言）。前月比の平均成長は約17% — [Startups For the Rest of Us ep.721（2024-07-09）](https://www.startupsfortherestofus.com/episodes/episode-721-7-key-takeaways-from-the-2024-state-of-independent-saas-report)
- 顧客層別の平均成長（前月比）：Enterprise 約26%、SMB 約12%、Consumer 約5%、Government 約1.75% — [同上](https://www.startupsfortherestofus.com/episodes/episode-721-7-key-takeaways-from-the-2024-state-of-independent-saas-report)

**デジタル商品（Gumroad）**
- 2020年（Gumroad の公表データに基づく）：4.6万人のクリエイターで計 $142M。**年 $1,000 以上を稼いだのは 7,945人（約17%）** — [Silicon Florist（2021-01-12）](https://siliconflorist.com/2021/01/12/what-happened-in-the-gumroad-creator-community-in-2020/)
- InsightRaider の2026年データ（146,271商品、2026-10-05 更新、価格×販売数の推計）：販売数を推計できたのは 12,952商品（8.9%）。そのうち上位130商品が推計収益の 77.3% を占める。**Software Development カテゴリが総額 $65.8M（約32%）で最大、1商品あたりの平均は $60,814、平均価格は $39.95** — [InsightRaider](https://insightraider.com/fr/data/gumroad-statistics-2026)
- 同社の別ページは「44% の商品は生涯収益 $0」「上位1%が収益の99.5%」と書いているが、上のデータページではこの数字を確認できなかった（データページには「販売データの欠落は $0 の証拠ではない」とある）。**扱いは要注意** — [InsightRaider（Notion テンプレの回答ページ）](https://insightraider.com/en/answers/how-much-can-you-make-selling-notion-templates-on-gumroad)

### Inferences
- データ源ごとに「$0 の割合」は 約50%（IH）〜不明（RevenueCat は除外）まで幅があります。それでも**「中央値は月 $100〜200、月 $1k は上位2割弱、月 $10k は上位5%前後」という形はほぼ一致**しています。新しい有料ツールの計画は、中央値の月 $72〜$169 を基準に立てるのが現実的です。
- MicroConf の母集団（既に売上のある SaaS）でも、約6割は低成長か停滞です。月 $1k を超えた後の伸びも保証されません。
- ツール工房の CLAUDE.md にある「段1単体では月100万に届かない」「数字は盛らない」という見通しは、これらのデータと矛盾しません。段2（有料版）も、中央値で見れば月1万円前後が出発点です。

### Gaps
- Baremetrics / ChartMogul / Paddle / Stripe Atlas の「小規模 SaaS の収益分布」を直接示す2025〜2026年の公開データは見つかりませんでした（ChartMogul は SaaS 全体の成長ベンチマークが中心で、個人開発の分布ではない）。
- MicroConf 2024 の全区分の表（MRR $1k〜$10k、$10k 超の割合など）は原本でしか確認できず、未取得です。2025〜2026年版が出ているかも確認できませんでした。
- 「失敗率」（作ったが $0 のまま撤退した割合）を時系列で追った研究は見つかりませんでした。IH の $0 が約50% というのが、最も近い代理指標です。

---

## 2. ソロ開発者に向くカテゴリ：手間が少なく収益の証拠があるのはどれか

### Takeaway
**カテゴリ別の比較に耐える集計データはほとんどありません。** あるのは (a) RevenueCat のカテゴリ別の到達率、(b) MicroConf の「B2B／SMB は Consumer より伸びる」、(c) Gumroad で開発者向けソフトの単価と総額が高いこと、の3つです。拡張機能・Sheets アドオン・Mac ユーティリティ・Notion テンプレについては、個別の成功例（生存者バイアスあり）しか見つかりませんでした。

### Cited Findings
- **B2B は伸びやすい**：bootstrapped SaaS の平均成長（前月比）は Enterprise 約26%、SMB 約12%、Consumer 約5%。下位は aspiring entrepreneurs・education・consumer・government — [Startups For the Rest of Us ep.721（MicroConf 2024）](https://www.startupsfortherestofus.com/episodes/episode-721-7-key-takeaways-from-the-2024-state-of-independent-saas-report)
- **モバイルの Business カテゴリ**：月 $1k 到達 14.7%（全体は 17.3%）、月 $10k 到達 1.6%（全体は 4.6%）、月 $1k までの中央値113日（全体は58日）。到達は遅いが、download→paid は 2.6% で全体の 2.0% より高い — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)
- **開発者向けのデジタル商品**：Gumroad の推計では Software Development カテゴリが総額・1商品あたり平均（$60,814）・平均価格（$39.95）のいずれも最大 — [InsightRaider（2026-10）](https://insightraider.com/fr/data/gumroad-statistics-2026)
- **TrustMRR のカテゴリ別中央値**：Productivity 約 $45 が最低、Sales 約 $640 が最高。Content Creation は中央値 $125 だが、1社の $3.5M MRR に引っ張られて平均は $22,515（運営元の資料） — [BigIdeasDB（2026-07-08）](https://bigideasdb.com/saas-revenue-benchmarks-by-category-2026)
- **Google Sheets / Workspace アドオンの個別例（自己申告）**：家計簿用 Sheets 拡張の BudgetSheet が MRR $1.6k — [Indie Hackers](https://www.indiehackers.com/post/how-i-built-a-google-sheets-extension-making-1-6k-mrr-b42d845e6a)。Notion→Sheets 同期の Sync2Sheets が MRR $9k・有料顧客400超（2024年5月） — [Starter Story](https://www.starterstory.com/stories/sync2sheets-give-notion-the-superpowers-of-google-sheets)
- **Notion テンプレ**：Thomas Frank のテンプレ2つが2022年までに $1M、Easlo が $50万超という話は自己申告か又聞き。月 $1,000〜3,000 という「典型」の数字も販売ツール企業のブログ発で、監査されていない — [Kajabi](https://kajabi.com/blog/can-you-make-money-selling-notion-templates)
- **Mac メニューバー系**：$19 の買い切りで出した開発者の HN 投稿に対し、「iStat Menus は $11.99」と相場の安さを指摘するコメント（販売数は不明） — [HN](https://hn.svelte.dev/item/42482286)。Setapp 自身のガイドは、専門ユーティリティには買い切りが今も有効だが収益の予測性は低い、としている（宣伝色あり） — [Setapp](https://setapp.com/app-reviews/app-monetisation-strategies)
- **ブラウザ拡張**：収益を検証済みの拡張112本の分析で、57.1% が $0、月 $1,000 超は 6.3%、平均は月約 $295（サンプルが小さく、関連サービスの販売元の資料） — [BigIdeasDB](https://bigideasdb.com/how-to-monetize-a-chrome-extension)（429 で本文は取得できず、検索要約のみ）

### Inferences
- 証拠の強さで並べると、①B2B／SMB 向け（MicroConf の成長データ）、②開発者向けソフト・テンプレのデジタル販売（Gumroad の単価・総額）、③既存プラットフォーム上のアドオン（Sheets や Notion 連携。個別例のみ）、の順で「売れた証拠」があります。PDF 変換・汎用の計算機・汎用コンバーターは、無料の代替が多すぎて有料の証拠が見つかりませんでした。これは無料＋広告の段1向きで、段2の有料品には向かないと読めます。
- 「特定の職業向けの計算機」は、Business カテゴリと同じく到達は遅くても転換率が高い側に入ると推測します。ただし直接のデータはありません。
- 手間（サポート負荷）とカテゴリの関係を測ったデータは見つかりませんでした。「完全クライアントサイド＝サーバー費・個人情報の管理なし」は、ツール工房の構造上の利点として残ります。

### Gaps
- Excel アドイン（Microsoft AppSource）、Atlassian Marketplace、Figma Community の有料プラグインについて、収益分布の公開データは見つかりませんでした。
- データスクレイパー／エクスポーター、PDF 変換の有料版の収益データも見つかりませんでした。
- 「サポート時間あたりの収益」でカテゴリを比べたデータはありません。

---

## 3. マーケットプレイス／プラットフォームのアドオン：収益・手数料・発見されやすさ

### Takeaway
ストア内検索という**集客上の利点はあるものの、どのストアでも大半は無名のまま**です。Shopify は51%がレビュー0件で、推計収益の約72%を上位1%が取ります。Chrome は約70%が利用者100人未満で、有料対応は4.7%にとどまり、その86%が買い切りです。手数料は Shopify が初年度 $1M まで0%、Apple は小規模事業者で15%。

### Cited Findings
**Shopify App Store**
- 2026年6月の推計（RevenueHunt。課金データではなくモデル推計）：公開アプリ 22,546本、直近12か月で6,000本超を追加（全体の約4分の1）。**レビュー0件が51%、10件未満が81%**。推計収益の**約72%を上位1%（225本）**、約30%を上位10本が占める。何らかの収益があるように見えるのは約36%。最も多い入口価格（中央値も同じ）は **$9.99**。初めから課金するのは4.5%、恒久無料プランがあるのは44.8%。「Built for Shopify」バッジ付きは6.7% — [RevenueHunt「State of the Shopify App Economy」](https://revenuehunt.com/state-of-the-shopify-app-economy/)
- 最も競合が多いのは配送・フルフィルメント（3,841本、うち手応えがあるのは28%） — [RevenueHunt](https://revenuehunt.com/state-of-the-shopify-app-economy/)
- 2021年の推計（2,265開発者）：**$1k 未満が54.53%**、$1k〜10k が約28%、$10k〜50k が約11%、$100k 超が約4%（収益の期間単位とモデルの前提は推計値） — [Spur-i-t（2021）](https://spur-i-t.com/blog/shopify-app-store-analysis-2021/)
- 手数料：既定は20%。登録した開発者は年間総収益の最初の $1,000,000 まで0%、それを超えると15%。年 $20M 以上の開発者は免除の対象外 — [Shopify.dev「Revenue share」](https://shopify.dev/apps/store/revenue-share)（条件は改定されることがあるので、利用前に原文で確認が必要）

**Chrome Web Store**
- 拡張機能は 137,345本（テーマを含めると 176,608）。**約70%が利用者100人未満で、全インストールの0.1%未満**。インストール数の中央値は17。100万人超は337本。**何らかの課金に対応しているのは4.7%で、その約86%が買い切り**、サブスクは約8% — [DebugBear](https://debugbear.com/blog/counting-chrome-extensions)（初出2020-06。2026-08 に更新表記があるが、データは2020年5月収集）
- 有料拡張は全体の8.9%で、インストールでは2.6%。有料拡張 16,718本のうち 5,885本（約35%）は利用者0人 — [I-Programmer](https://i-programmer.info/news/81/13013.html)（2019年前後の古いデータ）
- 決済代行 ExtensionPay の公表は自社顧客の累計（「開発者が累計 $25,000 を稼いだ」など）で、規模は小さい — [ExtensionPay（IH）](https://www.indiehackers.com/product/extensionpay/25000-payments-in-browser-extensions--MvJwDXPIrwfoFTC2Az4)
- 個人開発者が拡張5本で計測した無料→有料の転換は0.8%（本人はこのカテゴリでは0.5〜2%が現実的と見ている。1人の事例） — [DEV Community](https://dev.to/_350df62777eb55e1/real-numbers-freemium-chrome-extension-monetization-after-6-months-5hga)
- Chrome のスパムポリシー（2020年4月）：同じ機能の拡張を複数出すこと、誤解を招くメタデータ、匿名の推薦文を禁止 — [Chromium Blog](https://blog.chromium.org/2020/04/keeping-spam-off-chrome-web-store.html)

**Apple App Store**
- 手数料は標準30%、小規模事業者は15%。年会費 $99 — [Business Model Analyst（2026-07-21）](https://businessmodelanalyst.com/ai-vibecoding-app-store-flood/)

**Notion / Gumroad**
- Notion マーケットプレイスの手数料は「10%＋$0.40／取引」。ただし出典は第三者のヘルプページで、Notion 公式では確認できていない — [carterlab](https://carterlab.info/help/selling-on-marketplace)

### Inferences
- ストアは「載せれば検索で見つかる」場所であり続けています。ただ、Shopify の51%がレビュー0件、Chrome の70%が利用者100人未満という数字を見ると、**ストア内の発見性は上位数%にしか効いていません**。
- Shopify の $9.99 という入口価格と、Chrome の86%が買い切りという点が、小さなツールの価格の相場を示しています。
- Shopify は手数料の条件が個人には有利（最初の $1M まで0%）です。ただし直近1年でアプリが約4分の1増えており、AI による参入増と整合します（因果は示されていません）。

### Gaps
- Google Workspace Marketplace、Atlassian Marketplace、Figma について、手数料以外の収益分布データは見つかりませんでした（Google は収益データを公開していない）。
- Chrome Web Store の2025〜2026年のポリシー変更や、AI 製の量産拡張への取り締まりについて、一次情報は見つかりませんでした（検索で出たのは2020年の告知だけ）。
- Chrome の拡張数を2026年時点で数え直したデータは見つかりませんでした。

---

## 4. AI時代（2025〜2026）の変化：供給の洪水、獲得の難化、取り締まり、何が守れるか

### Takeaway
**供給は数倍に増えたのに、需要（ダウンロード数・注目される件数）はほぼ横ばい**です。つまり1製品あたりの成功確率は下がっています。App Store の新規リリースは2026年上半期だけで2025年通年に迫りましたが、ダウンロードは+2%。Show HN の投稿は6.3倍、20点以上を取る投稿は1.6倍。識者の意見は「コードは堀にならない。残るのは流通・データ・信頼・業界の深い知識」でほぼ一致しています（ただし意見記事が中心）。

### Cited Findings
**供給の洪水（データ）**
- App Store の新規リリースは2025年に約60万本（+30%）、2026年上半期だけで約56万本。この調子なら年100万本を超え、2016年のピーク（約89万本）を上回る。一方、**ダウンロード数は2025年が+3%、2026年上半期が+2%** にとどまる（Sensor Tower の推計、NYT の報道に基づく） — [Business Model Analyst（2026-07-21）](https://businessmodelanalyst.com/ai-vibecoding-app-store-flood/)／[9to5Mac（2026-07-20）](https://9to5mac.com/2026/07/20/report-app-store-added-nearly-as-many-new-apps-in-h1-2026-as-in-all-of-2025/)
- 2026年第1四半期の新規申請は前年同期比+84%（約23.6万本） — [9to5Mac（2026-04-06）](https://9to5mac.com/2026/04/06/app-store-sees-84-surge-in-new-apps-as-ai-coding-tools-take-off/)。2025年の新規申請を557,000本とする報道もあり、上の60万本とは数字が合わない — [TheNextWeb（2026-04-05）](https://thenextweb.com/news/vibe-coding-apple-app-store-surge-crackdown)
- 新しいサブスクアプリの公開数は、2022年1月の約2,000本/月から2026年1月の14,700本超/月へ（約7倍） — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)
- Show HN の月間投稿は ChatGPT 公開時の約0.9千件から2026年2月の5.8千件へ（6.3倍）。**20点以上を取った投稿は128件から211件（1.6倍）だけ**。2026年7月には Show HN が URL 投稿の13.5%を占めた（原典は orangecrumbs.com の分析） — [Zeli（2026-09-15）](https://zeli.app/story/49712005)
- HN のモデレーターが新規アカウントの Show HN 投稿を制限したという報告もある（二次情報） — [feedbagel](https://feedbagel.com/post/analysis-of-ai-generated-project-proliferation-in-hacker-news-show-hn-submission)
- Shopify App Store は直近12か月で6,000本超を追加（全体の約4分の1） — [RevenueHunt（2026-06）](https://revenuehunt.com/state-of-the-shopify-app-economy/)

**プラットフォーム側の動き**
- Apple は Guideline 2.5.2（審査後に機能を変えるコードのダウンロードや実行の禁止）を根拠に、2026年3月中旬に Replit や Vibecode などのアップデートを止めた。Anything は2025年12月からアップデートが止まり、2026-03-30 に削除された。Apple の立場は「狙っているのは審査後に挙動を変えるアプリで、vibe coding 全般ではない」 — [TheNextWeb（2026-04-05）](https://thenextweb.com/news/vibe-coding-apple-app-store-surge-crackdown)
- 審査期間：開発者側は「24〜48時間だったのが7〜30日以上に延びた（2026年3月）」と言い、Apple は「申請の90%を48時間以内に審査、平均1.5日」と説明している。**両者は食い違う** — [TheNextWeb](https://thenextweb.com/news/vibe-coding-apple-app-store-surge-crackdown)／[Business Model Analyst](https://businessmodelanalyst.com/ai-vibecoding-app-store-flood/)
- 新しいアプリの多くは単機能で、課金ではなく広告で稼ぐ形 — [Business Model Analyst](https://businessmodelanalyst.com/ai-vibecoding-app-store-flood/)

**AI で作った製品の成功例（金額を公開しているもの。生存者バイアスに注意）**
- fly.pieter.com（Pieter Levels）：2025年2月に Cursor で約3時間で作ったブラウザ用フライトシム。広告枠と $29.99 の機体課金で、17日目に MRR $87k（年換算 $1M）と本人が投稿した。**2026年半ばの本人の X プロフィールでは「$0/m」**。買い切りと広告枠は更新されないので、話題が冷めると収益も消えた。成功の要因は、10年かけて築いた本人のフォロワーと信頼だった、と記事は分析している — [DEV Community](https://dev.to/promptway/he-built-a-flight-simulator-in-three-hours-and-hit-1m-a-year-in-17-days-then-it-went-to-zero-1b1l)。広告収入を月 $5,000 前後とする報道もあり、時期によって数字が違う — [AvGeekery](https://avgeekery.com/?p=39779)
- Stampa（Marco Pérez）：約1週間で開発、約2万ダウンロード、利益は約 $3,000（期間は不明） — [Business Model Analyst](https://businessmodelanalyst.com/ai-vibecoding-app-store-flood/)
- 個人開発者ではなく作る道具の側の売上：Cursor は年換算 $2B 超（2026年3月）、Lovable は年換算 $200M（2025年末）、Replit は2025年の売上 $240M。**AI ブームで最も確かに稼いでいるのは「ツルハシ売り」** — [TheNextWeb](https://thenextweb.com/news/vibe-coding-apple-app-store-surge-crackdown)

**AI アプリの収益特性**
- AI アプリは支払いユーザー1人あたりの収益が約41%高く、解約は約30%速い — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)／[PPC Land](https://ppc.land/ai-apps-earn-41-more-per-user-but-churn-30-faster-revenuecat-finds/)

**何が守れるか（識者・実務家の意見。データではない）**
- 多くのカテゴリは「Cursor で週末にクローンできる」。問題は「3か月後に7つあるクローンではなく、なぜあなたのを買うのか」になる。残る堀は、真似できない流通（ブランド・コミュニティ・営業関係）、データのネットワーク効果、規制業界のワークフロー、SOC 2 や HIPAA のような取得に1年かかる信頼の証明 — [DEV Community「People Are Vibe-Coding Clones of Every Paid App」](https://dev.to/james_anderson_h/people-are-vibe-coding-clones-of-every-paid-app-what-actually-survives-38ak)／[guptadeepak.com](https://guptadeepak.com/hard-truths-about-saas-in-2026/)
- 10のワークフローに組み込まれ、1年分のユーザーデータを抱えたツールの乗り換えコストは、週末クローンにはない — [LaunchIt](https://launchit.fast/blog/can-i-vibecode-it-review)
- 制約はもう「作ること」ではなく「流通」に移った。「CAC は2021〜2026年に60%上がった」「ソロ起業家の99%が集客を最大の課題に挙げる」という数字も出てくるが、ベンダーブログ発で**検証されていない** — [Vibecom](https://www.vibecom.app/blog/the-vibe-coders-distribution-problem-how-the-bottleneck-shifted-in-2026)
- 意見が割れている点：「見つけたニッチは数か月で AI 製の競合に埋まる」と「だからこそソロは業界特化に向かう（特化のコストが下がった）」の両論がある — [guptadeepak.com](https://guptadeepak.com/hard-truths-about-saas-in-2026/)／[Techwrix](https://www.techwrix.com/why-vibe-coding-is-reshaping-solo-saas-development-in-2026/)

### Inferences
- **母数は増えたのに成功の数はほぼ変わらない**、というのがデータから言える最も確かな変化です。Show HN（投稿6.3倍、注目1.6倍）と App Store（リリース約2倍、ダウンロード+2%）は同じ形をしています。「作れば見つけてもらえる」確率は数分の1に落ちたと見るべきです。
- RevenueCat の「収益の69%は2020年以前のアプリ、2025年以降は3%」は、**先に場所を取った製品が強い**ことを示しています。新規参入は、既存製品が手を出していない狭い需要か、自前の集客路を持つ場合に限って勝ち目があります。
- コモディティ化した側（推測を含む）：単機能の汎用ユーティリティ、汎用の変換・計算機、AI API の薄いラッパー、テンプレ的な SaaS のクローン。どれも数日で複製できて、無料の代替も多いものです。
- 価値が残る側：①**自前の集客**（検索流入・メールリスト・フォロワー）。ツール工房の段1のアクセスがまさにこれ。②**業界・地域固有の知識**（日本の法令・和暦・税・業務慣行など、正確さに根拠が要るもの）。③**信頼**（データを送らない・広告詐欺がない・出典が明記されている）。④**蓄積するデータや組み込み**（ユーザーの設定・履歴・ワークフロー連携）。
- fly.pieter.com の例は「AI で作れば当たる」話ではありません。「**集客力のある人なら、AI で作る速さが効く**」という話です。一度きりの収益は残らない、という教訓も付いています。

### Gaps
- Chrome Web Store、Google Play、Shopify での「AI 製の量産品」の件数や削除件数について、一次データは見つかりませんでした。
- 個人開発者の CAC（顧客獲得コスト）の上昇を測ったデータは見つかりませんでした（「+60%」は未検証）。
- 「主に AI エージェントで作った」製品で、監査済みまたは Stripe 検証済みの収益を、継続的に（スパイクではなく）公開している例は、まとまった形では見つかりませんでした。TrustMRR の AI タグ付き1,213社の「平均成長 99.9%」は、外れ値に引っ張られた平均で、運営元の資料です — [BigIdeasDB](https://bigideasdb.com/micro-saas-trends-2026)
- 価格の崩壊（同じ機能の相場が下がったか）を時系列で示すデータは見つかりませんでした。

---

## 5. 価格設定：買い切りかサブスクか、無料→有料の転換率、返金率

### Takeaway
小さなツールの現場は**買い切りが主流**です（Chrome の有料拡張の86%）。一方、モバイルではサブスクが基本で、**約4分の1が「サブスク＋買い切り（lifetime）」の併用**です。転換率はハードペイウォール（無料では使えない）が 10.7% に対してフリーミアムが 2.1%（RevenueCat、モバイル）。SaaS のフリーミアムは 3〜5% が典型。返金率は、ソフト単体のデータが乏しく、ゲーム（Steam）で平均10.8%です。

### Cited Findings
**価格の水準**
- モバイルのサブスク価格の中央値：週 $5.99、年 $34.80（前年 $31.60）、年額で最も多い価格は $30。月額の中央値は $10 とする記述と $7→$8 とする図があり、レポート内で食い違う — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)
- Shopify アプリで最も多い入口価格は $9.99 — [RevenueHunt（2026-06）](https://revenuehunt.com/state-of-the-shopify-app-economy/)
- Gumroad の Software Development カテゴリの平均価格は $39.95 — [InsightRaider（2026-10）](https://insightraider.com/fr/data/gumroad-statistics-2026)
- Mac メニューバーアプリの例：$19 の買い切り（反応は「高い」）、iStat Menus は $11.99 — [HN](https://hn.svelte.dev/item/42482286)

**買い切りかサブスクか**
- Chrome の有料拡張：買い切り約86%、アプリ内課金6.3%、サブスク約8%（2020年のデータ） — [DebugBear](https://debugbear.com/blog/counting-chrome-extensions)
- モバイルの収益モデル：サブスクだけが63.5%、サブスク＋lifetime が23.2%、＋消耗型が10.7%、3つすべてが2.5% — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)
- 買い切りと広告枠は更新されないので、話題が冷めると $0 になる（fly.pieter.com）。Levels 本人は Photo AI について「最初から月 $10 以上を取る」と言っている — [DEV Community](https://dev.to/promptway/he-built-a-flight-simulator-in-three-hours-and-hit-1m-a-year-in-17-days-then-it-went-to-zero-1b1l)
- Setapp（Mac アプリのサブスク束）は「使うアプリが多い会員ほど、1開発者あたりの取り分が減る」と批判されている — [MacStories](https://www.macstories.net/news/mac-app-subscription-service-setapp-goes-live/)

**転換率**
- モバイル（35日目の download→paid）：中央値2.0%。**ハードペイウォール10.7%（上位25%は20%超）、フリーミアム2.1%**。高価格帯2.8%、中価格帯2.0%、低価格帯1.4%。北米2.8%、インド・東南アジア0.7% — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)
- トライアル→有料：17〜32日のトライアルが42.5%、5〜9日が37.4%、4日以下が25.5%。3日トライアルの解約の55.4%は初日に起きる — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)
- SaaS のフリーミアム：self-serve で3〜5%が典型、上位は6〜8%。トライアルは良好で8〜12%、優秀で15〜25% — [Crazy Egg](https://www.crazyegg.com/blog/free-to-paid-conversion-rate/)。2026年の200製品調査（ChartMogul・Growth Unhinged・ProductLed）では中央値8%、25%は2.5%未満、という要約もある（原典は未確認） — [Crazy Egg](https://www.crazyegg.com/blog/free-to-paid-conversion-rate/)
- bootstrapped SaaS（MicroConf 2024）：トライアルでカード登録を必須にしているのは71%。成長は「カード必須トライアル」が約14%で最高、churn は「無料プラン」が約11%で最悪、LTV は「カード不要トライアル」が約 $6,500 で最高（フリーミアムは約 $3,000） — [Startups For the Rest of Us ep.721](https://www.startupsfortherestofus.com/episodes/episode-721-7-key-takeaways-from-the-2024-state-of-independent-saas-report)
- Chrome 拡張のフリーミアム転換は0.8%（1人の開発者の5本） — [DEV Community](https://dev.to/_350df62777eb55e1/real-numbers-freemium-chrome-extension-monetization-after-6-months-5hga)

**返金・課金失敗**
- Steam ゲームの返金率（2024年、150超の開発者の調査）：平均10.8%、中央値9.5%（本数ベース） — [GameDiscoverCo](https://gamedevreports.substack.com/p/gamediscoverco-steam-refunds-research)
- デジタル商品・ソフトの返金率は8〜15%が多いとする業界目安（ベンダーの用語集なので参考程度） — [trendtrack.io](https://www.trendtrack.io/glossary/refund-rate)
- Google Play の解約の約31%は課金失敗による非自発的なもの（App Store は14%） — [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)

### Inferences
- 無料ツールに広告を載せる段1から段2に進むなら、「無料版で需要を確かめ、**有料版は機能を区切って最初から課金する**（ハードペイウォールに近い Pro 版）」のほうが、ゆるいフリーミアムより転換率が5倍前後高い、というのがモバイルのデータの示すところです。ただし Web ツールに同じ倍率が当てはまるかは未検証です。
- 小さなユーティリティは買い切り（$10〜40）が相場として受け入れられています。ただ、売上が続かず一度で終わりやすいです。買い切りなら「毎年の更新版」や「新しいツールの追加」で、リピート購入の流れを作る必要があります。
- 購買力の差が大きい（北米2.8%、インド・東南アジア0.7%）ので、日本語市場は「英語圏よりは小さいが、新興国よりは払う」位置づけになると推測します（日本単独のデータはありません）。

### Gaps
- Web ツール・ブラウザ拡張の買い切りとサブスクを、同じ条件で比べたデータはありません。
- 自前の決済（Stripe／Paddle／Lemon Squeezy）で売るソフトの返金率・チャージバック率について、公開ベンチマークは見つかりませんでした。
- フリーミアムの「2026年の200製品調査」の原典は確認できていません。

---

## 6. 日本固有の情報（個人開発の収益公開）

### Takeaway
日本の個人開発者の**収益分布を集計した調査は見つかりませんでした**。見つかったのは個別の収益報告と解説記事です。共通するのは、①何年も $0 に近い期間を経て伸びる、②広告よりサブスク、③作るより届けるほうが難しい、④売却（M&A）で出口を作れるが、届くのは一握り、の4点です。

### Cited Findings
- Qiita の「個人開発での売上が初任給を超えた話」（@nakapon9517、2025-09-24）：約8年かけて月20万円超。グラフでは2017〜2021年が¥0、その後 ¥30（2022）→ ¥1,000（2023）→ ¥40,000（2024）→ ¥200,000（2025）。方針は「自分が使うものを作る・最小機能で1か月以内にリリース・広告ではなくサブスク・事前に市場を調べる」。1年かけた SNS 型アプリは維持費だけがかかり、収益なしで閉じた — [Qiita](https://qiita.com/nakapon9517/items/14bf412fe169824cc824)
- 入江慎吾氏（2026-03-29）：40本以上を作って、売却まで至ったのは「ほんの一握り」。月12万円規模のサービスが数百万円で売れ、MENTA は「億単位」で売れた。売却は打診から引き渡しまで数週間〜数か月。倍率の具体的な数字は書かれていない — [入江慎吾ブログ](https://devtools.shingoirie.com/blog/indie-dev-app-sell-exit-strategy/)
- Zenn の記事（2023年向け）：広告とサブスクを合わせて月2,500円の現状から、1年で月2万円を目指す計画 — [Zenn](https://zenn.dev/ataka/articles/6fa9526c194cc1)
- マネーフォワードの解説（2026-01-27 更新）：個人アプリ開発で「月5万円程度は現実的に可能」と書く一方、競合の多さで収益化のハードルは高いとしている — [マネーフォワード クラウド](https://biz.moneyforward.com/tax_return/basic/81242/)
- Apple 日本の発表（2026年6月）：App Store のエコシステムは1.4兆ドル規模（見出し）。これには App Store が仲介した物販・サービスの取引が含まれ、開発者のアプリ収益そのものではない点に注意 — [Apple Newsroom（日本）](https://www.apple.com/jp/newsroom/2026/06/app-store-ecosystem-reaches-1-point-4-trillion-usd-as-developers-thrive-globally/)

### Inferences
- 日本でも、「月5万円」「月20万円」の報告には数年分の助走があります。月1〜5万円を目標にするなら、1本で当てるより「数を出して、当たったものに寄せる」のが報告の共通パターンです。これはツール工房の「段1で需要を測り、段2で有料化する」順序と同じ考え方です。
- 日本語圏は英語圏より市場が小さいぶん、AI 製の量産品の流入も（今のところ）英語ほど多くないと推測します。ただしデータはありません。日本の制度や慣行に依存する計算・変換（和暦・税・社会保険・法定の書式など）は、海外勢が参入しにくく、根拠の正確さが差になるという意味で守りやすい側です。

### Gaps
- 個人開発者の収益分布を日本語で集計した調査（アンケート）は見つかりませんでした。
- note・Zenn・BOOTH でのデジタル商品（テンプレ・技術書）の売上分布も見つかりませんでした。
- 日本語の Chrome 拡張や Web ツールの有料版の収益を公開した例は、今回の検索では見つかりませんでした。
