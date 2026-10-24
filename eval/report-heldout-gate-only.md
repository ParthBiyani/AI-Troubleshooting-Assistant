# End-to-end evaluation: `heldout` (24 questions, gate only, no LLM)

Decision accuracy: **17/24** (70.8%)
False answers on out-of-scope questions: **0**
Correct source at rank 1 / in top 3 (answerable questions): **12/14** / **12/14**

Latency p50 / p95: 142 ms / 195 ms

## Decision confusion matrix

| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 9 | 4 | 1 |
| **clarify** | 0 | 3 | 1 |
| **not_in_kb** | 0 | 1 | 5 |

## Misclassified questions

- [paraphrase] "the card machine screen says it cannot connect to the server" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [paraphrase] "settlement file from the bank never arrived so reconciliation is stuck" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [paraphrase] "merchant tried to refund more than the customer originally paid" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [paraphrase] "nightly job that settles merchants did not run" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [code] "CrashLoopBackOff on the payments pods" expected `answer`, got `not_in_kb` (Blocked by the prompt-injection guard before retrieval.)
- [vague] "please help, something broke" expected `clarify`, got `not_in_kb` (Best semantic match 0.59 is below 0.62.)
- [out_of_scope] "my printer at the office is jammed" expected `not_in_kb`, got `clarify` (Match is weak or ambiguous between several entries.)

