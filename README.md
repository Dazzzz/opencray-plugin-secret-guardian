# OpenCray Secret Guardian Plugin

Pre-persistence secret redaction for OpenClaw. Redacts API keys, tokens, passwords, and other sensitive credentials before they are written into session history or persisted tool results.

## Features

- 🔍 **30+ detection patterns** — API keys, tokens, passwords, JWTs, and more
- ✂️ **Redacts HIGH confidence secrets before persistence** — Prevents them from landing in searchable transcripts
- ⚠️ **Warn on MEDIUM/LOW confidence** — Logs suspicious patterns
- 🦞 **Native OpenClaw integration** — Uses `before_message_write` and `tool_result_persist`
- 🧠 **Memory-safe by design** — Aims to keep raw secrets out of session history, compaction inputs, and downstream memory indexing

## Installation

```bash
openclaw plugins install .
```

## Requirements

- OpenClaw >= 2026.4.0
- No Python dependency required in the current plugin build

## Limitations

### No real-time user warning
The `before_message_write` hook **cannot send a warning message back to the user** in the chat interface. OpenClaw's hook result type only supports:
- `block` — cancel the write
- `message` — rewrite the message content

There is no `warning` or `alert` field to display a formatted message to the user.

**What this means:**
- ✅ The secret is redacted before persistence (transcript/memory safe)
- ❌ The user does **not** see a "⚠️ API key detected" warning in the chat
- ❌ The user only sees the redacted `[REDACTED: ...]` version if they inspect the transcript later

**Workarounds for user alerting:**
1. Use a separate `message_received` hook for fire-and-forget alerting (but this runs after persistence)
2. Use a custom channel integration that checks messages before display
3. Rely on console logs and audit trails for detection awareness

### Already-rendered text
Secrets visible in the live chat UI **before** the hook fires remain visible. The hook only affects what gets persisted, not what's already on screen.

### Historical data
The plugin cannot retroactively redact secrets in session files created before the plugin was installed.

---

## How It Works

```text
You type: "Here's my OpenRouter key: sk-or-v1-abc123..."
                    ↓
  Secret Guardian intercepts before_message_write
                    ↓
  HIGH confidence secret detected
                    ↓
  Transcript text rewritten before persistence
                    ↓
  Stored as: "Here's my OpenRouter key: [REDACTED: OpenRouter api_key]"
```

Tool outputs follow a similar path via `tool_result_persist`.

## Current Scope

Secret Guardian currently targets:
- inbound / assistant transcript persistence via `before_message_write`
- tool output persistence via `tool_result_persist`

It does **not** guarantee removal from:
- already-rendered live UI text
- provider-side logs outside OpenClaw
- channel/platform history that already received the raw text before interception

## Configuration

OpenClaw will install the plugin and add its entry automatically. Trusted plugins should also be allowlisted in `plugins.allow`.

## Detection Coverage

| Service | Pattern | Confidence |
|---------|---------|------------|
| OpenRouter | `sk-or-v1-...` | HIGH |
| OpenAI | `sk-proj-...` | HIGH |
| Anthropic | `sk-ant-...` | HIGH |
| GitHub | `ghp_...` / `gho_...` | HIGH |
| AWS | `AKIA...` | HIGH |
| Telegram | `123456:AA...` | HIGH |
| Discord | bot token formats | HIGH |
| Stripe | `sk_live_...` / `sk_test_...` | HIGH |
| Brave Search | `BSA...` | HIGH |

## Related

- [OpenCray](https://opencray.org)
- [ClawHub](https://clawhub.ai)

## License

MIT © OpenCray
