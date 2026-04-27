import { scanForSecrets, redactContent } from "./detector.js";

// OpenClaw plugin types — using inline definitions since SDK exports vary by version
interface PluginHookMessageSendingEvent {
  to: string;
  content: string;
  replyToId?: string | number;
  threadId?: string | number;
  metadata?: Record<string, unknown>;
}

interface PluginHookMessageSendingResult {
  content?: string;
  cancel?: boolean;
}

// ─── Plugin Hook ───────────────────────────────────────────────────────────────

export async function onMessageSending(
  event: PluginHookMessageSendingEvent
): Promise<PluginHookMessageSendingResult> {
  const { content } = event;

  // Skip empty or very short messages
  if (!content || content.length < 8) {
    return {};
  }

  // Run detection
  const result = scanForSecrets(content);

  if (!result.findings || result.findings.length === 0) {
    return {}; // Clean — allow through
  }

  // Filter to HIGH confidence only for auto-blocking
  const highConfidence = result.findings.filter(
    (f) => f.confidence === "HIGH"
  );

  if (highConfidence.length === 0) {
    // MEDIUM/LOW confidence — allow but log
    console.warn(
      "[Secret Guardian] Medium/low confidence secrets detected (allowed):",
      result.findings.map((f) => f.type).join(", ")
    );
    return {};
  }

  // HIGH confidence secrets found — BLOCK the message
  console.error(
    "[Secret Guardian] BLOCKED message with secrets:",
    highConfidence.map((f) => `${f.service} ${f.type}`).join(", ")
  );

  // Build redacted version for user to see what was caught
  const redacted = redactContent(content, highConfidence);

  return {
    cancel: true,
    // Note: OpenClaw may not support 'content' modification in cancel mode
    // The cancel prevents sending; user gets the alert via console/error
  };
}

// ─── Plugin Registration ───────────────────────────────────────────────────────

export function register() {
  console.log("[Secret Guardian] Plugin registered");
  return {
    id: "secret-guardian",
    name: "Secret Guardian",
    version: "1.0.0",
    hooks: {
      message_sending: onMessageSending,
    },
  };
}

export function activate() {
  console.log("[Secret Guardian] Plugin activated — watching for secrets");
}

// ─── Plugin Manifest ───────────────────────────────────────────────────────────

export default {
  id: "secret-guardian",
  name: "Secret Guardian",
  version: "1.0.0",
  description:
    "Real-time secret detection for OpenClaw. Blocks messages containing API keys, tokens, passwords, and credentials before they reach chat channels.",
  author: "OpenCray (opencray.org)",
  homepage: "https://opencray.org",
  repository: "https://github.com/Dazzzz/opencray-plugin-secret-guardian",
  license: "MIT",

  hooks: {
    message_sending: onMessageSending,
  },

  // Configuration schema (for future use)
  config: {
    blockHighConfidence: {
      type: "boolean",
      default: true,
      description: "Auto-block HIGH confidence secrets",
    },
    warnMediumConfidence: {
      type: "boolean",
      default: true,
      description: "Log warning for MEDIUM confidence secrets",
    },
    allowLowConfidence: {
      type: "boolean",
      default: true,
      description: "Allow LOW confidence matches through",
    },
  },
};
