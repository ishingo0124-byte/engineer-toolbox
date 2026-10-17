# Existing third-party token-saving / context-efficiency tools for Claude Code (as of 2026-10-17)

Data-collection notes:
- GitHub stars and last-push dates come from the GitHub search API on **2026-10-17**. Some rows show only `updated_at`, which includes star activity, so I do not report a last commit date for those.
- npm weekly downloads come from `api.npmjs.org/downloads/point/last-week/<pkg>` and cover **2026-10-06 to 2026-10-12**. PyPI figures come from pypistats.org (`recent`).
- **Claimed** means the tool's own README, marketing or author benchmark. **Measured (independent)** means a third party ran it. Treat every number without that label as a claim.

---

## Q1. Which tools exist in each category, and how popular are they?

### Takeaway
Every category asked about is crowded with free OSS, and several categories contain projects with tens of thousands of stars. The biggest names by stars are obra/superpowers (~301k), caveman (~113k), claude-mem (~101k), rtk (~84k), OmniRoute (~77k), codegraph (~74k), Context7 (~63k) and LiteLLM (~61k). By real install volume (npm weekly downloads), Context7 MCP (~1.21M/week), ccusage (~365k/week), codegraph (~129k/week), repomix (~98k/week) and ccstatusline (~74k/week) lead. Stars and downloads often disagree badly, so stars are a weak signal of adoption.

### Cited Findings

