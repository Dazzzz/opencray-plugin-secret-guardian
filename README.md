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
