# End-to-end evaluation: `sealed` (44 questions, with LLM)

Decision accuracy: **39/44** (88.6%)
False answers on out-of-scope questions: **0**
Correct source at rank 1 / in top 3 (answerable questions): **25/29** / **27/29**
Answer models (fallback order): google:gemini-3.5-flash-lite
Judge model: google:gemini-3.1-flash-lite
Model answers: 29; citations/teams removed by the validator: 0
Groundedness (judge model, 27 answers): **260/260** statements supported (100.0%)
Latency p50 / p95: 2543 ms / 6939 ms

## Decision confusion matrix

| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 27 | 1 | 1 |
| **clarify** | 0 | 2 | 3 |
| **not_in_kb** | 0 | 0 | 10 |

## Misclassified questions

- [paraphrase] "the endpoint says our credentials are rejected" expected `answer`, got `clarify` (Uncertain: the model decides whether one entry clearly matches.)
- [code] "KEY_REVOKED errors since yesterday" expected `answer`, got `not_in_kb` (Uncertain: the model decides whether one entry clearly matches.)
- [vague] "customers are complaining about checkout" expected `clarify`, got `not_in_kb` (Best semantic match 0.60 is below 0.62.)
- [vague] "the system seems down" expected `clarify`, got `not_in_kb` (Best semantic match 0.61 is below 0.62.)
- [vague] "can you check the machine" expected `clarify`, got `not_in_kb` (Best semantic match 0.59 is below 0.62.)

## Statements the judge marked unsupported

None.

