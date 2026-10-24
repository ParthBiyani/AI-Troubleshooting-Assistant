# End-to-end evaluation (52 questions, with LLM)
Decision accuracy: **50/52** (96.2%)
False answers on out-of-scope questions: **0**
Top-1 source correct on answerable questions: **34/37**
Model answers: 35; citations/teams removed by the validator: 0
Latency p50 / p95: 2539 ms / 4192 ms
## Decision confusion matrix
| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 36 | 1 | 0 |
| **clarify** | 0 | 7 | 0 |
| **not_in_kb** | 0 | 1 | 7 |
## Misclassified questions
- [code] "RedisConnectionException in payments logs" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [out_of_scope] "how do I set up Apple Pay on an iPhone" expected `not_in_kb`, got `clarify` (Match is weak or ambiguous between several entries.)
