# Project State — Zehn-Khan / ذهن‌خوان

Last verified: 2026-11-18

## Repository and current main

- Repository: `hosseinasgari898989-dev/Tolid_mohtava` (public; keep public).
- Current `main` at last verification: `ee7dfa8d94c1cfca58c0387c4716ae1af8b7b4ac`, containing both approved PR merges, `docs/PROJECT_STATE.md`, and removal of the failure-only media Artifact upload. The new target selector exists only on the feature branch.
- PR #1, “Upgrade Remotion video factory to V2”: merged at `19226216d6c8956a013d6e23c3245bda479776f0`.
- PR #2, “Fix V3 closing CTA timing and seamless outro”: merged at `a5a6157a31dcee8529c868242537d1560d523bd1`.
- The two requested backups remain present: `backup/pre-motion-graphics-v2-2026-11-17` and `backup/pre-v3-regression-2026-11-18`. Do not delete them.
- Other retained branches at last check: `backup/pre-remotion-syntax-fix-2026-11-17`, `backup/pre-v3-polish-2026-11-18`, `feature/motion-graphics-v2-2026-11-17`, `feature/v3-polish-2026-11-18`, and `fix/v3-regression-2026-11-18`.

## What exists

- GitHub Actions workflow: `.github/workflows/daily.yml`, named **Daily Video Factory**.
- Trigger is `workflow_dispatch` only. It checks out the selected ref and renders one selected video ID.
- Pipeline: `scripts/pipeline.mjs`; Persian Edge TTS with actual word-boundary timings: `scripts/tts.py`; voice/music/SFX mixing and loudness processing: `scripts/mix_audio.py`; completion status: `scripts/mark-done.mjs`.
- Video: Remotion, React, 1080×1920, 30fps, Vazirmatn, animated hook/headlines, word-synced subtitles, SVG backgrounds, scene transitions and a loop-friendly outro.
- V3 outro regression helpers/tests: `src/outroTiming.js`, `scripts/outro_timing.test.mjs`.
- Content inventory: `content_bank.json`. Last checked: `brain-tired-001` done; `zeigarnik-001` and `two-minute-001` pending.
- Main stack uses Remotion `4.0.544`, React `19.3.1`, Node `22`, Python `3.11`.

## Output and workflow rules

- Generated MP4, caption and contact sheet belong only in GitHub Releases. Never commit generated media or publish these media outputs as GitHub Actions Artifacts.
- Do not add generated media to the repository.
- Workflow remains manual (`workflow_dispatch`) until the Cloudflare scheduler is deliberately configured and approved.
- Never log, expose or commit secrets.
- Keep Pexels removed; no paid services.
- No publishing to Instagram, TikTok or YouTube is performed by this factory workflow.
- Keep the current opening hook, word-by-word subtitle timing, voice mastering/loudness chain, closing CTA and first/last-frame loop test intact.

## Verified runs and releases

- PR #2 branch run #10: [Daily Video Factory run](https://github.com/hosseinasgari898989-dev/Tolid_mohtava/actions/runs/44274959959). It completed green on `fix/v3-regression-2026-11-18`, SHA `d1ae97818125b490da20624e2a48ce50ea1c8f6c`.
- Run #10 tests: 4 passed, 0 failed. Render: 748 frames, 24.94s. Contact sheet includes 22s, 23s, 24s and last-frame samples. First/last comparison: MAE 0.837; pixels with channel delta >24: 0.006%.
- Release: [video-brain-tired-001](https://github.com/hosseinasgari898989-dev/Tolid_mohtava/releases/tag/video-brain-tired-001). It contains MP4, caption, contact sheet and voice comparison samples.
- Run #10 is a branch verification, not a verification run on post-merge `main`.

## Pending

1. Owner to run **Daily Video Factory** on `main` from the GitHub phone UI and verify the post-merge main MP4/contact sheet.
2. Inspect the resulting main-branch MP4 and contact sheet, including frame-0 hook, word-by-word subtitles, at least 1.2s CTA visibility, no dark gap and last-frame/first-frame match.
3. Motion Kit V1 and `kit-demo` are being developed on `feature/motion-kit-v1-2026-11-18`; rollback snapshot: `backup/pre-motion-kit-v1-2026-11-18`. Do not merge it until the owner confirms.

## Motion Kit V1 branch

- Feature branch: `feature/motion-kit-v1-2026-11-18`.
- Pre-change backup: `backup/pre-motion-kit-v1-2026-11-18`.
- PR #3 is open: [Build Motion Kit V1 and kit-demo composition](https://github.com/hosseinasgari898989-dev/Tolid_mohtava/pull/3); base is `main` at `ee7dfa8d94c1cfca58c0387c4716ae1af8b7b4ac`.
- Implemented on this branch: brand tokens, RTL/Persian-digit/layout helpers, reusable animated components, animated background pack, slide/wipe/zoom transitions, `kit-demo` composition and layout/data integration. The existing `.github/workflows/daily.yml` is the sole manual entry point and now offers a `target` choice: `video` or `kit-demo` (default `video`).
- `target=video` keeps the prior video pipeline and release path. `target=kit-demo` renders the composition, creates a contact sheet every two seconds and uploads only `kit-demo.mp4` plus `kit-demo-contact-sheet.png` to the Release tagged `kit-demo`. The standalone `kit-demo.yml` workflow has been removed to avoid a duplicate entry point.
- The demo explicitly skips loop comparison because it is not a looping video; normal video rendering keeps its first/last-frame loop check.
- No workflow was dispatched during this change. The owner will run the updated **Daily Video Factory** from a phone; `main` remains unchanged.
- Keep this branch unmerged until owner approval.

## Licensing note

- Remotion's official Free License covers individuals and teams of up to 3 people, including automated rendering and commercial video creation. Larger for-profit organizations may need a paid Company License; re-check eligibility if the project team or operating entity changes.
- No paid stock provider or paid external rendering service was added by Motion Kit V1.

## Known issues / cautions

- The failure-only diagnostic Artifact upload of contact-sheet frames has been removed from `main`; generated MP4s and contact sheets are uploaded only to GitHub Releases.
- The repository had no `docs/PROJECT_STATE.md` before this file was added.
- Run #10's video and contact-sheet assets were verified by workflow logs and Release asset metadata. A separate visual inspection of the binary image/video was not available in the prior browser session.
