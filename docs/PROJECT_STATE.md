# Project State — Zehn-Khan / ذهن‌خوان

Last updated: 2026-11-20 — static review fixes and handoff docs pushed; manual Actions runs pending.

## Repository and branch guardrails

- Repository: `hosseinasgari898989-dev/Tolid_mohtava`.
- Active branch: `feature/motion-kit-v1-2026-11-18`.
- Rollback snapshot: `backup/pre-motion-kit-v1-2026-11-18` (never delete or modify).
- PR #3: https://github.com/hosseinasgari898989-dev/Tolid_mohtava/pull/3 — must remain open/unmerged until separate explicit owner approval.
- At this update, the latest known feature HEAD before this document commit is `73b214b9a73b8690e4f57eed5d8be5b272b548f9`. Re-read the branch tip before dispatching or editing.
- The initial GitHub comparison showed feature 26 commits ahead of backup at `0052c2ed6fcc5f07100dd01d72c0cd9ecc30a730`. Three static-review fixes and two docs commits followed. Full commit history: https://github.com/hosseinasgari898989-dev/Tolid_mohtava/pull/3/commits
- Main and backup were both verified at `ee7dfa8d94c1cfca58c0387c4716ae1af8b7b4ac` at the beginning of the static-review pass. Verify they remain unchanged before any future operation.
- Correction to the previous report: `0052c2e` was a real pushed commit. What was missing was a successful final Workflow/render verification, not a commit.

## Completed and pushed

- Motion Kit V1: branded backgrounds, visible grid/glows, floating shapes, watermark/vignette, reusable visual components, layout/text-fit utilities, and Remotion demo composition `kit-demo`.
- Production visual and subtitle areas are separate; existing frame-0 hook, RTL word subtitles, gold active word and CTA/loop logic remain in source.
- Content Bank V2 validation and backward compatibility; sources required; `TO_VERIFY` content remains draft; max five hashtags; TTS/layout/icon/visual/transition/narration guardrails.
- Test content bank: `content_bank_test.json` with `venus-day`, `cleopatra-timeline`, and `octopus-hearts`.
- Production pipeline, Edge TTS retries, contact-sheet generator, audio mixing and production/demo QA profiles.
- Workflow inputs in `.github/workflows/daily.yml`: `target` choices `video`, `kit-demo`, `kit-test`; `test_id` choices `venus-day`, `cleopatra-timeline`, `octopus-hearts`.
- `scheduler.js` request timeout/retry and header-only manual trigger protection. It is source only; no Cloudflare deployment.
- `docs/CLOUDFLARE_SETUP.md` Android setup guide and `docs/NEXT_STEPS.md` new-chat handoff prompt.
- Outputs go only to GitHub Releases. Do not use GitHub Actions Artifacts or commit rendered MP4/PNG/WAV files.

## Static-review fixes pushed

1. `scripts/pipeline.mjs`: contact-sheet loop comparison now records metrics/report without aborting the render before QA can create its JSON report; production items are permitted only when `status=pending`.
2. `scripts/qa.mjs`: the QA script itself is the final loop pass/fail gate, checking MAE <= 5 and changed pixels <= 2%, after the metrics file is written.
3. `.github/workflows/daily.yml`: explicit no-item failure for `video` / `kit-test`; QA-failure condition applies only when a video was actually rendered; completion marking and content-bank push require `qa_passed=true`.
4. An empty production selection is no longer mislabeled as a QA failure. Failed actual renders still retain their QA report and outputs in the Release before Workflow failure.
5. Static inspection confirmed the exact package versions pinned in `package.json` exist: React/React DOM 19.3.1, Remotion packages 4.0.544, Lucide React 1.74.0, Fontsource Vazirmatn 5.3.0. No dependency versions changed in this pass.

## Production target behavior — important

