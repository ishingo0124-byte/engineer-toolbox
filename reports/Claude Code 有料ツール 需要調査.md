# 「節約する道具」ではなく「漏れを測る道具」を売る

依頼者が欲しいと考えている「Claude Code のトークンを大幅に節約できる汎用ツール」は、有料商品としては成立しないと判断します。理由は三つあります。一つ目に、消費の大半は会話履歴の再送（利用者のログでは全トークンの93〜99.9%がキャッシュ読み込み）と、Claude Code 本体の固定費（空のセッションでも約3.3万トークン）です。外付けの圧縮ツールが削れる部分は小さいということです。二つ目に、削れる仕組みは Anthropic が2026年にほぼ毎月のペースで標準機能に組み込んでいます。三つ目に、rtk（約8.4万スター）や caveman（約11.3万スター）などの無料 OSS で市場は埋まっています。しかも独立した計測では、rtk で費用 +7.6%、caveman で +10.9% と、請求額が増えた結果まで出ています。一方、「上限がすぐ来る」という悩みは Claude Code のリポジトリで最もコメントが多い問題です。実際にお金が動いている数少ない領域が「上限・使用量の見える化」で、$7〜9 の買い切りアプリが売られています。したがって売るべきなのは、文章を縮める道具ではありません。利用者自身のログから「どこで漏れたか、どう直せばいくら減るか」を示す道具です。推奨の順位は次のとおりです。1位は手元のパソコンだけで動く「節約余地診断」で、無料のブラウザ版をツール工房に置き、有料のローカル版を BOOTH で ¥980〜1,480 の買い切りにします。2位は、節約ツールや設定の効き目を自分の作業で測る A/B 実測キットで、まず無料の実測記事から始めます。3位はサブエージェント（Claude Code が作業を任せる子エージェント）の予算ガードで、単体では売らず1位に同梱します。ただし、どれも副収入の規模です。参照できる唯一の数字は海外の有料使用量アプリ SessionWatcher の自己申告「1,504 ユーザー」で、そこから推定しても累計売上は $1万〜2.3万にとどまります。

## トークンの9割以上は「履歴の再送」で、圧縮ツールではほとんど削れない

