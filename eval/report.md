# End-to-end evaluation: `testset` (52 questions, with LLM)

Decision accuracy: **49/52** (94.2%)
False answers on out-of-scope questions: **0**
Correct source at rank 1 / in top 3 (answerable questions): **34/37** / **36/37**
Answer models (fallback order): google:gemini-3.5-flash-lite
Judge model: google:gemini-3.5-flash
Model answers: 46; citations/teams removed by the validator: 0
Groundedness (judge model, 19 answers): **204/205** statements supported (99.5%)
Latency p50 / p95: 3083 ms / 6705 ms

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

## Statements the judge marked unsupported

- "repeat customers paying with a saved card keep getting errors": Escalation: to PPE. if the token-service error rate is above 5%.. Attach: Grafana token-service error rate dashboard screenshot; Sample transaction IDs with TOKEN_INVALID or TOKEN_EXPIRED errors (The attachment requirements are not mentioned in KB-CARD-004.)

