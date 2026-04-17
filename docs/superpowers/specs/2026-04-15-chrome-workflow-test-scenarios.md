# Chrome Browser Workflow — Test Scenarios

**Date:** 2026-04-15  
**Branch:** `docs/chrome-workflow-fixes`  
**Related workflow:** `CLAUDE.md` → Browser Verification section  
**Status:** Draft

---

## Overview

Test suite for validating the Browser Verification workflow defined in `CLAUDE.md`.
Each group can be run independently or sequentially. Group 0 tests trigger recognition (does Claude know when to use Chrome?); Groups 1–2 test execution correctness and are the highest-priority foundation for the workflow itself.

**Format:** Each row is one scenario.  
**Pass condition:** Observable behavior Claude must exhibit — not just "it works."

---

## Group 0 — Trigger recognition

*Standalone. Tests whether Claude self-identifies that visual verification is needed and initiates the Chrome workflow at the right moment — after a complete logical unit of work, not after individual file edits.*

**Ad-hoc visual requests:**

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 0.1 | User: "change the nav bar background from gray to `#1a1a2e`" (single file) | Modify `.svelte` → complete all changes → trigger Chrome workflow once | Chrome workflow fires after all edits are done, not after first file |
| 0.2 | User: "re-layout the Company Profile panel — move ESGScores below StockPriceChart and tighten the spacing" (touches 3 files) | Modify all 3 files → trigger Chrome workflow once after all 3 are done | Chrome workflow fires exactly once, after the last file; not after file 1 or 2 |
| 0.3 | User: "add a loading spinner to CompanyProfile while data fetches" | Implement across all needed files → trigger Chrome workflow once when complete | Chrome workflow fires once at end; spinner visible in screenshot |
| 0.4 | User: "replace the CompanySearch dropdown with a Combobox component" | Implement replacement → trigger Chrome workflow once when complete | Chrome workflow fires once; new component visible in screenshot |

**Plan-driven triggers:**

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 0.5 | Plan: "Step 3: Update chart accent colors. Step 4 (depends on Step 3): **Verify visual result in browser.**" | Complete Step 3 → execute Step 4 → trigger Chrome workflow at Step 4 | Chrome workflow fires at Step 4, not at Step 3 mid-implementation |
| 0.6 | Plan: "Step 2: Modify `DashboardLayout.svelte`, `ESGScores.svelte`, `CompanyProfile.svelte` for new grid structure. Step 3 (depends on Step 2): **Verify layout in browser.**" | Complete all three file changes in Step 2 → trigger Chrome workflow at Step 3 | Chrome fires once at Step 3 after all 3 files done; not before |

**Negative cases (no visual check):**

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 0.7 | User: "fix the TypeScript error in `src/lib/stores/index.ts` line 42" | Fix type error only | No `lsof`, no `tabs_context_mcp`, no screenshot |
| 0.8 | Plan: "Step 1: Refactor `parseCSV()` to handle null values" — no verify instruction, no dependent verify step | Complete refactor only | No Chrome tools called |
| 0.9 | User: "update the `Company` interface to add a `sector` field" | Update type only | No Chrome tools called |

---

## Group 1 — Tab discovery + server state

*Standalone. Tests the Step 1–4 workflow from CLAUDE.md. Most likely to break; run first.*

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 1.1 | Localhost tab open, server running | Find tab, confirm server via `lsof`, record tabId, stop | No port scan or navigation called |
| 1.2 | Localhost tab open, server stopped | Find tab → `lsof` confirms dead → restart server → reload tab | Tab recovered; no dead-page screenshot |
| 1.3 | No tab → `lsof` finds server running | Navigate existing MCP tab to `localhost:<port>` | Tab opens at detected port |
| 1.4 | No tab → `lsof` finds nothing | Start `npm run dev`, parse port, navigate | Tab opens after server starts; escalates if >15s |
| 1.5 | Extension not connected | Prompt user once to run `/chrome`, retry once | Escalates; does not retry indefinitely |
| 1.6 | Dia extension also active (`tabs_context_mcp` returns "Multiple Chrome extensions connected") | Prompt user with Dia-specific warning, retry once after confirmation | Escalates with correct message; never calls `switch_browser` |
| 1.7 | Tab disappears mid-session | Re-run tab discovery on next browser call | Re-discovers cleanly; does not reference stale tabId |

