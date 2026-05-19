/**
 * Pure parsing for AI <ACTION> blocks — no database imports (testable in isolation).
 */

export type ChatIntent =
  | "food"
  | "support"
  | "info"
  | "activity"
  | "care"
  | "general";

export type ChatActionRequestType =
  | "FOOD_ORDER"
  | "SUPPORT_REQUEST"
  | "CARE_PROFILE_UPDATE";

export interface SuggestedChatAction {
  intent: ChatIntent;
  requestType: ChatActionRequestType | null;
  summary: string;
  structuredData?: Record<string, unknown>;
  phase: "propose" | "confirmed";
  urgency?: "normal" | "urgent";
}

const ACTION_BLOCK_RE = /<ACTION>\s*([\s\S]*?)\s*<\/ACTION>/gi;
const ACTION_OPEN_RE = /<ACTION>\s*([\s\S]*)$/i;
const ACTION_CLOSE_RE = /<\/ACTION>/gi;
const OPTIONS_BLOCK_RE = /<OPTIONS>\s*([\s\S]*?)\s*<\/OPTIONS>/i;
const OPTIONS_OPEN_RE = /<OPTIONS>\s*([\s\S]*)$/i;

const VALID_INTENTS = new Set<ChatIntent>([
  "food",
  "support",
  "info",
  "activity",
  "care",
  "general",
]);

const VALID_REQUEST_TYPES = new Set<ChatActionRequestType>([
  "FOOD_ORDER",
  "SUPPORT_REQUEST",
  "CARE_PROFILE_UPDATE",
]);

/** Remove ACTION markup from text shown to guests (complete or truncated tags). */
export function stripActionMarkup(raw: string): string {
  return raw
    .replace(ACTION_BLOCK_RE, "")
    .replace(ACTION_OPEN_RE, "")
    .replace(ACTION_CLOSE_RE, "")
    .trim();
}

/** Remove OPTIONS markup from guest-visible text. */
export function stripOptionsMarkup(raw: string): string {
  return raw
    .replace(OPTIONS_BLOCK_RE, "")
    .replace(OPTIONS_OPEN_RE, "")
    .replace(/<\/OPTIONS>/gi, "")
    .trim();
}

export function stripAiMarkup(raw: string): string {
  return stripOptionsMarkup(stripActionMarkup(raw));
}

const MAX_REPLY_OPTIONS = 4;
const MAX_OPTION_LEN = 48;

export function normalizeReplyOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of options) {
    const label = o.replace(/\*\*/g, "").trim().slice(0, MAX_OPTION_LEN);
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push(label);
    if (out.length >= MAX_REPLY_OPTIONS) break;
  }
  return out;
}

function parseOptionsPayload(payload: string): string[] {
  const trimmed = payload.replace(/<\/OPTIONS>/gi, "").trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeReplyOptions(parsed.filter((x): x is string => typeof x === "string"));
    }
  } catch {
    // fall through
  }

  const fromBrackets = trimmed.match(/\[([\s\S]*)\]/);
  if (fromBrackets?.[1]) {
    const inner = fromBrackets[1];
    const quoted = [...inner.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
    if (quoted.length > 0) return normalizeReplyOptions(quoted);
  }

  return normalizeReplyOptions(
    trimmed
      .split(/[,|]/)
      .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, ""))
      .filter(Boolean),
  );
}

function extractOptionsFromRaw(raw: string): string[] {
  const complete = raw.match(OPTIONS_BLOCK_RE);
  if (complete?.[1]) return parseOptionsPayload(complete[1]);

  const open = raw.match(OPTIONS_OPEN_RE);
  if (open?.[1]) return parseOptionsPayload(open[1]);

  return [];
}

/** Fallback: numbered / bulleted lines in the visible reply. */
export function extractNumberedOptions(text: string): string[] {
  const opts: string[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:\d+[\.\):]|[•\-–])\s+(.+?)\s*$/);
    if (m?.[1]) opts.push(m[1].replace(/\*\*/g, "").trim());
  }
  return normalizeReplyOptions(opts);
}

export function serializeReplyOptionsMeta(options: string[]): string {
  return JSON.stringify({ replyOptions: options });
}

export function parseReplyOptionsFromMeta(
  originalContent: string | null | undefined,
): string[] {
  if (!originalContent) return [];
  try {
    const parsed = JSON.parse(originalContent) as { replyOptions?: unknown };
    if (Array.isArray(parsed.replyOptions)) {
      return normalizeReplyOptions(
        parsed.replyOptions.filter((x): x is string => typeof x === "string"),
      );
    }
  } catch {
    return [];
  }
  return [];
}

