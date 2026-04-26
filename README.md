# OpenCray Secret Guardian Plugin

Real-time secret detection for OpenClaw. Intercepts outgoing messages and blocks them if they contain API keys, tokens, passwords, or other sensitive credentials.

## Features

- 🔍 **30+ detection patterns** — API keys, tokens, passwords, JWTs, and more
- 🚫 **Auto-block HIGH confidence secrets** — Prevents accidental exposure
- ⚠️ **Warn on MEDIUM/LOW confidence** — Logs suspicious patterns
- 🔒 **Zero dependencies** — Uses existing `secret_guardian.py` detection engine
- 🦞 **Native OpenClaw integration** — Clean plugin hook, no hacks

## Installation

```bash
# Via ClawHub (when published)
openclaw plugin install @opencray/secret-guardian

# Or manually
git clone https://github.com/Dazzzz/opencray.git
cd opencray/plugins/secret-guardian
npm install
npm run build
# Copy dist/ to your OpenClaw plugins directory
```

## Requirements

- OpenClaw >= 2026.4.0
- `secret_guardian.py` at `~/clawd/scripts/security/secret_guardian.py`
- Python 3.8+ (for the detection engine)

## How It Works

```
You type: "Here's my OpenRouter key: sk-or-v1-abc123..."
                    ↓
  Secret Guardian plugin intercepts via message_sending hook
                    ↓
  Runs secret_guardian.py detection on the text
                    ↓
  🚨 HIGH confidence secret detected!
                    ↓
  Message BLOCKED — never reaches Discord/Telegram/webchat
                    ↓
  Console alert: "BLOCKED: OpenRouter api_key detected"
```

## Configuration

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "secret-guardian": {
        "enabled": true,
        "config": {
          "blockHighConfidence": true,
          "warnMediumConfidence": true,
          "allowLowConfidence": true
        }
      }
    }
  }
}
```

## Detection Coverage

| Service | Pattern | Confidence |
|---------|---------|------------|
| OpenRouter | `sk-or-v1-...` | HIGH |
| OpenAI | `sk-proj-...` | HIGH |
| Anthropic | `sk-ant-...` | HIGH |
| GitHub | `ghp_...` / `gho_...` | HIGH |
| AWS | `AKIA...` | HIGH |
| Telegram | `123456:AA...` | HIGH |
| Discord | `MTQ3...` | HIGH |
| Stripe | `sk_live_...` / `sk_test_...` | HIGH |
| Brave Search | `BSA...` | HIGH |
| And 20+ more... | | |

## Related

- [OpenCray](https://opencray.org) — Open-source house familiar
- [Secret Guardian CLI](https://github.com/Dazzzz/opencray/tree/main/scripts/security) — Standalone detection tool
- [ClawHub](https://clawhub.ai) — OpenClaw plugin registry

## License

MIT © OpenCray
