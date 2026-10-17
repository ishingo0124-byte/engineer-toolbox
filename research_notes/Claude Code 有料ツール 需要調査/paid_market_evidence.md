# Claude Code 関連の有料商品は何が・いくらで・どれだけ売れているか（2026年10月17日時点）

調査日: 2026-10-17。数字の取り方は次のとおり。

- **note**: note の公開 API `https://note.com/api/v3/hashtags/ClaudeCode/notes?order=popular&paid_only=true`（人気順・有料のみ、10ページ＝497本）と、同じ API の新着順（300本、2026-10-14〜10-17 公開分）、`#クロードコード` 人気順（145本）を当日取得し、スクリプトで集計した。note は購入者数を公開しないため、**「スキ」は購入数ではない**（無料部分だけ読んだ人も押せる）。購入数は著者がタイトルに書いた「○部突破」だけが手がかりで、これは自己申告。
- **Zenn**: 公開 API `https://zenn.dev/api/books?topicname=claudecode` を当日全件取得（255冊）。Zenn も販売数は非公開で、like 数は購入数ではない。
- **BOOTH**: 検索ページ `https://booth.pm/ja/search/Claude%20Code?sort=wish_lists` と各商品の `.json`（スキ＝wish_lists_count）を当日取得。BOOTH も販売数は非公開。
- **Brain**: 商品ページに埋め込まれたデータ（`sales_histories_count`、評価、アフィリエイト率）を当日取得。Brain は販売数を公開している唯一の国内プラットフォームだった。
- **Gumroad**: 検索 API `https://gumroad.com/products/search?query=claude%20code`（3つの並び順×5ページ、112件）を当日取得。販売数は非公開で、評価件数（ratings count）だけが見える。評価件数は購入数の下限。
- 「推定」と書いたものは私の推定で、出典の数字ではない。

---

## Q1. note: どの Claude Code 有料記事が売れているか（価格・購入者数・スキ・テーマ）

### Takeaway
note の Claude Code 有料記事は**供給過多**。`#ClaudeCode` の新着有料記事は1日あたり約60〜90本公開され、新着300本のスキ中央値は1。一方、人気上位（スキ100以上）は79本あり、上位100本の価格中央値は**¥1,990**（全体の中央値 ¥980 より高い）。上位は「有名著者の考え方・ノウハウ」（梶谷健人が上位100本中17本）と「稼ぐ系＋実物（スキル・コード・テンプレ）付き」が占める。購入数が見える例は、自己申告で「3,000部」（¥980、イケハヤ）、「832名申込」（¥19,800 のセミナーアーカイブ）、「300部」（¥5,980）、「130部」（¥39,800）が上限クラスで、大半は数十部以下と推定される。

### Cited Findings

