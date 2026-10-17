# Claude Code user pain points and unmet needs, 2025 to Oct 2026 (EN + JP communities)

Data collected 2026-10-17. GitHub reaction counts are from the GitHub issue search API (via the GitHub MCP tool) on that day. Zenn and Qiita like counts come from their public APIs on the same day. HN points come from the hn.algolia.com API. "Reactions" means the issue's total reaction count. Where I give a "+1" count, it is the thumbs-up subset.

Access limits that shape this evidence:
- Reddit (reddit.com and old.reddit.com) was blocked for both search and fetch.
- note.com's API returned 403.
- X can only be seen through secondary sources.
- The repo-wide "sort by reactions" API call was blocked. The GitHub top list below is therefore assembled from (a) the GitHub web UI's open-issue list sorted by thumbs-up, fetched as a page, and (b) about 20 topical searches sorted by reactions.

---

## Q1. What are the most-upvoted open feature requests and bug reports in anthropics/claude-code (sorted by reactions)?

### Takeaway
By reactions, the top open issues in Oct 2026 fall into five groups:
- Account and plan friction: multi-account switching (~1,100 reactions on each of two issues), India pricing, phone verification.
- Usage-limit depletion: the most-commented threads in the repo (~1,500 and 877 comments).
- Terminal/TUI rendering: scroll-jump, flicker and copy-paste (300 to 820 each).
- Instruction-file portability: AGENTS.md. The closed issue has 6,687 reactions, the largest in the repo.
- Review and parallel-work UX: diff review UI, multi-window, worktrees.

