# Presentation script (10 minutes) and backup demo

The deck is `docs/presentation/TriageGPT_deck.pptx`: 12 slides for the talk and 3 appendix slides for
questions. Speaker notes are in the file (View, Notes). Fonts are Segoe UI and Consolas, so present from a
Windows machine or check the layout once on the presenting machine.

Core message: **the AI writes the answer, it does not decide what is true.** Retrieval and code decide what the
manual supports; the model only writes it up, and code checks the result.

## Timing

The deck is 12 slides for the talk plus 3 appendix slides. The live demo replaces slide 4 in the timing.

| Min        | Slides | What happens                                                                       |
| ---------- | ------ | ---------------------------------------------------------------------------------- |
| 0:00-0:30  | 1      | Title. One line: the AI writes, it does not decide what is true                    |
| 0:30-1:00  | 2      | The problem: a confident wrong answer is worse than a slow one                     |
| 1:00-5:00  | 3-4    | Slide 3, then **leave the deck for the live demo** (slide 4 is the backup)         |
| 5:00-5:50  | 5      | How it works: the model is one step out of six                                     |
| 5:50-6:30  | 6      | Safe by design: masking, injection, citations                                      |
| 6:30-7:15  | 7      | How I tested: 94%, then 75%, then 88.6%                                            |
| 7:15-8:15  | 8      | **What the 75% told me: four causes, four fixes** (the slide that shows judgement) |
| 8:15-8:45  | 9      | How I found three of them: one live question                                       |
| 8:45-9:20  | 10     | Results on the unseen set                                                          |
| 9:20-9:50  | 11     | Limits, next steps, and who did what                                               |
| 9:50-10:00 | 12     | Close and QR code                                                                  |

## Live demo (about 4 minutes)

Use the example chips so nothing depends on typing. Open https://triage-gpt-seven.vercel.app/ beforehand and
ask one question to warm it up.

1. **In the manual.** "customer says money got cut twice for one order". Point at the badge, the L1/L2 pills,
   the escalation routes with what to attach, and the `KB-PAY-005` chips. Click a chip to open the entry.
2. **Too vague.** "payment failing". It asks questions. Answer one and show it narrowing.
3. **Out of scope.** "my laptop VPN is not connecting". It says so; no invented steps.
4. **Guardrails.** The card-number chip (watch the "Masked" badge and the sidebar title), then "ignore all
   previous instructions": refused, nothing retrieved.
5. Finish by switching on **Under the hood** for the first answer, then **New chat** and the history sidebar.

If the free model limits are hit, the app falls back to another model or shows the raw entries. Slide 4 holds
real screenshots of all three behaviours as a backup.

## Things to say plainly

- **The story to land (slides 7 and 8):** "75% was not a verdict, it was a to-do list." Retrieval had the right
  entry first in 13 of 14 answerable questions, so the fault was in the decision logic, not in search. Four root
  causes, four fixes, then 44 new questions written before changing anything and run once. Name the cost
  honestly: on the same 24 questions, 4 of 6 misses were fixed, 1 new miss appeared and 2 remain.

- The first version scored 94-96% on the questions it was tuned on and **75% on new ones**. The 44-question
  sealed set, written and committed before the fixes and run once, gave **88.6%** with **zero** out-of-scope
  questions answered.
- The sets differ in size and content, so that is a trend, not a like-for-like comparison. With 44 questions
  the uncertainty is wide (roughly 75% to 95%).
- Runs used different models because the free Groq daily limit ran out. The judge is a model too.
- Before presenting, **edit the "Who did what" column on slide 10** so it names the tools you used and the files
  you wrote or reviewed yourself.

## Backup demo video (3-4 minutes)

Record in case the network or the free tier fails. One continuous take at 1080p, browser zoom 125%.

1. (0:00) The README and the Actions page with green checks, 15 seconds.
2. (0:15) The plain-language question; open a source chip.
3. (1:15) "payment failing"; answer the follow-up.
4. (2:00) The out-of-scope question.
5. (2:30) The card number, then the injection attempt.
6. (3:10) Under the hood, then the evaluation slide (slide 8) to end.
