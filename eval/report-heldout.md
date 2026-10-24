# End-to-end evaluation: `heldout` (24 questions, with LLM)

Decision accuracy: **21/24** (87.5%)
False answers on out-of-scope questions: **0**
Correct source at rank 1 / in top 3 (answerable questions): **13/14** / **13/14**
Answer models (fallback order): google:gemini-3.5-flash-lite
Judge model: groq:openai/gpt-oss-20b
Model answers: 16; citations/teams removed by the validator: 0
Groundedness (judge model, 0 answers): **0/0** statements supported (n/a%)
Latency p50 / p95: 2493 ms / 6793 ms

## Decision confusion matrix

| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 12 | 1 | 1 |
| **clarify** | 0 | 3 | 1 |
| **not_in_kb** | 0 | 0 | 6 |

## Misclassified questions

- [paraphrase] "the card machine screen says it cannot connect to the server" expected `answer`, got `not_in_kb` (Uncertain: the model decides whether one entry clearly matches.)
- [paraphrase] "dashboard numbers are behind, recent sales are not visible to the merchant" expected `answer`, got `clarify` (Uncertain: the model decides whether one entry clearly matches.)
- [vague] "please help, something broke" expected `clarify`, got `not_in_kb` (Best semantic match 0.59 is below 0.62.)

## Statements the judge marked unsupported

None.

