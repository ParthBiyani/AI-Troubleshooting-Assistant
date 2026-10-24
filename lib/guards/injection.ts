export interface InjectionResult {
  flagged: boolean;
  source: "heuristic" | "prompt-guard" | "none";
}

const PATTERNS = [
  /ignore (?:all |any )?(?:the )?(?:previous|prior|above|earlier) (?:instructions|prompts?|rules)/i,
  /disregard (?:all |any )?(?:the )?(?:previous|prior|above|your) (?:instructions|prompts?|rules)/i,
  /(?:print|reveal|show|repeat|output|leak) (?:me )?(?:your|the) (?:system|hidden|initial) (?:prompt|instructions?|message)/i,
  /you are now (?:in )?(?:dan|developer mode|an? unrestricted)/i,
  /pretend (?:that )?(?:the )?(?:knowledge base|kb|manual) says/i,
  /(?:act|behave) as (?:if )?(?:you have )?no (?:rules|restrictions|guidelines)/i,
];

export const heuristicInjection = (text: string): boolean => PATTERNS.some((p) => p.test(text));

const GUARD_MODEL = "meta-llama/llama-prompt-guard-2-86m";

/**
 * Prompt Guard returns a probability. At 0.5 it blocked the legitimate question
 * "CrashLoopBackOff on the payments pods" (score 0.975), because jargon-only text
 * looks unusual to it. Across the 76 evaluation questions, genuine attacks scored
 * 0.99 or higher and everything else below 0.3, so the cut-off sits between them.
 * The margin is thin; the regex heuristics above remain the primary defence.
 */
export const GUARD_THRESHOLD = 0.98;

/**
 * Cheap classifier in front of the main model. Heuristics run first (free and
 * deterministic); Groq Prompt Guard adds coverage when a key is configured.
 * If the classifier is unreachable we keep the heuristic result and carry on,
 * because every downstream step is also grounded and validated.
 */
export async function checkInjection(text: string): Promise<InjectionResult> {
  if (heuristicInjection(text)) return { flagged: true, source: "heuristic" };

  const key = process.env.GROQ_API_KEY;
  if (!key) return { flagged: false, source: "none" };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: GUARD_MODEL, messages: [{ role: "user", content: text }] }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { flagged: false, source: "none" };
    const data = await res.json();
    const score = parseFloat(data?.choices?.[0]?.message?.content ?? "0");
    return { flagged: score >= GUARD_THRESHOLD, source: "prompt-guard" };
  } catch {
    return { flagged: false, source: "none" };
  }
}
