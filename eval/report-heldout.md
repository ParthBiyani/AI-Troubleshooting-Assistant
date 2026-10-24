# End-to-end evaluation: `heldout` (24 questions, with LLM)

Decision accuracy: **18/24** (75.0%)
False answers on out-of-scope questions: **0**
Correct source at rank 1 / in top 3 (answerable questions): **13/14** / **13/14**
Model answers: 17; citations/teams removed by the validator: 0
Groundedness (judge model, 12 answers): **116/118** statements supported (98.3%)
Latency p50 / p95: 2555 ms / 4395 ms

## Decision confusion matrix

| expected \ got | answer | clarify | not_in_kb |
|---|---|---|---|
| **answer** | 10 | 3 | 1 |
| **clarify** | 0 | 3 | 1 |
| **not_in_kb** | 0 | 1 | 5 |

## Misclassified questions

- [paraphrase] "the card machine screen says it cannot connect to the server" expected `answer`, got `not_in_kb` (Match is weak or ambiguous between several entries.)
- [paraphrase] "settlement file from the bank never arrived so reconciliation is stuck" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [paraphrase] "merchant tried to refund more than the customer originally paid" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [paraphrase] "nightly job that settles merchants did not run" expected `answer`, got `clarify` (Match is weak or ambiguous between several entries.)
- [vague] "please help, something broke" expected `clarify`, got `not_in_kb` (Best semantic match 0.59 is below 0.62.)
- [out_of_scope] "my printer at the office is jammed" expected `not_in_kb`, got `clarify` (Match is weak or ambiguous between several entries.)

## Statements the judge marked unsupported

- "certificate on the payments endpoint ran out and clients get handshake errors": Escalation: to NET-INFRA. immediately for P1. Attach: nothing (Missing ABP escalation and includes extra detail not in entry.)
- "after they rotated their API key the merchant integration stopped working": Escalation: to IAM. new key is also rejected. Attach: nothing (Not mentioned in entry)