Claude Code は、ツールを使うたびにそれまでの会話全体を送り直します。公式ドキュメントも「一日開きっぱなしのセッションでは、一行の質問でも会話全体ぶんの使用量を引く」と説明しています ([Claude Code Docs: Manage costs](https://code.claude.com/docs/en/costs))。ある利用者が30日分のログを集計した GitHub issue #24147 では、キャッシュ読み込みが50.9億トークンだったのに対し、入出力は389万トークンでした。つまり**全トークンの99.93%がキャッシュ読み込み**です。対象を762セッションに広げた集計でも93.43%でした ([#24147 のミラー](https://claudeissues.com/issue/24147-cache-read-tokens-consume-99-93-of-usage-quota-architectural-scaling-issue-with))。

固定費も大きい部分です。2026年7月の計測（v2.1.207）では、空のセッションの最初のリクエストが約3.28万トークンで、そのうち**組み込みツールの説明だけで約2.4万トークン**を占めていました。CLAUDE.md・MCP（外部ツールを Claude につなぐ仕組み）・プラグインを入れた実用的な構成では、何も入力しないうちに7.5万〜8.5万トークンに達します ([GIGAZINE（Systima の計測を紹介）](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token))。

| 消費源 | 規模（出典の数字） | 標準機能の対応（2026年10月時点） | 外付けツールの余地 |
|---|---|---|---|
| 会話履歴の再送 | 利用者ログで全トークンの93〜99.9% ([#24147](https://claudeissues.com/issue/24147-cache-read-tokens-consume-99-93-of-usage-quota-architectural-scaling-issue-with)) | 1時間キャッシュ、自動・部分圧縮、アイドル時の自動圧縮 v2.1.299 ([CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)) | 「いつ /clear するか」の判断を助けることだけ |
| 本体の固定費 | 空のセッションで約3.3万、うちツール定義が約2.4万 ([GIGAZINE](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token)) | 本体側で最適化 | なし（第三者は手を出せない） |
| CLAUDE.md・MCP・skills | 72KB の CLAUDE.md で毎回約2万、MCP 5個で5千〜7千 ([GIGAZINE](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token)) | MCP の遅延読み込みが既定、skills の段階読み込み、/context の改善提案、/doctor の削減案 ([Manage costs](https://code.claude.com/docs/en/costs)) | 中身の点検と、直し方の提示 |
| コマンド出力 | 費用の約6%（5タスクでの計測） ([dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)) | 5万文字を超える出力はディスクへ退避、Read の重複排除 ([CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)) | 小さい（rtk の理論上の上限は入力の約3%） |
| サブエージェント・チーム | 2体に分けると入力が約4.2倍、エージェントチームは約7倍 ([GIGAZINE](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token)、[Manage costs](https://code.claude.com/docs/en/costs)) | /usage でサブエージェント別の内訳を後から確認 | 任せる前の見積もりと上限設定 |

この構図が「汎用の節約ツール」に不利な理由も三つあります。まず、節約ツールが主に狙うコマンド出力は**費用の約6%**しかありません。常に読み込まれる文脈の約42%と比べてずっと小さい割合です ([dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk))。JetBrains は、rtk が仕組み上削れる量の上限を入力トークンの約3%と見積もっています ([財経新聞（JetBrains の検証を報道）](https://www.zaikei.co.jp/article/20260722/862344.html))。次に、API ではキャッシュ読み込みの料金が通常の入力の0.1倍（Opus 5.5・Sonnet 5.5 では0.05倍）です。すでにキャッシュに乗っている文章を縮めても、請求額はほとんど変わりません ([Claude API docs: Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching))。最後に、最大の消費源である履歴の再送を減らす方法は、公式が勧める「タスクの区切りで /clear する」という利用者の判断です。文章を圧縮する道具では、この判断の代わりになりません ([Manage costs](https://code.claude.com/docs/en/costs))。なお、サブスクの上限の計算で各トークンがどう重み付けされるかは公開されていません。そのため、キャッシュ読み込みが上限をどれだけ減らすかは、誰にも正確には言えません。

Anthropic 自身にも節約を急ぐ理由があります。Claude Code チームは「キャッシュヒット率が高いほど、サブスクの上限を寛大にできる」と書き、ヒット率が下がると障害（SEV）として対応しています ([claude.dev blog, 2026-04-30](https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/))。2026年に入ってから組み込まれた主な機能は次のとおりです。1月に MCP ツールの遅延読み込みが既定になり（v2.1.7）、大きな出力をディスクへ退避する機能も入りました（2月には退避の閾値が5万文字に下がりました）。3月には Read の重複排除（v2.1.86）と /context の改善提案、5月には /usage の内訳表示（v2.1.149）、8〜9月にはキャッシュの統計と原因の診断、10月14日にはアイドル時の自動圧縮（v2.1.299）が加わりました ([CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md))。Anthropic は8月に「Claude Code の使用量まわりの変更はまだ続く」とも述べています ([BleepingComputer](https://www.bleepingcomputer.com/news/artificial-intelligence/anthropic-is-cutting-claude-codes-current-weekly-limits-by-17-percent/))。仕組みの工夫でトークンを節約する道具は、どれも Anthropic がこれから標準機能にしうる範囲に入っています。

## 有名な節約ツールは、独立した計測で請求をむしろ増やしている

節約ツールの市場は、すでに無料の OSS で埋まっています。2026年10月17日時点の数字は次のとおりです。Bash 出力を書き換える rtk が**83,674スター** ([GitHub](https://github.com/rtk-ai/rtk))、簡潔に答えさせる caveman が**113,142スター** ([GitHub](https://github.com/JuliusBrussee/caveman))、ツールの出力を別の場所で処理する context-mode が30,379スター・npm で週24,527件のダウンロードです ([GitHub](https://github.com/mksglu/context-mode))。コードの関係図を作る codegraph は74,312スター・npm 週128,535件 ([GitHub](https://github.com/colbymchenry/codegraph))、セッションの記憶を持たせる claude-mem は101,286スターです ([GitHub](https://github.com/thedotmack/claude-mem))。新しい有料品がここに割り込む余地はほとんどありません。

問題は市場が埋まっていることだけではありません。独立した対照実験では、宣伝されている60〜98%という削減率がほとんど再現しません。

| ツール | 方式 | 宣伝 | 独立計測の結果 |
|---|---|---|---|
| rtk | Bash 出力の書き換え | 60〜90%削減 | effort 低で1タスクの費用 **+7.6%**（p=0.004、80組）、effort 高で +0.1% ([財経新聞](https://www.zaikei.co.jp/article/20260722/862344.html))。別の計測では **+7.1%** ([dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)) |
| caveman | 簡潔に出力させるスキル | 出力65%削減 | 出力トークン **−8.5%**（86タスク） ([Badgerworks](https://www.badgerworks.co.uk/posts/saving-token-spend/))。別の計測では費用 **+10.9%** ([dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)) |
| pxpipe | 文脈を画像にして送る | 削減をうたう | 費用 **+196.7%** ([dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)) |
| Ponytail | コードを書きすぎないスキル | 費用 −20% | 費用 −10.3%（80組） ([MindStudio](https://www.mindstudio.ai/blog/claude-token-saving-plugins-tested)) |
| token-savior | 関数などの単位で参照する | 97%削減 | 1タスクだけの計測で −43% ([computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)) |
| CodeGraph | コードの関係図 | — | 開発者自身の計測で費用 −44%。リポジトリ別では13〜78%で、Gin ではほぼ横ばい ([CodeGraph README](https://github.com/colbymchenry/codegraph)) |

請求が増えた理由もわかっています。rtk は出力を約63%削りましたが、Claude が削られた部分を確かめようとして追加のコマンドを実行しました。1ステップあたりの量は減っても、ステップの数が増えたわけです。caveman のルールは毎回約2,900トークンを上乗せし、pxpipe の画像は最初のキャッシュ書き込みを約2.7万トークンから約10.2万トークンに増やしました ([dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk))。しかも rtk 自身の集計画面は、請求が7.6%増えた同じ実験で「99.8%節約」と表示していました ([財経新聞](https://www.zaikei.co.jp/article/20260722/862344.html))。

効果が確認できたのは、文章を縮める方式ではありませんでした。読むファイルの数とやり取りの回数を減らす方式（関数単位の参照、短い CLAUDE.md、コードの関係図）です。ただし、その効き目はリポジトリとタスクによって大きく変わります。計測から読める結論は、**「汎用」と「大幅」は両立しない**ということです。

有料化の動きもありますが、売れている証拠は見つかりません。出力を圧縮する中継サービス Token Limits は月 $5 で「セッションが3倍長くなる」とうたっていますが、効果は検証されていません ([Token Limits](https://tokenlimits.app/pricing))。claude-mem は10万スターの無料版を足場に、クラウド同期付きの CMEM Pro を月 $30 で売り始めました ([newreleases.io](https://newreleases.io/project/github/thedotmack/claude-mem/release/v13.14.0))。どちらも売上や契約数は公開していません。この分野のお金の取り方は「まず無料で広く使われ、そのあとクラウド同期・チーム向け分析・ホスト型の索引に課金する」形に寄っています。節約の仕組みそのものは無料のままです。

以上から、依頼者の案が成立しない理由は四つにまとまります。削れる部分が小さいこと、標準機能に取り込まれること、強い無料の競合がいること、そして効果を正直に測ると「大幅」とは言えないことです。売り方の面でも不利です。Yahoo!ニュース エキスパートの記事（2026-10-05）は、Claude Code が情報商材の「新しい包装紙」になっていると批判し、「『制限が来なくなる裏技』に至っては、そもそも成り立たない」と書いています ([Yahoo!ニュース](https://news.yahoo.co.jp/expert/articles/b81dfb68d80582d06810d0ca651bf687d8812f21))。「大幅節約」をうたう有料記事は、この括りで見られます。

仮に依頼者が自分の作業で確かに効く方法を持っていたとしても、文章で書ける手法は買われた直後に共有されます。それなら無料で公開して、「正直に測る人」という評判に換えたほうが得です。負けた計測結果まで公開することを売りにする Chisle のような例も出てきています ([GitHub](https://github.com/JayPokale/Chisle))。

## お金が動くのは「上限の見える化」と「成果物」で、設定ファイルには値段が付かない

悩みそのものは本物で、しかも強いものです。Max プランですぐ上限に当たるという #16157 はコメント約1,495件でリポジトリ最多 ([GitHub #16157](https://github.com/anthropics/claude-code/issues/16157))、2026年3月に上限の減りが急に速くなったと訴える #38335 は545リアクション・877コメントです ([GitHub #38335](https://github.com/anthropics/claude-code/issues/38335))。#67412 は「どの上限に当たったかが表示されないので、Max の契約者が不要な追加クレジットを買ってしまう」と訴えています ([GitHub #67412](https://github.com/anthropics/claude-code/issues/67412))。#19673（77リアクション）は「使用率84%なのに上限に達した」という報告です ([GitHub #19673](https://github.com/anthropics/claude-code/issues/19673))。こうした声からわかるのは、**消費の内訳が見えないこと自体が悩みになっている**ということです。

9月14日には、期間限定だった週の上限の50%増量が、恒久的な25%増に切り替わりました。Anthropic 自身が「今と比べると、週の上限は17%減る」と説明しています ([BleepingComputer](https://www.bleepingcomputer.com/news/artificial-intelligence/anthropic-is-cutting-claude-codes-current-weekly-limits-by-17-percent/))。Hacker News では「プロンプトを読む前に3.3万トークン」という投稿が706ポイントを集めました。いちばん上の返信は「7体のサブエージェントが、1体も終わらないうちに予算を使い切った」というものです ([HN](https://news.ycombinator.com/item?id=48883275))。

実際にお金や手間が払われている証拠があるのは、使用量の見える化です。無料の集計ツール ccusage は月877,566ダウンロードで、Claude Code 本体の npm ダウンロード（月5,510万件）の約1.6%にあたります ([npm: ccusage](https://api.npmjs.org/downloads/point/last-month/ccusage)、[npm: claude-code](https://api.npmjs.org/downloads/point/last-month/@anthropic-ai/claude-code))。有料アプリでは、SessionWatcher が Solo 版 $6.99（11月から $8.99）、Pro 版を年 $24 か買い切り $59 で売り、「1,504+ ユーザー」と表示しています ([SessionWatcher](https://sessionwatcher.com/claude))。Usagebar は $9 の買い切りです ([Usagebar](https://usagebar.com/))。SessionWatcher の利用者全員が Solo 版か Bundle 版（$6.99〜14.99）を買ったと仮定すると、累計売上は約 $1万〜2.3万です（私の推定）。無料の競合と標準の /usage に押されて、価格の相場は1桁ドルにとどまっています。

日本の有料市場のデータは、さらに厳しいものです。note の #ClaudeCode の有料記事は1日60〜90本のペースで増えています。10月14〜17日の新着300本は、スキの中央値が1、77%が ¥1,000以下でした ([note API 新着順](https://note.com/api/v3/hashtags/ClaudeCode/notes?order=new&paid_only=true&page=1))。Zenn の claudecode トピックの有料本182冊は like の中央値が0で、96冊が like 0 です ([Zenn API](https://zenn.dev/api/books?topicname=claudecode&order=latest))。BOOTH の CLAUDE.md・hook・設定パック（¥980〜2,980）は、スキが1〜3に集中しています ([BOOTH 検索](https://booth.pm/ja/search/Claude%20Code?sort=wish_lists))。

国内で販売数を確認できた最大の例は、Brain で売られているイケハヤ氏の「Claude Codeの教科書」です。価格 ¥980、販売履歴3,403件、紹介者へのアフィリエイト報酬50%で、売れた要因は著者の知名度と紹介の広がりです ([Brain](https://brain-market.com/u/ikehaya/a/b2kzM5UjMgoTZsNWa0JXY))。設定ファイルに値段が付いているのは、動画や LP のような**成果物を直接作るスキル**として売られた場合に限られます。Brain の ¥1,000・1,000部、note の ¥39,800・130部がその例で、どちらも部数は販売者の自己申告です ([osaruproducer](https://osaruproducer.substack.com/p/1000aiclaude-code)、[note](https://note.com/masa_wunder/n/nf1aa9aa90f1c))。Zenn の有料本で例外的に読まれたのは、Agent SDK の本（¥500・like 100）のように、無料の情報がまだ少ない具体的な技術テーマでした ([Zenn API](https://zenn.dev/api/books?topicname=claudecode&order=latest))。

チームの予算管理にも、予算を持つ買い手はいます。Uber が2026年の AI 予算を4か月で Claude Code に使い切ったという話は、Hacker News で402ポイントを集めました ([HN](https://news.ycombinator.com/item?id=47976415))。ただ、この市場は営業活動が必要で、公式の分析機能とも競合するため、今の工房の形には合いません。

ここまでのデータから、ブランドも SNS の読者も持たない売り手が戦える場所は一つに絞れます。毎日の具体的な不満を一つ解決する小さなソフトを、¥1,000前後で売ることです。

日本の読者層には、もう一つ見逃せない特徴があります。Zenn の claudecode トピックで最も like を集めた記事は「Claude Codeで『AI部下10人』を作ったら」（1,803 like）です ([Zenn](https://zenn.dev/shio_shoppaize/articles/5fee11d03a11a1))。note の新着にも「AI社員○人」系の設定記事が並んでいます（¥500〜2,100 で、スキは一桁） ([note API 新着順](https://note.com/api/v3/hashtags/ClaudeCode/notes?order=new&paid_only=true&page=1))。こうした並列運用は、先の表にある4.2〜7倍の消費の増え方をそのまま招く使い方です。この層が上限の悩みを最も強く感じていると推定できます。

## 売り場は BOOTH、集客は無料記事、商品名に「Claude Code」は使わない

| 販路 | 手数料 | ¥3,000 の商品が1件売れたときの手数料（出金費用を除く） | 向いているもの |
|---|---|---|---|
| BOOTH | 価格×5.6%＋45円。振込手数料200円か300円 ([BOOTH](https://booth.pixiv.help/hc/ja/articles/115004576874)) | 約213円（7.1%） | zip・ソフトの買い切り |
| note | 決済手段ごとの事務手数料（カード5%、携帯キャリア15%など）＋残額の10%。振込手数料270円 ([note](https://www.help-note.com/hc/ja/articles/360011358873)) | カード435円（14.5%）、キャリア705円（23.5%） | 解説記事とファイルをまとめて売る |
| Zenn（本） | 3.6%＋残額の10%。振込手数料350円 ([Zenn FAQ](https://zenn.dev/faq/sales)) | 約397円（13.2%） | 文章（本）。ファイルを配る場ではない |
| Polar | 5%＋50¢。米国外のカードは＋1.5%。出金費用は別 ([Polar](https://polar.sh/resources/pricing)) | — | 継続課金、非公開 GitHub リポジトリへの自動招待、ライセンスキー ([Polar Docs](https://polar.sh/docs/features/benefits/introduction)) |
| Gumroad | 直販10%＋50¢、Gumroad 内の Discover 経由は30% ([Gumroad](https://gumroad.com/pricing)) | — | 海外向け |
| Lemon Squeezy | 5%＋50¢。Stripe への移行期 ([Lemon Squeezy](https://www.lemonsqueezy.com/pricing)) | — | ライセンスキー |

note では、有料記事に1ファイル50MBまでのファイル（zip など）を添付して売れます ([note ヘルプ](https://www.help-note.com/hc/ja/articles/360016349894))。ただし手数料は最も高く、¥1,000 の記事がカード決済で1本売れて出金すると、手元に残るのは585円です ([note ヘルプ](https://www.help-note.com/hc/ja/articles/360011358873))。メンバーシップは月額課金だけです。退会者を Slack や Discord などの外部サービスから自動で外す機能もないので、GitHub リポジトリへの招待と解除は手作業になります ([note FAQ](https://www.help-note.com/hc/ja/articles/900000164086))。zip を売るなら返金は「不可」に設定します。売上を公開して購入を煽る書き方（利用停止の理由になる）や、「必ずもうかる」といった誤解を招く表現（禁止事項）も避けてください ([note 利用規約](https://terms.help-note.com/hc/ja/articles/44943817565465))。

海外の決済代行（Polar・Gumroad・Lemon Squeezy）は、購入者側の国の税金をまとめて処理してくれます。ただし、日本の銀行口座へ出金できる条件は、今回の調査では公式ページで確認できませんでした。国内向けの買い切りなら、BOOTH で売り、note と Zenn には無料の解説記事を置いて BOOTH へ誘導する形が、手数料と前の節の市場データの両面から見て最も合理的です。

届け方の技術面も整理しておきます。Claude Code のプラグインは、`.claude-plugin/marketplace.json` を置いた git リポジトリで配ります。リポジトリを非公開にすれば、マーケットプレイスも非公開になります ([Claude Code Docs](https://code.claude.com/docs/en/plugins/publish))。zip（`archive`）で配り、`headersHelper` で認証ヘッダーを付けて購入者だけに限る方法もありますが、利用者はインストールと更新のたびに承認が必要です ([Claude Code Docs](https://code.claude.com/docs/en/plugins/host-marketplace))。いちばん手軽なのは、zip を `~/.claude/skills/` に置くか `--plugin-dir` で読み込んでもらう形ですが、この場合は自動更新されません ([Claude Code Docs](https://code.claude.com/docs/en/plugins/publish))。

SKILL.md や hook はただのテキストファイルで、購入者の手元に完全な形で残ります。再配布を技術的に防ぐ方法はありません。商品の価値は「Claude Code の更新に合わせて直し続けること」に置き、価格はコピーされる前提で低めにします。

規約については、利用者が自分の環境で、改変していない Claude Code の中で動かす skills・hook・MCP サーバー・ローカルのツールなら、売っても問題になりません。禁止されているのは次のような行為です。Claude.ai の認証情報やセッショントークンを集める・保存する・中継すること。他人の要求をサブスクの資格で Claude に流すこと。Claude の利用を再販・中継することです。Anthropic は「予告なしに」取り締まると明記しています ([Claude Code Docs: Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance))。実際に、2026年1月9日には公式アプリ以外でのサブスク認証（OAuth）が遮断され ([GIGAZINE](https://gigazine.net/gsc_news/en/20260220-anthropic-third-party-block))、4月4日には OpenClaw などの他社製の実行環境がサブスクの利用枠から外されました ([InfoWorld](https://www.infoworld.com/article/4154435/anthropic-cuts-openclaw-access-from-claude-subscriptions-offers-credits-to-ease-transition.html))。また、**商品名やロゴに「Claude Code」「Anthropic」を使うことは認められていません** ([Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance))。

OSS を組み込む場合のライセンスも確認しておきます。ccusage と Repomix は MIT ライセンスなので、著作権表示を残せば同梱できます ([ccusage LICENSE](https://raw.githubusercontent.com/ryoppippi/ccusage/main/apps/ccusage/LICENSE))。Serena は v2 から GPL-3.0-or-later に変わりました（最後の MIT 版は v1.7.0）。同梱すると購入者に再配布の自由が生じるので、ソースを閉じた有料商品にはできません ([Serena LICENSE](https://raw.githubusercontent.com/oraios/serena/main/LICENSE))。

## 推奨: 「節約余地診断」を無料で出し、数字が出てから有料版を作る

| 順位 | 案 | 主な対象 | 形と価格 | 売れると考える根拠 | 最大のリスク |
|---|---|---|---|---|---|
| 1 | 節約余地診断（手元で完結、トークン消費ゼロ） | 上限に当たる Pro・Max の個人 | 無料ブラウザ版 → 有料ローカル版 ¥980〜1,480 の買い切り（BOOTH） | 上限の悩みが最も大きい。$7〜9 の使用量アプリに購入実績がある | 標準の /usage・/insights の強化 |
| 2 | A/B 実測キット | 節約ツールを入れた人、チームで導入を判断する人 | 無料記事＋MIT スクリプト → 有料の Zenn 本 ¥500〜1,000 | 対照実験をする道具が存在しない | 市場が狭い、計測に費用がかかる、規約上グレーな部分 |
| 3 | サブエージェント予算ガード | 並列運用・「AI部下」型の利用者 | 1位の有料版に同梱 | 消費が4.2〜7倍に増える。任せる前の見積もり機能が標準にない | 標準機能になりやすい、テキストなのでコピーが容易 |

### 1位: 節約余地診断（手元のパソコンだけで動き、トークンを使わない）

**対象**は、Pro・Max で上限に当たる個人です。特に、サブエージェントや並列セッションを多用する人を想定します。

**何をするか**: 手元のセッション履歴（JSONL）を読み、消費を「履歴の再送」「固定費（CLAUDE.md・MCP・skills）」「サブエージェント」「キャッシュ切れ後の再書き込み」に分けます。そのうえで、セッションのどこで消費が膨らんだかを時系列で示し、「この地点で /clear していれば約○トークン少なかった」「この分割は単独で実行した場合の約○倍」「CLAUDE.md のこの節は毎回○トークン」と、もしこうしていたら減った量と直し方を出します。減った量は仮定を置いた推定なので、仮定と幅を必ず画面に表示します。「節約したい」という依頼者の動機に、測れる形で応える道具です。

**なぜ既存のもので足りないか**: 標準の /usage は分類ごとの内訳と、10%以上を占める行動（長い文脈やキャッシュ切れ）への警告を出します。ただしこれは「この機械のセッション履歴からの近似」で、どこで何をすべきだったかという処方までは出しません。/insights は最大200セッションの使い方を分析しますが、分析そのものが上限を消費します ([Manage costs](https://code.claude.com/docs/en/costs))。/context にも改善提案はありますが、対象は今の文脈に何が載っているかです。ccusage などの集計ツールは合計と推移を見る道具です。ccusage については、サブエージェントのファイルを数えておらず、出力を77〜94%少なく数えているという第三者の指摘もあります（検証されていない主張です） ([skills.sh](https://skills.sh/tdimino/claude-code-minoan/claude-usage))。手元で同じ入力から同じ結果を計算し、トークンを使わずに処方まで出す道具は、今回の調査では見つかりませんでした。ログにはコードやプロンプトが含まれるので、「外部に送らない」こと自体が売りになります。有料の使用量アプリもこの点を訴えています ([SessionWatcher](https://sessionwatcher.com/claude))。

**形・販路・価格**: 無料版は、ツール工房のサイトにブラウザだけで動くページとして置きます。ファイルを読み込ませるだけで外部には送らないので、サイトの方針とそのまま合います。有料版は、履歴を直接読み込み、複数のプロジェクトや期間をまとめて診断し、設定の書き換え案（サブエージェントのモデル指定や hook）まで出すローカルアプリ（単一の実行ファイル＋HTML レポート）にします。これを BOOTH で ¥980〜1,480 の買い切りで売ります。価格の目安は SessionWatcher と Usagebar の $6.99〜9 です。

売上の目安も計算しておきます。¥1,200 で BOOTH に出すと、1本あたりの手取りは約 ¥1,088 です。50本で約5.4万円、100本で約10.9万円、300本で約32.6万円になります（振込手数料と税は含みません）。何本売れるかを推定できるデータはありません。英語で、Mac と Windows に対応し、3つのツールをまとめて見られる SessionWatcher で1,504ユーザーです。日本語だけの新しい商品なら、年に100本売れれば上出来だと見ています（私の推定です）。

**主なリスク**: 最も大きいのは標準機能の強化です。/usage は5月に内訳表示、8〜9月にキャッシュの統計、10月にアイドル時の自動圧縮と、ほぼ毎月よくなっています。上限の計算でのトークンの重み付けが公開されていないため、「上限の何%」とは言えず、トークン数と API 料金への換算で示すしかありません。ログの形式は Claude Code の更新で変わることがあり、そのたびに対応する手間がかかります。規約の面では、ローカルの履歴を読むだけにとどめ、認証情報には触れず、Claude も呼び出しません。商品名には「Claude Code」を入れず、「（Claude Code 用）」と対応環境を説明する程度にします。ただし、どこまで許されるかの公式な基準は確認できていません。ccusage のコードを流用する場合は、MIT ライセンスの表示を残します。

**安く需要を確かめる方法**: まず無料版だけを作り、BOOTH にも無料で置いて3か月様子を見ます。見る数字は、サイトのページの PV、Search Console の検索クエリ、BOOTH の無料版のダウンロード数とスキです。比較の基準には、BOOTH で無料配布されている「Claude使用量表示アプリ」のスキ17を使います ([BOOTH](https://vtool.booth.pm/items/8016870))。これを下回るなら有料版は作りません。この基準は私の判断です。

### 2位: 節約ツール・設定の A/B 実測キット

**対象**は、rtk・caveman・Serena などを入れた人、入れるか迷っている人、チームで道具の採用を決める人です。

**何をするか**: 同じタスク群を、設定ありとなしでそれぞれ数回ずつ `claude -p --output-format json` で実行します。キャッシュ読み込みを含めた費用換算のトークン数、やり取りの回数、タスクに正解したかどうかを比べ、差が誤差の範囲かどうかを判定してレポートにします。日本語のタスクセットも付けます。

**なぜ既存のもので足りないか**: 人気の節約ツールに対照実験の機能はありません。各ツールの節約カウンターは、自分が削った量しか数えていません（rtk の「99.8%節約」が典型例です）。信頼できる比較は JetBrains・Badgerworks・dev.to のブログ記事にしかなく ([Badgerworks](https://www.badgerworks.co.uk/posts/saving-token-spend/))、日本語のプロンプトでまとまった数を計測した例は見つかりませんでした。

**形・販路・価格**: まず無料で始めます。主要なツールを日本語のタスクで測った記事を、負けた結果も含めてすべて公開し、スクリプトも MIT ライセンスで公開します。反応があれば、手法・タスクセット・Claude Code の更新ごとの再計測結果をまとめて、有料の Zenn 本（¥500〜1,000）にします。Zenn の有料本はほとんど売れていませんが、無料の情報が少ない具体的な技術テーマは例外です。

**主なリスク**: 市場が狭く、有料にできる部分が小さいことです。計測自体にもお金がかかります。JetBrains は425回の試行に約 $320 を使いました ([財経新聞](https://www.zaikei.co.jp/article/20260722/862344.html))。サブスクの契約でスクリプトから大量に実行することは、一般利用者向け規約の「自動化された手段でのアクセス」の禁止 ([Consumer Terms](https://www.anthropic.com/legal/consumer-terms)) に照らすとグレーです。そのため、計測には API キーを使うよう案内します（この線引きは私の判断です）。結果はタスクによって変わるので、「あなたの作業でも同じ結果になる」とは書けません。

**安く需要を確かめる方法**: 無料の実測記事を1本出して反応を見ます。比較の目安は、Zenn の Serena 紹介記事の834 like ([Zenn](https://zenn.dev/sc30gsw/articles/ff81891959aaef)) と、Qiita の Headroom 紹介記事の158 like ([Qiita](https://qiita.com/shinkai_/items/61b10d10c63db47a64e7)) です。1本目が Zenn で100 like に届かなければ有料本は作らず、記事を更新し続けてサイトへの集客に使います（この基準も私の判断です）。

### 3位: サブエージェント予算ガード（単体では売らない）

**対象**は、「AI部下10人」のような並列運用をしている人です。

**何をするか**: サブエージェントを起動する直前に動く hook で、起動する数と固定費から追加の消費を見積もります。決めた上限を超える分割は止めるか、確認を求めます。サブエージェントのモデル、`maxTurns`、`omitClaudeMd` を決めた方針どおりに強制し、作業が終わったらサブエージェントごとの消費を報告します。

**なぜ既存のもので足りないか**: 標準機能には、/usage による後からの内訳確認と、`CLAUDE_CODE_SUBAGENT_MODEL` などの個別の設定があります。しかし、任せる前に「分けると得か損か」を見積もる機能や、任せる単位ごとの上限はありません ([Manage costs](https://code.claude.com/docs/en/costs))。

**形・販路・価格**: 1位の有料版に同梱します。単体の hook 集は BOOTH でスキ1〜3、note の「AI社員」設定記事もスキは一桁なので、単体では売りません。

**主なリスク**: 3つの案の中で、最も標準機能に取り込まれやすい案です。`--max-budget-usd` やゴールのチェックイン回数の上限など、予算を絞る機能はすでに一部あります ([Manage costs](https://code.claude.com/docs/en/costs))。hook はテキストファイルなので、コピーも簡単です。止めすぎると、作業を任せることで得られる品質の利点まで失います。

**安く需要を確かめる方法**: hook を1本だけ、GitHub と Zenn の記事で無料公開し、スターと like の数で関心を測ります。

### 作らないほうがよい案

| 案 | 避ける理由 |
|---|---|
| 汎用の圧縮、簡潔出力、Bash 出力フィルタ、画像化（依頼者の当初案を含む） | 無料 OSS が数万〜11万スターで先行している。独立計測の結果は −8.5%〜+196.7% で、標準機能にも取り込まれつつある |
| 使用量を表示するだけの道具（ステータスライン・CLI） | ccusage が週36.5万ダウンロード。ほかに ccstatusline・claude-hud もあり、標準の /usage もある ([npm](https://api.npmjs.org/downloads/point/last-week/ccusage)) |
| 中継サーバー・モデルの振り分け・「無料トークン」系、サブスク認証を扱う外部アプリ | 認証情報の中継と再販は禁止されている。2026年1月と4月に予告なしで遮断された |
| 複数アカウントの切り替え | 約1,100リアクションの要望が2件あるほど関心は高い ([#18435](https://github.com/anthropics/claude-code/issues/18435))。しかしアカウントの共有は禁止されており ([Consumer Terms](https://www.anthropic.com/legal/consumer-terms))、予備の枠として使う用途はグレー |
| CLAUDE.md・hook・AI社員の設定パック単体 | BOOTH でスキ1〜3、Zenn の有料本は like の中央値が0。テキストなのですぐにコピーされる |
| コードの索引・ドキュメント取得・記憶 | codegraph・Serena・Context7（週121万ダウンロード）・claude-mem が無料で先行しており、資金のある企業も参入している ([npm](https://api.npmjs.org/downloads/point/last-week/%40upstash%2Fcontext7-mcp)) |
| 「Claude Code ○○」という商品名、「月○万円」「上限が来なくなる」という訴求 | 名称の使用は認められていない。note の禁止事項と利用停止の理由に当たる。情報商材と同じ括りで批判されている |

Claude Code の「節約」に払われるお金の大半は、追加の利用枠や上位プランの形で Anthropic に入るか、知名度のある売り手のノウハウ記事に入っています。道具を作る側に残る取り分は小さいというのが、今回のデータからの正直な結論です。

それでも、1位の無料診断はツール工房にとって損のない一手です。外部に送らないブラウザだけのツールというサイトの型にそのまま合い、有料版を作らずに終わっても、上限や使用量を調べる人の検索需要を受け止める資産として残ります。Claude Code の有料市場が情報商材と同じ目で見られている今は、「数字を盛らずに測る」こと自体が他との違いになります。この強みを生かすには、「月○万円」と並ぶ note の有料欄で売るより、無料記事で信頼を集めて BOOTH で小さく売るほうが合っています。有料版を作るかどうかは、スターや「いいね」ではなく、無料の診断が実際に使われたかどうかで決めてください。
