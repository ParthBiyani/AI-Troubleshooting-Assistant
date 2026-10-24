# Q&A preparation

Short answers you can say out loud, with the numbers behind them. Quote the held-out figures first: they
are the honest ones.

## The numbers to remember

| Measure                                   | First design, held-out (24) | Second design, sealed (44, run once) |
| ----------------------------------------- | --------------------------- | ------------------------------------ |
| Decisions correct (answer / ask / refuse) | 18/24, 75.0%                | **39/44, 88.6%**                     |
| Out-of-scope questions wrongly answered   | 0                           | **0**                                |
| Correct entry at rank 1 (answerable)      | 13/14                       | 25/29                                |
| Statements supported by a judge model     | 116/118, 98.3%              | 260/260, 100%                        |
| Latency p50 / p95                         | 2.6 s / 4.4 s               | 2.5 s / 6.9 s                        |

How to explain the two rows honestly:

- The **first design** scored 94-96% on the 52 questions it was tuned on, and 75% on 24 questions written
  afterwards. That gap is the cost of tuning on a small set.
- I then looked at the failures, fixed three real faults (below), and wrote **44 new questions before changing
  anything**, committed them, froze the code, and ran them **once**: 88.6%. The sets differ (24 vs 44), so this
  is not a like-for-like comparison, but the sealed set is the only clean estimate I have.
- The 44-question set is now spent. Any further tuning needs a fresh one.
- With 44 questions the uncertainty is wide, roughly 75% to 95%.

The runs used different answer models (Groq gpt-oss-120b early on, then Gemini 3.5 Flash-Lite) because the
free Groq daily token limit ran out mid-evaluation. Say so if asked; do not blur it.

**The three faults, found from one live question ("Payment is hitting 504 again and again"):**

1. The gate read the highest semantic score among all five retrieved entries, which belonged to an unrelated
   entry, instead of the score of the entry fused ranking put first.
2. The badge said "Need more info" above a complete answer, because the label came from the gate and not from
   the validated model output.
3. The model returned only one escalation team where the entry lists four, so the schema and prompt now return
   every route and the full attach list.

## Questions you will probably get

**Why not just put all 67 entries in the prompt?**
Three reasons. Tokens: the Groq free tier allows about 8K tokens a minute per model and the manual is
far larger. Measurability: with retrieval I can score whether the right entry was found separately from
whether the model wrote it well. Scale: it works at 67 entries by accident and breaks at 6,700.

**What stops the model inventing a fix?**
Four layers. (1) The model only sees the top three entries. (2) The prompt says to use only those and
to cite each statement. (3) The schema makes `source_id` mandatory on every statement. (4) Code removes
any statement that cites an entry that was not retrieved, and any team not in the directory. Separately,
when retrieval confidence is low the model is not called at all.

**How did you choose the thresholds? What happens at the boundary?**
I printed the retrieval scores for every development question and picked the values that separated the
groups: below 0.62 on the best candidate, refuse; at or above 0.70 semantic and 150 keyword on the top-ranked
entry, answer confidently; in between, uncertain, and the model decides. The weakness is that I tuned on the
same questions I then scored, which is why I wrote a held-out set (75%) and then a sealed set that I ran once
(88.6%). The sealed set is the honest figure.

**So is it too cautious now?**
Less than before. On the sealed set 27 of 29 answerable questions were answered, 1 got follow-up questions and 1 was
told "not in KB". The remaining weak spot is the opposite one: very short vague messages ("the system seems down")
scored just under the refusal floor and were told "not in KB" instead of being asked what is wrong. Short vague
messages and genuinely out-of-scope ones score alike on a small embedding model. A cross-encoder re-ranker would
separate them better, and that is the next step.

**Why hybrid search and not only embeddings?**
Exact tokens like `RC 91`, `504` and `KEY_REVOKED` are weak spots for small embedding models. On my set
semantic-only actually scored a higher Hit@1 (94.6% vs 91.9% for hybrid), and hybrid was the only one to
reach 100% at rank 5. I kept hybrid for that robustness; I did not measure it to be better at rank 1 and
should not claim it is.

**Why no vector database?**
67 entries. The vectors are a 216 KB JSON file and the comparison is a dot product in memory. A database
would add a service and a failure mode for no benefit. At around 10,000 entries I would move to a vector
store with chunking, metadata filters and a re-ranker.

**What if the KB entry itself is wrong?**
The assistant repeats it faithfully, with its id, so the error is traceable to one entry. That is a
property of grounded systems: they are only as good as the source. A feedback button on each answer that
raises a ticket against the entry would close the loop.

**How do you handle card numbers and other sensitive data?**
They are masked before anything else happens: Luhn-validated card numbers become `XXXX XXXX XXXX 1111`,
and OTPs and CVVs are masked. This happens before caching, logging and any call to a model provider. The
masking is tested, including that long order ids which fail the Luhn check are left alone.

**What about prompt injection?**
Two layers. Regex patterns catch the common phrasings. Groq Prompt Guard catches novel ones. I found Prompt
Guard blocked a legitimate question, "CrashLoopBackOff on the payments pods", because jargon-only text
scores high with it. I raised its threshold from 0.5 to 0.98 using the scores on all 76 questions. The
gap is thin (attacks scored 0.99 or more, that question 0.975), so I describe it as a defence in depth,
not a guarantee. Even if an injection got through, the output is still schema-checked and citation-checked.

**Free-tier models: any concern?**
Yes. Rate limits are tight (about 8K tokens a minute), so I keep prompts to three entries, cache repeated
questions, limit each IP and chain several models so a 429 falls through to the next. Gemini's free tier
may use prompts to improve Google's products. Everything here is synthetic and PII is masked first. In
production I would use a paid, no-retention tier.

**How is groundedness measured, and can you trust it?**
A second, smaller model checks each statement against the cited entries and marks it supported or not.
On held-out answers 116 of 118 statements were supported. I trust it as a screening tool, not proof: the
judge is a model, and both unsupported flags were about the escalation line (an empty "attach" list),
which are arguably nitpicks. I also read ten answers by hand against their entries (`docs/SPOT_CHECK.md`): no invented steps or teams,
but secondary escalations and attach lists were sometimes left out.

**What did the AI write, and what did you write?**
AI coding assistants drafted the sample KB, scaffolding and boilerplate. The architecture choices (hybrid
retrieval, no vector database, a deterministic gate before the model, validation in code), the thresholds,
the test sets, the prompt rules and the review are mine. (Say specifically which files you reviewed and
changed; the code tour lists them.)

**What would you do next?**

1. A larger labelled set, with a train/test split, and a calibrated confidence score instead of hand
   thresholds.
2. A feedback button per answer that files a ticket against the cited KB entry.
3. A re-ranker for the cases where the right entry is found but not trusted.
4. Ticket-system integration, so the escalation box can open a pre-filled ticket.
5. Hindi and mixed-language queries.

## Where it breaks (for the limitations slide)

- Paraphrases that mix two topics, such as "settlement file from the bank never arrived": the gate asks
  for more information instead of answering.
- Short, vague, in-domain wording such as "the card machine screen says it cannot connect to the server":
  the gate asked for more information and the model then decided none of the candidate entries matched,
  so the user was told "not in KB" for a question the KB does cover (terminal offline, KB-TRM-001). The
  model may be more cautious than the gate, so this is a safe failure, but it is still a miss.
- Out-of-scope questions sharing vocabulary with the KB ("printer at the office") get a clarifying
  question, not a flat refusal.
- Empty "attach" lists on some escalations, where the entry names evidence to attach.
- Free-tier rate limits and the one-instance, in-memory cache and rate limiter.