function extractJsonObject(src: string): string | null {
  const start = src.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function parseLooseActionFields(src: string): Partial<SuggestedChatAction> | null {
  const pick = (key: string): string | undefined => {
    const m = src.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "i"));
    return m?.[1];
  };
  const pickNullOrEnum = (key: string): string | null | undefined => {
    const quoted = src.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "i"));
    if (quoted) return quoted[1];
    const isNull = src.match(new RegExp(`"${key}"\\s*:\\s*null`, "i"));
    if (isNull) return null;
    return undefined;
  };

  const intent = pick("intent") as ChatIntent | undefined;
  const phase = pick("phase") as "propose" | "confirmed" | undefined;
  const requestType = pickNullOrEnum("requestType") as ChatActionRequestType | null | undefined;
  const summary = pick("summary");

  if (!intent && !phase && !summary) return null;

  return {
    intent: intent ?? "general",
    phase: phase ?? "propose",
    requestType: requestType ?? null,
    summary: summary ?? "",
  };
}

function tryParseActionPayload(payload: string): SuggestedChatAction | null {
  const trimmed = payload.replace(ACTION_CLOSE_RE, "").trim();
  if (!trimmed) return null;

  const jsonSlice = extractJsonObject(trimmed) ?? trimmed;

  try {
    return JSON.parse(jsonSlice) as SuggestedChatAction;
  } catch {
    const loose = parseLooseActionFields(trimmed);
    if (!loose) return null;
    return loose as SuggestedChatAction;
  }
}

function extractActionFromRaw(raw: string): SuggestedChatAction | null {
  const complete = [...raw.matchAll(ACTION_BLOCK_RE)];
  if (complete.length > 0) {
    return tryParseActionPayload(complete[complete.length - 1]![1]!);
  }

  const open = raw.match(ACTION_OPEN_RE);
  if (open?.[1]) {
    return tryParseActionPayload(open[1]);
  }

  return null;
}

/** Only staff-ticket actions are kept; info/activity/boredom must not surface ACTION. */
export function normalizeSuggestedAction(
  action: SuggestedChatAction | null,
): SuggestedChatAction | null {
  if (!action) return null;

  const intent = VALID_INTENTS.has(action.intent) ? action.intent : "general";
  const phase = action.phase === "confirmed" ? "confirmed" : "propose";
  const requestType =
    action.requestType && VALID_REQUEST_TYPES.has(action.requestType)
      ? action.requestType
      : null;
  const summary = typeof action.summary === "string" ? action.summary.trim() : "";

  if (!requestType) return null;
  if (!summary) return null;
  if (phase !== "propose" && phase !== "confirmed") return null;

  return {
    intent,
    phase,
    requestType,
    summary: summary.slice(0, 500),
    urgency: action.urgency === "urgent" ? "urgent" : "normal",
    structuredData:
      action.structuredData && typeof action.structuredData === "object"
        ? action.structuredData
        : undefined,
  };
}

function guestTextFallback(action: SuggestedChatAction | null): string {
  if (action?.requestType === "FOOD_ORDER") {
    return "I can place that order for you — shall I send it to the kitchen?";
  }
  if (action?.requestType === "SUPPORT_REQUEST") {
    return "I can notify our team about this — would you like me to go ahead?";
  }
  if (action?.requestType === "CARE_PROFILE_UPDATE") {
    return "I can save these preferences to your profile — shall I confirm?";
  }
  return "How else can I help with your stay?";
}

export function parseAiResponse(raw: string): {
  guestText: string;
  action: SuggestedChatAction | null;
  replyOptions: string[];
} {
  const parsed = extractActionFromRaw(raw);
  const action = normalizeSuggestedAction(parsed);

  let replyOptions = extractOptionsFromRaw(raw);
  let guestText = stripAiMarkup(raw);

  if (replyOptions.length === 0 && guestText) {
    replyOptions = extractNumberedOptions(guestText);
  }

  if (!guestText) {
    guestText = guestTextFallback(action);
  }

  return { guestText, action, replyOptions };
}

export function actionToCategory(action: SuggestedChatAction | null): string {
  if (!action) return "general";
  if (action.requestType === "FOOD_ORDER") return "room_service";
  if (action.requestType === "SUPPORT_REQUEST") return "support";
  if (action.requestType === "CARE_PROFILE_UPDATE") return "care";
  return action.intent;
}

const PENDING_PREFIX = "action:pending:";

export function serializePendingAction(action: SuggestedChatAction): string {
  return PENDING_PREFIX + JSON.stringify(action);
}

export function parsePendingFromCategory(category: string | null | undefined): SuggestedChatAction | null {
  if (!category?.startsWith(PENDING_PREFIX)) return null;
  try {
    return normalizeSuggestedAction(
      JSON.parse(category.slice(PENDING_PREFIX.length)) as SuggestedChatAction,
    );
  } catch {
    return null;
  }
}
