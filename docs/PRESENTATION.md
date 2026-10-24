# Presentation script (10 minutes) and backup demo

Core message: **the AI writes the answer, it does not decide what is true.** Retrieval and code decide
what the knowledge base supports; the model only writes it up, and code checks the result.

## Timing

| Min        | Section                               |
| ---------- | ------------------------------------- |
| 0:00-1:00  | 1. Problem                            |
| 1:00-5:00  | 2. Live demo (four questions)         |
| 5:00-7:00  | 3. How it works                       |
| 7:00-8:30  | 4. Results, including the honest ones |
| 8:30-10:00 | 5. Limitations and next steps         |

## 1. Problem (1 min)

- L1 and L2 engineers lose time searching runbooks, and a wrong guess causes a bad escalation.
- A chatbot that sounds confident but invents a fix is worse than no chatbot, especially in payments.
- So the goal is not "answer everything"; it is "answer from the manual, show the source, and say so when
  the manual does not cover it".

## 2. Live demo (4 min)

Use the example chips so nothing depends on typing.

1. **Plain-language question in the KB.** Click "customer says money got cut twice for one order".
   Point out: the mode badge, L1/L2 pills on each check, the escalation box with what to attach, and the
   `KB-PAY-005` chips. Click a chip: the full entry opens beside it, with a link to the PDF manual.
2. **Vague question.** Click "payment failing". The assistant asks two or three questions that separate
   the candidate entries instead of guessing. Answer one ("it is the saved card flow") and show it
   narrowing.
3. **Out of scope.** Click "my laptop VPN is not connecting". It says the KB does not cover it and sends
   the user to raise a ticket with L2. No steps are made up.
4. **Guardrails.** Click the card-number chip. Show the badge "Masked: card number, OTP" on the answer
   card. Then the "ignore all previous instructions" chip: refused, nothing
   retrieved.

Finish by switching on **Under the hood** on the first question: gate decision and reason, the scores,
which model answered, prompt version, tokens, latency.

## 3. How it works (2 min)

Show the architecture diagram from the README and say three things:

- **Hybrid search.** Keyword search for exact codes like `RC 91`; embeddings for paraphrases; fused with
  Reciprocal Rank Fusion. No vector database for 67 entries, on purpose.
- **A gate before the model.** Code, not the prompt, decides answer, ask or refuse. When it refuses, the
  model is never called.
- **Validation after the model.** Every statement must cite an entry that was retrieved, and escalation
  can only name a team in the directory. Anything else is dropped in code.

## 4. Results (1.5 min)

|                                   | Tuned set (52) | Held-out set (24) |
| --------------------------------- | -------------- | ----------------- |
| Decisions correct                 | 94.2%          | 75.0%             |
| Out-of-scope questions answered   | 0              | 0                 |
| Statements supported by the judge | 99.5%          | 98.3%             |
| Latency p50                       | 3.1 s          | 2.6 s             |

Say it plainly: "The first number is flattering because I chose the thresholds on those questions. The
second set I wrote afterwards and never tuned on; that is the one to trust. The drop is almost entirely
cases where the assistant asked for more information when it could have answered. That is the safe way to
be wrong, and the dangerous case, answering something out of scope, is zero on both."

Retrieval table: keyword 83.8% Hit@1, semantic 94.6%, hybrid 91.9%; all about 97% at Hit@3.

## 5. Limitations and next steps (1.5 min)

- Synthetic KB, small question sets, written by one person.
- The gate is hand-tuned and too cautious on mixed paraphrases.
- The judge is itself a model; it screens, it does not prove.
- Free-tier rate limits.
- Next: a bigger labelled set with a proper split, calibrated confidence, a feedback button per answer,
  ticket-system integration, Hindi queries.

## Backup demo video (3-4 minutes)

Record in case the network or the free tier fails during the presentation. One continuous take.

1. (0:00) Show the repo README and the Actions page with green checks, 15 seconds.
2. (0:15) Ask the plain-language question; show the answer card and open a source chip.
3. (1:15) Ask "payment failing"; answer the follow-up.
4. (2:00) Ask the out-of-scope question.
5. (2:30) Paste a card number; show masking. Paste the injection attempt.
6. (3:10) Open Under the hood; end on the evaluation table.

Record at 1080p with the browser zoom at 125% so the text is readable in a meeting room.
