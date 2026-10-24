# Manual spot-check of model answers

Ten answers were generated with Gemini 3.5 Flash-Lite and read against the cited knowledge base entries by
hand, in addition to the judge-model score. Checked for: every cause, check and resolution step traceable
to the entry; L1/L2 tags kept; escalation team and priority matching the entry; nothing invented.

| #   | Question                                        | Result                                                                                                                                                       |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | customer says money got cut twice for one order | Faithful. KB-PAY-005, P2, escalate PPE with the entry's P1 condition. Omits the entry's second escalation (ABP for bank-side duplicates) and the attach list |
| 2   | encryption keys missing, machine refuses cards  | First attempt: no answer (transient model failure, raw entries shown). Retry: answered                                                                       |
| 3   | settled less than the sales total               | Faithful. KB-STL-002, P3, SETTLE-OPS, L1/L1/L2 kept                                                                                                          |
| 4   | pods killed for running out of memory           | Faithful. KB-INF-003, L2 tags kept, "L2 + approval" kept verbatim on the memory-limit change                                                                 |
| 5   | paid by UPI, money left, order shows failed     | Faithful. KB-PAY-008, ABP after 48 hours as the entry says; points to KB-UPI-002                                                                             |
| 6   | UPI button does nothing, no apps open           | Faithful. KB-UPI-004, escalates to PPE only if standard browsers also fail, as written                                                                       |
| 7   | refund more than the customer paid              | Gate chose "need more info"; the correct entry was retrieved but not trusted                                                                                 |
| 8   | certificate expired, handshake errors           | Faithful. KB-INF-001, P1, NET-INFRA, "L2 + approval" kept. Omits the ABP partner-certificate escalation                                                      |
| 9   | slow database queries                           | Faithful. KB-DB-002, all L2 checks, DBRE                                                                                                                     |
| 10  | integration broke after key rotation            | Faithful. KB-IAM-003 plus KB-PAY-003; IAM only if the new key is also rejected. Advice to ask for the key prefix, never the secret, is from the entry        |

**Findings.** No invented steps, teams or thresholds in the 8 full answers read. The recurring weakness is
omission, not invention: secondary escalation targets and "attach" lists are sometimes dropped. The judge
model flagged the same kind of statement once. A prompt rule that every escalation listed in the entry
must appear is the obvious next change; it has not been made, so these numbers are for the current prompt
(v1.0).
