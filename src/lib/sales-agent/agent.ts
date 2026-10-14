import { scriptById, type Script } from "./scripts";
import { buildSystemPrompt } from "./prompt";

export type Language = "bn" | "en";
export type Plan = "starter" | "avid" | "collector";

export interface ExtractedLead {
  name: string | null;
  phone: string | null;
  plan: Plan | null;
}

export interface AgentResult {
  reply: string;
  intent: string;
  language: Language;
  lead: ExtractedLead;
}

const LLM_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

/* -------------------------------------------------------------------------- */
/* Language detection                                                          */
/* -------------------------------------------------------------------------- */

/** True when the text contains Bangla script (U+0980–U+09FF). */
function isBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

export function detectLanguage(text: string): Language {
  return isBangla(text) ? "bn" : "en";
}

/* -------------------------------------------------------------------------- */
/* Lead extraction (used by both paths)                                        */
/* -------------------------------------------------------------------------- */

const PHONE_RE =
  /(?:\+?880|0)?\s?1[3-9]\d{8}/;

/** Normalise a Bangladeshi phone number to E.164 when recognisable. */
export function extractPhone(text: string): string | null {
  const m = text.replace(/\s+/g, "").match(PHONE_RE);
  if (!m) return null;
  let digits = m[0].replace(/\D/g, "");
  if (digits.startsWith("880")) return `+${digits}`;
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `+880${digits}`;
}

const PLAN_PATTERNS: Array<[RegExp, Plan]> = [
  [/collector|কালেক্টর|৮টি|৮টা|8 ?books|eight/i, "collector"],
  [/avid|অ্যাভিড|এভিড|৪টি|৪টা|4 ?books|four/i, "avid"],
  [/starter|স্টার্টার|২টি|২টা|2 ?books|two/i, "starter"],
];

/** Map a fragment to a plan keyword when the lead names one. */
export function extractPlan(text: string): Plan | null {
  for (const [re, plan] of PLAN_PATTERNS) {
    if (re.test(text)) return plan;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Deterministic fallback (no LLM key / LLM failure)                           */
/* -------------------------------------------------------------------------- */

interface Rule {
  id: string;
  test: RegExp;
}

// Ordered — most specific / highest-signal first (deposit is a buying signal,
// so it wins over price; price wins over generic greeting).
const RULES: Rule[] = [
  { id: "lead_deposit", test: /deposit|refund|return (the|my)|ফেরত|ডিপোজিট|জামানত/i },
  // Providing a Bangladeshi mobile number is a strong signup signal → push signup.
  { id: "close_primary", test: /(?:\+?880|0)?\s?1[3-9]\d{8}/ },
  { id: "obj_damage", test: /damage|lost|ruined|lose|নষ্ট|হারা|ক্ষতি/i },
  { id: "obj_digital_physical", test: /pdf|ebook|e-book|digital|ডিজিটাল|পিডিএফ|screen/i },
  { id: "obj_delivery", test: /outside dhaka|nationwide|everywhere|all over|বাইরে|সারা দেশ|সারাদেশ/i },
  { id: "lead_delivery", test: /deliver|delivery|ship|ডেলিভারি|পাঠান/i },
  { id: "obj_price", test: /too (much|expensive)|মহা|দামি|খুব দাম/i },
  { id: "lead_price", test: /price|cost|how much|কত|দাম|টাকা|মূল্য|charge/i },
  { id: "lead_how_it_works", test: /how (does it )?work|library|কিভাবে|লাইব্রেরি|কীভাবে কাজ/i },
  { id: "lead_catalog", test: /book|title|catalog|author|tagore|humayun|satyajit|zafar|বই|লেখক|রবীন্দ্রনাথ|হুমায়ূন|সত্যজিৎ|জাফর/i },
  { id: "obj_buy_own", test: /buy (my )?own|already buy|কিনি|নিজে কিনি/i },
  { id: "obj_not_read_much", test: /don'?t read much|no time|পড়ি না|সময় নেই|read much/i },
  { id: "obj_commitment", test: /don'?t like it|stuck|lock|commit|লক|আটকে|পছন্দ না/i },
  { id: "obj_maybe_later", test: /maybe later|later|পরে/i },
  { id: "lead_think_about_it", test: /think about it|think it over|ভাবব|চিন্তা কর/i },
  { id: "lead_just_browsing", test: /just (looking|browsing)|দেখছি|ঘুরছি/i },
];

function classifyDeterministic(text: string): Script {
  for (const rule of RULES) {
    if (rule.test.test(text)) return scriptById(rule.id)!;
  }
  return scriptById("instant_reply")!;
}

function deterministicResult(text: string): AgentResult {
  const language = detectLanguage(text);
  const script = classifyDeterministic(text);
  return {
    reply: language === "bn" ? script.bn : script.en,
    intent: script.id,
    language,
    lead: {
      name: null,
      phone: extractPhone(text),
      plan: extractPlan(text),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* LLM path                                                                    */
/* -------------------------------------------------------------------------- */

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/** Strip markdown code fences and extract the first JSON object. */
function parseLlmJson(content: string): AgentResult | null {
  const cleaned = content.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) return null;
    const lead = parsed.lead ?? {};
    return {
      reply: parsed.reply.trim(),
      intent: typeof parsed.intent === "string" ? parsed.intent : "instant_reply",
      language: parsed.language === "bn" ? "bn" : "en",
      lead: {
        name: typeof lead.name === "string" && lead.name ? lead.name : null,
        phone: typeof lead.phone === "string" && lead.phone ? extractPhone(lead.phone) ?? lead.phone : null,
        plan: typeof lead.plan === "string" ? normalisePlan(lead.plan) : null,
      },
    };
  } catch {
    return null;
  }
}

function normalisePlan(value: string): Plan | null {
  const v = value.toLowerCase();
  if (/collector|কালেক্টর/.test(v)) return "collector";
  if (/avid|অ্যাভিড|এভিড/.test(v)) return "avid";
  if (/starter|স্টার্টার/.test(v)) return "starter";
  return null;
}

async function callLlm(inboundText: string, history: string): Promise<AgentResult | null> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  const model = process.env.META_AGENT_MODEL?.trim() || DEFAULT_MODEL;
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(LLM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...(history ? [{ role: "user" as const, content: history }] : []),
          { role: "user", content: inboundText },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[rey:agent] DeepSeek ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return null;
    }

    const data = (await res.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseLlmJson(content);
  } catch (error) {
    console.error(`[rey:agent] LLM call failed:`, error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Public entry point                                                          */
/* -------------------------------------------------------------------------- */

export interface ComposeInput {
  /** The inbound message text from the customer. */
  text: string;
  /** Short recent conversation for context (older messages as "User/REY" lines). */
  history?: string;
}

/**
 * Compose a reply for an inbound message. Uses the LLM when configured, and
 * falls back to the deterministic classifier otherwise, so the bot always
 * answers with approved, on-brand copy.
 */
export async function composeReply(input: ComposeInput): Promise<AgentResult> {
  const llm = await callLlm(input.text, input.history ?? "");
  if (llm) return llm;

  // Merge deterministic lead extraction with any LLM-derived text when the LLM
  // replied but we couldn't parse structured fields (defensive — not reachable
  // in practice since parseLlmJson is strict). Fall back cleanly.
  return deterministicResult(input.text);
}
