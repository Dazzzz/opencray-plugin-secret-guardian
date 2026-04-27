const PATTERNS = [
  // Kimi
  { type: "api_key", service: "Kimi", regex: /sk-kimi-[a-zA-Z0-9]{40,}/gi, confidence: "HIGH" as const },
  // OpenRouter
  { type: "api_key", service: "OpenRouter", regex: /sk-or-v1-[a-zA-Z0-9]{40,}/gi, confidence: "HIGH" as const },
  // OpenAI
  { type: "api_key", service: "OpenAI", regex: /sk-proj-[a-zA-Z0-9_-]{100,}/gi, confidence: "HIGH" as const },
  { type: "api_key", service: "OpenAI", regex: /sk-[a-zA-Z0-9]{48}/gi, confidence: "HIGH" as const },
  // Anthropic
  { type: "api_key", service: "Anthropic", regex: /sk-ant-[a-zA-Z0-9]{32,}/gi, confidence: "HIGH" as const },
  // GitHub
  { type: "token", service: "GitHub", regex: /gh[pousr]_[A-Za-z0-9_]{36,}/gi, confidence: "HIGH" as const },
  // AWS
  { type: "access_key", service: "AWS", regex: /AKIA[0-9A-Z]{16}/g, confidence: "HIGH" as const },
  // Telegram
  { type: "bot_token", service: "Telegram", regex: /\d{9,10}:[A-Za-z0-9_-]{30,}/gi, confidence: "HIGH" as const },
  // Discord
  { type: "bot_token", service: "Discord", regex: /MT[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}/gi, confidence: "HIGH" as const },
  // Stripe
  { type: "api_key", service: "Stripe", regex: /sk_(live|test)_[0-9a-zA-Z]{24,}/gi, confidence: "HIGH" as const },
  // Brave Search
  { type: "api_key", service: "Brave Search", regex: /BSA[a-zA-Z0-9]{28,}/gi, confidence: "HIGH" as const },
  // Generic JWT
  { type: "jwt", service: "Generic", regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, confidence: "MEDIUM" as const },
  // Generic API key patterns (lowest priority — keep last)
  { type: "api_key", service: "Generic", regex: /\b[a-f0-9]{32,64}\b/g, confidence: "LOW" as const },
];

const CONTEXTUAL_KEYWORDS = [
  "api", "key", "token", "secret", "password", "credential", "auth",
  "access", "private", "bearer", "sk-", "ghp_", "AKIA"
];

export interface GuardianFinding {
  type: string;
  service: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  value: string;
  index: number;
}

export interface GuardianResult {
  findings: GuardianFinding[];
}

export function scanForSecrets(text: string): GuardianResult {
  const findings: GuardianFinding[] = [];
  const coveredRanges: Array<{start: number, end: number}> = [];

  function isOverlapping(start: number, end: number): boolean {
    for (const range of coveredRanges) {
      if (start < range.end && end > range.start) {
        return true; // Overlaps with an existing finding
      }
    }
    return false;
  }

  for (const pattern of PATTERNS) {
    // Reset lastIndex for global regexes to handle repeated scans
    pattern.regex.lastIndex = 0;
    const matches = text.matchAll(pattern.regex);
    for (const match of matches) {
      const value = match[0];
      const start = match.index!;
      const end = start + value.length;

      // Skip if this overlaps with an already-covered range
      if (isOverlapping(start, end)) continue;
      coveredRanges.push({start, end});

      // Check contextual keywords for confidence boost
      const contextStart = Math.max(0, start - 50);
      const contextEnd = Math.min(text.length, end + 50);
      const context = text.slice(contextStart, contextEnd).toLowerCase();
      const hasContext = CONTEXTUAL_KEYWORDS.some(kw => context.includes(kw));

      let confidence = pattern.confidence;
      if (confidence === "LOW" && hasContext) {
        confidence = "MEDIUM";
      }

      findings.push({
        type: pattern.type,
        service: pattern.service,
        confidence,
        value,
        index: start
      });
    }
  }

  return { findings };
}

export function redactContent(content: string, findings: GuardianFinding[]): string {
  let redacted = content;
  // Sort by index descending to replace from end to start
  const sorted = [...findings].sort((a, b) => b.index - a.index);
  for (const finding of sorted) {
    redacted = redacted.slice(0, finding.index) +
               `[REDACTED: ${finding.service} ${finding.type}]` +
               redacted.slice(finding.index + finding.value.length);
  }
  return redacted;
}