The single biggest open item (#45596, 2,113 reactions) is an emotional plea to bring back a removed "/buddy" feature. It shows that intensity on GitHub does not always mean willingness to pay.

### Cited Findings

**Top ~20 open issues by reactions (as of 2026-10-17)**

| Rank | Issue | Reactions (+1) | Comments | Opened | Theme |
|---|---|---|---|---|---|
| 1 | #45596 "Bring Back Buddy — A Consolidated Plea from the Community" | 2,113 (+1 1,193; heart 645) | 281 | 2026-04-09 | Removed TUI feature (/buddy) |
| 2 | #18435 "Add the ability to manage multiple Claude accounts within the Claude Desktop app with easy switching between profiles" | 1,121 (+1 912) | 201 | 2026-01-15 | Multi-account |
| 3 | #36151 "Multi-account switching in Claude Mobile app without shared email" (labelled invalid/not CC-specific) | 1,052 (+1 759) | 188 | 2026-03-19 | Multi-account |
| 4 | #34229 "[BUG] Phone verification" (labelled invalid) | +1 between 759 and 912 (inferred from sort position) | 742 | 2026-03-14 | Account/verification |
| 5 | #16157 "[BUG] Instantly hitting usage limits with Max subscription" | +1 between 690 and 759 (inferred from sort position) | ~1,495 (most-commented) | 2026-01-03 | Usage limits |
| 6 | #826 "Console scrolling top of history when claude add text to the console" | 822 (+1 690) | 354 | 2025-04-19 | TUI scroll |
| 7 | #17432 "India-Specific Pricing Plans (INR) for Claude & Claude Code" | 647 (+1 501) | 215 | 2026-01-11 | Price localization |
| 8 | #31005 "Support for AGENTS.md and .agents/skills/, the community has been asking since August 2025" | 562 (+1 417) | 33 | 2026-03-05 | Instruction files |
| 9 | #38335 "Claude Max plan session limits exhausted abnormally fast since March 23, 2026 (CLI usage)" | 545 (+1 476; confused 42) | 877 | 2026-03-24 | Usage limits |
| 10 | #15942 "Add support for Visual Studio 2026 Integration" | +1 between 417 and 476 (inferred) | 155 | 2026-01-01 | IDE/Windows |
| 11 | #1455 "Claude Code does not respect the XDG Base Directory specification" | +1 between 417 and 476 (inferred) | 68 | 2025-05-31 | Linux config hygiene |
| 12 | #2511 "Connect Claude code to Claude projects" | +1 between 417 and 476 (inferred) | 52 | 2025-06-24 | Context/knowledge |
| 13 | #769 "In-progress Call causes Screen Flickering" | 336 | 307 | 2025-04-12 | TUI flicker |
| 14 | #1913 "Terminal Flickering" | 321 | 187 | 2025-06-10 | TUI flicker |
| 15 | #18170 "Copy/paste from terminal includes unwanted indentation and trailing spaces" | 300 | 138 | 2026-01-14 | TUI copy-paste |
| 16 | #85891 "Claude Desktop (Windows 11): main window stays always-on-top… no setting to disable it" | 291 | 121 | 2026-08-11 | Windows desktop |
| 17 | #33932 "VS Code Extension: Diff review UI similar to GitHub Copilot Edits Review" | 287 (+1 206; heart 51) | 41 | 2026-03-13 | Reviewing AI changes |
| 18 | #30154 "Multi-window support in Claude Code Desktop" | 262 | 75 | 2026-03-02 | Parallel sessions |
| 19 | #13354 "Continue when the session limit reached" | 215 | 80 | 2025-12-08 | Usage limits |
| 20 | #28240 "Permission prompt incorrectly triggers on cd instead of the actual command in compound bash statements" | 209 | 48 | 2026-02-24 | Permissions |

Sources for the table:
- Positions and comment counts come from the [GitHub issues list sorted by thumbs-up](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20state%3Aopen%20sort%3Areactions-%2B1-desc).
- Reaction counts come from GitHub search API results for each issue, for example [#45596](https://github.com/anthropics/claude-code/issues/45596), [#18435](https://github.com/anthropics/claude-code/issues/18435), [#38335](https://github.com/anthropics/claude-code/issues/38335), [#826](https://github.com/anthropics/claude-code/issues/826), [#17432](https://github.com/anthropics/claude-code/issues/17432), [#33932](https://github.com/anthropics/claude-code/issues/33932), [#30154](https://github.com/anthropics/claude-code/issues/30154) and [#13354](https://github.com/anthropics/claude-code/issues/13354).
- #16157 details are from [its issue page](https://github.com/anthropics/claude-code/issues/16157). The page shows ~1,495 comments. Reactions on the opening post were "currently unavailable" in the fetch. A follow-up comment by the author has 👍282, and a duplicate-bot comment has 👎338.

**Other high-signal issues by theme**

Usage limits and cost:
- [#35744](https://github.com/anthropics/claude-code/issues/35744) "Auto-continue after subscription rate limit resets": 106 reactions (2026-03-18).
- [#29579](https://github.com/anthropics/claude-code/issues/29579) "Rate limit reached despite Claude Max subscription and only 16% usage": 94 reactions, 153 comments (2026-02-28).
- [#41788](https://github.com/anthropics/claude-code/issues/41788) "Max 20 plan: rate limit 100% exhausted within ~70 minutes after reset": 86 reactions (2026-04-01).
- [#23706](https://github.com/anthropics/claude-code/issues/23706) "Opus 4.6 token consumption significantly higher than 4.5": 78 reactions (2026-02-06).
- [#19673](https://github.com/anthropics/claude-code/issues/19673) "You've hit your limit · While usage is still at 84%": 77 reactions, 102 comments (2026-01-21).
- [#9424](https://github.com/anthropics/claude-code/issues/9424) "Weekly Usage Limits Making Claude Subscriptions Unusable": 155 reactions, closed (2025-10-12).
- [#2944](https://github.com/anthropics/claude-code/issues/2944) "API Fallback for Pro/Max Subscriptions When Limits Are Reached": 80 reactions, closed (2025-07-03).
- [#1109](https://github.com/anthropics/claude-code/issues/1109) "Usage Metrics Visibility for Max Subscribers": 62 reactions, closed.
- [#5621](https://github.com/anthropics/claude-code/issues/5621) "StatusLine should expose API usage/quota information": 71 reactions, closed.
- [#11008](https://github.com/anthropics/claude-code/issues/11008) "Expose token usage and cost data in hook inputs": 33 reactions, open.
- [#80261](https://github.com/anthropics/claude-code/issues/80261) "Show usage limits on main screen / persistent usage indicator in desktop app": 28 reactions (2026-07-22).
- [#46917](https://github.com/anthropics/claude-code/issues/46917) "CC v2.1.100+ inflates cache_creation by ~20K tokens vs v2.1.98": opened 2026-04-12, ranked in the UI top 25 by +1.

Context loss and compaction:
- [#17428](https://github.com/anthropics/claude-code/issues/17428) "Enhanced /compact with file-backed summaries and selective restoration": 117 reactions (2026-01-11).
- [#98747](https://github.com/anthropics/claude-code/issues/98747) "2.1.286 idle compaction silently discards working context in long-running sessions; no opt-out": 31 reactions (2026-10-01, closed).
- [#6354](https://github.com/anthropics/claude-code/issues/6354) "Claude forgets everything in CLAUDE.md after compaction": 30 reactions.
- [#24201](https://github.com/anthropics/claude-code/issues/24201) "Ask questions for compaction": 19 reactions.

Permissions:
- [#70622](https://github.com/anthropics/claude-code/issues/70622) "option to disable clickable Yes/No prompts": 85 reactions.
- [#43713](https://github.com/anthropics/claude-code/issues/43713) "autoAllowBashIfSandboxed bypassed for commands containing shell expansions": 84 reactions.
- [#27957](https://github.com/anthropics/claude-code/issues/27957) "disable 'Command contains quoted characters in flag names' warning": 74 reactions.
- [#18950](https://github.com/anthropics/claude-code/issues/18950) "Skills/subagents do not inherit user-level permissions": 72 reactions.
- [#13340](https://github.com/anthropics/claude-code/issues/13340) "settings.json allow permissions are not respected": 51 reactions.
- [#6850](https://github.com/anthropics/claude-code/issues/6850) "settings.local.json allow not working - keeps asking": 46 reactions.
- [#30435](https://github.com/anthropics/claude-code/issues/30435) "Allow suppressing bash safety heuristic prompts via settings": 40 reactions.

Parallel work, worktrees and multi-repo:
- [#23627](https://github.com/anthropics/claude-code/issues/23627) "Multi-repository support for remote/web sessions": 99 reactions.
- [#30213](https://github.com/anthropics/claude-code/issues/30213) "Compound cd && git commands in worktrees should not require approval": 60 reactions.
- [#34437](https://github.com/anthropics/claude-code/issues/34437) "Worktrees should share the same project directory as the main repo": 47 reactions.
- [#15776](https://github.com/anthropics/claude-code/issues/15776) "Session state should persist across git worktrees": 47 reactions.
- [#23669](https://github.com/anthropics/claude-code/issues/23669) "Agent Teams: support per-teammate working directory, CLAUDE.md, and MCP configs": 32 reactions.

Reviewing AI changes:
- [#8660](https://github.com/anthropics/claude-code/issues/8660) "Edit preview/diff not showing in VSCode extension UI": 93 reactions.
- [#31888](https://github.com/anthropics/claude-code/issues/31888) "batch diff review mode… like Cursor": 58 reactions.
- [#61794](https://github.com/anthropics/claude-code/issues/61794) "per-hunk accept/reject diff UI": 32 reactions.

TUI:
- [#15199](https://github.com/anthropics/claude-code/issues/15199) "CLI output formatting artifacts break copy/paste - workarounds waste tokens": 108 reactions.
- [#4851](https://github.com/anthropics/claude-code/issues/4851) "Scrollback Buffer Rewind Lag in Claude Code + Tmux + VS Code": 97 reactions.
- [#22073](https://github.com/anthropics/claude-code/issues/22073) copy/paste newlines: 82 reactions.
- [#13378](https://github.com/anthropics/claude-code/issues/13378) "2-space indent and hard wrap at 80 breaks copy-paste": 79 reactions.

Windows:
- [#12506](https://github.com/anthropics/claude-code/issues/12506) "Claude Desktop: Option to execute commands in WSL": 147 reactions, closed.
- [#49933](https://github.com/anthropics/claude-code/issues/49933) "Native WSL Remote Integration for Claude Code Desktop": 82 reactions, closed.
- [#604](https://github.com/anthropics/claude-code/issues/604) "Windows native support": 81 reactions, closed.
- [#14902](https://github.com/anthropics/claude-code/issues/14902) "Native Windows (Powershell) install… is not viable": 37 reactions.

Multi-account, beyond the top 3:
- [#20131](https://github.com/anthropics/claude-code/issues/20131): 115 reactions.
- [#30031](https://github.com/anthropics/claude-code/issues/30031) "Support multiple account login and switching (like `gh auth switch`)": 91 reactions.
- [#24963](https://github.com/anthropics/claude-code/issues/24963): 69 reactions.
- [#22872](https://github.com/anthropics/claude-code/issues/22872) "Switching between personal and work Claude Code accounts is abysmal": 23 reactions.

Instruction files:
- [#6235](https://github.com/anthropics/claude-code/issues/6235) "Feature Request: Support AGENTS.md." has 6,687 reactions (+1 5,188) and 409 comments. It was opened 2025-08-21 and is now closed. It is by far the most-reacted issue found.
- Claude Code began reading AGENTS.md when no CLAUDE.md exists ([HN, 741 pts, 2026-09-18](https://news.ycombinator.com/item?id=49760187)).
- A follow-up found it worked "only when telemetry is on [fixed]" ([HN, 486 pts, 2026-09-23](https://news.ycombinator.com/item?id=49814947)).
- [#95690](https://github.com/anthropics/claude-code/issues/95690) "AGENTS.md Support: A Local Feature Locked Behind a Remote Switch" has 14 reactions (2026-09-20).

Security and trust:
- [#14485](https://github.com/anthropics/claude-code/issues/14485) "Plugin marketplace clone triggers unexplained SSH key access prompt": 50 reactions.
- [#62061](https://github.com/anthropics/claude-code/issues/62061) "v2.1.150 adds server-side system prompt injection via `tengu_heron_brook` feature flag": 50 reactions (2026-05-24, closed).

Model quality:
- [#42796](https://github.com/anthropics/claude-code/issues/42796) "[MODEL] Claude Code is unusable for complex engineering tasks with the Feb updates" was opened 2026-04-02 and has ~620 timeline items. It was locked as resolved on 2026-04-24.
  - It reports a Read:Edit ratio falling from 6.6 to 2.0 and edits to unread files rising from 6.2% to 33.7%.
  - Anthropic replied that thinking redaction was UI-only and pointed to an April 23 postmortem.
- [#83510](https://github.com/anthropics/claude-code/issues/83510) "Measurable quality regression in Claude generation 5… ~2x verbosity, under-disclosed model fallback": 25 reactions (2026-08-03).
- [#65961](https://github.com/anthropics/claude-code/issues/65961) "verbose code comments by default — ignores instructions to stop" (2026-06-07) is in the UI top 25 by +1.

Japanese/CJK input (mostly closed, i.e. fixed):
- [#8405](https://github.com/anthropics/claude-code/issues/8405) "Pressing Enter to confirm IME (Japanese) conversion unintentionally sends the prompt": 95 reactions.
- [#1306](https://github.com/anthropics/claude-code/issues/1306) "Japanese input UX improvements": 44 reactions.
- [#8498](https://github.com/anthropics/claude-code/issues/8498): 29 reactions.
- [#14405](https://github.com/anthropics/claude-code/issues/14405) "Panic on UTF-8 multibyte character boundary in Japanese text": 28 reactions.
- [#8423](https://github.com/anthropics/claude-code/issues/8423) (ATOK): 15 reactions.
- [#1547](https://github.com/anthropics/claude-code/issues/1547) "IME input causes performance issues and duplicate conversion candidates" is still open and in the UI top 25 by +1.

Velocity of new bugs:
- A Zenn author counted **76 GitHub issues (72 open)** filed within about two days that cite one desktop release (2.37337.1, 2026-10-14/15). The issues covered a missing usage/context ring, effort toggle going from 1 to 3 clicks, and project view removal ([Zenn tenpachi, 2026-10-15](https://zenn.dev/tenpachi/articles/539d6526000a41)).

### Inferences
- Account and plan friction (multi-account, phone verification, regional pricing) gets more raw reactions than any single coding-workflow feature. The multi-account requests strongly suggest many users hold more than one subscription (work and personal, or extra capacity) and want to rotate between them.
- Usage-limit pain is best measured by comment volume, not reactions. #16157 (~1,495 comments) and #38335 (877) are by far the most-discussed threads. People pile on to vent and to compare notes.
- TUI scroll, flicker and copy-paste bugs have been open since April 2025 with 300 to 800 reactions each. They are chronic irritants, but hard for third parties to fix.
- The large closed AGENTS.md issue shows strong demand for tool-neutral instruction files, so that rules work across Claude Code, Codex and others.

### Gaps
- I could not run a true repo-wide "sort by reactions" API query, which was blocked for this session. Some open issues with over 200 reactions on themes I did not search may be missing.
- Exact reaction totals for #34229, #16157, #15942, #1455, #2511, #27302 and #46917 are inferred from their position in the GitHub UI's +1-sorted list, not read directly.
- I could not determine exactly what the "/buddy" feature was beyond its being a TUI/skill feature that was removed around 2026-04-09.

---

## Q2. What complaints dominate r/ClaudeAI, r/ClaudeCode and Hacker News regarding Claude Code?

### Takeaway
On HN, the 2026 complaint threads with the most points are about:
- Silent quality degradation (1,364 / 1,085 / 971 / 942 pts).
- Anthropic restricting how subscriptions may be used, such as OpenClaw and third-party harnesses (1,349 / 1,099 / 625 pts).
- Opaque usage-limit changes (683 / 331 / 295 pts).
- Token overhead ("33k tokens before reading the prompt", 706 pts).

Reddit could not be accessed directly. Secondary coverage says Reddit and Discord carried the same usage-limit complaints (Jan 2026, Mar 2026).

### Cited Findings

**HN top complaint threads, 2026 (points / comments / date)**

Quality regressions:
- "Issue: Claude Code is unusable for complex engineering tasks with Feb updates": 1,364 / 753 / 2026-04-06 ([HN](https://news.ycombinator.com/item?id=47660925)).
  - Top replies include "That analysis is pretty brutal… stealthily degrade it over time, effectively pulling the rug from under their customers."
  - Another reply: "Something worse than a bad model is an inconsistent model… everything must be reviewed with intensity which is exhausting. I jumped on Max because it was worth it but I guess I'll have to cancel" ([HN comments via Algolia](https://news.ycombinator.com/item?id=47660925)).
- "Claude Code is being dumbed down?": 1,085 / 701 / 2026-02-11 ([HN](https://news.ycombinator.com/item?id=46978710)).
- "I cancelled Claude: Token issues, declining quality, and poor support": 971 / 582 / 2026-04-24 ([HN](https://news.ycombinator.com/item?id=47892019)). One comment: "Claude with Sonnet medium effort just used 100% of my session limit, some extra dollars, thought for 53 minutes, and said: API Error… exceeded the 32000 output token maximum."
- "An update on recent Claude Code quality reports" (Anthropic's response): 942 / 732 / 2026-04-23 ([HN](https://news.ycombinator.com/item?id=47878905)).
- "Claude Code daily benchmarks for degradation tracking": 760 / 354 / 2026-01-29 ([HN](https://news.ycombinator.com/item?id=46810282)).
- "Anthropic appears to be A/B testing reduced effort levels in Claude Code": 216 / 191 / 2026-08-22 ([HN](https://news.ycombinator.com/item?id=49401549)).

Policy and lock-in:
- "Claude Code refuses requests or charges extra if your commits mention 'OpenClaw'": 1,349 / 720 / 2026-04-30 ([HN](https://news.ycombinator.com/item?id=47963204)).
- "Tell HN: Anthropic no longer allowing Claude Code subscriptions to use OpenClaw": 1,099 / 827 / 2026-04-03 ([HN](https://news.ycombinator.com/item?id=47633396)).
- "Anthropic blocks third-party use of Claude Code subscriptions": 625 / 513 / 2026-01-09 ([HN](https://news.ycombinator.com/item?id=46549823)).

Limits and pricing:
- "Claude Code to be removed from Anthropic's Pro plan?": 683 / 642 / 2026-04-21 ([HN](https://news.ycombinator.com/item?id=47854477)).
- "Claude Code users hitting usage limits 'way faster than expected'": 331 / 224 / 2026-03-31 ([HN](https://news.ycombinator.com/item?id=47586176), article: [The Register](https://www.theregister.com/2026/03/31/anthropic_claude_code_limits/)). One commenter cited a Reddit user who reverse-engineered the binary and blamed a cache-invalidation bug.
- "Claude Code May–August 2026 weekly limits promotion": 295 / 267 / 2026-08-18 ([HN](https://news.ycombinator.com/item?id=49348751)). A search snippet attributes these comments to the thread (not verified by a direct fetch): one user cancelled Max 5x, one cancelled 20x after a single session used most of the weekly allowance, and one wrote "five research agents… spinning up a total of 26 subagents… burned through the remainder of my weekly in the span of 20 minutes."
- "Reallocating $100/Month Claude Code Spend to Zed and OpenRouter": 349 / 234 / 2026-04-09 ([HN](https://news.ycombinator.com/item?id=47700972)).

Token overhead:
- "Claude Code sends 33k tokens before reading the prompt; OpenCode sends 7k": 706 / 395 / 2026-07-12 ([HN](https://news.ycombinator.com/item?id=48883275)). Top reply: "What really burns tokens is sub agents… it immediately launched 7 sub agents which burned through my budget before even one of them was finished."

Trust and privacy:
- "Claude Code is steganographically marking requests": 2,445 / 750 / 2026-06-30. This is the highest-scoring Claude Code story found ([HN](https://news.ycombinator.com/item?id=48734373)).
- "Claude Session URL appended to commit messages and PR descriptions by default": 209 / 240 / 2026-08-30 ([HN](https://news.ycombinator.com/item?id=49498201)).
- "Claude Code runs Git reset --hard origin/main against project repo every 10 mins": 251 / 192 / 2026-03-29 ([HN](https://news.ycombinator.com/item?id=47567969)).

Platform:
- "Claude Code login fails with OAuth timeout on Windows": 222 / 304 / 2026-04-07 ([HN](https://news.ycombinator.com/item?id=47676521)).
- "Claude Desktop spawns 1.8 GB Hyper-V VM on every launch": 434 / 304 / 2026-06-10 ([HN](https://news.ycombinator.com/item?id=48479452)).
- "Anthropic, please ship an official Claude Desktop for Linux": 538 / 305 / 2026-06-07 ([HN](https://news.ycombinator.com/item?id=48434436)).

Alternatives:
- "Ask HN: Has anyone replaced Claude/GPT with a local model for daily coding?": 1,318 / 563 / 2026-06-15 ([HN](https://news.ycombinator.com/item?id=48542100)).
- "Claude Code: connect to a local model when your quota runs out": 386 / 207 / 2026-02-01 ([HN](https://news.ycombinator.com/item?id=46845845)).

Enterprise cost:
- "Uber torches 2026 AI budget on Claude Code in four months": 402 / 475 / 2026-05-01 ([HN](https://news.ycombinator.com/item?id=47976415)).
- "Microsoft starts canceling Claude Code licenses": 493 / 466 / 2026-05-22 ([HN](https://news.ycombinator.com/item?id=48238896)).
- "Meta and Microsoft take steps to reduce employee usage of Claude AI": 378 / 388 / 2026-10-07 ([HN](https://news.ycombinator.com/item?id=49997161)).

**HN "positive demand" threads that reveal wanted features**
- "Warcraft III Peon Voice Notifications for Claude Code": 1,006 pts (2026-02-12). This shows demand for knowing when the agent is done or waiting ([HN](https://news.ycombinator.com/item?id=46985151)).
- "MCP server that reduces Claude Code context consumption by 98%": 570 pts ([HN](https://news.ycombinator.com/item?id=47193064)).
- "Portal by Spotify cut my Claude Code token usage by 90%": 278 pts, 2026-09-04 ([HN](https://news.ycombinator.com/item?id=49571465)).
- "Orchestrate teams of Claude Code sessions": 396 pts ([HN](https://news.ycombinator.com/item?id=46902368)).
- "Cook: A simple CLI for orchestrating Claude Code": 307 pts ([HN](https://news.ycombinator.com/item?id=47434024)).
- "Running Claude Code dangerously (safely)": 351 pts ([HN](https://news.ycombinator.com/item?id=46690907)).
- "Breaking Claude Code Opus 5 Auto Mode": 399 pts, 2026-08-31 ([HN](https://news.ycombinator.com/item?id=49506819)).
- "How the Claude Code team does code review": 349 pts, 2026-10-16 ([HN](https://news.ycombinator.com/item?id=50122951)).
- "Claude Code On-the-Go": 543 pts ([HN](https://news.ycombinator.com/item?id=46491486)).

**Reddit (secondary sources only)**
- In January 2026, The Register reported complaints on Discord and Reddit about surprise usage limits. Anthropic blamed an expiring holiday bonus ([The Register, 2026-01-05](https://www.theregister.com/2026/01/05/claude_devs_usage_limits/)).
- A Reddit-based comparison (April 2026) reported that Claude Code on Opus 4.6 with two parallel sessions hit 100% of the 5-hour limit in 20 minutes, while Codex ran a 90-minute session without hitting a cap. This is a single developer's benchmark ([Startup Fortune](https://startupfortune.com/developers-flee-claude-code-rate-limits-for-openai-codex-as-throughput-war-heats-up/)).
- A DEV summary of "500+ Reddit developers" says Pro ($20) plans run out after 1 to 2 complex prompts, using 50 to 70% of the 5-hour window. Its sourcing is thin ([DEV](https://dev.to/_46ea277e677b888e0cd13/claude-code-vs-codex-2026-what-500-reddit-developers-really-think-31pb)).
- Compaction complaints:
  - Guides summarizing community reports say "Decisions and the original task are the usual casualties" of lossy compaction ([DEV](https://dev.to/alfredoizjr/how-to-stop-claude-code-from-losing-context-2026-30ib)).
  - Repeated compactions progressively drop file paths and error details ([Bytebell](https://bytebell.ai/blog/claude-code-compacting-losing-work/)).
  - GitHub [#7530](https://github.com/anthropics/claude-code/issues/7530) "Error during compaction" includes users saying they were switching to Codex.

### Inferences
- In 2026 the top three complaint clusters by HN points are, in order:
  1. Quality inconsistency, plus the trust erosion and verification burden it creates.
  2. Anthropic policy and lock-in decisions.
  3. Usage-limit opacity.
- Context compaction is a steady, lower-intensity complaint that rarely makes HN front pages but appears constantly in guides and GitHub.
- Many complaint threads end in "I switched to Codex/OpenCode/local models", so churn risk is real. Tools that make Claude Code harness-agnostic, or that cut token waste, have a receptive audience.

### Gaps
- No direct Reddit data (scores, thread titles), because reddit.com was inaccessible to both search and fetch. The Reddit picture rests on secondary reporting.
- No direct X/Twitter data in English.

---

## Q3. What do Japanese users (Zenn, Qiita, note, X) complain about or wish for? Which articles got the most likes?

### Takeaway
Japanese demand, as measured by likes, centres on:
- Learning the tool's sprawling features.
- Writing CLAUDE.md.
- Making the agent remember rules and past context.
- Running parallel "AI teams".
- Verifying or reviewing AI output, including not wanting to read AI-written docs.
- Rolling out to teams and juniors.
- Usage/cost visibility (ccusage).

Japanese-specific technical pain is concentrated in IME input (now mostly fixed on GitHub) and Windows encoding (CP932) breaking hooks.

### Cited Findings

**Zenn, topic "claudecode", all-time by likes (top items)**

| Likes | Bookmarks | Date | Title | Theme |
|---|---|---|---|---|
| 1,803 | 946 | 2026-01-25 | [Claude Codeで「AI部下10人」を作ったら…](https://zenn.dev/shio_shoppaize/articles/5fee11d03a11a1) | Parallel agents |
| 1,162 | 670 | 2025-06-20 | [Claude Code を初めて使う人向けの実践ガイド](https://zenn.dev/hokuto_tech/articles/86d1edb33da61a) | Onboarding |
| 1,123 | 398 | 2026-10-05 | [俺のAIプログラミング手法(2026/10/05)](https://zenn.dev/mizchi/articles/ai-coding-loop-formal) | Workflow/verification |
| 1,049 | 493 | 2025-06-29 | [Claude Codeの「すぐルール忘れる問題」を解決する超効果的な方法を見つけた気がする](https://zenn.dev/sesere/articles/0420ecec9526dc) | Rule/context loss |
| 973 | 513 | 2026-08-28 | [AIに丸投げしないで理解するためのAI開発手法（2026年8月現在）](https://zenn.dev/avaintelligence/articles/dont-outsource-understanding-to-ai) | Understanding/review |
| 850 | 304 | 2026-08-19 | [AIで生産性が3倍になった私たちが、チームを置き去りにした話](https://zenn.dev/factory_dx_eng/articles/ai-productivity-team-divide) | Team rollout |
| 834 | 443 | 2025-07-31 | [Claude Codeを10倍賢くする無料ツール「Serena」の威力とトークン効率化術](https://zenn.dev/sc30gsw/articles/ff81891959aaef) | Token efficiency |
| 735 | 202 | 2026-08-31 | [202608個人的claude code設定](https://zenn.dev/kawarimidoll/articles/d3f1a7542de71a) | Config |
| 605 | 322 | 2026-07-17 | [AIに「レビューして」はもう古い？「敵対的検証」のすすめ](https://zenn.dev/loglass/articles/6aa18c80496ec6) | Verification |
| 599 | 259 | 2025-06-06 | [Claude Pro（$20）プランでゼロから始めるClaude Code](https://zenn.dev/asap/articles/700168965fdb7b) | Cheap plan |
| 566 | 145 | 2025-05-30 | [Claude Codeの使用料金を可視化するCLIツール「ccusage」を作った](https://zenn.dev/ryoppippi/articles/6c9a8fe6629cd6) | Cost visibility |
| 544 | 290 | 2025-06-11 | [Claude Codeで効率的に開発するための知見管理](https://zenn.dev/driller/articles/2a23ef94f1d603) | Knowledge/memory |
| 520 | 294 | 2026-03-22 | [Claude Codeに長期記憶を持たせたら、壁打ちの質が変わった](https://zenn.dev/noprogllama/articles/7c24b2c2410213) | Long-term memory |
| 514 | 245 | 2026-01-27 | [AIの見張り番をやめよう - AIチームを指揮するOSS「TAKT」](https://zenn.dev/nrs/articles/c6842288a526d7) | Babysitting/orchestration |
| 466 | 242 | 2026-03-24 | [ハーネスエンジニアリングで人間のコードレビューをやめる](https://zenn.dev/theaktky/articles/1c6c3b9333117c) | Review |
| 449 | 240 | 2026-03-03 | [CLAUDE.mdに本当は何を書くべきなのか](https://zenn.dev/cureapp/articles/65b9a99d22ce2b) | CLAUDE.md |
| 447 | 260 | 2026-01-18 | [Claude Codeの機能が多くて混乱している人へ](https://zenn.dev/kazu1/articles/b678ce44616354) | Feature overload |
| 437 | 204 | 2025-06-09 | [Claude Codeを並列組織化してClaude Code "Company"にするtmuxコマンド集](https://zenn.dev/kazuph/articles/beb87d102bd4f5) | Parallel |

Source: Zenn public API, `topicname=claudecode&order=alltime`, retrieved 2026-10-17.

**Zenn, last ~30 days (Oct 2026), most liked**
- [Claude Codeに過去の会話を思い出させる](https://zenn.dev/babarot/articles/claude-code-session-recall): 37 likes / 21 bookmarks (2026-10-13). Session recall is the top article of the month.
- [モバイルアプリ開発でノートPCを持ち歩かなくなった話](https://zenn.dev/yasi/articles/mobile-dev-from-phone-with-claude): 35 likes. Phone-based use.
- [【LocalLLM】Claude Codeの代わりになる？精度・同時人数・費用を検証](https://zenn.dev/solvio/articles/6d374a9224327a): 14 likes. Cost-driven alternatives.
- [なぜ Skill は使ってもらえないのか](https://zenn.dev/nrs/articles/6ce38891833998): 14 likes.
- [Claude Code が"手元で何をしたか"まで追う — OpenTelemetry × BigQuery の収集基盤](https://zenn.dev/canly/articles/a20d02428b475a): 8 likes. Team observability.
- [モデルが変わっても効くトークン節約ポイント集](https://zenn.dev/tektek/articles/513e01d74ff122): 4 likes.
- [AIコーディングのコストが残らない…30秒で計測が切れていた](https://zenn.dev/yusuke_shiki/articles/ai-coding-cost-measurement-timeout): 2 likes.
- [Windows の Claude Code フックは、日本語のときだけ黙って壊れる](https://zenn.dev/haruto_miyakawa/articles/claude-code-hook-windows-cp932): 2 likes. Windows CP932 encoding.
- Several posts on not trusting "tests passed" or "fixed" claims:
  - [AI の「テストが通りました」を信じない](https://zenn.dev/k_iijima/articles/c93db4323345ec)
  - [Claude Codeの「直しました」を信じないために作った仕組みと、それでも5%残る話](https://zenn.dev/kirinukiauto/articles/510930af48266f)
- Daily-summary snapshots (counts at the time):
  - "Claude CodeにProfile機能を導入する": ♥8 ([digest 2026-09-04](https://github.com/shoji-miyoshi/test/issues/121)). Account/profile switching.
  - A /resume conversation-history search skill: ♥4 (same digest).
  - A hook that confirms before adding dependencies: ♥3 ([digest 2026-09-25](https://github.com/shoji-miyoshi/test/issues/163)).

Source: Zenn public API `order=monthly`, retrieved 2026-10-17. Monthly like counts are still accruing.

**Qiita, tag ClaudeCode, stocks > 300, by likes**

| Likes | Stocks | Date | Title | Theme |
|---|---|---|---|---|
| 2,370 | 1,853 | 2026-03-02 | [Claude Codeですべての日常業務を爆速化しよう！](https://qiita.com/minorun365/items/114f53def8cb0db60f47) | Non-coding use |
| 1,091 | 798 | 2026-06-25 | [正直に言う。お前のClaude Codeの使い方は間違っている](https://qiita.com/tehito/items/356e5f1dba112a075be1) | Usage mistakes |
| 972 | 1,074 | 2026-03-13 | [【入門記事】ClaudeCodeの中級者になりたい人は集合してください](https://qiita.com/K5K/items/72cc4282819ace823524) | Onboarding |
| 968 | 923 | 2026-02-17 | [【15分で追いつく！】今のClaude Codeができることをざっくり解説](https://qiita.com/kyuko/items/77e9e022860b57e4bd4d) | Feature catch-up |
| 875 | 795 | 2026-01-19 | [Claude Code作者が実践する「超並列駆動」開発術](https://qiita.com/ot12/items/66e7c07c459e3bb7082d) | Parallel |
| 832 | 670 | 2026-04-22 | [Opus4.7の登場により…「これはもうやめろ」と言い始めた6つのこと](https://qiita.com/ot12/items/06420caf41a34a910c53) | Model-change adaptation |
| 739 | 751 | 2026-04-14 | [Claude Code を Level 5 まで育てたら…](https://qiita.com/teppei19980914/items/8da88b33ffa8cf88dfa2) | Harness/config |
| 569 | 536 | 2026-03-31 | [100行のCLAUDE.mdより35行が効く理由](https://qiita.com/nogataka/items/d6c83ea50b82e1c2602c) | CLAUDE.md |
| 552 | 565 | 2026-03-14 | [【2026年最新版】Claude Codeで行うべきセキュリティ設定 10選](https://qiita.com/miruky/items/51db293a7a7d0d277a5d) | Security |
| 552 | 324 | 2025-08-08 | [ジュニアエンジニアがClaude Codeでバイブコーディングした結果、上司に迷惑をかけた話](https://qiita.com/MIDO-ruby7/items/177f4341af8b19984b80) | Team/review |
| 502 | 330 | 2026-09-13 | [生成AIが書いたドキュメントを読みたくない](https://qiita.com/take-yoda/items/e5d9ce6618523af1ffc5) | Review fatigue |
| 495 | 490 | 2026-02-06 | [Claude Codeを最強にするプラグイン・MCP・ツール総まとめ](https://qiita.com/shatolin/items/ca1810e419fee5fd963b) | Tool discovery |
| 494 | 560 | 2026-03-18 | [CLAUDE.mdを設計するとClaude Codeの生産性が別物になる](https://qiita.com/nogataka/items/1ad4e4ccaf47816c63e0) | CLAUDE.md |
| 474 | 429 | 2026-02-23 | [Boris Cherny氏の知見を元に作成された、CLAUDE.mdを理解する](https://qiita.com/uno_ha07/items/5820d195510861b5be71) | CLAUDE.md |
| 365 | 313 | 2025-06-13 | [tmuxでClaude CodeのMaxプランでAI組織を動かし放題](https://qiita.com/akira_papa_AI/items/9f6c6605e925a88b9ac5) | Parallel |
| 309 | 347 | 2026-02-28 | [Claude Code完全設定ガイド2026 - Hooks/Skills/MCP/権限](https://qiita.com/emi_ndk/items/56b2fc8bf4e7ed5ba7f3) | Config/permissions |
| 260 | 320 | 2026-07-20 | [CLAUDE.md 設計パターン集──7つのテンプレート](https://qiita.com/hikariclaude01/items/e54c70c90c6aa84d0f66) | CLAUDE.md templates |

Source: Qiita API v2 `tag:ClaudeCode stocks:>300`, 36 items, retrieved 2026-10-17.

Qiita articles since 2026-06 with stocks > 120, beyond those above:
- 360 likes: [新人AI禁止のあと、「新人AI制御教育ハーネス」を配った結果](https://qiita.com/WdknWdkn/items/fe4b1810f45e4b6df166) (2026-08-19). Team/junior rollout.
- 315 likes: [日本語推敲スキル「yomiyasu」がバズっていた](https://qiita.com/inoyu-qiita/items/0ffe6e74ecaf3aaa8b14) (2026-10-01). Quality of Japanese prose output.
- 187 likes: [【インシデント報告】Defender が有効なのに、開発機で5日間マイニングされていた](https://qiita.com/claudecat/items/fd8f449f1dddcc9f31fe) (2026-08-16). Dev-machine security. I did not verify whether Claude Code was the attack vector.
- 158 likes: [トークン代を節約する…「Headroom」](https://qiita.com/shinkai_/items/61b10d10c63db47a64e7) (2026-06-03). Token cost.
- 154 likes: [AIエージェントの作業結果、マークダウンで読むの辛くない？ →「HTML共有くん」](https://qiita.com/minorun365/items/320b4230c0b0c169ba13) (2026-08-16). Reviewing agent output.
- 142 likes: [CLAUDE.mdをそろそろ見直す時期かも ── Claude 5世代向け](https://qiita.com/nogataka/items/d6a54f3694726b9141f3) (2026-09-05). CLAUDE.md maintenance after model changes.

**Japanese usage-limit complaints**
- Serverworks' engineering blog (2026-04-03/04) documented the March 2026 "rapid consumption" problem. On Max ×5, greeting-level messages consumed several percent of the session window ([Serverworks](https://blog.serverworks.co.jp/2026/04/03/083619)).
- Anthropic's explanation in that period was tighter peak-hour limits and the higher cost of 1M-context sessions. It said some bugs were fixed, but that users had not been over-charged (same source).
- ASCII reported that in June 2026 a bug showed ~3% of Pro/Max users an incorrect weekly limit, sometimes blocking sends. Anthropic reset the 5-hour and weekly limits of affected users ([週刊アスキー](https://weekly.ascii.jp/elem/000/004/412/4412075/)).

**X (Japanese), via secondary source**
- After the 2026-10-14/15 desktop update, replies to the official announcement post included:
  - "effortの切り替えを元に戻してほしい" (216 likes, the most)
  - "旧サイドバーの方が使いやすかった" (32 likes)
  - requests to launch from the phone, and complaints about usage limits ([Zenn tenpachi](https://zenn.dev/tenpachi/articles/539d6526000a41))

**Japanese-language technical issues on GitHub**
- IME Enter sends the prompt prematurely: [#8405](https://github.com/anthropics/claude-code/issues/8405), 95 reactions.
- Japanese input UX: [#1306](https://github.com/anthropics/claude-code/issues/1306), 44 reactions.
- UTF-8 panic on Japanese text: [#14405](https://github.com/anthropics/claude-code/issues/14405), 28 reactions.
- ATOK: [#8423](https://github.com/anthropics/claude-code/issues/8423), 15 reactions.
- All four are closed. [#1547](https://github.com/anthropics/claude-code/issues/1547) (IME performance, duplicate candidates) remains open.

### Inferences
- Japanese demand is weighted toward "how to use it well" content: onboarding, CLAUDE.md design, parallel organisation, review harnesses. Several posts have 500 to 2,400 likes. This content is sellable as templates, books or checklists (Zenn Books/BOOTH) more than as software.
- Recurring Japanese software wishes:
  - remember rules and past sessions (session recall, long-term memory)
  - usage/cost visibility (ccusage)
  - token reduction (Serena, Headroom)
  - make agent output easier to review (HTML rendering of reports, verification harnesses)
  - team governance (education harness, OTel collection)
- Japanese-specific bugs (IME, CP932) are real but low-volume and mostly fixed upstream. They are a weak basis for a paid product.

### Gaps
- note.com could not be queried (API 403), so I have no note "スキ" rankings. Japanese X posts were only visible through one Zenn article's summary.
- Zenn monthly likes are still accruing, so October articles are under-counted.

---

## Q4. How strongly do users feel about running out of usage limits? Any surveys or polls? Do Max-plan users still hit limits?

### Takeaway
Feeling is very strong and recurring. Usage-limit threads are the most-commented issues in the entire repo (~1,495 and 877 comments). Explicit "cancelled" and "switching to Codex" statements appear on GitHub and HN throughout 2026. Max 5x and 20x users clearly still hit limits, especially with Opus, parallel sessions or subagents.

Anthropic changed limits several times in 2026:
- doubled 5-hour limits on May 6
- +50% weekly promo from May 13 to Sep 13
- +25% permanent from Sep 14

The end of the promo is effectively a ~17% cut from promo levels. I found no formal survey specifically about Claude Code limits. General developer surveys emphasise trust and verification instead.

### Cited Findings

**Intensity: GitHub**
- [#16157](https://github.com/anthropics/claude-code/issues/16157) (Max, opened 2026-01-03) has about 1,495 comments. Quotes:
  - "Either reduce price of Max plan to $10 or solve that. Are you kidding me?"
  - "This is my livelihood -not a hobby or side project… I'm about ready to pull the plug on my Max plan."
  - "is it time to switch to openAi again?" (Sep 8)
- In a pinned comment (2026-01-26), Anthropic said it had not changed rate limits since Opus 4.5 and that Opus 4.5 "runs longer and does more work."
- A Sep 17 comment says a related issue (#79773, weekly limits after a Max 20x upgrade) went about 58 days without an Anthropic reply.
- [#38335](https://github.com/anthropics/claude-code/issues/38335) "Max plan session limits exhausted abnormally fast since March 23, 2026": 545 reactions, 877 comments.
- Max 20x limit reports:
  - [#41788](https://github.com/anthropics/claude-code/issues/41788): Max 20 exhausted in ~70 minutes after reset, 86 reactions.
  - [#14261](https://github.com/anthropics/claude-code/issues/14261): "$200/Month 'Max' Subscription Provides ~12 Usable Days Due to Weekly Rate Limits".
  - [#29579](https://github.com/anthropics/claude-code/issues/29579): rate-limited at 16% usage, 153 comments.
- [#67412](https://github.com/anthropics/claude-code/issues/67412): the "out of usage credits" message doesn't say which limit was hit, so "Max subscribers buy extra credits unnecessarily" (2026-06-11).

**Intensity: HN and press**
- "Claude Code weekly rate limits": 609 pts / 705 comments (2025-07-28) ([HN](https://news.ycombinator.com/item?id=44713757)).
- "Anthropic tightens usage limits for Claude Code without telling users": 407 pts (2025-07-17) ([HN](https://news.ycombinator.com/item?id=44598254)); [TechCrunch](https://techcrunch.com/2025/07/17/anthropic-tightens-usage-limits-for-claude-code-without-telling-users/).
- Earlier HN complaints include "I would burn through my weekly limits in 2 days" and "no transparency around the metric for these limits" ([HN 47635116](https://news.ycombinator.com/item?id=47635116), via search summary).
- A trending X page reported that Max subscribers shared screenshots of rapid depletion after the Sep 14, 2026 change and announced cancellations, some moving to Codex. It also claimed Max 5x delivers ~3.5x and Max 20x ~6 to 8x in practice. These are unverified secondary claims ([X trending](https://x.com/i/trending/2099567247677161654); [X trending 2](https://x.com/i/trending/2094201936153088131)).

**Limit-change timeline (official or near-official)**
- Weekly caps were introduced on 2025-08-28 for Pro and Max. Anthropic estimated they would affect fewer than 5% of subscribers ([TechCrunch 2025-07-28](https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/); [Impress Watch](https://www.watch.impress.co.jp/docs/news/2034929.html)).
- Jan 2026: complaints about surprise limits, which Anthropic blamed on an expiring holiday bonus ([The Register](https://www.theregister.com/2026/01/05/claude_devs_usage_limits/)).
- Late March 2026: "rapid consumption" crisis ([The Register 2026-03-31](https://www.theregister.com/2026/03/31/anthropic_claude_code_limits/); [Serverworks](https://blog.serverworks.co.jp/2026/04/03/083619)).
- 2026-05-06: 5-hour limits doubled and the peak-hour reduction removed ([HN "Higher usage limits for Claude and a compute deal with SpaceX", 512 pts](https://news.ycombinator.com/item?id=48037986); [morphllm summary](https://www.morphllm.com/claude-code-usage-limits)).
- Weekly limit promo: "From May 13, 2026 through September 13, 2026, your weekly usage limit in Claude Code was 50% higher… starting September 14, 2026, weekly limits in Claude Code are 25% higher than they were before the promotion" (page updated 2026-09-14) ([Claude Help Center](https://support.claude.com/en/articles/15910845-claude-code-may-july-2026-weekly-limits-promotion)).
- Going from 150% to 125% of baseline is about a 17% reduction versus the promo ([explainx](https://www.explainx.ai/blog/anthropic-claude-code-limits-17-percent-cut-september-2026-august-2026)).
- Anthropic no longer publishes exact message or hour counts per window ([buildthisnow](https://www.buildthisnow.com/blog/models/claude-code-usage-limits-2026); [ai-souken](https://www.ai-souken.com/article/claude-usage-limitations)).

**Why Max users still hit limits (user-reported mechanisms)**
- Subagents and parallelism: "it immediately launched 7 sub agents which burned through my budget" ([HN 48883275](https://news.ycombinator.com/item?id=48883275)). A search summary of 2026 pricing guides said one guide estimates a 3-agent team uses ~7× the tokens of a single-agent session. The specific guide was not identified and the claim was not verified by fetch; candidates are [morphllm](https://www.morphllm.com/claude-code-usage-limits) and [faros](https://www.faros.ai/blog/claude-code-token-limits).
- Harness overhead: ~33k tokens sent before the prompt, versus 7k for OpenCode ([HN 48883275](https://news.ycombinator.com/item?id=48883275)). A cache_creation regression added ~20K tokens per request ([#46917](https://github.com/anthropics/claude-code/issues/46917)).
- Newer models consume more: [#23706](https://github.com/anthropics/claude-code/issues/23706), Opus 4.6 versus 4.5.

**Surveys and polls (general, not Claude-specific)**
- Stack Overflow 2025:
  - 66% say AI solutions are "almost right, but not quite".
  - 45% spend more time debugging AI code than expected.
  - 46% distrust AI accuracy versus 33% who trust it.
  - Sources: [The Register 2025-07-29](https://www.theregister.com/2025/07/29/coders_are_using_ai_tools/); [the-decoder](https://the-decoder.com/developers-rely-on-ai-tools-more-than-ever-but-trust-is-slipping/).
- Stack Overflow 2026 survey, per secondary coverage:
  - 65.9% use coding assistants or agents.
  - 14.1% use AI agents daily, and 37.9% don't plan to.
  - Nearly half trust AI output when they can verify it; 6.6% would trust AI with an important decision.
  - Sources: [IT Brief](https://itbrief.co.uk/story/stack-overflow-survey-shows-developers-trust-ai-with-caveats); [ADTmag](https://adtmag.com/blogs/watersworks/2026/01/stack-overflow-survey.aspx).
- Sonar's 2026 State of Code (1,100+ respondents) found a "verification bottleneck": faster generation hasn't produced the expected productivity gains ([Sonar community](https://community.sonarsource.com/t/results-from-the-2026-state-of-code-developer-survey-are-here/172502)).

### Inferences
- Limit pain is high in intensity and chronic: every quarter of 2026 had a flare-up. Its root cause, Anthropic's quota policy, cannot be fixed by third parties. What third parties can sell is:
  1. visibility: which limit, how fast, a forecast of when you'll run out
  2. waste reduction: tokens, subagents, context
  3. continuity: auto-resume after reset, account/profile switching, fallback to API or other models
- The ambiguity ("which limit did I hit?") and lack of published numbers are themselves pain points. They make measurement tools valuable even for users who never actually run out.

### Gaps
- I found no poll or survey specifically measuring Claude Code limit satisfaction or the share of Max users hitting limits.
- The claimed class action "Karl Kahn v. Anthropic" (June 2026), which one blog mentioned in search results, could not be verified and should not be used.
- The X claims that Max delivers 3.5x or 6 to 8x in practice are unverified.

---

## Q5. Which pains have users explicitly said they would pay to solve, or have they already bought tools to solve?

### Takeaway
The clearest money signals are:
- Usage visibility. ccusage gets ~878k npm downloads per month, ccstatusline ~203k per month, and paid menu-bar trackers sell at about $7 to $9 one-time.
- Capacity. Users run multiple accounts (the top multi-account issues have about 1,100 reactions each), buy "extra usage" at API rates, and file requests for paid resets and higher tiers.
- Enterprise spend governance. Uber, Microsoft and Meta cost stories score 380 to 490 pts on HN.

Willingness to pay for compaction, memory and review tooling is shown mostly indirectly, through popular free OSS and highly-liked how-to articles, not through purchases.

### Cited Findings

**Bought or used tools (adoption evidence)**
- npm downloads, 2026-09-13 to 2026-10-12:
  - `ccusage` (local usage/cost reports): **877,566**
  - `ccstatusline`: **202,712**
  - `@anthropic-ai/claude-code`: 55,097,186
  - Source: [npm API ccusage](https://api.npmjs.org/downloads/point/last-month/ccusage), [ccstatusline](https://api.npmjs.org/downloads/point/last-month/ccstatusline), [claude-code](https://api.npmjs.org/downloads/point/last-month/@anthropic-ai/claude-code).
  - ccusage downloads equal ~1.6% of Claude Code's npm downloads.
  - The Zenn launch article for ccusage has 566 likes ([Zenn](https://zenn.dev/ryoppippi/articles/6c9a8fe6629cd6)).
- Paid usage trackers exist:
  - Usagebar: $9 one-time, Mac. Shows the 5-hour window, weekly cap and context, with alerts at 50/75/90%.
  - SessionWatcher: from $6.99 one-time, macOS and Windows, multi-account tracking, team tier listed at $40/seat/year.
  - Prices are vendor-stated and conflict with an older $1.99 listing ([SessionWatcher guide](https://sessionwatcher.com/guides/best-claude-code-usage-trackers); [usagebar](https://usagebar.com/blog/claude-usage-mac-menu-bar); [sessionwatcher.com/claude](https://sessionwatcher.com/claude)).
  - Free competitors include ClaudeUsageBar, Claude Usage Tracker, CodexBar and the VS Code "Clusage" extension ([claudeusagebar](https://www.claudeusagebar.com/); [ClaudeUsageTracker](https://github.com/masorange/ClaudeUsageTracker); [Clusage](https://marketplace.visualstudio.com/items?itemName=Ajax1029.clusage)).
- Token and context reducers get strong attention:
  - HN "MCP server that reduces Claude Code context consumption by 98%": 570 pts ([HN](https://news.ycombinator.com/item?id=47193064)).
  - "Portal by Spotify cut my Claude Code token usage by 90%": 278 pts ([HN](https://news.ycombinator.com/item?id=49571465)).
  - Zenn Serena article: 834 likes ([Zenn](https://zenn.dev/sc30gsw/articles/ff81891959aaef)).
  - Qiita Headroom article: 158 likes ([Qiita](https://qiita.com/shinkai_/items/61b10d10c63db47a64e7)).
- Quality-degradation monitoring: "Claude Code daily benchmarks for degradation tracking" got 760 pts ([HN](https://news.ycombinator.com/item?id=46810282)).

**Explicit pay-more or pay-differently requests**
- [#2944](https://github.com/anthropics/claude-code/issues/2944) "API Fallback for Pro/Max Subscriptions When Limits Are Reached": 80 reactions. Users want to pay per token after the quota is gone without losing their session.
- [#83302](https://github.com/anthropics/claude-code/issues/83302) "Fast mode is excluded from subscription plans, so Max capacity can't cover the one feature I'd spend it on": 15 reactions (2026-08-02).
- [#97880](https://github.com/anthropics/claude-code/issues/97880) "Individual plan above Max 20x (e.g. $300–400/month)": 2 reactions (2026-09-28).
- [#100752](https://github.com/anthropics/claude-code/issues/100752) "Paid weekly usage reset ($50) for Max 20x plan": 1 reaction, which was a 👎 (2026-10-09).
- [#55012](https://github.com/anthropics/claude-code/issues/55012) "Higher Subscription Tier (MAX x30)": 1 reaction.
- Pro and Max subscribers can already prepay "extra usage" billed at standard API rates. This comes from a search summary across 2026 pricing guides and was not verified on Anthropic's own page; see e.g. [verdent](https://www.verdent.ai/guides/claude-code-pricing-2026) and [mintmcp](https://www.mintmcp.com/blog/claude-code-pricing).
- Price sensitivity in the opposite direction: [#17432](https://github.com/anthropics/claude-code/issues/17432) India INR pricing has 647 reactions.

**Multiple subscriptions (paying twice) and account switching**
- [#18435](https://github.com/anthropics/claude-code/issues/18435) (1,121), [#36151](https://github.com/anthropics/claude-code/issues/36151) (1,052), [#20131](https://github.com/anthropics/claude-code/issues/20131) (115), [#30031](https://github.com/anthropics/claude-code/issues/30031) (91, "like `gh auth switch`") and [#22872](https://github.com/anthropics/claude-code/issues/22872) ("Switching between personal and work Claude Code accounts is abysmal").
- A Japanese guide notes that no official document explicitly allows two personal Pro subscriptions, and advises against using a second account as a spare quota ([clauder-navi](https://clauder-navi.com/articles/2-claude-pro-accounts/)).
- A Zenn post "Claude CodeにProfile機能を導入する" got ♥8 in its first days ([digest](https://github.com/shoji-miyoshi/test/issues/121)).

**Session continuity**
- [#13354](https://github.com/anthropics/claude-code/issues/13354) "Continue when the session limit reached": 215 reactions.
- [#35744](https://github.com/anthropics/claude-code/issues/35744) "Auto-continue after subscription rate limit resets": 106 reactions.

**Enterprise and team spend (budget owners who pay)**
- "Uber torches 2026 AI budget on Claude Code in four months": 402 pts ([HN](https://news.ycombinator.com/item?id=47976415)).
- "Microsoft starts canceling Claude Code licenses": 493 pts ([HN](https://news.ycombinator.com/item?id=48238896)).
- "Meta and Microsoft take steps to reduce employee usage of Claude AI": 378 pts, 2026-10-07 ([HN](https://news.ycombinator.com/item?id=49997161)).
- A Japanese team built OpenTelemetry × BigQuery collection of Claude Code activity ([Zenn canly](https://zenn.dev/canly/articles/a20d02428b475a)).

**Switching spend elsewhere (negative pay signal for Claude, positive for alternatives)**
- "Reallocating $100/Month Claude Code Spend to Zed and OpenRouter": 349 pts ([HN](https://news.ycombinator.com/item?id=47700972)).
- "Ask HN: replaced Claude/GPT with a local model": 1,318 pts ([HN](https://news.ycombinator.com/item?id=48542100)).
- A Zenn cost comparison of local LLMs as a Claude Code substitute, 14 likes in Oct 2026 ([Zenn](https://zenn.dev/solvio/articles/6d374a9224327a)).

### Inferences

**Ranked pain points for a seller (my synthesis)**

The ranking weighs frequency × intensity × whether a third party can solve it × evidence of payment.

1. **Usage-limit visibility and forecasting.** Show which limit applies, the burn rate, a forecast of when you'll run out, per-session and per-subagent attribution, and alerts.
   - Evidence: the largest comment volumes, plus explicit confusion (#67412, #19673 "hit limit at 84%").
   - Money: ccusage at ~878k downloads per month; paid trackers at $7 to $9 one-time.
   - Solvable by third parties: yes, using local logs and statusline JSON.
   - Caveat: crowded with free OSS. A paid product must differentiate (team view, Windows, multi-account, forecasting, Japanese UI).
2. **Token and waste reduction.** Covers subagent blow-ups, harness overhead and context bloat.
   - Evidence: HN 706 / 570 / 278 pts; Zenn 834; Qiita 158.
   - Pay: people adopt tools, but the leaders are free.
   - Good fit for "audit what burned my quota" reports.
3. **Multi-account and profile switching, plus continuity across limit resets.** Covers auto-continue and fallback to API or another model.
   - Evidence: ~1,100 reactions on each of two issues, plus 215 and 106.
   - Users already pay for multiple seats.
   - Third-party CLI wrappers are feasible, but there is terms-of-service risk (Anthropic has restricted third-party harness use; HN 625 / 1,099 pts).
4. **Verification and review of AI changes.** Covers diff review UI, "don't trust 'fixed'/'tests passed'", and readable reports.
   - Evidence: #33932 287, #8660 93, #31888 58; Zenn 605 / 466 / 973; Qiita 502 / 154; SO 66% "almost right"; Sonar "verification bottleneck"; HN quality threads of 1,000+ pts.
   - Payable, especially for teams. Strong fit for checklists and harness templates.
5. **Context loss and memory across sessions.** Covers compaction, rules forgotten, past-session recall.
   - Evidence: #17428 117 and other compaction issues; Zenn 1,049 / 544 / 520; top Zenn article of Oct 2026 is about session recall.
   - Third-party memory tools exist (Serena etc.), so this is moderately payable.
6. **CLAUDE.md / AGENTS.md authoring and portability.** Evidence: #6235 6,687 reactions (closed); Qiita 569 / 494 / 474 / 260 / 142; Zenn 449. Strong demand for templates and generators, in Japanese especially. This is the best fit for a low-cost digital product (BOOTH/Zenn book).
7. **Parallel agents, worktrees and multi-window management.**
   - Evidence: #30154 262, #23627 99, #30213 60, #34437 47; Qiita 875; Zenn 1,803 / 514 / 437; HN 396 / 307.
   - OSS orchestrators abound; paid ones were not verified.
8. **Permission prompt friction and safe autonomy.**
   - Evidence: #28240 209 plus about 8 issues with 40 to 85 reactions each; HN 351 / 399.
   - Anthropic made auto mode the default in Aug 2026 ([HN 292 pts](https://news.ycombinator.com/item?id=49239021)), which may reduce this pain.
   - A sellable angle remains: allowlist generators and setting presets (Qiita security-settings article: 552 likes).
9. **Team rollout and cost governance.** Covers budgets, usage dashboards, junior guardrails.
   - Evidence: HN 402 / 493 / 378; Zenn 850; Qiita 360 / 552.
   - Buyers have budgets, but sales cycles are longer.
10. **Security of hooks, MCP and plugins; trust and privacy.**
    - Evidence: HN 2,445 (steganographic marking), 870 ("Cowork exfiltrates files", [HN](https://news.ycombinator.com/item?id=46622328)), 493 (Nx malware using the Claude CLI, [HN](https://news.ycombinator.com/item?id=45038653)), 336 (Alibaba ban, [HN](https://news.ycombinator.com/item?id=48772443)); GitHub #14485 50 and #62061 50.
    - Mostly enterprise-buyer pain.
11. **TUI rendering: scroll, flicker, copy-paste.** Very high reactions (822 / 336 / 321 / 300), but it is a first-party fix. Low third-party pay potential beyond a copy-cleanup utility.
12. **Windows and Japanese environment issues.**
    - Windows: #85891 291, #12506 147, #604 81; HN 222 / 434.
    - Japanese: IME issues 95 / 44 / 28 (mostly fixed); CP932 hook breakage (Zenn, 2026-10).
    - A niche but under-served audience for Japanese Windows users. Low volume.

### Gaps
- Apart from vendor-listed trackers, I found no hard sales numbers for any paid Claude Code add-on (revenue, downloads of paid apps).
- I found no direct user statements of the form "I'd pay $X for [compaction/memory/review] tool". Willingness to pay for those is inferred from adoption of free tools and from article popularity.
- I could not verify the pricing or existence of paid orchestrators or worktree managers for Claude Code.
- Reddit and note.com, often where buy-signals and "what tool do you use" threads live, were inaccessible.
