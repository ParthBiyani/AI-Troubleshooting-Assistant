# Code tour

A map of the repository for anyone who has to explain it. Read it in the order of a request: the question
comes in at the API route, flows through the pipeline, and ends up in the UI.

## The request, step by step

| # | Step | File | What it does | Why |
|---|---|---|---|---|
| 1 | API entry | `app/api/ask/route.ts` | Validates the body with Zod (2-600 characters), applies a per-IP limit of 10 requests a minute, calls the pipeline | Keeps abuse and free-tier quota exhaustion out of everything below |
| 2 | Mask PII | `lib/guards/pii.ts` | Replaces Luhn-valid card numbers with `XXXX XXXX XXXX 1111`, and masks OTPs and CVVs | Nothing sensitive may reach logs, the cache or a model provider |
| 3 | Injection check | `lib/guards/injection.ts` | Regex heuristics first, then Groq Prompt Guard (blocks at score 0.98 or higher) | Stops "ignore your instructions" attempts before any retrieval or model call |
| 4 | Cache lookup | `lib/cache.ts` | Hash of the normalised question, 10-minute TTL | Saves free-tier tokens on repeated questions |
| 5 | Retrieve | `lib/retrieval/index.ts` | Runs keyword and semantic search, fuses them, returns the top 5 with per-ranker scores | Exact codes need keywords, paraphrases need meaning |
| 6 | Gate | `lib/retrieval/gate.ts` | Decides `answer`, `clarify` or `not_in_kb` from the scores | The decision to refuse is made by code, not by a prompt |
| 7 | Generate | `lib/llm/generate.ts`, `lib/llm/prompts.ts` | Calls the first working model in the chain with the top 3 entries, forcing JSON that matches the schema | Fallback across models and providers survives 429s |
| 8 | Validate | `lib/guards/validate.ts` | Drops any cause, check, resolution or escalation that cites an entry that was not retrieved or a team that does not exist | The model cannot invent a source or a team |
| 9 | Respond | `lib/pipeline.ts` | Assembles answer, sources with scores, gate reasoning and metadata | The UI and the evaluation both use this one object |

`lib/pipeline.ts` is the file that ties it all together. Read it first.

## Knowledge base

| File | Role |
|---|---|
| `data/Northwind_Support_Knowledge_Manual.md` | The source of truth: 67 entries for a fictional company. Edit this and nothing else to change the KB |
| `lib/kb/parse.ts` | Parses the manual into typed entries, the escalation directory and the priority table. It throws if an id is duplicated, a field is missing, a check has no L1/L2 tag or a `Related entries` reference points nowhere |
| `lib/kb/types.ts`, `lib/kb/load.ts` | Types, and the typed import of the generated JSON |
| `scripts/build-index.ts` | Parses the manual, writes `data/kb-entries.json`, embeds every entry and writes `data/kb-vectors.json`. Runs automatically before `npm run build` |

`data/kb-entries.json`, `data/kb-vectors.json` and `.model-cache/` are generated and git-ignored.

## Retrieval

| File | Role |
|---|---|
| `lib/retrieval/text.ts` | What gets indexed: title, keywords, symptoms and likely causes. Not the resolution, because users describe symptoms |
| `lib/retrieval/bm25.ts` | MiniSearch with boosts (keywords x3, title x2, symptoms x1.5), prefix and fuzzy matching |
| `lib/retrieval/dense.ts` | `bge-small-en-v1.5` embeddings run locally; cosine similarity is a dot product because vectors are normalised |
| `lib/retrieval/fuse.ts` | Reciprocal Rank Fusion: `1 / (60 + rank)` summed over both rankings |
| `lib/retrieval/gate.ts` | The thresholds and the decision rule; see `docs/DECISIONS.md` for how each was chosen |

## Model layer

| File | Role |
|---|---|
| `lib/llm/prompts.ts` | The versioned system prompt (rules 1-9) and the function that formats entries, directory and the user's issue |
| `lib/llm/schema.ts` | The Zod output schema; every statement carries a `source_id` |
| `lib/llm/generate.ts` | The model chain from the `LLM_MODELS` env var, with a timeout per attempt |

## Interface

| File | Role |
|---|---|
| `app/page.tsx` | Chat page, example chips, follow-up handling after a "need more info" reply |
| `components/AnswerCard.tsx` | Mode badge, L1/L2 pills, citation chips, escalation box |
| `components/SourcesPanel.tsx` | Source cards with scores, full entry viewer, "Under the hood" panel |

## Quality

| File | Role |
|---|---|
| `tests/*.test.ts` | Unit tests for parser, PII, injection, RRF, gate, validator, cache and pipeline (model and retrieval mocked) |
| `eval/testset.json` | 52 questions used while building and choosing thresholds |
| `eval/heldout.json` | 24 questions written afterwards and never used to tune anything |
| `eval/retrieval-eval.ts` | Hit@k and MRR for keyword, semantic and hybrid retrieval |
| `eval/run-eval.ts` | Decision confusion matrix, citation validity, latency; with `--judge` also a groundedness score |
| `eval/judge.ts` | A second, smaller model checks each statement against the cited entries |
| `.github/workflows/ci.yml` | Lint, types, format, unit tests, production build, and a gate that fails if an out-of-scope question gets an answer |

## Things that are easy to get wrong when explaining

- **Retrieval does not call a model.** Only the final write-up does, and only in `answer` and `clarify` modes.
- **`not_in_kb` never calls a model.** The refusal text is fixed.
- **The model may be more cautious than the gate, never less.** If the gate says `answer` and the model says `not_in_kb`, the user sees `not_in_kb`.
- **Thresholds came from the first 52 questions.** Their accuracy there is optimistic; the held-out set is the honest number.
- **The knowledge base is fictional.** Never describe it as Pine Labs data.