**全体の分布（人気順・有料 497本、当日取得）** — [note API #ClaudeCode 人気順・有料](https://note.com/api/v3/hashtags/ClaudeCode/notes?order=popular&paid_only=true&page=1)
- `#ClaudeCode` のハッシュタグ全体の記事数（API の count、無料を含むと思われる）: 77,479本。
- 有料 497本の価格中央値 ¥980、平均 ¥4,229。価格帯の内訳: ¥500以下 160本、¥501〜1,000 129本、¥1,001〜2,000 65本、¥2,001〜3,000 53本、¥3,001〜5,000 34本、¥5,001〜10,000 17本、¥10,001以上 39本。
- スキ中央値 23。スキ100以上は79本、50以上は139本。
- スキ上位100本の価格中央値は ¥1,990。価格帯の内訳: ¥500以下 25本、¥501〜1,000 15本、¥1,001〜2,000 12本、¥2,001〜3,000 15本、¥3,001〜5,000 11本、¥5,001〜10,000 9本、¥10,001以上 13本。
- 人気順サンプルを価格帯別に見たスキ中央値: ¥500以下 21、¥501〜1,000 16、¥1,001〜2,000 24、¥2,001〜3,000 28、¥3,001〜5,000 52、¥5,001〜10,000 79、¥10,001以上 54。高い記事ほどスキが多いが、人気順で抜いたサンプルなので選択バイアスがある（下の Inferences 参照）。

**新着の供給量（新着順・有料 300本、2026-10-14〜10-17 公開）** — [note API #ClaudeCode 新着順・有料](https://note.com/api/v3/hashtags/ClaudeCode/notes?order=new&paid_only=true&page=1)
- 1日あたりの新着有料記事: 10/14 62本、10/15 86本、10/16 88本、10/17 64本（10/17 は取得時点まで）。
- 価格中央値 ¥680、平均 ¥1,128。¥500以下が148本、¥501〜1,000 が84本で、**77%が ¥1,000以下**。
- スキ中央値 1。300本中127本がスキ0、228本がスキ2以下。公開から日が浅い分を差し引いても、反応はほとんどない。

**スキ上位の有料記事（価格・スキ・公開日）**
- 梶谷健人「2026年、もはや Claude Code はエンジニア以外も全員が使うべきツールになった」¥4,980・スキ2,526・2026-02-10 — [note](https://note.com/kajiken0630/n/nc0cb92bc080f)
- 「競馬AI解体新書｜Claude Codeに競馬AIを作らせて、勝てないところまで全部書く」¥4,980・スキ1,324・2026-08-25 — [note](https://note.com/keiba_hitaxis/n/n2a12ff86cd63)
- ぷにまる「未経験から、Claude CodeでiOSアプリ開発。2ヶ月目に月10万円」¥3,480・スキ992・2026-06-14 — [note](https://note.com/punimaru_dev/n/n88d20110060a)
- AI駆動塾「ClaudeCodeのマジで世界一やさしい教科書【非エンジニア向け】」¥2,980・スキ592・2026-02-20 — [note](https://note.com/l_mrk/n/n435e046b6a67)
- 梶谷健人「Claude Code完結で『提案や登壇で使えるレベルのスライド資料』をつくる方法」¥9,800・スキ555・2026-03-19 — [note](https://note.com/kajiken0630/n/n3bc37c10ef3b)
- Lily「Claude Code自律環境で、月120万を『寝てても回る仕組み』から得るまで」¥3,980・スキ482・2026-06-22 — [note](https://note.com/bokuwalily/n/n849b3a07784a)
- チャエン「【保存版】Claude Code Desktopアプリ完全解説マニュアル…【6万文字】」¥14,800・スキ455・2026-05-04 — [note](https://note.com/chaen_channel/n/n8a93a5e955f8)
- ホンダ「【無料配布】最短5分でサービスLPを作れるAIデザインキット｜Claude Code」¥500・スキ400・2026-04-18 — [note](https://note.com/yuichirohonda/n/nd2929f5a72ff)
- 「月給50万円の進行管理担当を月額数千円のAPIにすり替えろ…デジタルクローン錬成術」¥5,000・スキ357・2026-04-07 — [note](https://note.com/constdx/n/n41acf16b2f9b)
- 木下斉「【MCPサーバー搭載…】500DL超！【Claude/Codex活用可能スキル提供】…10の鉄則」¥1,480・スキ325・2026-07-23 — [note](https://note.com/shoutengai/n/n7bae5d4e568b)
- 「[300部突破] Claude Code 0→100 完全攻略ロードマップ｜AI運用会社の作り方から収益化まで」¥5,980・スキ321・2026-06-22 — [note](https://note.com/ao_threads_log/n/n7977f13a0986)
- 「Cloudflare完全ガイド…【約23万字】」¥1,980・スキ280 — [note](https://note.com/miyata_archack/n/n2eb6da4d2cc8)
- チャエン「Claude Codeで2時間。AIだけで作ったLPがSEO検索1位…秘伝のスキルもDL可能」¥59,800・スキ256・2026-07-11 — [note](https://note.com/chaen_channel/n/n13e9b5da0e46)
- 「ブログ記事の量産から投稿までを完全自動化した夜 — Claude Code パイプライン【全コマンド＋全コード公開】」¥980・スキ250 — [note](https://note.com/ai_fukuro/n/nb9bfdce2725c)
- 「【実物テンプレ付き】Claude Code副業の始め方完全ガイド…ココナラで売れる商品を作る全手順」¥980・スキ240 — [note](https://note.com/ai_hack_dx/n/n28dfc5e6b302)
- 梶谷健人「Claude Codeが『バカになった問題』と『すぐ使用上限いってしまう問題』を根本的に解決する方法」¥2,980・スキ205（2026-04-15） — note API 人気順データ（上記 API）

**タイトルに購入数（自己申告）が書かれた記事**（購入数の唯一の手がかり）
- チャエン「【832名申込・満足度99%超】非エンジニア向けClaude Code業務活用マスター講座 完全アーカイブ｜CLAUDE.md設計・スキル作成・Excel/パワポ自動生成」¥19,800・スキ182。「832名」はセミナーの申込数で、このアーカイブ記事の購入数ではない — [note](https://note.com/chaen_channel/n/n9eeb07de2e7b)
- イケハヤ「【3000部突破】Claude Codeの教科書 - AI秘書から始める爆速仕事術」¥980・スキ40（note 版。Brain 版は Q3 参照） — [note](https://note.com/ihayato/n/n2e7a3a7338cb)
- 「[300部突破] Claude Code 0→100 完全攻略ロードマップ」¥5,980 — [note](https://note.com/ao_threads_log/n/n7977f13a0986)
- 「250部突破！【ブレーンメーカー】…Claude Code・Codexを『最強の相棒』に育てる全手順【はじめてフォルダ付き】」¥4,280・スキ34 — [note](https://note.com/poko_fukugyou/n/n92486890994e)
- まさお「【全コード共有】『動画を作って』で30分の解説動画が完成！ Remotion x Claude Code Skill設計実践【計130部突破】」¥39,800・スキ170・2026-01-30 — [note](https://note.com/masa_wunder/n/nf1aa9aa90f1c)
- 「【100部突破】Claude Code×Threads｜半自動で稼ぐAI副業の完全教科書」¥8,980・スキ86 — [note](https://note.com/kon_ai/n/n1a5535071409)
- 「【40部完売！】0からClaude Code収益化マニュアル」¥3,980・スキ47 — [note](https://note.com/suke_ai_dojo/n/nf3b7a25fd0ef)
- 「【25部突破】Claude Code初心者ガイド ー50代・知識ゼロでもアプリ作れましたー」¥1,980・スキ45 — [note](https://note.com/coco_here/n/n13e1a63a2aec)
- 「【10部突破！】…AIに『動画工場』を作らせて月30万円を超えるまでの全記録」¥4,980・スキ11 — [note](https://note.com/ai_factory/n/n47ff63583649)
- 「【月500部】Claudeでnoteを毎日書いて売るまでにやったことの全手順」¥14,800・スキ59（「月500部」は著者の全 note の販売数で、この記事単体の数字ではない） — [note](https://note.com/ryo_notedake/n/n578279080944)

**テーマの傾向（タイトルのキーワード集計。1本が複数カテゴリに入る）**
- スキ上位100本: テンプレ・設定・スキル・コード配布 29本、副業・稼ぐ・収益 20本、開発・技術 19本、業務効率・資料作成 17本、AI社員・秘書・組織 6本、使用上限・トークン 2本。
- 新着300本: テンプレ・設定・スキル配布 73本、開発・技術 53本、副業・稼ぐ 35本、AI社員・秘書・組織 29本、業務効率 24本、使用上限・トークン 12本。
- 新着には「AI社員○人」系が多い。例:「AI社員10部署の一人社長（CLAUDE.mdなど、実物とひな形13点）」¥2,100・スキ6、「Claude Codeの6人チーム一式（設定ファイル25点）」¥1,980・スキ8、「【コピペ可】Claude Codeで『AI秘書＋6部署』を作った｜CLAUDE.md・サブエージェント設定を全文公開」¥900・スキ13、「AI社員6人でnoteを売る会社を建てた。まだ1円も売れていない。」¥500・スキ11 — [note API 新着順](https://note.com/api/v3/hashtags/ClaudeCode/notes?order=new&paid_only=true&page=1)
- 「ツール＋解説」型（ファイル・スキル・コード付き）はよく見られる。上位の例: ¥980「全コマンド＋全コード公開」、¥1,480「スキル提供」、¥39,800「全コード共有」、¥59,800「秘伝のスキルもDL可能」、¥3,480「実行スクリプト2本＋テンプレ4本つき」（Lily、スキ128） — 上記各 note
- 著者の集中: 人気順497本のうち、まさお（AI活用）27本、梶谷健人 25本、「AI社員運用記」24本。スキ上位100本では梶谷健人が17本 — note API 人気順データ
- 「Claude Codeで note を量産して売る」系の記事自体も売られている（例: [らいと「Claude Codeでnoteを"量産"して月5万円を狙う副業ロードマップ」](https://note.com/aiwriter0116/n/n5205fb37afbb)、Rayna「『Claude Codeで書けば売れる』は間違いでした」¥1,980・スキ127）。

### Inferences
- note でスキを集める有料記事は、(1) 既存ファンのいる著名著者（梶谷健人、チャエン、イケハヤ）か、(2)「月○万円」「SEO1位」「受注三千万円」のような成果を見出しにした副業・事業系がほとんど。CLAUDE.md・サブエージェントの設定ファイルを主役にした記事は、新着に大量にあるのにスキがほぼ付いていない。**設定ファイル単体には、note の読者はほとんどお金を払っていない**と読める。
- 価格が高いほどスキ中央値が高いのは、価格が需要を生んでいるからではない。人気順で抜いた結果と、高価格の記事は著名著者が多いことが重なっている。新着では ¥1,000以下が77%なので、**無名の売り手は低価格に寄せても売れていない**。
- 自己申告の部数から粗く推定すると、上位の単品の売上は、¥980×3,000部 ≒ ¥294万（イケハヤ、note 経由の手数料前）、¥5,980×300部 ≒ ¥179万、¥39,800×130部 ≒ ¥517万。（推定・自己申告ベース。note の手数料と、Brain・note の重複は未調整。）
- ツール工房のように**著者ブランドも SNS フォロワーもない売り手**が note で設定パックを売るのは、データ上いちばん勝ちにくい形。

### Gaps
- note は購入数を公開しない。タイトルの「○部突破」以外に購入数を確かめる手段はない。
- マガジン（定期購読）の購読者数は今回取っていない（梶谷健人などは単品と別にマガジンもあると思われるが未確認）。
- note の公式ランキングページは今回取得していない。人気順はハッシュタグ API の popular ソートで、アルゴリズムは非公開。

---

## Q2. Zenn: Claude Code の有料本（価格・like・テーマ）

### Takeaway
Zenn の `claudecode` トピックの本は255冊で、うち**有料182冊の like 中央値は0**（182冊中96冊が like 0、like 10以上は3冊だけ）。like を最も集めているのは無料本（1,393 と 965）。有料本の価格中央値は ¥1,000（¥300〜2,000 に集中）。エンジニア読者は Zenn で Claude Code 本にお金を払っていない、という強い信号。

### Cited Findings
- 取得結果（2026-10-17）: 255冊（有料182・無料73）。有料本の like 中央値0、平均1.6、like 0 が96冊、10以上が3冊、50以上が1冊。無料本の like 中央値は1、平均43.3、50以上が6冊 — [Zenn API books?topicname=claudecode](https://zenn.dev/api/books?topicname=claudecode&order=latest)
- 有料本の価格中央値 ¥1,000。件数の多い価格: ¥1,000 38冊、¥500 36冊、¥1,500 30冊、¥300 28冊、¥2,000 13冊、¥200 12冊。最高は ¥5,000（1冊） — 同上
- 公開月別の冊数（全体）: 2026-01 8、02 10、03 13、04 28、05 19、06 28、07 40、08 26、09 42、10（17日まで）37。有料は 2026-07 34冊、09 35冊、10（17日まで）24冊。**供給は増え続けている** — 同上
- like 上位の有料本: ml_bear「Claude Agent SDK でつくる！対話型AIエージェント開発」¥500・like 100（2026-04-06）、「Claude Certified Architect – Foundations（CCA-F）資格試験テキスト」¥700・like 20、masayan1126「Claude Codeサブエージェント完全マスター…」¥300・like 17、masayan1126「Claude Code、最初にこれやっとき｜7つの設定で世界変わるで」¥300・like 7、hamaup「Claude Code実践ガイド」¥700・like 6、joinclass「Claude Code 全自動化バイブル -- Hooks・Skills・MCP・cron」¥2,000・like 5 — 同上
- 「設定・hook 集」型の有料本も like はほぼ0。例: soeno9「【受託SE向け】…【hook39本を全公開】」¥1,500・like 1、acerola_jp「Claude Code 実践キット：設定・テンプレート・指示の型」¥1,000・like 0、civras「Claude Code のプラン使用率を自動記録する ── そのまま貼れる指示文と、7日で踏んだ罠5つ」¥1,000・like 0 — 同上
- like 上位の無料本: tmasuyama1114「Claude Code 完全ガイド - 入門から実践的なカスタマイズまで」like 1,393、lv「0から分かる Claude Code 完全ガイド」like 965 — 同上、[0から分かる Claude Code 完全ガイド](https://zenn.dev/lv/books/f611cdfe8a6e1a)
- 2026年8月時点の第三者集計でも同じ傾向: 「Zenn の Claude Code 本156冊を数えた — 有料本の43%が like 0、中央値は無料本と同じ 1」（有料113冊、like 0 が49冊＝43.4%） — [shirube（Zenn, 2026-08 頃）](https://zenn.dev/shirube/articles/zenn-paid-books-data-2026)（本文は 403 で取得できず、検索結果の要約から引用）
- 個人の体験談として、¥1,500 の Zenn Book で「最初の1冊が売れた」ことを記事にする例がある（＝1冊売れることが記事になる水準） — [WireHarbor（note）](https://note.com/wireharbor/n/nbbd369b7bf41)
- その他の価格例: hamaup ¥700、saitoko ¥900（序章と第1部は無料） — [hamaup](https://zenn.dev/hamaup/books/claudecode-3f03ea67519a)、[saitoko（Qiita の告知）](https://qiita.com/saitoko/items/2225ddd693e6ec1011ff)

### Inferences
- Zenn では無料の網羅的ガイドが like を独占しており、有料本はほぼ読まれていない。like は購入数ではないが、like 0 が過半数という事実から、**大半の有料本の販売数は一桁**と推定される（推定）。
- 有料で例外的に like を集めたのは、Agent SDK・資格試験（CCA-F）など、無料情報がまだ少ない具体的な技術テーマ。「Claude Code の使い方・設定集」は無料記事・無料本と競合していて、有料では勝てていない。

### Gaps
- Zenn は販売数を公開しない。売上の実数はどこにもない。
- `order=liked` の並びがどの期間の like を使っているかは確認できなかった（全件を取り直して自分で like 順に並べたので、集計には影響しない）。

---

## Q3. BOOTH / Brain / Tips / Udemy / Kindle

### Takeaway
国内で**販売数が実際に確認できる最大の例は Brain**。イケハヤ「Claude Codeの教科書」は ¥980 で販売履歴3,403件（評価4.7・26件、アフィリエイト報酬50%）。BOOTH には「Claude Code」で602件が出るが、テンプレ・設定パック（¥980〜2,980）のスキは1〜3。スキを集めているのは技術書典系の同人誌（¥1,000〜2,000、スキ24〜37）と漫画（スキ72）。Udemy は日本語講座でも受講生1万人規模がある（ただしセール価格 ¥1,200〜2,000 前後）。

### Cited Findings

**Brain**
- イケハヤ「【3200部突破】Claude Codeの教科書 - AI秘書から始める爆速仕事術」: 価格 ¥980、`sales_histories_count` 3,403、評価4.7（26件）、`affiliate_rate` 0.5（紹介者に ¥490）。公開 2026-08-04、更新 2026-09-23。内容は「朝5時45分に Discord に届く予定とやることリスト」「メールの見張り・記録づけ・調べ物」を Claude Code の AI 秘書に任せる業務効率化。カテゴリは「ビジネス > 業務効率化・自動化」 — [Brain 商品ページ](https://brain-market.com/u/ikehaya/a/b2kzM5UjMgoTZsNWa0JXY)
- 同じ著者がブログで Brain 販売を告知している — [イケハヤ substack「Fable廃課金中のイケハヤ、『Claude Codeの教科書』をBrainで販売します」](https://ihayato.substack.com/p/fableclaude-codebrain)
- 「スライドと音声から動画を作る AI スキル」（Claude に読み込ませるだけで API キー不要）を Brain で ¥1,000 で販売し、1,000部売れたという報告（2026-10-02）。売れた理由として「信頼できる紹介者（Brain のコラボ機能）」「すぐ使える」「低価格の入口」を挙げている。部数は販売者側の申告 — [osaruproducer substack](https://osaruproducer.substack.com/p/1000aiclaude-code)
- Brain の Claude Code 教材を比べた記事（2026年4月）の検索結果の要約に、「わど式」301部完売、別の教材 ¥1,280・600部限定のうち539部、とある。本文は取得できず、アフィリエイト記事なので未検証 — [go2senkyo（速水肇）](https://go2senkyo.com/seijika/184180/posts/1364479)
- 「Brain × Claude Code 13体AI制作ライン」のレビュー記事は「販売数は伸びている」とするが、具体的な数字はない — [kaumae-review.com](https://kaumae-review.com/brain-claude-code-13ai-line-review/)
- Brain 運営メディアも Claude Code 特集を組んでいる（「なぜClaude Codeは非エンジニアでも使えるのか？…CLAUDE.md設計術」など） — [media.brain-market.com](https://media.brain-market.com/claude-code-beginner-brain/)

**BOOTH**（2026-10-17、スキ＝wish_lists_count）
- 検索件数: 「Claude Code」602件、「CLAUDE.md」397件、「ClaudeCode」142件。VRChat・Unity 系のツールも多く混じる — [BOOTH 検索](https://booth.pm/ja/search/Claude%20Code?sort=wish_lists)
- タイトルに Claude を含む商品をスキ順に並べた結果:
  - 「ClaudeCodeと進める漫画制作自動化入門」¥1,000・スキ72（2026-08-02） — [BOOTH](https://yasunai.booth.pm/items/8662433)
  - 「爆速開発を支えるClaude Code上級者テクニック」¥1,500・スキ37（2025-11-16、技術書） — [BOOTH](https://geek.booth.pm/items/7652106)
  - 佐々木拓郎「生成AI時代のクレデンシャルとパーミッション設計 — Claude Code を起点に」¥2,000・スキ31（2026-09-05） — [BOOTH](https://takuros.booth.pm/items/8717856)
  - 「『Claude Code暗号解読決戦 ミジンコ vs. AIエージェント』」¥1,500・スキ24 — [BOOTH](https://hack.booth.pm/items/8015186)
  - 無料の「TunaSync Unity MCP」スキ22、無料の「Claude使用量表示アプリ」スキ17 — [BOOTH](https://tunasync.booth.pm/items/8760604)、[BOOTH](https://vtool.booth.pm/items/8016870)
  - 「Claude Code 品質底上げキット【AI開発の作法】」¥5,000・スキ9 — [BOOTH](https://hedgehogs.booth.pm/items/8617570)
  - 「『note書いて』で2万字執筆〜投稿まで自動化するClaudeスキル」¥2,980・スキ7 — [BOOTH](https://freecredit.booth.pm/items/8592526)
- テンプレ・設定パックはスキ1〜3に集中: 「Claude Code プロジェクト設定キット ― CLAUDE.md×5 + スキル×5 + Hook付き」¥1,980・スキ3、「Claude Code Hooks 実践テンプレート集 30本」¥1,980・スキ2、「Claude Code MCP設定スターターキット（15本）」¥1,480・スキ2、「CLAUDE.md テンプレート集15選」¥1,480・スキ2、「Claude Code Agent Teams 実践設定パック…専門エージェント×10本」¥1,480・スキ2、「業務特化ワークスペース4本バンドル」¥9,300・スキ2、「AI社員チーム構築キット — Claude Code用セットアップウィザード」¥980・スキ2、「SaaSボイラープレート『sakigake』（Next.js 16 / DDD / Claude Code対応）」¥9,800・スキ2 — [DevToolBox ショップ](https://ezark-devtools.booth.pm/items/8143348)、[hitori-dougu](https://hitori-dougu.booth.pm/items/8537679)、[YK Ventures](https://yk-ventures.booth.pm/items/8146205)
- 1つのショップ（DevToolBox デジタルプロダクツ）が、¥100〜9,300 の Claude Code テンプレ・プロンプトパックを10点以上出品していて、どれもスキ1〜3 — 同上
- BOOTH 連動の外部ストアの例: 「ClaudeCodePrompt.shop」が CLAUDE.md テンプレ集（20種）¥1,980、コスト削減パック ¥2,980、Hooks設定マスターパック ¥1,980、初心者スタートガイド ¥500 などを並べるが、トップでは「準備中・まだ出品していません」とも書いていて矛盾している。販売数の表示はない — [claudecodeprompt.shop](https://www.claudecodeprompt.shop/)

**Udemy**（第三者ブログの比較表。2026-08-30 時点）— [free-aoi.blog](https://free-aoi.blog/claude-code-udemy-course/)
- 日本語講座の受講生数（評価・件数）: 我妻幸長「AIマルチエージェント入門」11,241人（4.4・971件）、Shin Code「Next.js+Supabase実践」11,701人（3.9・916件）、けいすけ「AIプログラミング入門」9,903人（846件）、とまだ「カスタマイズ完全ガイド」9,003人（4.3・625件）、ウマたん「データ分析・ダッシュボード」5,753人、ウマたん「Skills完全マスター」3,214人（4.2・322件）、くるしば「Claude Code完全攻略」2,578人（4.5・175件）、はむさん「ハーネス設計完全ガイド」2,065人（4.4・152件）、とまだ「未経験OK 5アプリ」1,905人。
- 英語講座: Academind「Claude Code – The Practical Guide」96,542人（4.5・15,276件）、Frank Kane「Building Faster with AI」38,633人。検索結果のスニペットでは Practical Guide が 105,924人と表示されていて、取得時期の違いと思われる — [Udemy](https://www.udemy.com/course/claude-code-the-practical-guide/)
- 同記事によると Udemy は定価で買われることがほとんどなく、セールで ¥1,200〜2,000 前後になる（講座ごとの定価は記載なし） — [free-aoi.blog](https://free-aoi.blog/claude-code-udemy-course/)
- その他の日本語講座（検索結果）:「Claude Codeで始めるAIプログラミング入門」10,132人、「【Claude Code入門】実用的なWebアプリケーション開発を通して学ぶ…」12,218人 — [Udemy](https://www.udemy.com/course/claude-code-vibe-cording/)、[Udemy](https://www.udemy.com/course/claude-code-vibe-coding-tutorial/)

**Kindle**
- 「マンガでわかる！Claude Code超入門」（NaoTsu Production）が「Business Systems & Planning」カテゴリで #1 Best Seller と表示されていた（キャッシュ。時期不明） — [Amazon.co.jp](https://www.amazon.co.jp/dp/B0GS3XZCR6)
- 「1冊3日で完成！Claude Code×Kindle副業の全手順」のような「Claude Code で Kindle を量産する」本も出ている — [Amazon.co.jp](https://www.amazon.co.jp/dp/B0H2HYVQSN)
- AI・機械学習カテゴリのランキングページに「ClaudeCode いちばんやさしい 教科書」が1位とあったが、ページが古い可能性がある（検索ツールの注記） — [Amazon.co.jp ベストセラー AI・機械学習](https://www.amazon.co.jp/gp/bestsellers/books/720370)

**Tips**
- 今回の調査では、Tips の Claude Code 商品で販売数が分かるものは見つからなかった（Gaps 参照）。

### Inferences
- 国内で「数千部」が確認できるのは、**Brain の低価格（¥980〜1,000）×著名人（またはその紹介）×アフィリエイト50%**という組み合わせだけ。Brain はアフィリエイトで拡散する仕組みなので、売れ方は製品の質より紹介網の強さで決まる。
- BOOTH でスキを集めているのは「技術書典の同人誌」と「ユニークな題材（漫画制作・暗号解読・認証設計）」。量産型のテンプレパックは反応がない。BOOTH の読者は**読み物としての独自性**に反応している。
- Udemy は受講生数こそ大きいが、単価はセールで ¥1,200〜2,000。動画講座を作れる講師ブランドが前提で、ツール工房の形（静的サイト＋自動化）とは合わない。

### Gaps
- Brain の Claude Code 商品を網羅的に一覧する方法が見つからなかった（Brain の検索ページはキーワードで絞り込めず、新着しか返さなかった）。イケハヤ以外の Brain 商品の販売数は、二次情報（アフィリエイト記事）しかない。
- Tips（tips.jp）とココナラは調べていない。
- Kindle の販売数（推定）や現在の順位は取得できていない。
- BOOTH は販売数を公開しないので、スキからの推定しかできない。

---

## Q4. 海外: 有料の Claude Code ツール・テンプレ・アプリ（Gumroad / 自社サイト / 売上公開）

### Takeaway
Gumroad の「claude code」検索は1,449件。**評価件数が多いのは無料（0ドル・pay-what-you-want）の集客用配布物**で、サンプル112件中37件が無料、評価件数の合計は無料2,151件に対し有料799件。有料で評価件数が多いのはガイド・プレイブック類（$12〜$147。中央値 $47）。ソフトウェアでは、使用量モニター（$9 買い切り、$6.99〜59 買い切り、$24/年）や設定キット（$89 買い切り）がある。売上の公開はほとんどなく、あっても未検証。

### Cited Findings

**Gumroad（2026-10-17、検索 API で112件取得）** — [Gumroad 検索 API](https://gumroad.com/products/search?query=claude%20code&sort=most_reviewed)
- 総件数1,449件（並び順 most_reviewed / default）。hot_and_new は327件。
- サンプル112件中、有料75件・無料37件（pay-what-you-want は46件）。評価件数の合計は有料799件、無料2,151件。有料の価格中央値 $47。
- 有料で評価件数が多い Claude 関連商品:
  - Usama Akram「Claude Code Playbook」$147・評価64件（5.0） — [Gumroad](https://usamaakrm.gumroad.com/l/claude-code-playbook)
  - Shahid Malik「Vibe Coder Kit — Build Production-Ready Websites with AI」$79・52件（5.0） — [Gumroad](https://nuovanceai.gumroad.com/l/qeeft)
  - Think Scale AI「50 Claude Code Commands, Tricks & Workflows That Most Users Don't Know」$12・50件（4.8） — [Gumroad](https://digitalwealthwithsa.gumroad.com/l/40claudecode)
  - AI Design Lab「Claude Code for Designers」$69.99・42件（4.9）。スキルファイル333個（9パック）付きのコース — [Gumroad](https://aidesignlab.gumroad.com/l/claude-code-for-designers)
  - Ziks「Claude OS」$47・39件（5.0） — [Gumroad](https://yourchatgptguide.gumroad.com/l/ClaudeOS)
  - Shahid Malik「Claude AI Prompt Library – 105 Ready-to-Use AI Prompts」$49.96・25件 — [Gumroad](https://nuovanceai.gumroad.com/l/uvfxz)
  - Aakash Gupta「Job Search OS in Claude Code」$49・6件、「PM Operating System in Claude Code」$49・6件 — 上記 Gumroad 検索データ
  - Bariq Rifki「Claude Code de 0 a 100 + bonus」€37・7件 — 同上
  - 「Motion Video Director — Claude Code Skill」$3.99・3件（3.7）、「Style-Locked AI Motion Graphics… (Claude Skill)」$10・4件 — 同上
- 評価件数が最も多いのは無料: 「Claude Mastery Guide」209件、「Motion Graphics with Claude Code」187件、Usama Akram の無料「Claude Skills for Business」68件・「Build n8n Automations with Claude Code」65件（同じ著者の $147 Playbook への導線と見られる） — 同上
- 個別の設定・テンプレパック: 「CLAUDE.md Starter Pack — 25 Production-Ready Templates」$47・評価3件（5.0） — [Gumroad](https://alfredolance.gumroad.com/l/uxwvom)。「Claude Code Agent OS — 30+ Subagents」（サブエージェント26・スラッシュコマンド12・CLAUDE.md テンプレ5）、「Agentic Coding Starter Kit」（CLAUDE.md・.cursorrules・サブエージェント4・hook レシピ）なども出品されている（価格・評価は未取得） — [Gumroad](https://planfulnest.gumroad.com/l/womhu)、[Gumroad](https://alphaletgo.gumroad.com/l/agentic-coding-kit)
- 「ToolGenX（agentskillpacks.com）」は SEO・マーケ・iOS 向けの Claude Code スキルパック19種などを $9〜119 で販売（販売者側の表記） — [agentskillpacks.com](https://www.agentskillpacks.com/)

**設定キット（自社サイト）**
- AgentsKit: Complete Bundle $89 買い切り（生涯アップデート。「あと15席」で $149 に値上げ）、Engineer Kit $49、Marketing Kit $49。中身はエージェント89・スキル122・コマンド181。「35 builders… in the last 3 weeks」「35 of 50」と表示（＝約3週間で35件、約 $3,100 相当。推定） — [agentskit.co](https://agentskit.co/)

**ソフトウェア（使用量モニター）**
- Usagebar: macOS メニューバー常駐。$9 買い切り（生涯アップデート）、無料版あり。5時間枠・週枠・コンテキスト使用量の表示と、50/75/90% での通知。利用者数の表示はない — [usagebar.com](https://usagebar.com/)
- SessionWatcher: Solo $6.99（11/1 から $8.99）買い切り、Bundle（Claude Code・Codex・Cursor）$14.99（→$19.99）買い切り、Pro Annual $24/年、Pro Lifetime $59（→$79）買い切り、Teams $40/席/年。7日間無料トライアル＋14日返金保証。「1,504+」ユーザー表示。macOS・Windows・iPhone/Watch（ベータ） — [sessionwatcher.com](https://sessionwatcher.com/)
- 無料の競合: ClaudeUsageBar（OSS）、Claude God（無料）、BOOTH の無料「Claude使用量表示アプリ」（スキ17） — [検索結果: claudeusagebar.com](https://www.claudeusagebar.com/)、[claudegod.app](https://claudegod.app/)、[BOOTH](https://vtool.booth.pm/items/8016870)

**オーケストレーション・本体機能との競合**
- Anthropic 公式に Agent View（複数エージェントを1画面で管理）、バックグラウンドエージェント、デスクトップアプリがあり、有料プランに含まれる。サードパーティの並列実行 GUI が有料で入り込む余地は狭まっている — [MindStudio: Claude Code Agent View](https://www.mindstudio.ai/blog/claude-code-agent-view-manage-multiple-agents)、[Claude Code Docs](https://code.claude.com/docs/en/overview)
- CodeAgentSwarm（複数の Claude Code エージェントを1つのアプリで回す）は存在するが、価格は取得できなかった（429） — [codeagentswarm.com](https://www.codeagentswarm.com/en/guides/claude-code-plans-and-pricing)

**売上公開（MRR）**
- 「Once」（Mac の集中アプリ、$12/月）が Claude Code で作られ、83日で $20K MRR になったという記事（2026-06-05）。開発者名も一次ソースもなく、Setapp のアフィリエイトリンクが並ぶ記事なので未検証。しかも「Claude Code ユーザー向けの商品」ではなく、「Claude Code で作った商品」 — [AI Cheatcode](https://aicheatcode.substack.com/p/he-built-a-20k-mrr-mac-app-with-claude)
- SuperX（$39/月、約 $23K MRR・約650社）は Indie Hackers の投稿だが、Claude Code ユーザー向けの商品ではない — [Indie Hackers](https://www.indiehackers.com/post/tech/hitting-23k-mrr-in-six-months-after-five-failures-4d64o9ev4AXXhX9ogHQQ)

### Inferences
- 海外でも、評価（＝購入）を集めているのは「著名インフルエンサーのプレイブック（$47〜147）」で、無料配布物から高額商品へつなぐ形。設定・テンプレパック単体（$47 で評価3件など）は日本と同じく弱い。
- 「Claude Code ユーザー向けソフトウェア」で実際に値段が付いて売られているのは、**使用量モニター（$6.99〜$9 買い切り、$24/年）**のように、毎日の具体的な不満（上限が見えない）を1つ解決する小さなツール。ただし無料の OSS 競合が多く、公式の `/usage` もあるので、価格は1桁ドル台に押し込まれている。
- 評価件数から販売数を出すには、評価率（例: 購入者の5〜10%が評価する）を仮定するしかない。仮定すると、$147 Playbook の64件は約640〜1,300件、売上は約 $9.4万〜19万（推定・仮定依存。根拠になる評価率のデータは無い）。

### Gaps
- Product Hunt のローンチ実績、GitHub Sponsors の金額（ccusage など人気 OSS）、LemonSqueezy の商品は今回調べていない。
- 有料の MCP サーバー（Claude Code 向けで課金しているもの）の具体例と価格は見つからなかった。
- Claude Code ユーザー向けツールで、検証可能な MRR 公開は見つからなかった。

---

## Q5. 価格帯: (a) ノウハウ記事 (b) 設定・テンプレパック (c) ソフトウェア

### Takeaway
- **(a) ノウハウ記事**: 売れている証拠があるのは ¥980〜1,000（Brain の数千部）と、著名著者の ¥2,980〜5,980（note でスキ数百〜2,500）。¥10,000以上（¥14,800〜59,800）は「セミナーアーカイブ」「成果を保証するような見出し」とセットで、部数は100〜130部程度（自己申告）。
- **(b) 設定・テンプレパック**: 国内の相場は ¥980〜2,980（BOOTH・note・Zenn）、海外は $47〜89。どのプラットフォームでも反応が最も弱い（BOOTH スキ1〜3、Zenn like 0〜1、Gumroad 評価3件）。売れているのは、パックが**成果物（動画生成・LP・記事量産）を直接出すスキル**として売られている場合（Brain ¥1,000・1,000部の申告、note ¥39,800・130部の申告）。
- **(c) ソフトウェア**: 実例は使用量モニターの $6.99〜9 買い切り、$24/年、$59 生涯。国内では BOOTH の ¥2,980〜19,800 のソフトがあるが、Claude Code 専用で売れている証拠は見つからなかった。

### Cited Findings
- (a) Brain ¥980・販売履歴3,403件 — [Brain](https://brain-market.com/u/ikehaya/a/b2kzM5UjMgoTZsNWa0JXY)。note の人気順有料記事の価格中央値 ¥980、スキ上位100本の価格中央値 ¥1,990 — [note API](https://note.com/api/v3/hashtags/ClaudeCode/notes?order=popular&paid_only=true&page=1)。¥5,980「300部突破」、¥8,980「100部突破」、¥39,800「計130部突破」 — [note](https://note.com/ao_threads_log/n/n7977f13a0986)、[note](https://note.com/kon_ai/n/n1a5535071409)、[note](https://note.com/masa_wunder/n/nf1aa9aa90f1c)
- (a) Zenn 有料本は ¥1,000 中央値で like 0 中央値 — [Zenn API](https://zenn.dev/api/books?topicname=claudecode&order=latest)
- (b) BOOTH のテンプレパック ¥980〜2,980 でスキ1〜3 — [BOOTH 検索](https://booth.pm/ja/search/Claude%20Code?sort=wish_lists)。Gumroad「CLAUDE.md Starter Pack」$47・評価3件 — [Gumroad](https://alfredolance.gumroad.com/l/uxwvom)。AgentsKit $89・約3週間で35件（自己申告） — [agentskit.co](https://agentskit.co/)
- (b) スキル（成果物を出すもの）: Brain ¥1,000・1,000部（申告） — [osaruproducer](https://osaruproducer.substack.com/p/1000aiclaude-code)
- (c) Usagebar $9 買い切り — [usagebar.com](https://usagebar.com/)。SessionWatcher $6.99〜$79 買い切り / $24/年、1,504+ユーザー — [sessionwatcher.com](https://sessionwatcher.com/)
- 買い手が価値を感じている点（販売ページ・タイトルの言い回しから）: 「時間短縮」（「1ヶ月の作業が1日で終わる」「15時間→4時間」）、「お金の節約・稼ぎ」（「月給50万円の担当を月額数千円のAPIに」「API コスト約40%減」）、「すぐ使える実物」（「全コード公開」「設定ファイル25点」「cdして実行するだけ」）、「上限問題」（「すぐ使用上限いってしまう問題を根本的に解決」） — 上記 note・BOOTH・claudecodeprompt.shop の各ページ

### Inferences
- 価格が効くのは「誰が売るか」と「何が出てくるか（成果物）」。**設定ファイルそのものには値段が付きにくく、設定ファイルが生み出す成果（動画・LP・記事・お金）に値段が付いている**。
- ツール工房にとっては、(c) の小さなソフト（例: 使用量の可視化）が、ブランドなしで勝負できる数少ない枠。ただし相場は1桁ドル（≒¥1,000〜1,500）の買い切りで、無料 OSS と公式機能に押されている。
- 1本あたりの売上は、(a) の著名著者 ¥数百万に対して、(b) の無名テンプレパックは ¥数千〜数万と推定される（推定）。

### Gaps
- 価格を変えたときの販売数の変化（価格弾力性）のデータは無い。
- 買い手のレビュー本文（何に満足したか）を体系的には集めていない（Brain の26件のレビュー本文は取得できなかった）。

---

## Q6. 飽和・買い手の反発（情報商材批判など）

### Takeaway
飽和と反発の両方がはっきり出ている。供給側: note の新着有料記事は1日60〜90本でスキ中央値1、Zenn の有料本は like 0 が過半数、BOOTH のテンプレパックはスキ1〜3。反発側: 2026年4月と10月に、Claude Code が「情報商材の新しい包装紙」になっているという批判記事が、ニュースサイトや論考サイトに出ている。

### Cited Findings
- 尾藤克之「情報商材は死んでいない Claude Codeという新しい包装紙」（Yahoo!ニュース エキスパート、2026-10-05）:「Claude Codeは今、情報商材の売り手にとって最も都合のいい題材になっている。」「『制限が来なくなる裏技』に至っては、そもそも成り立たない。」「テンプレートの中身に25選分の価値はない。」導線は「無料の特典→セミナー→個別相談→高額講座」。著者は Claude の実用書を出していて、利害があることを明示している — [Yahoo!ニュース](https://news.yahoo.co.jp/expert/articles/b81dfb68d80582d06810d0ca651bf687d8812f21)
- 同じ著者による「『Claude Codeがすごい』と言う人が見分けていないもの」。検索結果の要約では「数万円から数十万円の高額セミナーや情報商材が乱立」と指摘 — [Yahoo!ニュース](https://news.yahoo.co.jp/expert/articles/2cabc34caf1b2fba860853eafac12aaa964363a1)
- オトナンサー「『120秒でパワポ完成』のワナ エンジニア向けツール『Claude Code』が情報商材に悪用されるワケ」（話題性・検証困難性・不安喚起の3条件） — [dメニューニュース](https://topics.smt.docomo.ne.jp/article/otonanswer/life/otonanswer-364150)
- アゴラ「情報商材屋にうってつけなClaude Code（前編・後編）」（URL から2026-04-21/22 と推定） — [アゴラ 前編](https://agora-web.jp/archives/260421085952.html)、[後編](https://agora-web.jp/archives/260422063312.html)
- これを受けた note の反論・感想記事もある — [ひとり事業部のAI奮闘記](https://note.com/ai_funtouki/n/naa3f149a095b)
- 「Claude Codeが情報商材に悪用される理由とは？騙されないための3つの視点」という注意喚起ブログ — [ai-hacks.jp](https://ai-hacks.jp/claude-code-infoproduct-abuse/)
- 売り手側の自己批判:「『Claude Codeで書けば売れる』は間違いでした」（¥1,980・スキ127）、「AI社員6人でnoteを売る会社を建てた。まだ1円も売れていない。」（¥500）、「AI社員を34人そろえて、2ヶ月で会社をたたみました」（¥300）、「Claude Code 一人開発、1か月の運用記録 — 売上0円の実測」（Zenn ¥300） — [note API 人気順・新着順データ](https://note.com/api/v3/hashtags/ClaudeCode/notes?order=new&paid_only=true&page=1)、[Zenn API](https://zenn.dev/api/books?topicname=claudecode&order=latest)
- Zenn 有料本の43%が like 0（2026年8月の集計）→ 今回の集計では53%（96/182） — [shirube](https://zenn.dev/shirube/articles/zenn-paid-books-data-2026)、[Zenn API](https://zenn.dev/api/books?topicname=claudecode&order=latest)

### Inferences
- 「Claude Code × 副業・稼ぐ」の有料記事は、批判記事が名指しする情報商材の型（成果の見出し→無料特典→高額商品）と重なる。ツール工房の「正確さ＞見た目＞量」「数字は盛らない」方針は、この反発への**差別化の材料**になるが、同じ note・Brain 市場で売ると同類に見られる危険がある。
- 「Claude Code の使い方」「CLAUDE.md テンプレ」は無料情報（公式ドキュメント、Zenn の無料本 like 1,393、Qiita の無料テンプレ記事多数）と競合していて、有料にする根拠が弱い。飽和は、テンプレ・入門・AI社員系で特に強い。

### Gaps
- 返金率や低評価レビューの数（Brain・Gumroad）は取得していない。
- X（旧Twitter）上の買い手の不満投稿は体系的に集めていない。