The new feature workflow intentionally changes the old `video_id` default:
- Old workflow used `brain-tired-001` as a fixed default.
- New workflow uses a blank `video_id` to select the first eligible `pending` item, or accepts an exact ID only when its status is `pending`.
- Current `content_bank.json`: `brain-tired-001` is `done` with `fact_source: TO_VERIFY`; `zeigarnik-001` and `two-minute-001` are `draft` with `TO_VERIFY`. There are zero eligible production items.
- Therefore target=`video` with blank `video_id` must stop with the explicit no-pending guard. This is intentional and safer than rerendering old unverified content. Do not promote any entry until its source is verified and owner approves it.

## Exact Android run instructions

Do one run at a time. For each one:
1. Open https://github.com/hosseinasgari898989-dev/Tolid_mohtava
2. Tap **Actions** → **Daily Video Factory** → **Run workflow**.
3. Set **Use workflow from** to exactly `feature/motion-kit-v1-2026-11-18`.
4. Confirm the form shows the feature version's `target`, `video_id`, and `test_id` fields. The default `main` branch still has the older form; if the new fields do not appear after selecting the feature branch, stop and do not dispatch.
5. Use the following values and tap **Run workflow** again to confirm:

| Run | Use workflow from | target | video_id | test_id |
|---|---|---|---|---|
| 1 — Motion Kit showcase | `feature/motion-kit-v1-2026-11-18` | `kit-demo` | blank | `venus-day` (required field; ignored by demo) |
| 2 — Venus fact | `feature/motion-kit-v1-2026-11-18` | `kit-test` | blank | `venus-day` |
| 3 — Cleopatra timeline | `feature/motion-kit-v1-2026-11-18` | `kit-test` | blank | `cleopatra-timeline` |
| 4 — Octopus hearts | `feature/motion-kit-v1-2026-11-18` | `kit-test` | blank | `octopus-hearts` |
| 5 — Production guard check | `feature/motion-kit-v1-2026-11-18` | `video` | blank | `venus-day` (required field; ignored by production) |

- Run 1 creates `kit-demo.mp4`, `kit-demo-contact-sheet.png`, `qa-report.json` in Release tag `kit-demo`. It uses a synthetic audio bed. Story CTA and loop tests are N/A and appear as `SKIP`.
- Runs 2–4 are separate `kit-test` runs; assets accumulate in Release tag `kit-test` with unique filenames/reports for each test ID.
- Run 5 is expected to stop with no pending production item. It is a guard test only; do not expect an MP4 or Release from the current bank. For a real production render, first review a source and deliberately set one item to `pending`.
- Inspect Workflow conclusion, every QA check and report, then actual MP4/contact sheet in Releases. Release upload alone is not proof that QA passed.

## Pending owner actions

1. Run the five entries above from the phone; record actual run URLs/results.
2. Inspect each QA JSON, MP4 and contact sheet, and report any failures before changing thresholds or code.
3. Owner review of PR #3 and all outputs.
4. Merge only after the owner explicitly confirms; no assistant or automation may merge without that confirmation.
5. Cloudflare Worker/Cron setup remains a separate later owner action. No Worker was deployed and no Secrets/Cron were added.

## Known risks

- No Actions Workflow or unit test was run during this task; no green run, fresh MP4, contact sheet, QA report or Release upload is claimed.
- Static inspection cannot prove Edge TTS availability, FFmpeg fallback capability, render behavior, real visual thresholds or Release upload success.
- Frame edge/luma, text-fit and audio thresholds may expose content-specific false positives; inspect actual QA values before changing a gate.
- GitHub's manual-run UI may keep showing the default branch's older inputs. Run only after feature branch is selected and the new inputs are visible.
- Production has no verified pending content. A real `video` run requires owner-approved source verification first.
- `scheduler.js` dispatches `main`; do not deploy Cron before the approved feature code reaches main and a verified pending production item exists.

## Security, release and rollback

- Never ask for or print Secrets/Tokens. No secrets were added or changed.
- Do not introduce paid providers or services.
- No Actions Artifacts. Rendered outputs only in Releases, never in Git commits.
- Keep `backup/pre-motion-kit-v1-2026-11-18`; keep `main` unchanged.
- Do not merge PR #3 without explicit owner approval.
- If the unmerged branch is abandoned, close the PR and preserve main/backup. If merged later and rollback is needed, use a reviewed revert PR; never force-push main.
