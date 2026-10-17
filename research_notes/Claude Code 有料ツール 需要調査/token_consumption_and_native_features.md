# Where Claude Code spends tokens, and which savings Anthropic already ships (as of 2026-10-17)

Scope note: research date 2026-10-17. Latest Claude Code on npm is v2.1.302 (published 2026-10-16), stable tag v2.1.292 ([npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code)). Version release dates below come from the same npm registry `time` field. Official docs (code.claude.com) were read on 2026-10-17 and describe current behavior. Items dated before 2026 are marked as possibly outdated. "Claim" means a vendor or author claim that was not measured independently.

## 1. What are the main token sinks in a typical Claude Code session? (measured numbers)

### Takeaway
The biggest recurring cost is the full conversation being re-sent on every request: every turn and every tool call carries the system prompt, tool schemas, CLAUDE.md, and all earlier tool results. User log analyses show cache reads making up roughly 93–99.9% of all tokens processed. Fixed startup overhead was measured at about 33k tokens in an empty session and 75–85k in a realistic setup (July 2026). Built-in tool schemas account for about 24k of that. Subagents multiply everything, because each one re-pays the fixed overhead.

### Cited Findings
**Fixed / startup overhead**
- Empty-session baseline, measured at the API boundary with a relay server (Systima, Claude Code v2.1.207 released 2026-07-10, Sonnet 4.5, no MCP, no personal settings, prompt "Reply with exactly: OK"): the first request was about 32,800 tokens. That was the system prompt plus 27 tool descriptions, and the tool descriptions alone were about 24,000 tokens. With all tools disabled, the system prompt was about 6,500 tokens, against about 2,000 for OpenCode. OpenCode's whole first request was about 6,900 tokens, so Claude Code's was about 4.7x larger. In a 200k window, Claude Code uses about 1/6 of the space before any code is loaded. — [GIGAZINE 2026-07-13, reporting Systima](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token) (original: https://systima.ai/blog/claude-code-vs-opencode-token-overhead, not fetched directly)
- In the same measurement, a 72KB CLAUDE.md added about 20,000 tokens to every request, each small MCP server added about 1,000–1,400 tokens, and five servers added about 5,000–7,000. A "practical configuration" (instruction files, MCP, plugins) reached about 75,000 tokens before any user input, with 118 tools and 311KB sent, and about 75–85k depending on configuration. — [GIGAZINE / Systima, 2026-07-13](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token)
- A third-party `/context` sample (Feb 2026, claude-opus-4-5) showed "System tools" at 17.6k and "System prompt" at 2.6k, which is lower than Systima's 24k. Version and counting differences are likely. `/context` itself is an approximation introduced in v1.0.86. — [wmedia.es tip (search summary)](https://wmedia.es/en/tips/claude-code-context-command-token-usage); [claudelog](https://claudelog.com/faqs/what-is-context-command-in-claude-code)
- Anthropic's own "representative" context timeline (illustrative numbers, not measurements) lists startup items as follows: system prompt 4,200 tokens, auto memory (MEMORY.md, first 200 lines or 25KB) 680, environment info 280, deferred MCP tool names 120, skill descriptions 450, user CLAUDE.md 320, project CLAUDE.md 1,800. Conflict: this illustration does not show built-in tool schemas separately, while the Systima wire measurement found about 24k tokens of them. — [Claude Code docs: Explore the context window](https://code.claude.com/docs/en/context-window)

**Work-phase sinks (file reads, grep, Bash, test output)**
- In the same docs timeline (illustrative), the file reads are 2,400, 1,100, 1,800 and 1,600 tokens, a grep is 600, `npm test` output is 1,200, and the PostToolUse hook outputs are 100–120 each. In the subagent example, the subagent reads 6,100 tokens of files and only a 420-token summary returns to the main context. — [Claude Code docs: context-window](https://code.claude.com/docs/en/context-window)
- Per-call ceilings for tool output (current docs):
  - Read returns at most 25,000 tokens per call (`CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`) and refuses a whole file over 256 KB without paging.
  - Bash results stay inline up to about 30,000 characters (`BASH_MAX_OUTPUT_LENGTH`, max 150,000). Past that, the output goes to a file with a 2,000-character preview. Failed commands are cut to about 10,000 characters, head plus tail.
  - Glob is capped at 100 files.
  - WebFetch reads up to 100,000 characters of page content per call.
  - MCP results are capped at 25,000 tokens (`MAX_MCP_OUTPUT_TOKENS`) with a warning above 10,000. Text results over 50,000 characters are saved to disk.
  — [Tools reference](https://code.claude.com/docs/en/tools-reference); [env vars](https://code.claude.com/docs/en/env-vars); [MCP docs](https://code.claude.com/docs/en/mcp)
- The official Enterprise guidance says each Claude Code turn carries file contents, tool calls and multi-step reasoning, so "one debugging session can consume more than a day of chat." — [Claude Code docs: Manage costs](https://code.claude.com/docs/en/costs)

**Conversation history re-sent every request (the dominant sink)**
- Official docs: "Claude Code sends your full conversation with every request, and each time Claude uses tools it sends another request carrying that batch of tool results … a one-line question in a session that has been open all day still draws usage for the whole conversation." — [Manage costs: Why usage climbs in a long session](https://code.claude.com/docs/en/costs)
- One user's transcript analysis (GitHub issue #24147, opened 2026-02-08 on v2.1.37) covered 30 days from 2026-01-09 to 02-08. It counted 5.09B cache-read tokens, 176.5M cache-creation tokens and only 3.89M input/output tokens, so cache reads were 99.93% of all tokens (1,310 reads per I/O token). A follow-up over 762 sessions found 93.43% cache reads. The issue is still open with no Anthropic reply. — [claudeissues.com mirror of #24147](https://claudeissues.com/issue/24147-cache-read-tokens-consume-99-93-of-usage-quota-architectural-scaling-issue-with)
- A separate third-party sample of about 3.8B tokens split as 97.7% cache read, 2.0% cache write and 0.34% output. — [AgentsRoom blog (search summary)](https://agentsroom.dev/pt/blog/what-are-tokens-in-claude-and-how-they-work)
- A sample `/usage` session block in the official docs shows `1.2k input, 5.3k output, 940.0k cache read, 50.0k cache write ($0.55)` on claude-sonnet-4-6. — [Manage costs](https://code.claude.com/docs/en/costs)

**MCP tool schemas (historically large, now mostly deferred)**
- Before deferral became the default (Nov 2025), one user measured 7 MCP servers at 67,300 tokens of tool definitions, 33.7% of a 200k window, before the first message. The GitHub MCP server alone was about 18k tokens for 27 tools. — [mcp.directory summary of claude-code issue #11364, 2025-11-10](https://mcp.directory/blog/mcp-context-bloat-fix-2026-tool-search-code-mode-progressive-disclosure) (possibly outdated; pre tool-search default)
- Anthropic's own figures (Nov 2025): GitHub 35 tools about 26K tokens, Slack 11 tools about 21K, Sentry about 3K, Grafana about 3K, Splunk about 2K, for 58 tools and about 55K tokens in total. Jira alone is about 17K. Anthropic's internal peak was "134K tokens before optimization." — [Anthropic Engineering: Advanced tool use, 2025-11-24](https://www.anthropic.com/engineering/advanced-tool-use)

**Subagents / agent teams (multipliers)**
- Systima's multi-step task (file creation plus run) took 3 requests and about 121,000 total input tokens. The same work split across two subagents took about 513,000 total input tokens (about 4.2x), because each subagent re-read its own system prompt and tool descriptions and the parent re-read the results. — [GIGAZINE / Systima, 2026-07-13](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token)
- Official: "Agent teams use approximately 7x more tokens than standard sessions when teammates run in plan mode." — [Manage costs](https://code.claude.com/docs/en/costs)
- Subagents load CLAUDE.md and the same MCP and skill setup, minus the main session's auto memory. The built-in Explore and Plan agents skip CLAUDE.md. — [context-window docs](https://code.claude.com/docs/en/context-window); [features overview](https://code.claude.com/docs/en/features-overview)

**Extended thinking**
- "Thinking tokens are billed as output tokens, and the default budget can be tens of thousands of tokens per request depending on the model." Thinking cannot be turned off on Opus 5.5, Sonnet 5.5, Haiku 5.5 or the Fable models. — [Manage costs](https://code.claude.com/docs/en/costs)
- The default effort is `medium` for Opus 5.5, Sonnet 5.5 and Haiku 5.5, `high` for Fable 5.x, Opus 5 and Sonnet 5, and `xhigh` for Opus 4.7. Since v2.1.280 (2026-09-22), `default` resolves to Opus 5.5 on Pro, Max, Team, Enterprise and the API. — [Model config docs](https://code.claude.com/docs/en/model-config)

**Compaction itself**
- "`/compact` reads the conversation it summarizes, so compacting a large context is itself a large request." When the cache is warm the summarization call reads the prefix from cache. When the cache is cold, for example on resuming an old session, it reprocesses the full history as uncached input. — [Manage costs](https://code.claude.com/docs/en/costs); [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)
- The Anthropic blog describes the compaction summary as about 20k tokens and the cached compaction call as costing one tenth the price. — [Thariq Shihipar, "Prompt caching is everything", 2026-04-30](https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/)

**Background / idle consumers**
- Background summarization for `--resume` and status commands cost "typically under $0.04 per session".
- Prompt suggestions send an extra request after each response, mostly cache reads.
- Scheduled tasks (`/loop`), cross-session messages and goal check-ins each send the full context when they fire. Goal check-ins have been capped at 3 per goal since v2.1.246.
— [Manage costs](https://code.claude.com/docs/en/costs)

### Inferences
- In tokens processed, history replay (cache reads) dominates by one to two orders of magnitude. In billed dollars and probably in limit accounting, cache reads are discounted (0.1x, or 0.05x on Opus/Sonnet 5.5), so the effective cost share is smaller but still large in long sessions. Every token added early in a session, such as a large tool output, is paid again on every later request until `/clear` or compaction.
- Fixed overhead (about 30k built-in, plus CLAUDE.md, MCP and skills) matters most for context-window headroom and for subagent fan-out, where it is re-paid per agent with only a 5-minute cache. In a single long session it is cheap because it stays cached.
- The ~4.2x subagent multiplier (Systima) and ~7x agent-team multiplier (Anthropic) are the largest controllable multipliers. Users who adopt subagents "to save context" can spend more total usage.

### Gaps
- No public, version-pinned measurement of the October 2026 (v2.1.29x) empty-session size was found. Systima's 32.8k figure is v2.1.207 (July 2026). Whether built-in tools are now also deferred behind ToolSearch is not documented on the pages read. In this research session's own environment (Claude Code on the web, Oct 2026), tools such as WebFetch, WebSearch and Task* were offered only as "deferred tools", which suggests built-in deferral now exists. That is an observation, not a published source.
- No large-sample public study gives the share of tokens by category (file reads vs Bash output vs grep vs MCP results) across real sessions. The available figures are illustrative docs numbers or single-user anecdotes.
- No official per-model numbers for thinking-token usage per turn at each effort level.

## 2. How do prompt caching, cache reads/writes and TTL affect cost and subscription-limit consumption?

### Takeaway
Claude Code caches automatically by strict prefix match. On the API, cache reads cost 0.1x base input (0.05x on Opus/Sonnet 5.5, 0.025x on Fable 5.1), 5-minute writes cost 1.25x and 1-hour writes 2x. Subscribers get a 1-hour TTL on the main conversation, but subagents and compaction get 5 minutes, and anyone drawing on usage credits drops to 5 minutes. Anthropic's docs say re-reading history at the cached rate "still draws usage" against plan limits, but Anthropic does not publish the weights used for the 5-hour and weekly limits.

### Cited Findings
- API price multipliers, quoted: "5-minute cache write tokens are 1.25 times the base input tokens price; 1-hour cache write tokens are 2 times …; Cache read tokens are 0.1 times". Cache hits cost 0.05x on Opus 5.5 and Sonnet 5.5 and 0.025x on Fable 5.1 and Mythos 5.1. The minimum cacheable prefix is 512 tokens on the 5.x generation. On the API, "cache hits are not deducted against your rate limit" (ITPM). — [Claude API docs: Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- TTL policy in Claude Code:
  - Main conversation: 1 hour on a Claude subscription within plan usage.
  - Everything else (subagents, workflows, teammates, forks, compaction, titles): 5 minutes, except some server-controlled helper requests.
  - Usage credits, API key or cloud provider: 5 minutes for everything.
  - The TTL can be set with `promptCacheTtl` / `subagentPromptCacheTtl` (v2.1.242, 2026-08-24), `ENABLE_PROMPT_CACHING_1H` (added v2.1.108, 2026-04-14) or `FORCE_PROMPT_CACHING_5M`.
  — [Claude Code docs: Prompt caching](https://code.claude.com/docs/en/prompt-caching); [CHANGELOG v2.1.108](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- Request layout: system prompt and tool definitions come first, then project context (CLAUDE.md, auto memory, unscoped rules), then the conversation. A change in an early layer invalidates everything after it. There is "no per-file or per-segment caching." — [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)
- Actions that invalidate the cache: switching models, changing effort (except on Opus/Sonnet/Haiku 5.5 and Fable 5.1 via API or subscription), turning on fast mode, connecting or removing MCP servers when tools are loaded upfront, enabling a plugin that provides MCP servers, denying an entire tool when tool search is off, compaction, accumulating many images, and upgrading Claude Code. Actions that keep the cache: editing files, editing CLAUDE.md mid-session (the edit doesn't apply until `/clear`, `/compact` or a restart), permission-mode changes, output-style changes (v2.1.251+), invoking skills, `/recap`, `/rewind`, and spawning subagents. — [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)
- Cache scope is effectively one machine and directory, because auto-memory paths and the cwd/git snapshot are in the prefix. Parallel sessions in the same directory share a cache; sessions in different directories or worktrees do not. — [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)
- Subscription accounting (official wording): "With prompt caching, Claude Code re-reads that history at the cached token rate, so a one-line question in a session that has been open all day still draws usage for the whole conversation." Your first message after a break longer than the cache lifetime "misses the cache and reprocesses your full context." — [Manage costs](https://code.claude.com/docs/en/costs)
- Anthropic's design rationale: "A high cache hit rate lowers costs and lets Anthropic offer more generous rate limits on subscription plans". Claude Code declares SEVs (incidents) when its cache hit rate drops, and "a few percentage points of cache miss rate can dramatically affect cost and latency." — [Prompt caching is everything (2026-04-30)](https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/)
- Users dispute how cache reads count toward the 5-hour and weekly limits. Some commenters say they count at a discount, others that only writes count. The reporter in #24147 claims cache reads "count fully against quota". Anthropic has not answered there. — [#24147 mirror](https://claudeissues.com/issue/24147-cache-read-tokens-consume-99-93-of-usage-quota-architectural-scaling-issue-with)
- The `/usage` "Prompt cache (main)" line (v2.1.251, 2026-08-28) shows the hit ratio, misses, expected rebuilds and warm/cold state. "Likely cause" diagnosis was added in v2.1.260 (2026-09-03). Both cover the main conversation only, not subagents. — [Manage costs](https://code.claude.com/docs/en/costs); [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- Many 2026 changelog entries fix accidental cache misses, for example "tool definitions being re-rendered after an OAuth token refresh" (about once an hour, v2.1.248), `/model` re-sending every tool definition (v2.1.267), and Remote Control re-sending the Bash tool (v2.1.257). — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)

### Inferences
- On subscriptions the biggest avoidable waste is cache expiry: idle for more than 1 hour, then a full re-write at 1.25–2x. Anthropic is closing this natively with idle compaction (v2.1.299) and with cache-miss diagnostics.
- Subagents run on a 5-minute TTL and their own prefix even on subscriptions. Long-running or intermittent subagents therefore pay full writes repeatedly, which is a structural cost a user cannot see in the main-conversation cache line.
- The exact weights for cache reads, writes and output in the 5-hour and weekly limits are not public. This opacity drives user anxiety and is the main demand driver for "usage tracking" tools.

### Gaps
- No official statement of how cache-read, cache-write, input and output tokens are weighted against Pro/Max 5-hour and weekly limits.
- No official cache-hit-rate statistic for typical Claude Code sessions. The only example is in the docs: "91% of input tokens from cache".

## 3. Which native token-saving features exist as of Oct 2026, and what do they save?

### Takeaway
By October 2026 Claude Code natively handles most "obvious" token-saving tricks:
- MCP tool deferral by default
- persisting large outputs to disk
- Read deduplication and paging
- on-demand skill loading with capped description budgets
- auto, manual, partial and idle compaction plus tool-output clearing
- a 1-hour cache, cache-miss diagnostics and `/usage` attribution
- subagents on cheaper models
- hook-based output filtering, which you must write yourself

A third-party tool that only does one of these is largely redundant.

### Cited Findings
**Visibility / measurement**
- `/context` was added in v1.0.86 (2025-08-20). Actionable optimization suggestions were added in v2.1.74 (2026-03-11): it "identifies context-heavy tools, memory bloat, and capacity warnings". `/context all` shows tokens per loaded MCP tool. — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md); [features overview](https://code.claude.com/docs/en/features-overview)
- `/usage` has the following views (the v2.1.260 changelog still refers to `/cost`, so the two names coexist or were merged; not verified):
  - Session token and $ block.
  - Per-category attribution of plan-limit usage across skills, subagents, plugins and individual MCP servers (v2.1.149, 2026-05-22).
  - Behavior flags for anything at 10% or more, such as long context or cache misses.
  - Loop rows (v2.1.242).
  - 24h/7d toggle.
  It is "approximate and computed from local session history on this machine", so other devices and claude.ai are not included. — [Manage costs](https://code.claude.com/docs/en/costs); [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- `/insights` writes an HTML report on usage patterns and friction across up to 200 sessions. Its own run consumes plan usage. A status line can show context usage, and OpenTelemetry export covers cache read and write tokens per user. — [Manage costs](https://code.claude.com/docs/en/costs); [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)

**MCP overhead**
- Tool search / deferred loading was enabled in "auto" mode by default in v2.1.7 (2026-01-13), deferring tools once MCP descriptions exceeded 10% of context. `auto:N` was added in v2.1.9 (2026-01-15). As of Oct 2026, unset means "All MCP tools deferred and loaded on demand." Only tool names and server instructions load. In Anthropic's illustration, deferred MCP names cost about 120 tokens. Fallbacks to loading upfront: models older than Opus 4 / Sonnet 4, older Vertex models, non-first-party `ANTHROPIC_BASE_URL` proxies, and Azure-hosted Foundry. — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md); [MCP docs](https://code.claude.com/docs/en/mcp); [context-window docs](https://code.claude.com/docs/en/context-window)
- Anthropic's API-level claim for the Tool Search Tool: an 85% reduction in tool-definition tokens, about 8.7K instead of about 77K for 50+ tools, with accuracy gains (Opus 4.5 79.5% to 88.1%). — [Advanced tool use, 2025-11-24](https://www.anthropic.com/engineering/advanced-tool-use) (vendor claim)
- MCP descriptions are cut at 4,096 characters for upfront tools and server instructions, and at 16,384 characters for deferred tools (v2.1.295/296, early Oct 2026). The cap is configurable with `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`. — [MCP docs](https://code.claude.com/docs/en/mcp)
- Official advice: "Prefer CLI tools when available: Tools like `gh`, `aws`, `gcloud`, and `sentry-cli` are still more context-efficient than MCP servers". — [Manage costs](https://code.claude.com/docs/en/costs)

**Tool-output size controls**
- Large tool outputs are persisted to disk instead of truncated (v2.1.2, 2026-01-08). The threshold was lowered from 100K to 50K characters in v2.1.51 (2026-02-23). Per-tool `anthropic/maxResultSizeChars` up to 500K came in v2.1.91, and a 1 GB on-disk cap in v2.1.265. — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- Read tool changes:
  - v2.1.86 (2026-03-27): "compact line-number format and deduplicates unchanged re-reads, reducing token usage".
  - v2.1.145 (2026-05-19): a PARTIAL first page instead of an error.
  - v2.1.296 (2026-10-09): an `allow_large` option to read big files deliberately.
  — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- Bash output: `BASH_MAX_OUTPUT_LENGTH` defaults to 30,000 characters (max 150,000), and `bashOutputMaxChars` goes up to 128,000 (v2.1.261+). — [Tools reference](https://code.claude.com/docs/en/tools-reference)
- Hooks can rewrite commands or filter output before Claude sees it. The official docs' example is a PreToolUse hook that pipes `npm test`, `pytest` or `go test` through `grep … | head -100`. The docs claim this cuts "a 10,000-line log file … from tens of thousands of tokens to hundreds." Hooks cost zero context unless they return output. — [Manage costs](https://code.claude.com/docs/en/costs); [features overview](https://code.claude.com/docs/en/features-overview)
- Code intelligence (LSP) plugins: "A single 'go to definition' call replaces what might otherwise be a grep followed by reading multiple candidate files." — [Manage costs](https://code.claude.com/docs/en/costs)

**Instructions / memory**
- Skills were added in v2.0.20 (2025-10-16) and use progressive disclosure: descriptions at start, full body on use. The description budget is 1% of the context window, with an 8,000-character fallback (`SLASH_COMMAND_TOOL_CHAR_BUDGET`). Each description in the listing has been capped at 250 characters since v2.1.86. `disable-model-invocation: true` or `skillOverrides` drop a skill from context entirely. — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md); [env vars](https://code.claude.com/docs/en/env-vars); [features overview](https://code.claude.com/docs/en/features-overview)
- Example of in-product optimization: the bundled `claude-api` skill dropped "from ~200k+ tokens to ~25k by loading reference docs on demand" (v2.1.234, 2026-08-17). The skill listing is no longer re-injected on every resume, saving "~600 tokens … per resume" (v2.1.70). — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- CLAUDE.md guidance: keep it under 200 lines, move workflow-specific content to skills, and use `.claude/rules/` with `paths:` frontmatter so rules load only for matching files. `/doctor` gives "trim proposals for a checked-in CLAUDE.md". Auto memory loads only the first 200 lines or 25KB. — [Manage costs](https://code.claude.com/docs/en/costs); [features overview](https://code.claude.com/docs/en/features-overview); [how Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)

**Context lifecycle**
- When context fills up: "It clears older tool outputs first, then summarizes the conversation if needed." The docs also count "clearing old tool results from context" as an "expected rebuild" in cache stats. No user-facing setting for tool-result clearing was found. — [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works); [Manage costs](https://code.claude.com/docs/en/costs)
- Auto-compact thresholds and controls:
  - Native-1M models compact at about 967K by default. The 4.6 models without extended context compact at 200K.
  - The window can be set to 100K–1M with `/autocompact`, `autoCompactWindow` or `CLAUDE_CODE_AUTO_COMPACT_WINDOW`. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` sets an earlier trigger.
  - `/rewind` can "Summarize from here" or "up to here" (partial compaction).
  - Compaction stops after a few attempts if one huge output keeps refilling the context.
  — [Model config](https://code.claude.com/docs/en/model-config); [env vars](https://code.claude.com/docs/en/env-vars); [context-window docs](https://code.claude.com/docs/en/context-window); [how Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)
- After compaction Claude Code re-reads up to 5 recently modified files (any over 5,000 tokens come back as a path reference) and re-injects invoked skills, capped at 5,000 tokens per skill and 25,000 in total. — [context-window docs](https://code.claude.com/docs/en/context-window)
- Idle compaction (v2.1.299, 2026-10-14): "a 200K+ token conversation left idle for about 54 minutes is compacted before its one-hour prompt cache expires, so your next message doesn't reprocess it all". The threshold is set with `CLAUDE_CODE_IDLE_COMPACT_MIN_TOKENS` and the feature turns off with `idleCompaction: false`. — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md); [env vars](https://code.claude.com/docs/en/env-vars)
- Cache-safe design: compaction forks the same prefix, plan mode is implemented as tools so the tool set never changes, and tool stubs use `defer_loading: true`. — [Prompt caching is everything (2026-04-30)](https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/)
- `/model` now asks for confirmation when the cache is warm and the switch would cost a full re-read (TTL-aware since v2.1.238). `/reload-plugins` refuses a reload that would cause a full re-read unless `--force` is given. — [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)

**Delegation / models**
- The Explore subagent ("Powered by Haiku … to save context") arrived in v2.0.17 (2025-10-15). Subagents can be given `model: haiku`. `CLAUDE_CODE_SUBAGENT_MODEL` (with `_FORCE`) sets one model for every subagent. `maxTurns` limits subagent turns, `omitClaudeMd` drops CLAUDE.md for a subagent, and Explore and Plan skip CLAUDE.md. — [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md); [env vars](https://code.claude.com/docs/en/env-vars); [tools reference](https://code.claude.com/docs/en/tools-reference); [features overview](https://code.claude.com/docs/en/features-overview)
- Effort levels (`/effort`), `MAX_THINKING_TOKENS` for fixed-budget models, `opusplan` (Opus for planning, Sonnet for execution, with a cache rebuild at each toggle), `--max-budget-usd`, and `CLAUDE_CODE_MAX_OUTPUT_TOKENS`. — [Manage costs](https://code.claude.com/docs/en/costs); [model config](https://code.claude.com/docs/en/model-config); [env vars](https://code.claude.com/docs/en/env-vars)

### Inferences
- Already native, so a standalone paid tool for these would be redundant:
  - MCP schema slimming or lazy loading
  - per-tool truncation or persist-to-disk
  - a context visualizer
  - per-MCP or per-skill usage attribution
  - a cache-hit monitor
  - "compact earlier" switches
  - a cache keep-alive before TTL expiry
  - skill lazy-loading
  - Haiku routing for exploration
- Native only as building blocks you must assemble yourself: hook-based output filtering (the official example is DIY), a "codebase-overview" skill (suggested in docs, not shipped), subagent model policy, and CLAUDE.md trimming (`/doctor` proposes, the human decides).

### Gaps
- The exact version in which "unset = defer all MCP tools" replaced the 10% auto threshold could not be found in the changelog lines grepped. v2.1.7 (Jan 2026) introduced auto at 10%. The current docs say all tools are deferred when unset.
- No public documentation of tool-result clearing thresholds or settings in Claude Code. Only the behavior is described.
- No independent measurement of savings from Read deduplication or the compact line-number format.

## 4. What does Anthropic's official "manage costs / reduce token usage" guidance recommend?

### Takeaway
Anthropic's checklist (docs as of Oct 2026):
1. Clear between tasks.
2. Compact with focus instructions.
3. Match the model to the task (Sonnet or Haiku for most work and for subagents).
4. Leave MCP deferred, prefer CLIs and disable unused servers.
5. Install LSP plugins.
6. Preprocess output with hooks.
7. Move CLAUDE.md content to skills (CLAUDE.md under 200 lines).
8. Lower effort or thinking.
9. Delegate verbose operations to subagents.
10. Keep agent teams small.
11. Write specific prompts.
12. Use plan mode and course-correct early.

Its enterprise benchmark is about $13 per developer per active day.

### Cited Findings
- Enterprise averages: "around $13 per developer per active day and $150-250 per developer per month, with costs remaining below $30 per active day for 90% of users." — [Manage costs](https://code.claude.com/docs/en/costs)
- "Token costs scale with context size … Claude Code automatically optimizes costs through prompt caching … and auto-compaction". — [Manage costs](https://code.claude.com/docs/en/costs)
- Specific recommendations are listed verbatim under these headings: "Clear between tasks", "Add custom compaction instructions", "Choose the right model", "Reduce MCP server overhead", "Install code intelligence plugins", "Offload processing to hooks and skills", "Move instructions from CLAUDE.md to skills", "Adjust extended thinking", "Delegate verbose operations to subagents", "Manage agent team costs", "Write specific prompts", and "Work efficiently on complex tasks" (plan mode, Escape, `/rewind`, verification targets, test incrementally). — [Manage costs](https://code.claude.com/docs/en/costs)
- High spend on API or cloud "usually traces back to long sessions that were never cleared or to Opus left as the default model." — [Manage costs](https://code.claude.com/docs/en/costs)
- Recommended team rate limits run from 200k–300k TPM per user for 1–5 users down to 10k–15k TPM per user for 500+ users. — [Manage costs](https://code.claude.com/docs/en/costs)
- Prompt-caching tips: "Pick your model and effort level at the top of a session, then save `/compact` for natural breaks", and `/rewind` instead of compacting when abandoning a path. — [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)
- The Lifehacker Japan (2026-09-03) and MakeUseOf piece names four "hidden token drains": CLAUDE.md loaded every session, MCP servers auto-connecting, scheduled tasks (Routines), and the skills list sent every session. The fixes it gives are moving content to skills, disabling servers or `disableClaudeAiConnectors`, and reviewing routines. It gives no measured numbers. — [Lifehacker Japan](https://www.lifehacker.jp/article/2609checked-claude-code-usage-found-four-hidden-token-drains-never-knew-about/)

### Inferences
- Almost every official recommendation is a behavior or habit (clear, compact, choose a model, write specific prompts) or a configuration the user must author (hooks, skills, subagent definitions). Anthropic automates the mechanics but leaves judgment to the user, for example when to `/clear`, what to put in CLAUDE.md, and which output to filter.

### Gaps
- No official numeric estimate of savings for each recommendation, apart from the hook example ("tens of thousands of tokens to hundreds") and the agent-team ~7x figure.

## 5. History of usage limits (drives how much users care)

### Takeaway
- Weekly caps for Claude Code on Pro and Max began on 2025-08-28.
- In 2026 Anthropic doubled the 5-hour limits (May 6) and ran a temporary +50% weekly boost from May 13 to mid-September.
- It then settled on a permanent +25% from September 14, which users experienced as a 17% cut against the boost.
- The resulting "limit anxiety" (user reports of hitting limits faster around September 2026) is the main demand driver for token-saving tools.

### Cited Findings
- 2025-07-28 announcement: weekly limits for Pro and Max starting 2025-08-28, estimated to affect fewer than 5% of subscribers, aimed at 24/7 background use and account sharing or resale. The 5-hour limits were unchanged. There were two weekly limits, one overall and one for Opus 4. TechCrunch's estimates: Pro 40–80 hours of Sonnet 4 per week; Max $100 140–280 hours of Sonnet 4 plus 15–35 hours of Opus 4; Max $200 240–480 hours of Sonnet 4 plus 24–40 hours of Opus 4. (2025, outdated model names.) — [TechCrunch 2025-07-28](https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/); [GIGAZINE 2025-07-29](https://gigazine.net/gsc_news/en/20250729-anthropic-calude-code-rate-limits); [AIN 2025-07-30](https://en.ain.ua/2025/07/30/anthropic-introduces-weekly-limits-for-claude-code/)
- 2026-05-06 (secondary sources; the primary Anthropic post was not fetched): 5-hour Claude Code limits doubled on Pro, Max, Team and seat-based Enterprise. The peak-hour throttle, which reportedly cut quota by up to half at busy times, was removed for Pro and Max. This was tied to a SpaceX/Colossus compute deal. — [Verdent guide](https://www.verdent.ai/guides/claude-code-limits-doubled-may-2026); [Appwrite blog](https://appwrite.io/blog/post/anthropic-doubles-claude-code-rate-limits)
- 2026-05-13: weekly limits raised 50% on Pro, Max, Team and seat-based Enterprise, temporarily, until 2026-07-13. The boost was extended to July 19, then August 19, then August 31. — [Verdent](https://www.verdent.ai/guides/claude-code-limits-doubled-may-2026); [apidog](https://apidog.com/blog/claude-code-limits-extension-august-2026/); [letsdatascience](https://letsdatascience.com/news/anthropic-ends-temporary-claude-code-weekly-usage-boost-b162a5f0). Sources conflict on whether weekly caps changed in May at all (search summary).
- Late August 2026: Anthropic announced a permanent +25% to standard weekly limits from September 14, keeping the 50% boost until then. Anthropic's words: "Compared to today, this works out to a 17% reduction in weekly limits on Claude Code." It said more Claude Code usage changes are coming. — [BleepingComputer 2026-08-29](https://www.bleepingcomputer.com/news/artificial-intelligence/anthropic-is-cutting-claude-codes-current-weekly-limits-by-17-percent/)
- User reports (unverified) in #24147: on Pro with Opus 5, users report about 234–408M tokens a day without hitting limits in mid-to-late August. On 2026-09-02 they report about 47M tokens bringing the 5-hour limit to 99%, and claim a 5–7x effective drop. — [#24147 mirror](https://claudeissues.com/issue/24147-cache-read-tokens-consume-99-93-of-usage-quota-architectural-scaling-issue-with)
- Current official framing:
  - Pro and Max have a 5-hour session limit and a weekly limit, and Max also has a separate weekly Fable limit. "These limits are shared across Claude and Claude Code".
  - Usage credits let you continue past a limit.
  - A "wrapping up" allowance lets an in-progress step finish.
  — [Support: Using Claude Code with Pro or Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- Team and Enterprise seats draw on a per-seat allowance with rolling 5-hour and weekly windows, shared with chat and Cowork. "Usage inside the seat allowance isn't metered in dollars." Claude Code v2.1.234+ can wait out a limit and auto-continue (`autoContinueAtUsageLimit`). — [Manage costs](https://code.claude.com/docs/en/costs)
- On subscriptions, `/usage` shows plan usage bars. The Session $ figure "isn't relevant for billing purposes". — [Manage costs](https://code.claude.com/docs/en/costs)

### Inferences
- Limit policy has changed about every 1–3 months since mid-2025, and users cannot see the exact weighting. Willingness to pay for limit forecasting and stretching probably peaks right after cuts such as September 2026.
- Anthropic is shipping its own limit-visibility features quickly: the `/usage` breakdown (May 2026), cache stats (Aug–Sep 2026) and idle compaction (Oct 2026). Any tool focused purely on visibility competes with a free, improving native feature.

### Gaps
- The primary Anthropic posts for May 6, May 13 and August 2026 were not fetched. Those dates rely on secondary coverage, and one source dates the permanent-increase announcement to Aug 29 and another to Aug 30.
- No official hours or prompts per plan for 2026; the 40–80 hour figures are from 2025.
- No information found on limit changes after 2026-09-14.

## 6. Residual gaps native features do NOT solve (openings for a paid tool)

### Takeaway
What remains after native features is mostly judgment and orchestration, not mechanism. The structural cost of re-sending history is only addressed by manual `/clear` and `/compact` habits. Native features don't decide whether a subagent will save or cost more, and noisy output under the caps still floods context. There is no way to forecast against undisclosed limits, no audit of CLAUDE.md and skill content over time, and no cross-device or team view for subscription users. Built-in prompt and tool overhead (about 30k) cannot be reduced by third parties at all.

### Cited Findings
- History replay is the dominant sink (93–99.9% of tokens are cache reads in user logs), and the official remedy is a habit: "Clear between tasks". `/clear` "costs nothing", but the user must decide when. — [#24147 mirror](https://claudeissues.com/issue/24147-cache-read-tokens-consume-99-93-of-usage-quota-architectural-scaling-issue-with); [Manage costs](https://code.claude.com/docs/en/costs)
- Output under the caps still enters context in full: up to about 30,000 characters of Bash output inline, up to 25,000 tokens per Read call, and up to 25,000 tokens per MCP result. The official mitigation is a hand-written PreToolUse hook. — [Tools reference](https://code.claude.com/docs/en/tools-reference); [MCP docs](https://code.claude.com/docs/en/mcp); [Manage costs](https://code.claude.com/docs/en/costs)
- Subagent fan-out multiplies input tokens: about 121k became about 513k with two subagents, and agent teams use about 7x. Subagents get a 5-minute TTL and are not covered by the main cache stats line. — [GIGAZINE/Systima](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token); [Manage costs](https://code.claude.com/docs/en/costs); [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)
- The `/usage` breakdown is local-machine-only and approximate. It excludes other devices and claude.ai, even though limits are shared across Claude and Claude Code. — [Manage costs](https://code.claude.com/docs/en/costs); [Support article](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- ccusage, a popular third-party usage tool, reportedly undercounts output tokens by 77–94% for heavy users because it ignores subagent files and applies timezone filtering. This is a claim from a skills.sh page. — [skills.sh claude-usage](https://skills.sh/tdimino/claude-code-minoan/claude-usage)
- Existing third-party attempts at output compression exist. For example, the "context-mode" MCP plugin claims a 50–90% reduction in MCP-related tokens, based on the author's own experience. — [search summary of mcp.directory and related posts](https://mcp.directory/blog/mcp-context-bloat-fix-2026-tool-search-code-mode-progressive-disclosure)
- A 72KB CLAUDE.md costs about 20k tokens per request. Native help is limited to the 200-line guideline and `/doctor` trim proposals. — [GIGAZINE/Systima](https://gigazine.net/gsc_news/en/20260713-claude-code-consuming-token); [features overview](https://code.claude.com/docs/en/features-overview)
- The cache is scoped to one directory and machine, so sessions in different worktrees do not share it. — [Prompt caching docs](https://code.claude.com/docs/en/prompt-caching)

### Inferences (candidate openings, ranked by how big a sink remains)
1. **Session hygiene and history pruning.** Detect task boundaries and stale context, then auto-suggest or auto-run `/clear`, a focused `/compact`, or `/rewind`, using hooks such as UserPromptSubmit and status-line data. This is the largest remaining sink, and natively it is user judgment only.
2. **Ready-made output filters.** Ship a curated hook pack: test-runner-aware (jest, pytest, go test, cargo), build and install log reducers, git diff summarizers, and log greppers. The docs show the pattern but ship only one DIY example. The value is in breadth, correctness, and not hiding failures.
3. **Subagent and workflow cost governance.** Estimate before delegating whether a subagent saves or costs (fixed overhead times N agents with a 5-minute TTL), enforce model, `maxTurns` and `omitClaudeMd` policies, and report per-subagent spend including cache writes. Native attribution exists but gives no advice or caps per delegation.
4. **Limit forecasting for subscribers.** Forecast "will this task fit my remaining 5-hour or weekly budget?" from local logs plus observed limit-burn rates, across devices. Native `/usage` is local, approximate and retrospective. ccusage reportedly undercounts. The exact weights are undisclosed, so any forecaster must calibrate empirically, which is a risk.
5. **CLAUDE.md, rules and skills auditing.** Measure which instructions are actually used or violated, propose moves to path-scoped rules or skills, and track token weight over time for teams. Native `/doctor` proposes trims for one file only.
6. **Team-level visibility on subscription seats.** Usage inside the seat allowance "isn't metered in dollars", and the spend report covers only usage credits. Teams lack a native per-member token view outside Enterprise APIs and OpenTelemetry.
7. **Avoiding repeated codebase exploration.** Auto-generate and maintain a "codebase-overview" skill or map, which the docs suggest but do not ship, so that new sessions don't re-read the same files. Native options are LSP plugins and auto memory (first 200 lines or 25KB).
- **Not viable or redundant:**
  - Shrinking Claude Code's own ~6.5k system prompt and ~24k built-in tool schemas. They are inside the product and only adjustable via deny rules, `--safe-mode` or the Agent SDK.
  - MCP schema compression, a cache keep-alive, a context visualizer, and generic truncation. These have been native since January–October 2026.

### Gaps
- No public evidence yet of how much users would pay for these gaps, or of whether Anthropic plans to ship automatic task-boundary `/clear` or built-in output filters. Anthropic said "more Claude Code usage changes are coming" (August 2026), which is a roadmap risk for any third-party tool.
- No independent benchmark compares hook-based output filtering against no filtering in real sessions, so savings claims for an output-filter product would need the vendor's own measurement.
