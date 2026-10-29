# Submission checklist

## URLs

- Repository: https://github.com/tranpaul707/CSE_4095
- App source on prepared branch:
  https://github.com/tranpaul707/CSE_4095/tree/hangman-web-app/hangman-web
- Branch: `hangman-web-app`. If submitting before merging, clearly identify the
  branch/folder so the grader sees the app rather than an older main branch.
- Public app: **pending Render service creation and verification**.

## 1–2 page PDF report

Start with REPORT_DRAFT.md and revise it in your own words. Add the verified live
URL and describe the actual Render setup after deployment. Complete the personal
reflection based on what you understand and learned. Export the finished report
as a 1–2 page PDF. Do not claim deployment or manual checks that have not happened.

Include development process, architecture, testing, deployment, one challenge and
resolution, reflection, and two or three representative prompts. DEVELOPMENT.md
contains factual implementation and test notes.

## 2–3 minute screen recording

Suggested sequence (use the public HTTPS site, not localhost):

- 0:00–0:20: Show the public URL and difficulty choices; start a game.
- 0:20–1:15: Guess letters with buttons and keyboard. Explain the pattern,
  letters tried, chances, and drawing. Reach a win or loss.
- 1:15–1:35: Show the outcome and start another game without a page reload.
- 1:35–2:30: Show Chrome Network → Fetch/XHR. Select a guess request; explain
  the JSON payload, response, and matching page update. Show that an active
  response has no answer field.

If a game takes too long, rehearse so the recording includes a complete result.
You can demonstrate a loss; a win is not required.

## Before HuskyCT submission

- [ ] Run the backend tests locally and read their output.
- [ ] Play locally; inspect and explain at least one request in Chrome.
- [ ] Deploy and play through a full game on the public site.
- [ ] Check the live URL from a separate browser/private window.
- [ ] Confirm the repository branch includes all app files and README.
- [ ] Submit repository/source URL, public app URL, final report PDF, recording.
- [ ] Keep the public app accessible during grading.
