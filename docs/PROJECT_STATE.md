# Project State — Zehn-Khan / ذهن‌خوان

Last verified: 2026-11-18

## Repository and current main

- Repository: `hosseinasgari898989-dev/Tolid_mohtava` (public; keep public).
- Main after both approved merges: `a5a6157a31dcee8529c868242537d1560d523bd1` (followed by a small workflow-safety commit removing the failure-only media Artifact upload).
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

1. Run **Daily Video Factory** once on the current `main` and confirm it is green. A saved browser GitHub session expired during the last dispatch attempt; the owner must sign in and save the existing TinyFish browser profile before the run can be dispatched from the browser.
2. Inspect the resulting main-branch MP4 and contact sheet, including frame-0 hook, word-by-word subtitles, at least 1.2s CTA visibility, no dark gap and last-frame/first-frame match.
3. Motion Kit V1 and `kit-demo` are being developed on a new backup-protected feature branch. Do not merge that branch until the owner confirms.

## Known issues / cautions

- The failure-only diagnostic Artifact upload of contact-sheet frames has been removed from `main`; generated MP4s and contact sheets are uploaded only to GitHub Releases.
- The repository had no `docs/PROJECT_STATE.md` before this file was added.
- The saved browser profile's GitHub sign-in may expire. Do not ask for or store passwords in chat; use the saved profile's sign-in page.
- Run #10's video and contact-sheet assets were verified by workflow logs and Release asset metadata. A separate visual inspection of the binary image/video was not available in the prior browser session.