---

## Group 2 — Recovery scenarios

*Standalone. Extension drops, server dies, retry limits.*

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 2.1 | Extension disconnects mid-session (`tabs_context_mcp` returns "not connected") | Prompt user once: _"The Chrome extension isn't connecting. Please run `/chrome` in Claude Code CLI, then let me know when done."_ Retry once after confirmation | Escalates cleanly; does not re-attempt without user confirmation |
| 2.2 | Tab used earlier in session disappears (user closes it) | On next browser call, `tabs_context_mcp` shows tab gone → re-run tab discovery (Steps 3–4) using fresh results | Re-discovers or creates new tab; does not reference stale tabId |
| 2.3 | Server dies mid-session (screenshot or console shows connection error) | Re-run Step 1 (`lsof`) to confirm server dead → restart `npm run dev` in background → wait up to 15s for port → reload tab | Tab shows live app; no dead-page screenshot taken |
| 2.4 | Recovery attempted 2–3 times, still failing | Stop self-recovery loop; escalate to user with clear description of what was tried and what failed | Does not retry beyond 3 attempts; surfaces actionable message |

---

## Group 3 — UI verification scenarios

*Assumes tab established (Group 1 complete). Tests HMR integrity check, screenshot retry logic, and scale-transform awareness.*

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 3.1 | Code change made; HMR fires (`[vite] hmr update` in console) | Wait 2s → read console with pattern `(?i)(error\|\[vite\])` → see `hmr update` → proceed to screenshot | Screenshot taken; no unnecessary reload |
| 3.2 | Code change made; Vite triggers full reload (`[vite] full reload` in console) | See `full reload` → wait additional 2s → screenshot | Screenshot taken after full reload completes |
| 3.3 | Code change made; no `[vite]` messages in console | Call `navigate` on the tab to force reload → wait 2s → screenshot | Page force-reloaded before screenshot; not skipped |
| 3.4 | JS errors present in console after change | Note errors in response; treat as likely root cause of any visual issue | Error flagged to user before or alongside screenshot; not silently ignored |
| 3.5 | Screenshot reveals a visual problem | Fix issue → re-screenshot (up to 3 total attempts) | Problem resolved within 3 attempts or escalated |
| 3.6 | 3 screenshot attempts all show problems | Stop retrying; escalate to user with description of observed problem and what was attempted | Does not take a 4th screenshot; clear escalation message |
| 3.7 | Component written at 1200px appears 600px wide in screenshot | Account for 0.5× scale transform; do not flag as a sizing bug | No false regression reported; correct scale reasoning in response |

---

## Group 4 — Network inspection scenarios

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 4.1 | Feature involves a data fetch; user asks to inspect requests | Call `read_network_requests` with relevant URL pattern → surface matched requests/responses | Correct request identified; irrelevant traffic filtered |
| 4.2 | `read_network_requests` returns no matches for expected endpoint | Report absence clearly; do not assume silence means success | User informed; possible root cause noted |

---

## Group 5 — Viewport / responsive scenarios

*Claude handles `resize_window` only. Device emulation (UA, touch) is configured manually by the user.*

| # | Starting state | What Claude should do | Pass condition |
|---|---|---|---|
| 5.1 | User asks to test at a specific viewport size | Call `resize_window` to set dimensions → screenshot at new size → report observations | Window resized before screenshot; not skipped |
| 5.2 | User has manually configured device emulation (UA, touch) | Respect user-configured emulation; only call `resize_window` for size changes | UA/touch state untouched; resize-only behavior |

---

## Notes

- Group 0 is standalone and tests the trigger layer — does Claude know when to use Chrome at all? Run this first when evaluating whether CLAUDE.md instructions are sufficient.
- Groups 1 and 2 are standalone and highest-priority for execution correctness — they cover the foundation scenarios most likely to break.
- Groups 3–5 depend on a tab already being established.
- Scale transform (0.5×) is a project-specific concern captured in scenario 3.7; it applies any time a screenshot is evaluated for correctness.
- "Self-recover 2–3 times before escalating" is the general recovery budget applied across Groups 2–3.
- Group 0 negative cases (0.7–0.9) are equally important — over-triggering Chrome on non-visual tasks is a failure condition.
