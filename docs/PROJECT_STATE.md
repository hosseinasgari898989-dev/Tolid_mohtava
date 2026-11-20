# Project State — Zehn-Khan / ذهن‌خوان

Last updated: 2026-11-20 (hardening code committed; workflow renders pending)

## Repository, branches and merge gate

- Repository: `hosseinasgari898989-dev/Tolid_mohtava` (public).
- Feature branch for this task: `feature/motion-kit-v1-2026-11-18`.
- Required rollback snapshot: `backup/pre-motion-kit-v1-2026-11-18`. Keep this branch.
- Existing PR #3: [Build Motion Kit V1 and kit-demo composition](https://github.com/hosseinasgari898989-dev/Tolid_mohtava/pull/3), base `main`.
- The owner explicitly requires review before merge. **Do not merge PR #3 or any follow-up PR without a separate owner confirmation.**
- `main` and the backup branch must remain unchanged during this task.
- Current verified `main` and rollback backup SHA: `ee7dfa8d94c1cfca58c0387c4716ae1af8b7b4ac`.
- Hardening implementation commits: `e137b982da303cbd0135941b19214ef0b92192c6`, `e73b6246e338bf3e338ac487ab027f98c3ac6de6`, `2e1511aa2e4ac78332a0f4f8326483fb89456594`, `be5d8ee006b7fe9480c25e383d331aa017a7ced7`, and `f43c032e541b454cd524a101c805149651dabe95`. Re-check the current feature branch HEAD before dispatch.

## Architecture and existing behavior

- Rendering: Remotion `4.0.544`, React `19.3.1`, Node.js `22`, Python `3.11`.
- Frame: 1080×1920, 30 fps, H.264, vertical short-video format.
- Pipeline: `scripts/pipeline.mjs`.
- Persian Edge TTS and word-boundary timings: `scripts/tts.py`.
- Voice/music/SFX mixing and two-pass loudness normalization: `scripts/mix_audio.py`.
- Rendered scenes and production outro: `src/Video.jsx`, `src/outroTiming.js`.
- Reusable Motion Kit: `src/kit/components.jsx`, `src/kit/backgrounds.jsx`, `src/kit/layout-utils.js`, `src/kit/transitions.jsx`.
- Demo composition: `src/kit/DemoComposition.jsx`, composition id `kit-demo`.
- Main workflow entry point: `.github/workflows/daily.yml`; keep it `workflow_dispatch` only.
- Contact-sheet generation and loop MAE check: `scripts/contact_sheet.py`.
- Quality gates: `scripts/qa.mjs`; tests: `scripts/qa.test.mjs` and the existing Node test files.
- Content schema and validation: `scripts/content_bank.mjs`, `scripts/content_bank.test.mjs`.

## Approved production behavior — preserve

- Hook headline starts on frame 0.
- Word-by-word subtitles remain aligned to real Edge TTS word boundaries; the active word is gold and the layout remains RTL.
- Closing CTA is exactly `فالو کن برای فردا` and has at least 1.2 seconds of full visibility.
- No dark empty frame at the end.
- Final frame must match first frame using the existing contact-sheet MAE / changed-pixel gate.
- Audio uses the existing voice/music/SFX pipeline and is checked around -14 LUFS with true peak no higher than -1.5 dBTP.
- Production output must be 1080×1920, 30 fps, H.264, and under 59 seconds.
- Do not introduce paid providers or paid media services.

## Content Bank

- `content_bank.json` remains backward compatible with the previous items, but now has V2 topic/layout/data/source metadata.
- Old content without a verified `fact_source` is marked `TO_VERIFY`. Pending legacy entries are changed to `draft`; do not promote them to pending until their claims and sources are checked.
- Hashtags are limited to five.
- The three fact-test entries live in `content_bank_test.json` and are separate from the production bank:
  - `venus-day` — comparison; NASA Venus facts: https://science.nasa.gov/venus/venus-facts/
  - `cleopatra-timeline` — timeline; Egypt Ministry of Tourism and Antiquities dates the Great Pyramid to Khufu (c. 2589–2566 BCE); UCL's Digital Egypt records Cleopatra VII's reign through 30 BCE; NASA records Apollo 11's lunar landing on 20 July 1969: https://egymonuments.gov.eg/monuments/the-great-pyramid/ ; https://www.ucl.ac.uk/museums-static/digitalegypt/chronology/cleopatravii.html ; https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo11info.html
  - `octopus-hearts` — card/orbit; Smithsonian Ocean: https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives
- Those three test sources were checked for the stated claims. Legacy `TO_VERIFY` entries remain unverified.

## Release and output policy

- MP4, contact sheets, captions and `qa-report.json` are stored only in GitHub Releases.
- Do not upload these outputs as GitHub Actions Artifacts.
- Do not commit generated MP4, PNG, WAV or other rendered media.
- Production releases use `video-<id>`.
- Demo release tag: `kit-demo`.
- Fact-test release tag: `kit-test`, containing each selected test item's MP4, caption, contact sheet and QA report.
- No publishing to any social account is performed by this repository workflow.

