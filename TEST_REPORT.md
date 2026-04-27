# Secret Guardian Plugin - Comprehensive Test Report

**Date:** 2026-04-27
**Plugin Version:** 1.1.0
**Test Status:** ✅ ALL TESTS PASSED

---

## Summary

Secret Guardian has been rebuilt from outbound blocking to **pre-persistence redaction** using:
- `before_message_write` hook
- `tool_result_persist` hook

This ensures secrets are redacted **before** being written to session history, preventing them from entering:
- Session transcripts (JSONL files)
- Memory indexing/search
- Compaction outputs
- Tool result persistence

---

## Unit Tests (23/23 Passed)

### Detection Accuracy
| # | Test | Result |
|---|------|--------|
| 1 | User OpenRouter key redacted | ✅ |
| 2 | User OpenRouter key removed from text | ✅ |
| 3 | Clean message not modified | ✅ |
| 4 | Tool AWS key redacted | ✅ |
| 5 | Tool AWS key removed | ✅ |
| 6 | Assistant GitHub token redacted | ✅ |
| 7 | Assistant GitHub token removed | ✅ |
| 8 | Multiple secrets both redacted | ✅ |
| 9 | Case insensitive detection | ✅ |
| 10 | Secret in middle of sentence | ✅ |
| 11 | Empty message not modified | ✅ |
| 12 | Clean tool result not modified | ✅ |
| 13 | Telegram bot token redacted | ✅ |
| 14 | Stripe key redacted | ✅ |
| 15 | Anthropic key redacted | ✅ |
| 16 | OpenAI key redacted | ✅ |
| 17 | Discord token redacted | ✅ |
| 18 | Brave Search key redacted | ✅ |
| 19 | Text property redacted (not content) | ✅ |
| 20 | Tool content property redacted | ✅ |
| 21 | No false positives on normal text | ✅ |
| 22 | Short token not detected | ✅ |
| 23 | JWT medium confidence not redacted | ✅ |

### Key Behaviors Verified
- ✅ HIGH confidence secrets are redacted with `[REDACTED: Service type]`
- ✅ MEDIUM/LOW confidence secrets are logged but NOT redacted (warn only)
- ✅ Clean text passes through unmodified
- ✅ Multiple secrets in one message all get redacted
- ✅ Case insensitive detection works
- ✅ Both `text` and `content` properties handled
- ✅ Tool results redacted via `tool_result_persist`

---

## Live Session Verification

### Current Session File Analysis
- **Session ID:** `3b870ad6-d57b-4278-9d06-26fd7d6e1a65`
- **Redaction count:** 40 `[REDACTED: ...]` instances
- **Raw secret patterns found:** 0 (in recent active session)

### Historical Note
- 3 instances of raw secret-like patterns found in session file
- These are from **April 26** (before plugin was rebuilt)
- They appear in assistant tool calls writing documentation (README examples)
- NOT actual leaked credentials — just example patterns in code

---

## Fixes Applied in v1.1.0

### Detector Improvements
1. **Case insensitive detection** — added `/gi` flags to all regex patterns
2. **Telegram token length** — reduced from 35 to 30+ chars after colon
3. **Brave Search token** — reduced from 32 to 28+ chars after `BSA`
4. **Regex lastIndex reset** — prevents stale state from previous scans

### Architecture Changes
1. **Hook migration** — from `message_sending` to `before_message_write` + `tool_result_persist`
2. **Behavior change** — from blocking/cancelling to redaction
3. **Zero dependencies** — pure TypeScript, no Python required

---

## Detection Coverage

| Service | Pattern | Confidence |
|---------|---------|------------|
| OpenRouter | `sk-or-v1-...` | HIGH |
| OpenAI | `sk-proj-...` / `sk-...` | HIGH |
| Anthropic | `sk-ant-...` | HIGH |
| GitHub | `gh[pousr]_...` | HIGH |
| AWS | `AKIA...` | HIGH |
| Telegram | `123456789:AA...` | HIGH |
| Discord | `MT...` | HIGH |
| Stripe | `sk_live_...` / `sk_test_...` | HIGH |
| Brave Search | `BSA...` | HIGH |
| Generic JWT | `eyJ...` | MEDIUM |
| Generic hex | `[a-f0-9]{32,64}` | LOW |

---

## What This Protects

✅ **Inbound user messages** — redacted before session persistence  
✅ **Assistant messages** — redacted before session persistence  
✅ **Tool results** — redacted before persistence  
✅ **Memory indexing** — secrets won't enter searchable memory  
✅ **Session transcripts** — stored as `[REDACTED: ...]` not raw values  

## What This Does NOT Protect

❌ **Already-rendered live UI** — text visible before interception stays visible  
❌ **Provider-side logs** — if provider logs before OpenClaw sees it  
❌ **Channel/platform history** — if message already sent before interception  
❌ **Pre-existing historical data** — old sessions from before plugin install  

---

## Recommendations

1. **For maximum protection:** Consider purging old session files that predate the plugin
2. **For live UI cleanup:** This is a separate concern — requires post-render deletion capability
3. **For provider logs:** Use environment variables or secure vaults, never hardcode secrets
4. **Regular testing:** Run the test suite after any plugin updates

---

## Test Command

```bash
cd ~/clawd/projects/opencray-plugin-secret-guardian
npx tsc && node -e "
const { onBeforeMessageWrite, onToolResultPersist } = require('./dist/index.js');
// ... test cases ...
"
```

---

**Status:** ✅ Production ready
**Confidence:** High — 23/23 tests pass, live session verified
