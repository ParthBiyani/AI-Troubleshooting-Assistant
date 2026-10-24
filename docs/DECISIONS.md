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

The decision between answering, asking for more information and refusing is made by code from three
retrieval signals: the best semantic score, the gap between #1 and #2, and the best BM25 score. This keeps
"do not invent a resolution" from depending on the model obeying a prompt. For `not_in_kb` the model is not
called at all.

Thresholds (`lib/retrieval/gate.ts`), chosen by reading the signals for every question in the test set:

| Threshold       | Value | Meaning                                                                                                                       |
| --------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| `denseFloor`    | 0.62  | Below this the closest entry is unrelated, so refuse. Every out-of-scope and adversarial question except two scored below it. |
| `denseAnswer`   | 0.70  | At or above this a match is strong enough to answer. Every vague question except "payment failing" scored below it.           |
| `minGap`        | 0.03  | A lead over the runner-up this large means the match is unambiguous.                                                          |
| `strongKeyword` | 300   | Strong exact-term evidence can substitute for the gap. "payment failing" scored 50 here.                                      |

Caveat: these were tuned on the same questions they are scored on. See the README limitations.

Two out-of-scope questions ("laptop VPN", "Apple Pay") score 0.63 to 0.67 because they share vocabulary with
network and card entries. They are sent to `clarify`, which is a soft failure (the user is asked a question)
rather than a false answer. We chose not to widen `denseFloor` to catch them because that would also refuse
legitimate vague-but-in-scope questions.

## 5. Grounding enforced in code

The model's output must match a Zod schema where every cause, check, resolution step and escalation has a
`source_id`. `validateAnswer` removes anything citing an entry that was not in the retrieved context and any
escalation to a team not in the directory. If nothing grounded survives, the UI shows the raw KB entries.
The model may downgrade a gate decision to `not_in_kb` but never upgrade it.

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
- Prompt change to list every escalation in the entry, and re-run both sets.
- Retune the gate on a larger split; the held-out set is now used up as a test set if it informs changes.
- A one-off Prompt Guard fix (threshold 0.98) was made after the held-out run exposed a false positive.