## QA behavior

- Production visual content occupies 31%-57%; word subtitles occupy 58%-72%, leaving a separation gap inside the approved 12%-72% safe region. The `kit-demo` showcase uses its own 31%-72% area because it has no story subtitles.
- `scripts/qa.mjs` samples frames every 1.5 seconds and checks navy background, corners and edge strips, nonblank first frame, separate production/subtitle areas, dimensions, fps, codec, duration, audio, loudness and true peak.
- Production profile additionally checks closing-line visibility, loop comparison, word timing, content-bank validity and text fit.
- `kit-demo` is a showcase rather than a story video. Its QA report explicitly marks story-video CTA and first/last loop gates as `SKIP`; it still checks frame appearance, safe-area/layout fit, audio and loudness. Do not describe these skipped demo-only checks as passed.
- A failed QA report is retained in the relevant Release before the Workflow is made to fail. A successful Release upload does not mean the QA gate passed.
- Every render path must run QA after rendering. Check the QA report and the output assets, not only the workflow summary.

## Workflow usage from an Android phone

1. Open this repository in GitHub mobile or Chrome.
2. Tap **Actions**.
3. Choose **Daily Video Factory**.
4. Tap **Run workflow**.
5. Set the branch to `feature/motion-kit-v1-2026-11-18` while the PR is still unmerged. The default `main` workflow currently exposes only the older `video_id` form; after selecting the feature branch, verify the form refreshes and shows `target` and `test_id`. If it still shows the old form, do not dispatch with guessed/default inputs.
6. Choose one target:
   - `kit-demo`: renders the Motion Kit showcase, synthetic audio bed, a 1.5-second contact sheet and QA report. Assets go to the `kit-demo` Release.
   - `kit-test`: choose `venus-day`, `cleopatra-timeline` or `octopus-hearts`. The full narration/subtitle/CTA/loop video is built and assets accumulate in the `kit-test` Release.
   - `video`: leave `video_id` blank to select the first `pending` item, or enter an exact item id. This uses `content_bank.json` and the production Release path.
7. Tap **Run workflow** again to confirm.
8. Open the run and wait until all steps are terminal. Check each QA line and confirm the overall conclusion is green.
9. Open **Releases** and inspect the matching Release. Check that MP4, contact sheet, caption (where present) and `qa-report.json` are listed.
10. Do not merge the PR just because a render or Release upload succeeded. Review the source changes, QA report and MP4/contact sheet first.

## Cloudflare Scheduler — not deployed by this task

- Worker source: `scheduler.js`.
- Required Cloudflare Secrets: `GITHUB_PAT` and `MANUAL_TRIGGER_KEY`.
- Fine-grained PAT must be limited to this Repository, with **Actions: Read and write**. The dispatch endpoint requires Actions write; no Contents permission is needed for the scheduler. The Worker caps each attempt at 8 seconds and the three-attempt exponential-backoff path at approximately 27 seconds worst case.
- The Worker dispatch body targets `main`; this is the intended automated production branch after the owner approves and merges the feature PR.
- Cron Triggers use UTC.
- No Cloudflare Worker code or Cron Trigger was deployed in this task.
- Phone setup guide: `docs/CLOUDFLARE_SETUP.md`.
- Never paste Secrets into chat, commits, Issues or logs.

## Rollback

- If PR #3 is still open and has not been merged: close the PR. `main` is unaffected; leave the feature and backup branches for audit.
- If this work is merged later and a rollback is needed: open the merged PR, use GitHub's **Revert** action, review the generated revert PR and merge that only after owner approval.
- Never force-push `main`, reset `main` to the backup branch, or delete `backup/pre-motion-kit-v1-2026-11-18`.
- The backup branch is a preserved pre-task snapshot for comparison and recovery reference.

## Known issues and verification status

- The hardening code is committed on the feature branch, but no manual GitHub Actions dispatch was performed from this task. No green run or fresh MP4/PNG has been verified for this commit.
- The existing `kit-demo` Release contains assets from an earlier run only (MP4 and contact sheet; no QA report). Do not attribute those files to this hardening commit. The next run must upload a fresh `qa-report.json`.
- Production `content_bank.json` currently has no verified `pending` items: old pending posts remain `draft` with `fact_source: TO_VERIFY`. Leave `video_id` blank to avoid automatically rerendering the already-done legacy item.
- `kit-demo` deliberately has no story CTA or story loop; those gates are N/A and displayed as `SKIP`.
- Legacy items without fact sources are not ready for a new factual production render; keep their statuses as `draft`.
- Cloudflare setup remains a manual owner action; no secrets were added or deployed by this task.
- This document must be updated after the owner runs the requested targets, including real run URLs, QA conclusions, Release asset checks and remaining failures.
