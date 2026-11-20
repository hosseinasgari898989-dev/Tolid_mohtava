# Zehn-Khan Video Factory

A free Persian short-video factory built with Remotion and GitHub Actions.

## V2

- Narration-matched scenes: each scene's `narration` is aligned to real Edge TTS word boundaries.
- A 1.5-second animated opening hook, large per-word kinetic scene text and highlighted keywords.
- Four animated SVG backgrounds, changing scene-to-scene, with animated pictograms and zoom/slide/glitch transitions.
- Large, outlined word subtitles in the Instagram-safe vertical area.
- An opaque branded outro that fully covers previous scene layers.
- Configurable Edge voice, rate and pitch per video.
- Procedural ambient music and whoosh/pop sounds when local assets are absent.
- Optional local MP3 music and SFX from `assets/music/` and `assets/sfx/`, chosen deterministically by video ID.
- Voice ducking, audio fades and final loudness normalization.
- Farid/Dilara voice comparison samples for the first video.

## Motion Kit V1

The reusable Remotion component library is in `src/kit/` and brand tokens are in `design/tokens.js`. Every content scene can declare a `layout` and its `data` object: `headline`, `bignumber`, `chart`, `timeline`, `comparison`, `card`, or `list`. The `kit-demo` composition demonstrates all components and transitions. Its render receives a local synthetic audio bed; the MP4, 1.5-second contact sheet and `qa-report.json` are published only to the `kit-demo` GitHub Release. The demo QA profile skips story-video CTA and loop checks, which do not apply to this showcase.

## No API keys or paid services

The renderer, backgrounds, icons, music pad and fallback sound effects are generated locally.
Edge TTS needs an internet connection but no project API key. This build implements only
`tts_provider: "edge"`; the provider boundary is ready for another provider later.

## Remotion license

Remotion's official Free License covers individuals and teams of up to 3 people, including automated rendering and commercial video creation. Larger for-profit organizations may need a paid Company License. Re-check eligibility if the operating entity or team size changes.

## Workflow

The GitHub Actions workflow is `workflow_dispatch` only and has three targets:

- `video`: a production-bank item. Leave `video_id` blank to select the first item with status `pending`, or enter an exact id to request a specific bank item.
- `kit-demo`: the Motion Kit showcase with audio, a 1.5-second contact sheet and QA report.
- `kit-test`: one of the verified items in `content_bank_test.json` (`venus-day`, `cleopatra-timeline`, `octopus-hearts`).

Production and fact-test renders use real Edge TTS word boundaries, the approved outro and loop cover, then run `scripts/qa.mjs`. Their MP4, caption, contact sheet and per-video QA report are stored only in GitHub Releases. The first-video run also uploads `voice-test-farid.mp3` and `voice-test-dilara.mp3`.

The job has a 12-minute limit and the Remotion render itself has a 10-minute guard.

## Content schema

Content Bank V2 requires `id`, `status`, `topic`, `layout`, `data`, `voiceover`,
`scenes`, `caption`, up to five `hashtags` and a non-empty `fact_source`.
Each scene needs `narration`, `text_on_screen`, `highlight`, `icon`, `layout`
and `data`. The ordered scene narration segments must cover the voiceover exactly.
Legacy fields remain readable; items with `fact_source: "TO_VERIFY"` stay in `draft`.

- On-screen text: maximum seven words per scene.
- Visuals: `neural`, `particles`, `waves`, `geometry`.
- Icons: `brain`, `low-battery`, `clock`, `lightbulb`, `checklist`,
  `question`, `heart`, `eye`.
- Transitions: `zoom`, `slide`, `glitch`.
- TTS fields: `tts_provider`, `voice`, `rate`, `pitch`.

Validation fails if scene narration is missing, out of sequence, or not a complete
match for the voiceover; it also checks highlights, icon names, text length and
background changes before synthesis or rendering.

## Optional audio assets

Place Pixabay MP3 tracks in `assets/music/` and short whoosh/pop effects in
`assets/sfx/`. Add each Pixabay track-page URL to `assets/LICENSES.md`.
If either folder has no MP3 files, the factory generates the corresponding audio.
