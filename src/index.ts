import { scanForSecrets, redactContent } from "./detector.js";

interface AgentMessageLike {
  role?: string;
  content?: unknown;
  text?: unknown;
  [key: string]: unknown;
}

interface PluginHookBeforeMessageWriteEvent {
  message: AgentMessageLike;
  sessionKey?: string;
  agentId?: string;
}

interface PluginHookBeforeMessageWriteResult {
  block?: boolean;
  message?: AgentMessageLike;
}

interface PluginHookToolResultPersistEvent {
  toolName?: string;
  toolCallId?: string;
  message: AgentMessageLike;
  isSynthetic?: boolean;
}

interface PluginHookToolResultPersistResult {
  message?: AgentMessageLike;
}

function extractTextFromMessage(message: AgentMessageLike): string | null {
  if (typeof message.text === "string") return message.text;
  if (typeof message.content === "string") return message.content;
  return null;
}

function replaceTextInMessage(message: AgentMessageLike, redacted: string): AgentMessageLike {
  if (typeof message.text === "string") {
    return { ...message, text: redacted };
  }
  if (typeof message.content === "string") {
    return { ...message, content: redacted };
  }
  return message;
}

function maybeRedactText(text: string, source: string): { changed: boolean; redacted: string; summary?: string } {
  if (!text || text.length < 8) {
    return { changed: false, redacted: text };
  }

  const result = scanForSecrets(text);
  if (!result.findings || result.findings.length === 0) {
    return { changed: false, redacted: text };
  }

  const highConfidence = result.findings.filter((f) => f.confidence === "HIGH");
  if (highConfidence.length === 0) {
    console.warn(
      `[Secret Guardian] ${source}: medium/low confidence secret-like content allowed:`,
      result.findings.map((f) => `${f.service} ${f.type} ${f.confidence}`).join(", ")
    );
    return { changed: false, redacted: text };
  }

  const redacted = redactContent(text, highConfidence);
  console.warn(
    `[Secret Guardian] ${source}: redacted before persistence:`,
    highConfidence.map((f) => `${f.service} ${f.type}`).join(", ")
  );

  return {
    changed: redacted !== text,
    redacted,
    summary: highConfidence.map((f) => `${f.service} ${f.type}`).join(", ")
  };
}

export function onBeforeMessageWrite(
  event: PluginHookBeforeMessageWriteEvent
): PluginHookBeforeMessageWriteResult {
  const text = extractTextFromMessage(event.message);
  if (!text) return {};

  const outcome = maybeRedactText(text, "before_message_write");
  if (!outcome.changed) return {};

  return {
    message: replaceTextInMessage(event.message, outcome.redacted)
  };
}

export function onToolResultPersist(
  event: PluginHookToolResultPersistEvent
): PluginHookToolResultPersistResult {
  const text = extractTextFromMessage(event.message);
  if (!text) return {};

  const outcome = maybeRedactText(text, "tool_result_persist");
  if (!outcome.changed) return {};

  return {
    message: replaceTextInMessage(event.message, outcome.redacted)
  };
}

export function register() {
  console.log("[Secret Guardian] Plugin registered");
  return {
    id: "secret-guardian",
    name: "Secret Guardian",
    version: "1.1.0",
    hooks: {
      before_message_write: onBeforeMessageWrite,
      tool_result_persist: onToolResultPersist,
    },
  };
}

export function activate() {
  console.log("[Secret Guardian] Plugin activated — redacting secrets before persistence");
}

export default {
  id: "secret-guardian",
  name: "Secret Guardian",
  version: "1.1.0",
  description:
    "Redacts secrets before OpenClaw persists them to session history and tool transcripts.",
  author: "OpenCray (opencray.org)",
  homepage: "https://opencray.org",
  repository: "https://github.com/Dazzzz/opencray-plugin-secret-guardian",
  license: "MIT",
  hooks: {
    before_message_write: onBeforeMessageWrite,
    tool_result_persist: onToolResultPersist,
  },
  config: {
    blockHighConfidence: {
      type: "boolean",
      default: false,
      description: "Reserved for future use; current mode redacts instead of blocking."
    }
  }
};
