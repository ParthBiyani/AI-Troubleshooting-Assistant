# End-to-end evaluation: `heldout` (24 questions, gate only, no LLM)

Decision accuracy: **18/24** (75.0%)
False answers on out-of-scope questions: **0**
Correct source at rank 1 / in top 3 (answerable questions): **13/14** / **13/14**

Latency p50 / p95: 5 ms / 9 ms

## Decision confusion matrix

| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 10 | 4 | 0 |
| **clarify** | 0 | 3 | 1 |
| **not_in_kb** | 0 | 1 | 5 |

## Misclassified questions

- [paraphrase] "the card machine screen says it cannot connect to the server" expected `answer`, got `clarify` (Uncertain: the model decides whether one entry clearly matches.)
- [paraphrase] "settlement file from the bank never arrived so reconciliation is stuck" expected `answer`, got `clarify` (Uncertain: the model decides whether one entry clearly matches.)
- [paraphrase] "nightly job that settles merchants did not run" expected `answer`, got `clarify` (Uncertain: the model decides whether one entry clearly matches.)
- [paraphrase] "dashboard numbers are behind, recent sales are not visible to the merchant" expected `answer`, got `clarify` (Uncertain: the model decides whether one entry clearly matches.)
- [vague] "please help, something broke" expected `clarify`, got `not_in_kb` (Best semantic match 0.59 is below 0.62.)
- [out_of_scope] "my printer at the office is jammed" expected `not_in_kb`, got `clarify` (Uncertain: the model decides whether one entry clearly matches.)

