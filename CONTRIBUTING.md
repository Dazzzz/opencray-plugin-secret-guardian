# Contributing to OpenCray

Thank you for your interest in contributing! OpenCray is an open-source project building privacy-respecting tools for the OpenClaw ecosystem.

## How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Test your changes**
5. **Submit a pull request**

## Project Structure

```
opencray/
├── plugins/           # OpenClaw plugins
│   └── secret-guardian/
├── website/           # Landing page (opencray.org)
└── branding/          # Logo, icons, assets
```

## Plugin Development

### Prerequisites

- Node.js 18+
- OpenClaw >= 2026.4.0
- Python 3.8+ (for Secret Guardian detection engine)

### Building a Plugin

```bash
cd plugins/your-plugin
npm install
npm run build
```

### Testing

Plugins can be tested locally by symlinking into your OpenClaw plugins directory:

```bash
ln -s $(pwd)/dist ~/.openclaw/plugins/your-plugin
```

## Code Style

- TypeScript for plugins
- Static HTML/CSS for website
- Follow existing patterns in the codebase

## Questions?

- Open an issue on GitHub
- Email: darren@halprin.com.au
