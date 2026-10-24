# Decision log

Short records of why things are the way they are. Newest at the bottom.

## 1. Next.js + TypeScript on Vercel

One codebase serves the UI and the API, and Vercel deploys straight from GitHub with a preview URL per
branch. Rejected: a Python backend on a free host that sleeps (a slow first request is risky in a live
demo) and Streamlit (looks like a notebook, cannot run on Vercel).

## 2. No vector database

There are 67 entries. Entry vectors are computed at build time into `data/kb-vectors.json` and compared in
memory with a dot product (vectors are normalised, so this is cosine similarity). A vector database would
add a service, a key and a failure mode for no benefit at this size. At around 10,000 entries the plan
would be a vector store, chunking, metadata filters and a re-ranker.

## 3. Hybrid retrieval with Reciprocal Rank Fusion

Support questions mix exact tokens (`RC 91`, `504`, `KEY_REVOKED`) and loose descriptions ("money got cut
twice"). BM25 handles the first, embeddings the second. RRF (`1 / (60 + rank)`) merges the two rankings
without calibrating their very different score scales.

Only title, keywords, symptoms and likely causes are indexed. Users describe symptoms, so matching on
resolution text adds noise. The model still receives the full entry.

Measured on `eval/testset.json` (37 answerable questions): semantic-only has the best Hit@1 (94.6%),
hybrid is second (91.9%), BM25 is third (83.8%); all three reach Hit@3 of 97.3% or higher. Hybrid is kept
for its Hit@5 and robustness on exact codes, but on this set it did not beat semantic-only at rank 1.

## 4. A deterministic gate before the model

The first decision, refuse or continue, is made by code from retrieval scores, so "do not invent a
resolution" does not depend on the model obeying a prompt. For `not_in_kb` the model is not called at all.

Current rule (`lib/retrieval/gate.ts`, second iteration):

| Threshold       | Value | Meaning                                                                                               |
| --------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| `denseFloor`    | 0.62  | If the best semantic score across all candidates is below this, nothing in the KB is close: refuse    |
| `denseAnswer`   | 0.70  | The semantic score of the entry that fused ranking put first must reach this to answer confidently    |
| `keywordAnswer` | 150   | ...and that same entry needs keyword support at least this strong (vague messages share few keywords) |

Anything between the floor and the confident rule is "uncertain": the model is shown the top three entries and
chooses between answering, asking questions, or saying the KB does not cover it. The label the user sees is the
validated model output, not the gate's guess.

### What changed in the second iteration, and why

A live question ("Payment is hitting 504 again and again") exposed two faults:

1. **The gate read the wrong entry's score.** It took the highest semantic score among all five retrieved
   entries, which belonged to an unrelated entry (0.707) rather than the correct one that fused ranking put first
   (0.675). Signals are now taken from the entry ranked first by fusion, plus a keyword-support floor. The old
   "gap to the runner-up" and "strong keyword" thresholds are gone.
2. **The badge said "Need more info" on a full answer.** The label came from the gate even when the model had
   produced a grounded answer. The label is now the validated model mode. This deliberately relaxes the earlier
   rule that the model could be more cautious than the gate but never less; the validator still enforces
   grounding, and the gate still refuses outright when nothing is close.

Also changed: the schema now returns every escalation route the entry lists (previously one) and the full attach
list, and prompt v1.2 tells the model that a message too vague to judge is "clarify", not "not in KB".

### How it was evaluated without fooling myself

- The 52 original questions and the 24 held-out questions are now **development data**: I looked at their
  failures, so any score on them is optimistic. Thresholds and the prompt were adjusted on them only.
- Before changing anything, I wrote **44 new questions** (`eval/sealed.json`) and committed them. The code was
  frozen, and the sealed set was run **once**. Nothing was changed afterwards.

| Set                          | Decisions correct | Out-of-scope wrongly answered | Notes                                  |
| ---------------------------- | ----------------- | ----------------------------- | -------------------------------------- |
| Held-out, old system         | 18/24 (75.0%)     | 0                             | Before this iteration                  |
| Held-out, new (development)  | 21/24 (87.5%)     | 0                             | Optimistic: failures were inspected    |
| Original 52, new (dev)       | 52/52 (100%)      | 0                             | In-sample on two iterations; ignore it |
| **Sealed, new (clean test)** | **39/44 (88.6%)** | **0**                         | The honest figure                      |

Sealed-set misses: three very short vague messages ("customers are complaining about checkout", "the system
seems down", "can you check the machine") scored 0.59 to 0.61 semantically and were refused by the floor
instead of getting follow-up questions; one credentials question got follow-ups; one `KEY_REVOKED` question was
judged by the model to be outside the KB. Very short vague messages and genuinely out-of-scope ones score
alike on a small embedding model, so the floor cannot separate them without a better scorer (a cross-encoder
re-ranker is the next step). Groundedness on the sealed answers: 260 of 260 statements supported by a judge
model (Gemini 3.1 Flash-Lite, scoring Gemini 3.5 Flash-Lite answers).

## 5. Grounding enforced in code

The model's output must match a Zod schema where every cause, check, resolution step and escalation has a
`source_id`. `validateAnswer` removes anything citing an entry that was not in the retrieved context and any
escalation to a team not in the directory. If nothing grounded survives, the UI shows the raw KB entries.
A gate refusal is final; otherwise the model's validated mode is the label (see section 4).

## 6. Prompt kept small

Groq's free tier allows about 8K tokens per minute per model, so the prompt carries the top 3 entries and a
one-line-per-team directory rather than the whole KB. The prompt is versioned (`PROMPT_VERSION`) and the
version is returned with every answer.

## 7. Privacy and safety

Card numbers (Luhn-checked so order ids are left alone), OTPs and CVVs are masked before caching, logging
or any provider call. User text is wrapped in `<user_issue>` and the system prompt tells the model to treat
it as data. Injection attempts are caught by heuristics first, then Groq Prompt Guard when a key is set.

## 8. Graceful degradation

Semantic search is optional at runtime: if the embedding model cannot load (for example a serverless size
limit), the pipeline falls back to keyword search with its own thresholds and says so in the UI. If every
model in the chain fails, the user still gets the retrieved entries.

## 9. Open items

- Deploy and verify the embedding model fits the hosting provider's function size limit.
- Done: full LLM evaluation, a judge-model groundedness score, a held-out set and a ten-answer manual
  read (see the README and `docs/SPOT_CHECK.md`).
- Done: every escalation route and the attach list are returned (prompt v1.2), and the sealed set was run once.
- Next: a cross-encoder re-ranker for the very short vague messages, evaluated on a fresh sealed set. The current sealed set is now spent.
- A one-off Prompt Guard fix (threshold 0.98) was made after the held-out run exposed a false positive.

## 10. Chat history is per browser, not a shared log

"History of all chats on the website" could mean a shared log of every visitor's questions or each person's
own history, as in a chat product. We built the second. A shared log needs a database, and it would put every
visitor's questions, which can contain merchant details, in front of everyone else, which contradicts the
privacy approach elsewhere in the app. History is therefore stored in the visitor's browser (localStorage).

- Messages are masked (card numbers, OTPs, CVVs) before saving, and titles come from the masked text.
- Each stored answer keeps its scores, gate and guard details but not the full text of each retrieved entry
  (about 90% of its size); `/api/entries/[id]` returns that text when a source card is opened again.
- At most 50 chats are kept, and if the browser refuses a write the oldest chat is dropped and the write
  retried, so history degrades gracefully instead of failing silently.
- Trade-offs: history does not follow the user to another browser or device, and clearing site data erases it.
  A signed-in, server-side history would fix that and is the next step if the app is ever used by a team.
