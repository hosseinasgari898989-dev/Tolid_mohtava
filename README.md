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

## No API keys or paid services

The renderer, backgrounds, icons, music pad and fallback sound effects are generated locally.
Edge TTS needs an internet connection but no project API key. This build implements only
`tts_provider: "edge"`; the provider boundary is ready for another provider later.

## Workflow

The GitHub Actions workflow is `workflow_dispatch` only. It renders one selected video.
The manual input defaults to `brain-tired-001`. The workflow uploads the MP4 and caption
to its existing GitHub Release; the first-video run also uploads
`voice-test-farid.mp3` and `voice-test-dilara.mp3`.

The job has a 12-minute limit and the Remotion render itself has a 10-minute guard.

## Content schema

Every scene needs `text_on_screen` and `narration`. The ordered scene narration segments
must cover the voiceover exactly. Optional scene fields are `highlight`, `visual`,
`icon` and `transition`.

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
