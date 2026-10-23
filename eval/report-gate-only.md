# End-to-end evaluation (52 questions, gate only, no LLM)
Decision accuracy: **49/52** (94.2%)
False answers on out-of-scope questions: **0**
Top-1 source correct on answerable questions: **34/37**
Latency p50 / p95: 6 ms / 9 ms
## Decision confusion matrix
| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 36 | 1 | 0 |
| **clarify** | 0 | 7 | 0 |
| **not_in_kb** | 0 | 2 | 6 |
## Misclassified questions
- [code] "RedisConnectionException in payments logs" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [out_of_scope] "my laptop VPN is not connecting" expected `not_in_kb`, got `clarify` (Match is weak or ambiguous between several entries.)
- [out_of_scope] "how do I set up Apple Pay on an iPhone" expected `not_in_kb`, got `clarify` (Match is weak or ambiguous between several entries.)
