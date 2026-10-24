# End-to-end evaluation: `testset` (52 questions, with LLM)

Decision accuracy: **52/52** (100.0%)
False answers on out-of-scope questions: **0**
Correct source at rank 1 / in top 3 (answerable questions): **34/37** / **36/37**
Answer models (fallback order): google:gemini-3.5-flash-lite
Judge model: groq:openai/gpt-oss-20b
Model answers: 44; citations/teams removed by the validator: 1
Groundedness (judge model, 5 answers): **72/72** statements supported (100.0%)
Latency p50 / p95: 2850 ms / 6028 ms

## Decision confusion matrix

| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 37 | 0 | 0 |
| **clarify** | 0 | 7 | 0 |
| **not_in_kb** | 0 | 0 | 8 |

## Misclassified questions

None.

## Statements the judge marked unsupported

None.