**A. Usage / cost monitoring (statuslines, dashboards, menubar apps)**
- ccusage (`npx ccusage`; the repo now lives under the ccusage org): 19,039 stars, pushed 2026-10-17. npm: **364,993/week, 877,566/month**. It is the de facto standard CLI for analysing local Claude Code JSONL logs — [GitHub](https://github.com/ccusage/ccusage); [npm API](https://api.npmjs.org/downloads/point/last-week/ccusage)
- jarrodwatts/claude-hud: 28,605 stars, pushed 2026-10-17. Plugin showing context usage, active tools, running agents and todo progress — [GitHub](https://github.com/jarrodwatts/claude-hud)
- sirmalloc/ccstatusline: 13,311 stars. npm **73,946/week** — [GitHub](https://github.com/sirmalloc/ccstatusline); [npm API](https://api.npmjs.org/downloads/point/last-week/ccstatusline)
- getagentseal/codeburn: 11,488 stars, created 2026-04. "Free, local tool to track AI coding token usage and cost across 37 tools". npm **7,666/week** — [GitHub](https://github.com/getagentseal/codeburn)
- Maciek-roboblog/Claude-Code-Usage-Monitor: 8,746 stars, **last push 2026-07-05 (possibly slowing)**. PyPI `claude-monitor` 1,530/week — [GitHub](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor); [pypistats](https://pypistats.org/api/packages/claude-monitor/recent)
- Other 2026 entrants:
  - kenn-io/agentsview: 6,130 stars
  - matt1398/claude-devtools: 3,983 stars
  - graykode/abtop ("htop for AI coding agents"): 3,752 stars
  - Javis603/token-monitor: 3,154 stars
  - phuryn/claude-usage: 2,274 stars
  - xiufengsun/TokenTracker: 2,067 stars
  - mikehasa/agentacct: 766 stars
  - nateherkai/token-dashboard: 729 stars
  - daniel3303/ClaudeCodeStatusLine: 612 stars
  - stormzhang/token-tracker (Chinese/English): 532 stars
  - Owloops/claude-powerline: 1,174 stars, 4,623 npm/week

  All are free or local-first — [GitHub search results](https://github.com/search?q=token+claude&type=repositories&s=stars)
- Paid menubar app SessionWatcher: tracks the 5-hour and weekly limits, alerts at 70% and 90%, gives token and cost breakdowns, and runs on Mac and Windows. Its site claims "Trusted by 1,504+ users" — [sessionwatcher.com](https://sessionwatcher.com/claude)
- Free or OSS menubar alternatives exist: ClaudeBar, Usage4Claude (MIT), CCSeva, Claude-Pulse and ClaudeUsageTracker — [alternativeto / search summary](https://alternativeto.net/software/codeburn/)
- Built-in features overlap with all of the above. `/usage` shows remaining 5-hour and weekly quota, reset time and burn rate, and `/context` shows what fills the context window — [Claude Code docs (costs)](https://code.claude.com/docs/en/costs); [oldeucryptoboi guide](https://oldeucryptoboi.substack.com/p/claude-code-usage-limits-guide)

**B. Codebase indexing / semantic search / symbol-level retrieval**
- colbymchenry/codegraph: **74,312 stars** (created 2026-01). npm `@colbymchenry/codegraph` **128,535/week**. It is a pre-indexed SQLite/FTS5 code knowledge graph with a single `codegraph_explore` MCP tool. MIT. A hosted "CodeGraph platform" is in beta behind a waitlist — [GitHub](https://github.com/colbymchenry/codegraph)
- oraios/serena: 30,339 stars, pushed 2026-10-15. PyPI `serena-agent` **43,802/week**. LSP-based semantic retrieval and editing toolkit — [GitHub](https://github.com/oraios/serena); [pypistats](https://pypistats.org/api/packages/serena-agent/recent)
- zilliztech/claude-context: 12,619 stars, but **last push 2026-07-14**. npm `@zilliz/claude-context-mcp` is only **556/week**. It needs OpenAI embeddings plus Zilliz/Milvus — [GitHub](https://github.com/zilliztech/claude-context); [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)
- Smaller tools:
  - vitali87/code-graph-rag: 5,263 stars
  - jgravelle/jcodemunch-mcp: 2,778 stars. Claims "Cut AI token costs 95%+", "313B+ tokens saved"
  - isaacphi/mcp-language-server: 1,610 stars, last push 2026-03-01 (stale)
  - Houseofmvps/codesight: 1,417 stars
  - Mibayy/token-savior: 1,182 stars
  - johnhuang316/code-index-mcp: 1,004 stars
  - ktnyt/cclsp: 675 stars, last push 2026-02-22 (stale)
  - defendend/Claude-ast-index-search: 575 stars. Claims "~40-50% economy tokens"
  - ast-grep/ast-grep-mcp: 479 stars

  — [GitHub](https://github.com/oraios/serena) and the search results above
- Commercial: Augment **Context Engine MCP** launched on 2026-02-06 for any MCP agent, including Claude Code. It has a local mode (Auggie CLI) and a remote hosted mode. The vendor claims "80% improvement" for Claude Code with Opus 4.5 on 300 Elasticsearch PRs — [Augment changelog](https://www.augmentcode.com/changelog/context-engine-mcp-in-ga); [Augment blog](https://www.augmentcode.com/blog/context-engine-mcp-now-live)

**C. Codebase packing / summarization**
- yamadashy/repomix: 28,872 stars. npm **98,074/week** — [GitHub](https://github.com/yamadashy/repomix)
- coderamp-labs/gitingest: 15,940 stars — [GitHub](https://github.com/coderamp-labs/gitingest)
- Aider-AI/aider (repo-map originator): 49,594 stars, but **last push 2026-05-22** — [GitHub](https://github.com/Aider-AI/aider)

**D. Documentation fetchers**
- upstash/context7: 63,181 stars. npm `@upstash/context7-mcp` **1,212,373/week, 2,916,965/month**, the highest install volume of any tool in this survey — [GitHub](https://github.com/upstash/context7); [npm API](https://api.npmjs.org/downloads/point/last-week/%40upstash%2Fcontext7-mcp)

**E. Output compression / filtering of Bash, test and log output**
- rtk-ai/rtk ("Rust Token Killer"): **83,674 stars** (created 2026-01-22). A PreToolUse hook rewrites `git status` into `rtk git status`. Claims "60-90%". "The hook only fires on Bash tool calls", so Read, Grep and Glob bypass it. Supports 18 agents — [GitHub](https://github.com/rtk-ai/rtk)
- mksglu/context-mode: 30,379 stars (created 2026-02-23). npm **24,527/week**. Runs tool output in a sandbox and keeps only stdout in context, with SQLite FTS5/BM25 retrieval and session memory after compaction. Claims "315 KB becomes 5.4 KB. 98% reduction." Licensed ELv2 (source-available) — [GitHub](https://github.com/mksglu/context-mode)
- caveman's CLI (`@caveman-ai/cli`, 14,626 npm/week) includes a "Read less" input compressor for logs, JSON, CSV and test output — [GitHub](https://github.com/JuliusBrussee/caveman)
- Smaller tools:
  - ojuschugh1/sqz: 649 stars
  - ooples/token-optimizer-mcp: 550 stars, 206 npm/week. Uses Brotli compression and a SQLite cache
  - gglucass/headroom-desktop: 603 stars. Menubar app claiming "~50%"
  - Headroom itself (Apache-2.0, by Tejas Chopra): `headroom wrap claude`. Claims 60-95% on compressible traffic
  - sliday/tamp: claims "50% fewer tokens"
  - apolloraines/ClaudeSlim: claims 60-85%

  — [GitHub search](https://github.com/topics/token-optimization); [noqta.tn on Headroom](https://noqta.tn/en/blog/headroom-ai-context-compression-token-cost-reduction-2026); [tamp](https://github.com/sliday/tamp); [ClaudeSlim](https://github.com/apolloraines/claudeslim)
- teamchong/pxpipe: 7,522 stars. "cut Claude Code token usage by rendering text context as images" — [GitHub](https://github.com/teamchong/pxpipe)

**F. Memory / persistent context / CLAUDE.md optimizers**
- thedotmack/claude-mem: **101,286 stars**. npm 18,247/week. It records sessions through hooks and injects compressed observations in later sessions — [GitHub](https://github.com/thedotmack/claude-mem)
- mem0ai/mem0: 67,333 stars (general agent memory) — [GitHub](https://github.com/mem0ai/mem0)
- tobi/qmd (local doc/notes search engine, used for agent memory): 30,453 stars — [GitHub](https://github.com/tobi/qmd)
- Smaller memory tools:
  - basicmachines-co/basic-memory: 4,255 stars, AGPL
  - cytostack/openwolf: 2,394 stars
  - doobidoo/mcp-memory-service: 2,021 stars
  - lucasrosati/claude-code-memory-setup: 1,025 stars. Claims "Up to 71.5x fewer tokens"
  - GreatScottyMac/context-portal: 767 stars, last push 2026-01-27 (stale)
  - raiyanyahya/recall: 758 stars

  — GitHub search results as above
- CLAUDE.md slimmers:
  - drona23/claude-token-efficient: 6,094 stars. One 619-byte CLAUDE.md
  - nadimtuhin/claude-token-optimizer: 621 stars. The April 2026 review called it unmaintained; the repo shows activity again in October 2026
  - alexgreensh/token-optimizer: Claude Code plugin under PolyForm Noncommercial

  — [GitHub](https://github.com/drona23/claude-token-efficient); [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)

**G. Model routing / cheaper-model fallback / proxies**
- musistudio/claude-code-router: 37,711 stars. npm **45,721/week** — [GitHub](https://github.com/musistudio/claude-code-router)
- BerriAI/litellm: 61,420 stars. Its docs include a "Claude Code cut costs" tutorial that pairs it with a Headroom sidecar — [GitHub](https://github.com/BerriAI/litellm); [LiteLLM docs](https://docs.litellm.ai/docs/tutorials/claude_code_cut_costs)
- 2026 "free tokens" gateways:
  - diegosouzapw/OmniRoute: **77,489 stars**. Advertises "RTK+Caveman compression saves 15-95% tokens"
  - Alishahryar1/free-claude-code: 61,109 stars
  - decolua/9router: 30,941 stars, 2,620 open issues. Advertises "RTK -40% tokens"

  — [OmniRoute](https://github.com/diegosouzapw/OmniRoute); [free-claude-code](https://github.com/Alishahryar1/free-claude-code); [9router](https://github.com/decolua/9router); [vibecoding.app on gateways and terms](https://vibecoding.app/blog/free-tokens-for-claude-code-and-codex)
- Older proxies:
  - 1rgs/claude-code-proxy: 3,757 stars
  - fuergaosi233/claude-code-proxy: 2,799 stars, last push 2026-03-12 (stale)
  - snipeship/ccflare: 1,052 stars, last push 2026-04-19

  — GitHub search results as above

**H. Framework / prompt packs**
- obra/superpowers: **300,920 stars**
- gsd-build/get-shit-done: 64,285 stars, last push 2026-05-31
- bmad-code-org/BMAD-METHOD: 54,243 stars
- wshobson/agents: 40,943 stars
- Yeachan-Heo/oh-my-claudecode: 39,987 stars
- davila7/claude-code-templates: 32,703 stars
- VoltAgent/awesome-claude-code-subagents: 25,778 stars
- SuperClaude_Framework: 23,906 stars. Advertises a "Token-Efficiency mode" with 30–50% context savings
- JuliusBrussee/caveman: **113,142 stars** (created 2026-04-04). Terse-output skill plus proxy
- Smaller output-style packs:
  - alexgreensh/attention-span: 1,465 stars
  - JayPokale/Chisle: 679 stars. Notable because it publishes "benchmarks including the runs it loses"

— [GitHub search results](https://github.com/obra/superpowers); [Lumadock on SuperClaude](https://lumadock.com/tutorials/superclaude-framework)
- Curated list: hesreallyhim/awesome-claude-code has 55,871 stars — [GitHub](https://github.com/hesreallyhim/awesome-claude-code)

**I. Prompt compression (LLMLingua-like)**
- microsoft/LLMLingua: 6,756 stars. A research library that is not Claude Code-specific — [GitHub](https://github.com/microsoft/LLMLingua)
- toon-format/toon: 25,507 stars. A compact JSON alternative for LLM prompts — [GitHub](https://github.com/toon-format/toon)
- Paritok-official/paritok-4b-v1: 1,460 stars (created 2026-07). A "compression gateway" powered by a 4B code model. Claims 25% on turn 1, rising past 85% in long sessions — [GitHub](https://github.com/Paritok-official/paritok-4b-v1)

**Japanese ecosystem**
- InterfaceX-co-jp/genshijin ("原始人"): 332 stars. A Japanese port of caveman tuned for Japanese-specific verbosity — [GitHub](https://github.com/InterfaceX-co-jp/genshijin)
- Japanese comparison and how-to articles:
  - ai-heartland.com 5-tool comparison: published 2026-04-23, updated 2026-10-14 — [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/)
  - RTK guide — [ai-heartland RTK](https://ai-heartland.com/ai/claude/rtk/)
  - Zenn: okamyuji survival guide, dx_pm_product cost-reduction guide, amu_lab "最大90%削減" guide — [Zenn okamyuji](https://zenn.dev/okamyuji/articles/claude-code-token-limit-survival-guide); [Zenn dx_pm_product](https://zenn.dev/dx_pm_product/articles/ai-token-cost-reduction-guide); [Zenn amu_lab](https://zenn.dev/amu_lab/articles/claude-code-token-reduction-guide-2026)
  - Qiita: rairaii, RTK + caveman — [Qiita](https://qiita.com/rairaii/items/0ea0ebf709eb00230b93)
  - note: "10 free tools" — [note](https://note.com/matomechannel/n/nd2d83fb30fda?hl=en)
  - sakutto.ai: breakdown of startup tokens — [sakutto.ai](https://sakutto.ai/articles/claude-code-startup-token-overhead)
  - Zaikei: news coverage of the JetBrains rtk test (2026-07-22) — [Zaikei](https://www.zaikei.co.jp/article/20260722/862344.html)
- Serena effect tests in Japanese: an A/B fix of a Streamlit issue with and without Serena, plus a mixi engineering write-up. I could not extract their numbers — [Zenn hcproduce](https://zenn.dev/hcproduce_blog/articles/42aac2f761b32d); [Zenn mixi](https://zenn.dev/mixi/articles/4b77baf024d8fc)

### Inferences
- Stars are a poor proxy for usage in 2026:
  - claude-context has 12.6k stars but about 556 npm installs a week.
  - caveman has 113k stars but 14.6k CLI installs a week (skill installs through `npx skills add` are not counted).
  - Several 2026 repos reached 30k–113k stars within months.
  - Possible star inflation, or "viral but not used" patterns, should be assumed. Download counts (npm/PyPI) are the better adoption signal, though they also include CI and bot traffic.
- Real adoption is concentrated in a few tools: Context7, ccusage, codegraph, repomix, ccstatusline, serena, claude-code-router and context-mode.
- Several earlier tools look stale (last push in the first half of 2026): claude-context, Claude-Code-Usage-Monitor, mcp-language-server, cclsp, context-portal, fuergaosi233 proxy, aider. This suggests churn as Claude Code ships native features.

### Gaps
- I could not use the GitHub REST API (the session proxy blocked it), so issue counts and commit histories beyond `pushed_at` were not collected.
- I did not get download counts for skill and plugin installs through the Claude Code plugin marketplace or `npx skills`. No public counter was found.
- No reliable X/Twitter or Reddit mention counts were gathered.
- DeepWiki MCP, Nia and Ref.tools were not covered. The ref.tools page fetched only showed an unrelated tagline.

---

## Q2. Are there independent benchmarks or credible user reports of actual savings, or of tools making things worse?

### Takeaway
Independent paired A/B tests consistently find real savings far below advertised figures. The main tests are JetBrains SkillsBench (July 2026), a dev.to author's test (October 2026) and computingforgeeks (April 2026).
- rtk: around 0% to **+7.6% cost**.
- caveman: −8.5% output tokens, or net cost increase.
- pxpipe: **+197%**.
- Ponytail: about −10% cost versus −20% claimed.

The tools that do show sizeable measured savings work on how many files and turns the agent reads, not on squeezing text: symbol navigation (token-savior −43%, a single-task test), a minimal CLAUDE.md (−40%), and a code graph (CodeGraph, self-reported −44% cost). Fixed overhead — always-loaded context, MCP tool definitions and rule text — is a major hidden cost that many "saver" tools add to.

### Cited Findings

**JetBrains SkillsBench series (Denis Shiryaev, July 2026)**
- rtk setup: Claude Code 2.1.201 with claude-sonnet-5, 425 paid trials, about $320 compute. The low-effort arm used 80 matched task pairs — [Zaikei (JP coverage of JetBrains, 2026-07-22)](https://www.zaikei.co.jp/article/20260722/862344.html)
- rtk results at low effort: median cost per task **+7.6% (p=0.004)**, turns +13.8% (p=0.03), cache reads +14.3% (p=0.008) — [Zaikei](https://www.zaikei.co.jp/article/20260722/862344.html)
- rtk results at high effort: cost +0.1% (p=0.99). Quality showed no significant difference at either effort level (sign test p=1.0) — [Zaikei](https://www.zaikei.co.jp/article/20260722/862344.html)
- The rtk hook rewrote only **33–50% of detected Bash calls** — [Zaikei](https://www.zaikei.co.jp/article/20260722/862344.html)
- rtk's own dashboard (`rtk gain`) reported about **96.2M tokens saved (99.8%)** over the same runs where the bill went up. It measures against the untruncated raw output, estimates tokens as chars/4, and ignores that most input cost is cache reads at 1/10 price — [Zaikei](https://www.zaikei.co.jp/article/20260722/862344.html); [Badgerworks](https://www.badgerworks.co.uk/posts/saving-token-spend/)
- JetBrains estimated that rtk's **theoretical maximum saving is about 3% of input tokens**:
  - Read and Grep bypass the Bash hook.
  - About half of shell commands are unsupported.
  - About 1/6 of Bash calls use pipes, heredocs or substitution, which rtk refuses to rewrite.
  - The remaining calls account for under 20% of tool-output characters.

  — [Zaikei](https://www.zaikei.co.jp/article/20260722/862344.html)
- caveman: measured **−8.5% output tokens** versus about 65% advertised, over 86 tasks with quality unchanged (p=0.82). Raw cost came out +11.6% because one task crossed a long-context pricing tier ($8.29 vs $0.33) — [Badgerworks summary of JetBrains](https://www.badgerworks.co.uk/posts/saving-token-spend/); [JetBrains blog rtk post](https://blog.jetbrains.com/ai/2026/07/rtk-claude-code-token-savings/) (403 when fetched; figures via secondary sources)
- Ponytail (a YAGNI "write less code" skill): measured −15% code, −10.3% cost and −11% time over 80 paired tasks. Advertised figures were −54% code, −22% tokens, −20% cost and −27% time — [JetBrains ponytail post via search summary](https://blog.jetbrains.com/ai/2026/07/ponytail-skill-claude-tested/); [MindStudio](https://www.mindstudio.ai/blog/claude-token-saving-plugins-tested)
- Ponytail had earlier retracted an 80–94% claim as based on a padded baseline. An independent four-task test helped on one vague task and produced the same or more tokens on three scoped tasks — [Badgerworks](https://www.badgerworks.co.uk/posts/saving-token-spend/)

**dev.to "Token-saving tools made my Claude Code usage go up" (2026-10-07)**
- Method: five fixed tasks, three runs each, `claude -p --output-format json`, cost-weighted tokens. Every run scored 15/15 correct — [dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)
- Results: rtk v0.51.0 **+7.1%**, caveman v3.1.0 **+10.9%**, pxpipe v0.14.0 **+196.7%** — [dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)
- Why usage went up — [dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk):
  - rtk cut output by about 63%, but Claude ran extra commands to see what was cut ("Fewer tokens per step can mean more steps").
  - caveman's rules added about 2,900 tokens to every call.
  - pxpipe's images raised first-call cache writes from about 27K to about 102K.
- Where the cost went: about **42% was always-loaded context** (system prompt, instructions, tool list). Command output was only about 6% — [dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)

**computingforgeeks (tested April 2026; Claude Code 2.1.116 with Sonnet 4.5, one "propose 3 improvements" task on sindresorhus/ky, baseline 284,473 tokens / $0.2666)**
- token-savior **−43%** tokens
- claude-token-efficient −40% tokens, the lowest cost at $0.1886
- caveman −37 to −38%
- token-optimizer-mcp −23%
- alexgreensh/token-optimizer −18%
- code-review-graph −5%
- rtk about 0%
- context-mode and claude-context were installed but not benchmarked

The author warns that this is a single task on a single repo. The tool manifests of token-savior (about 11K tokens) and token-optimizer-mcp (4–6K tokens) can cancel out savings on short tasks — [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)

**Contradiction on caveman**
- computingforgeeks measured −38% on one task. JetBrains measured −8.5% output tokens over 86 tasks. dev.to measured +10.9%.
- caveman's own README shows that a plain "Answer concisely" instruction already gets most of the gain: 4,334 output tokens, versus 4,119 with /caveman and 6,983 with no instruction. The README also admits the rules cost about 1,160 input tokens per call — [caveman README](https://github.com/JuliusBrussee/caveman)
- caveman reportedly narrowed its claim in v1.9.1 (2026-07-03) to a single 65% figure covering output tokens only — [Zenn/JP search summary](https://www.mindstudio.ai/blog/claude-token-saving-plugins-tested)

**Self-reported benchmarks (not independent)**
- CodeGraph, re-measured 2026-08-05 on Opus 4.8 across seven repos with four runs each and medians reported: **−62% tokens, −44% cost, −88% tool calls**.
  - Per-repo cost savings ranged from about 13% (Django) to 78% (Excalidraw); Gin was about even.
  - It leaves about 80% more retrieval context resident.
  - The project admits earlier figures were produced without blocking the CLI in the control arm.

  — [CodeGraph README](https://github.com/colbymchenry/codegraph)
- Token Savior (author data): a 90-task benchmark went from 1.55M to 804K tokens. Its 97% headline counts only "injected characters" on navigation operations — [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/)
- context-mode: 315 KB → 5.4 KB is a vendor example. I found **no independent benchmark** — [context-mode README](https://github.com/mksglu/context-mode); [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)
- Japanese self-measurement (Zenn amu_lab): RTK plus caveman/genshijin gave about 74% total. genshijin reported 80% output reduction on Japanese text versus 68% for caveman — [Zenn amu_lab via search](https://zenn.dev/amu_lab/articles/claude-code-token-reduction-guide-2026)

**Fixed overhead and evidence of tools making things worse**
- Claude Code startup cost (2.1.207, July 2026): about **33K tokens on the first request, of which about 24K are tool definitions**. OpenCode's equivalent is about 7K — [sakutto.ai](https://sakutto.ai/articles/claude-code-startup-token-overhead)
- On the same measurements: a 72KB CLAUDE.md adds about 20K tokens per request, five MCP servers add 5–7K per request, and a real first request reaches 75–85K — [sakutto.ai](https://sakutto.ai/articles/claude-code-startup-token-overhead)
- Splitting work across two subagents raised total tokens from 121K to 513K (about 4.2×) — [sakutto.ai](https://sakutto.ai/articles/claude-code-startup-token-overhead)
- Serena's tool definitions alone were measured at about 23,878 tokens by an unofficial slimmed fork, which claims a 50.3% cut (not independent) — [serena-slim on Glama](https://glama.ai/mcp/servers/mcpslim/serena-slim)
- Japanese sources note that Serena can be counter-productive on small repos because of its definition overhead — [search summary of JP sources](https://zenn.dev/okamyuji/articles/claude-code-token-limit-survival-guide)
- Claude Code's built-in **MCP Tool Search** defers tool definitions once they exceed 10% of the context window, and it is on by default.
  - A worked example cut 147 tools from about 90K tokens to about 15K.
  - An "85%" reduction figure is attributed to Anthropic via secondary sources.
  - Loaded tools still cost tokens.

  — [claudefa.st](https://claudefa.st/blog/tools/mcp-extensions/mcp-tool-search); [atcyrus](https://atcyrus.com/stories/mcp-tool-search-claude-code-context-pollution-guide); [mcp.directory](https://mcp.directory/blog/mcp-context-bloat-fix-2026-tool-search-code-mode-progressive-disclosure)
- SuperClaude: its injected commands, personas and modes take up context every session before the user types anything. The cost was not quantified. Its "30–50% savings" mode is unverified — [Lumadock](https://lumadock.com/tutorials/superclaude-framework)
- claude-mem uses a model API to compress observations, so compression itself costs tokens. Its own installer lists about $8.91 per 1,000 observations when billed to the user's Anthropic plan — [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/); [newreleases.io claude-mem v13.14.0](https://newreleases.io/project/github/thedotmack/claude-mem/release/v13.14.0)
- Prompt-side compression: caveman's README cites an Adobe Research "CAVEWOMAN" paper (June 2026) saying that compressing *prompts* caveman-style backfires, while terse *outputs* save 1.4–2.4× per model. This is secondary; I did not verify the paper — [caveman README](https://github.com/JuliusBrussee/caveman)
- On the quality risk of filtering, JetBrains' reviewer argues that savings with a "quality tax" are not savings. A dropped test-failure line can make the agent re-run commands or misreport a failing build — [search summary of JetBrains/Reddit critiques](https://radar.firstaimovers.com/rtk-claude-code-install-guide-2026.md)

### Inferences
- The industry's headline numbers (60–98%) measure each tool's own counterfactual — bytes removed from one tool's output — not the user's bill. Prompt caching (cache reads at 0.1×), harness truncation and extra turns erase most of the gain. The gap between counters and billed reality is the central credibility problem of this category.
- Approaches that cut turns and file reads (code graphs, symbol navigation, short CLAUDE.md) have better measured results than approaches that compress text (output styles, Bash filters, image rendering).
- Each added skill, MCP server or rule file adds a fixed per-call cost, and that fixed cost is the most common reason "savers" backfire.

### Gaps
- No independent benchmark was found for context-mode, claude-mem, Context7, Serena (numbers not extracted), claude-code-router savings, or SuperClaude/BMAD/GSD.
- The original JetBrains posts returned HTTP 403. Figures come from Zaikei, Badgerworks and MindStudio summaries, which agree with each other.
- No large-N study exists on Japanese-language prompts and outputs: tokenization differs, and genshijin's claims are self-reported.

---

## Q3. Are any of these sold commercially? At what price? Is there evidence of revenue?

### Takeaway
Most leaders are free OSS. Monetization is appearing through open-core, cloud-sync and licensing moves, plus a few small paid utilities: claude-mem CMEM Pro, Context7 Pro, SessionWatcher, Token Limits, Augment's credits, Caveman Cloud, the CodeGraph platform waitlist, BUSL/ELv2/PolyForm licenses, and the context-mode Insight dashboard. Prices cluster at **$5–$30 per month or $7–$59 one-time**. Public revenue evidence is almost non-existent; SessionWatcher's "1,504+ users" is the only concrete number found.

### Cited Findings
- **claude-mem CMEM Pro: $30/month** flat with cloud sync. The installer now lists it first as "Recommended".
  - Alternatives in the same installer are billed to the user: OpenRouter about $2.73, Gemini about $3.39, or the Anthropic plan about $8.91 per 1,000 observations.
  - Release v13.14.0 is about two months before October 2026.

  — [newreleases.io](https://newreleases.io/project/github/thedotmack/claude-mem/release/v13.14.0)
- **Context7**: the free tier covers public repos only. Pro is **$7 per seat per month**, plus **$15 per 1M parse tokens** for private repos, with up to 20 members. This comes from an undated docs mirror; DeepWiki describes a four-tier layout (Free, Pro, Team, Enterprise) — [Context7 plans doc mirror (Glama)](https://glama.ai/mcp/servers/@upstash/context7-mcp/blob/a880d842a3bf9d7ed6ff1dadc602539e67ae6a6f/docs/plans-pricing.mdx); [DeepWiki](https://deepwiki.com/upstash/context7/18.1-plan-comparison)
- **SessionWatcher** (paid quota-tracker menubar app for Claude, Codex and Cursor) — [sessionwatcher.com](https://sessionwatcher.com/claude):
  - Claude Solo $6.99 one-time (rising to $8.99 after Nov 1).
  - Bundle $14.99 one-time.
  - Pro $24/year or $59 lifetime, covering 5 devices and 20 tools.
  - Teams $40 per seat per year, with a 3-seat minimum.
  - Claims "1,504+ users".
- **Token Limits** (compression proxy plus MCP for Claude Code, Cursor and others): free trial of 100 requests, then **Pro $5/month** for unlimited use. Claims "3x longer sessions" (unverified) — [tokenlimits.app/pricing](https://tokenlimits.app/pricing)
- **Augment Context Engine MCP**: free promo of 1,000 requests until end of February 2026, then credit-based billing. Third parties put Augment plans at about $20–200/month and report a "40% service fee". I could not confirm that fee from Augment — [Augment changelog](https://www.augmentcode.com/changelog/context-engine-mcp-in-ga); [Augment credit pricing docs](https://docs.augmentcode.com/models/credit-based-pricing); [rywalker research](https://rywalker.com/research/augment-context-engine)
- **Caveman**: the CLI is free. "Auto" requires a free account and sends recent prompts and context to Caveman Cloud. "Caveman Cloud" (observability, evals, autopilot) has a sign-up and a "Free plan", with no prices listed. Telemetry is on by default — [caveman README](https://github.com/JuliusBrussee/caveman)
- **CodeGraph**: the CLI and MCP server are MIT and free. A hosted "CodeGraph platform" is in early beta with a waitlist at getcodegraph.com — [CodeGraph README](https://github.com/colbymchenry/codegraph)
- **rtk**: the CLI is Apache-2.0, but `rtk-engine` and `rtk-proxy` are **BUSL-1.1**. Offering RTK commercially to third parties requires contacting the team. No paid tier is listed — [rtk README](https://github.com/rtk-ai/rtk)
- **context-mode**: ELv2 (source-available). It mentions a hosted "Insight" dashboard for organisation analytics with no price listed — [context-mode README](https://github.com/mksglu/context-mode); [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)
- **alexgreensh/token-optimizer**: PolyForm Noncommercial 1.0.0, so commercial use requires a separate license — [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/); [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/)
- **claude-context (Zilliz)**: free, but it drives usage of paid OpenAI embeddings and Zilliz Cloud/Milvus — [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)
- **claude-mem license conflict**: ai-heartland lists AGPL-3.0, while GitHub's API reported Apache-2.0 on 2026-10-17. It may have been relicensed — [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/); [GitHub](https://github.com/thedotmack/claude-mem)
- **Headroom**: Apache-2.0 and local. No hosted or paid tier was found. headroom-desktop is a separate menubar app; its pricing was not found — [noqta.tn](https://noqta.tn/en/blog/headroom-ai-context-compression-token-cost-reduction-2026); [GitHub](https://github.com/gglucass/headroom-desktop)
- No paid tier was found for ccusage, ccstatusline, claude-hud, codeburn, repomix, gitingest, serena, claude-code-router, rtk (CLI), caveman (CLI) or the framework packs.

### Inferences
- SessionWatcher revenue, as a rough upper bound if every claimed user bought Solo or Bundle: 1,504 × $7–15 ≈ **$10k–23k lifetime**. This is my estimate and not a reported figure. It suggests that small paid utilities in this space earn hobby-to-side-income amounts, not a business.
- The common 2026 pattern is "viral free OSS, then a cloud tier": claude-mem ($30/mo), Caveman Cloud, the CodeGraph platform, context-mode Insight, plus licensing moves (rtk BUSL, context-mode ELv2). Paid value is going into **cloud sync, team analytics/observability, and hosted indexing**, not into the core compression trick, which stays free.
- A newcomer cannot charge for a function that a free tool with 10k–100k stars already does locally. The few paid wins are convenience and polish (native menubar app, multi-tool, multi-device), team features, and private-data indexing.

### Gaps
- No revenue, MRR or subscriber counts were found for claude-mem Pro, Context7 Pro, Caveman Cloud, Augment Context Engine or Token Limits.
- I could not confirm the current Context7 pricing page directly (only a mirror), nor Ref.tools or Nia pricing.
- I did not check whether Japanese paid note articles (a common monetization route in Japan) sell Claude Code token-saving know-how, or how well they sell.

---

## Q4. Which pains do users say these tools still do not solve?

### Takeaway
The unsolved pains are not "compress my output more". They are the following:
1. **Not knowing what actually ate my quota**: meter opacity, idle drain bugs, shifting limits.
2. **Not knowing whether a "saver" really saved anything on my bill**: self-reported counters mislead.
3. **Fixed always-loaded overhead** (tool definitions, CLAUDE.md, MCP, skills), which most tools add to.
4. **Quality risk** from filtering.
5. **Runaway multipliers** such as agent loops and subagent fan-out.

### Cited Findings
- **Opaque and erratic limits**:
  - Users report usage meters climbing while Claude Code is idle; one "Morning" message used 15% of a Max 5-hour window (GitHub issues #38335 and #39507).
  - Anthropic called the investigation a "top priority" and attributed one January spike to an expiring bonus.

  — [The Register 2026-01-05](https://www.theregister.com/2026/01/05/claude_devs_usage_limits/); [laozhang blog](https://blog.laozhang.ai/en/posts/claude-code-usage-limit-issues)
- **Limit changes are hard to follow**:
  - 5-hour limits were doubled in May 2026.
  - A weekly +50% promotion ran until 2026-08-19.
  - A permanent +25% from Sep 14 amounts to about a 17% cut versus promo levels.

  — [Claude support (zh-TW)](https://support.claude.com/zh-TW/articles/15910845-claude-code-2026年5月至8月每週限額推廣); [pasqualepillitteri](https://pasqualepillitteri.it/en/news/13403/claude-code-weekly-limits-25-percent-17-cut); [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/)
- Users conflate at least two separate causes — normal consumption versus throttling or anomalies — and need help separating them — [oldeucryptoboi](https://oldeucryptoboi.substack.com/p/claude-code-usage-limits-guide)
- **Misleading savings counters**: "Each tool's self-reported savings measure its own counterfactual, not your bill." The paired session cost (tool on vs. off) is described as the only reliable test — [Badgerworks](https://www.badgerworks.co.uk/posts/saving-token-spend/)
- rtk gain reported 99.8% saved during runs that cost 7.6% more — [Zaikei](https://www.zaikei.co.jp/article/20260722/862344.html)
- dev.to's conclusion is to measure before adopting any token-saving tool. The author plans to patch each tool (keep rtk error lines, reduce caveman to one rule, make pxpipe threshold-based) — [dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)
- **Always-loaded overhead dominates**: about 42% of cost is always-loaded context, versus about 6% for command output — [dev.to](https://dev.to/awesome_fredtv_c0c3/token-saving-tools-made-my-claude-code-usage-go-up-heres-the-measurement-edk)
- Measured overhead sources: 24K tokens of tool definitions at startup, about 20K per request for a 72KB CLAUDE.md, and 5–7K per request for five MCP servers — [sakutto.ai](https://sakutto.ai/articles/claude-code-startup-token-overhead)
- **Quality versus savings**: Reddit users worry that compressed custom output confuses Claude and causes more tokens to be spent on errors and clarifications. Reviewers say a filter makes "editorial judgment" about what the model needs — [search summary (Reddit snapshot)](https://reddit.sentinel-team.org/posts/1r2tt7q/snapshots/2026-02-12T19%3A01%3A05.011011Z); [firstaimovers](https://radar.firstaimovers.com/rtk-claude-code-install-guide-2026.md)
- **Runaway multipliers**:
  - "One session in a loop can drain your daily budget in minutes" — [MindStudio hacks](https://www.mindstudio.ai/blog/claude-code-token-management-hacks)
  - The subagent split example used about 4.2× more tokens — [sakutto.ai](https://sakutto.ai/articles/claude-code-startup-token-overhead)
- **Task dependence**: Ponytail helps on vague prompts but not on scoped tickets. Savings from rtk depend on whether a session has a few large outputs or many small ones — [Badgerworks](https://www.badgerworks.co.uk/posts/saving-token-spend/)
- **Licensing friction for companies**: PolyForm Noncommercial (Token Optimizer), AGPL (basic-memory, possibly claude-mem earlier), ELv2 (context-mode) and BUSL (rtk engine) complicate corporate use — [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/); [computingforgeeks](https://computingforgeeks.com/reduce-claude-code-token-usage-tools/)
- **Privacy and telemetry concerns**:
  - caveman's CLI sends telemetry by default, and Auto sends prompts and context to its cloud.
  - codegraph has anonymous telemetry on by default.
  - Paid trackers market "no upload" as a feature.

  — [caveman README](https://github.com/JuliusBrussee/caveman); [codegraph README](https://github.com/colbymchenry/codegraph); [SessionWatcher](https://sessionwatcher.com/claude)

### Inferences
- The strongest unmet need is **trustworthy measurement**: a neutral way to run "tool on vs. off" on your own tasks and see the billed difference, including cache reads, turns and quality. No popular tool does this. Usage trackers report totals, and savers report their own counterfactuals.
- The second is **overhead auditing with prescriptions**:
  - The need: "your fixed overhead is 33K tokens; here is what each MCP server, skill and CLAUDE.md section costs per call, and here is what to remove".
  - What exists today:
    - `/context` shows a breakdown but gives no advice.
    - Token Optimizer is noncommercial-licensed.
    - claude-token-optimizer is a scaffolder rather than an auditor.
- The third is **quota forecasting and attribution for subscription users**, answering "which project or task burned my weekly limit, and will I run out before reset?". Monitoring tools mostly show totals and burn rate. SessionWatcher shows people will pay a few dollars for polish here.

### Gaps
- I could not access Reddit or Hacker News threads directly, so the quotes come via secondary summaries.
- I found no surveys that quantify how many users want each feature.
- Japanese user complaints were found only in general terms ("トークンの減りが早い", tokens run out fast); there are no structured Japanese pain-point sources.

---

## Q5. Which categories are saturated with free OSS (hard to sell), and which needs remain unmet (possible paid opportunities)?

### Takeaway
The following categories are saturated and should not be sold into:
- Usage CLIs and statuslines (ccusage, ccstatusline, claude-hud, codeburn and 10+ more)
- Repo packing (repomix, gitingest)
- Public docs fetching (Context7, free tier with 1.2M installs a week)
- Code-graph indexing (codegraph, serena)
- Bash-output compression (rtk, context-mode)
- Terse-output skills (caveman, claude-token-efficient)
- Routers and gateways (claude-code-router, LiteLLM, OmniRoute)
- Local memory (claude-mem core)
- Framework packs (superpowers, BMAD, GSD, SuperClaude)

Areas with open or weakly served space: independent A/B savings verification, fixed-overhead auditing with recommendations, subscription-quota forecasting and attribution with a polished UI, team-level governance, private-docs and cross-repo indexing (crowded by funded vendors), and Japanese-language guidance and tools.

### Cited Findings
- Saturation evidence: download volume — Context7 MCP 1.21M/week, ccusage 365k/week, codegraph 129k/week, repomix 98k/week, ccstatusline 74k/week, serena-agent 44k/week, claude-code-router 46k/week, context-mode 25k/week, claude-mem 18k/week (all free) — [npm API](https://api.npmjs.org/downloads/point/last-week/ccusage); [pypistats](https://pypistats.org/api/packages/serena-agent/recent)
- Saturation evidence: at least 15 free usage trackers appeared on GitHub between February and August 2026, from codeburn at 11.5k stars down to token-tracker at 532 — [GitHub search](https://github.com/getagentseal/codeburn)
- Paid entries that exist (price anchors):
  - Quota menubar app: $7–15 one-time, $24/year Pro, $4 per seat per month for teams — [SessionWatcher](https://sessionwatcher.com/claude)
  - Compression proxy: $5/month — [Token Limits](https://tokenlimits.app/pricing)
  - Memory with cloud sync: $30/month — [claude-mem](https://newreleases.io/project/github/thedotmack/claude-mem/release/v13.14.0)
  - Private-docs indexing: $7 per seat per month plus parse tokens — [Context7 mirror](https://glama.ai/mcp/servers/@upstash/context7-mcp/blob/a880d842a3bf9d7ed6ff1dadc602539e67ae6a6f/docs/plans-pricing.mdx)
  - Hosted context engine: credits — [Augment](https://www.augmentcode.com/changelog/context-engine-mcp-in-ga)
- Native features keep absorbing third-party value:
  - MCP Tool Search is on by default — [claudefa.st](https://claudefa.st/blog/tools/mcp-extensions/mcp-tool-search)
  - `/usage` and `/context` are built in — [Claude Code docs](https://code.claude.com/docs/en/costs)
  - Several 2025-era tools went stale in 2026 (see Q1)
- The measurement gap is real:
  - No popular tool runs paired on/off session-cost tests for users. The evidence comes from blog posts by JetBrains, Badgerworks and dev.to — [Badgerworks](https://www.badgerworks.co.uk/posts/saving-token-spend/)
  - Chisle markets "published benchmarks including the runs it loses" as a differentiator, which suggests honesty is a selling point — [Chisle](https://github.com/JayPokale/Chisle)
- In Japan, the main resources are free comparison articles (ai-heartland, Zenn, Qiita, note) and one small Japanese-specific skill (genshijin, 332 stars). I found no Japanese-made paid tool in this space — [ai-heartland](https://ai-heartland.com/explain/claude-code-token-optimization-tools-comparison/); [genshijin](https://github.com/InterfaceX-co-jp/genshijin)

### Inferences (opportunity map — my judgement, not sourced facts)

| Category | Free OSS saturation | Paid viability | Notes |
|---|---|---|---|
| Usage CLI / statusline | Very high | Very low | ccusage plus many clones; built-in /usage |
| Quota menubar app (polished, multi-tool) | Medium | Low–medium (one-time $7–15) | SessionWatcher shows small sales are possible; side-income scale |
| Repo packing | Very high | Very low | repomix and gitingest are mature |
| Public docs fetch | Very high (Context7) | Low | Context7 owns it; paid only for private docs |
| Code graph / symbol nav | High (codegraph, serena) | Low for individuals; enterprise is occupied by funded vendors (Augment) | Hosted versions are moving to waitlists |
| Bash / log output compression | High (rtk, context-mode) | Low; measured savings are weak | Credibility damaged by the JetBrains/dev.to results |
| Terse-output skills / CLAUDE.md rules | Very high | ~0 | A one-line "answer concisely" gets most of the gain |
| Memory | High (claude-mem core free) | Medium for cloud sync and team sharing ($30/mo anchor) | claude-mem already sells this |
| Routing / gateways | High | Low; ToS risk for "free token" gateways | |
| **Neutral A/B savings verifier** ("does tool X reduce *my* bill?") | **Low** | **Medium** | Unmet; fits a "measure, don't trust" positioning |
| **Fixed-overhead auditor with prescriptions** (CLAUDE.md / MCP / skills per-call cost) | Low–medium | Medium (as a free web tool for traffic; as a paid Pro report) | /context gives raw numbers only |
| **Subscription quota forecasting and attribution** (per project or task, "will I hit the weekly limit?") | Medium | Medium | Ties to the most-voiced pain (limits) |
| Team governance (seat-level spend, policy) | Low in OSS | Medium–high, but competes with official analytics and gateways | Needs sales effort |
| Japanese-language guides and tools | Low | Low–medium (as content and SEO) | Mostly free articles; genshijin is the only JP tool |

- For a static, client-side, no-external-calls web tool site (this company's stage 1), these fit the unmet needs without competing head-on with OSS CLIs:
  - A browser-only Claude Code JSONL analyser (privacy-preserving)
  - A CLAUDE.md / MCP per-call overhead calculator
  - A "token-saver claim vs. measured" reference page with sourced numbers
  - A subscription limit and reset calculator

  Paid stage-2 candidates would then be a local A/B session-cost verifier, or an overhead auditor with recommendations.

### Gaps
- No direct demand data (search volumes, survey) was gathered to size these unmet needs; this would need Search Console or keyword tools.
- I did not check whether Anthropic's official Team/Enterprise analytics already cover team governance and attribution, which could close that gap.
- I could not determine whether any existing tool already does paired on/off cost testing as a product: none was found in searches, but coverage was not exhaustive.
