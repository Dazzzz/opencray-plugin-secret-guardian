import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

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

// ─── Configuration ─────────────────────────────────────────────────────────

const GUARDIAN_SCRIPT = resolve(
  process.env.HOME || "~",
  "clawd/scripts/security/secret_guardian.py"
);

const PROTECT_SCRIPT = resolve(
  process.env.HOME || "~",
  "clawd/scripts/security/protect-secret.sh"
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface GuardianFinding {
  type: string;
  service: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  value: string;
}

interface GuardianResult {
  findings: GuardianFinding[];
}

// ─── Detection ─────────────────────────────────────────────────────────────────

function runGuardian(text: string): GuardianResult {
  if (!existsSync(GUARDIAN_SCRIPT)) {
    console.warn("[Secret Guardian] Detection script not found:", GUARDIAN_SCRIPT);
    return { findings: [] };
  }

  try {
    const output = execSync(
      `python3 "${GUARDIAN_SCRIPT}" --stdin`,
      {
        input: text,
        encoding: "utf-8",
        timeout: 5000,
        maxBuffer: 1024 * 1024,
      }
    );
    return JSON.parse(output) as GuardianResult;
  } catch (err: any) {
    // Exit code 1 means secrets found — that's expected
    if (err.status === 1 && err.stdout) {
      try {
        return JSON.parse(err.stdout) as GuardianResult;
      } catch {
        return { findings: [] };
      }
    }
    console.error("[Secret Guardian] Detection error:", err.message);
    return { findings: [] };
  }
}

// ─── Redaction ─────────────────────────────────────────────────────────────────

function redactContent(content: string, findings: GuardianFinding[]): string {
  let redacted = content;
  for (const finding of findings) {
    // Replace the actual secret value with a redaction marker
    redacted = redacted.replace(finding.value, `[REDACTED: ${finding.type}]`);
  }
  return redacted;
}

// ─── Alert Message ───────────────────────────────────────────────────────────

function buildAlert(findings: GuardianFinding[]): string {
  const lines = findings.map(
    (f) => `• **${f.service}** ${f.type} (confidence: ${f.confidence})`
  );
  return `🚨 **Secret Guardian Alert**\n\n${lines.join("\n")}\n\nYour message has been blocked to prevent exposing sensitive credentials.\n\n**Options:**\n1. Encrypt the secret: \`protect-secret.sh\`\n2. Use a redacted reference: \`[REDACTED: ${findings[0].type}]\`\n3. Rotate the credential if already exposed`;
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
  const result = runGuardian(content);

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

// ─── Plugin Manifest ───────────────────────────────────────────────────────────

export default {
  id: "secret-guardian",
  name: "Secret Guardian",
  version: "1.0.0",
  description:
    "Real-time secret detection for OpenClaw. Blocks messages containing API keys, tokens, passwords, and credentials before they're sent to chat channels.",
  author: "OpenCray (opencray.org)",
  homepage: "https://opencray.org",
  repository: "https://github.com/Dazzzz/opencray",
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
