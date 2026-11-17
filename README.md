# Zehn-Khan Video Factory

A free Persian short-video factory built with Remotion.

## Features

- Persian voiceover with Edge TTS (fa-IR-FaridNeural)
- Word-level subtitle timings, with an even-split fallback
- Four original animated backgrounds: neural, particles, waves and geometry
- Three text templates: facts, list and question
- RTL Persian text with the bundled Vazirmatn font
- 1080x1920, 30 FPS, H.264 MP4
- GitHub Releases for video and caption files

## No stock footage or API keys

All backgrounds are generated locally in Remotion with React, SVG and CSS.
There are no stock-video providers, stock downloads or API keys.

Edge TTS still needs an internet connection to generate the Persian voice.
It does not need a project API key.

## Workflow

The GitHub Actions workflow uses workflow_dispatch only.
It processes one pending video per run.

A successful run renders the MP4 and caption, uploads both to a GitHub
Release, then marks that video as done in content_bank.json.

## Add a video

Add an object to content_bank.json with a unique ID, status pending,
a title, voiceover, template, scenes, caption and hashtags.

Allowed templates: facts, list, question.

Each scene needs text_on_screen. The optional visual field can be:
neural, particles, waves or geometry. Omit it to rotate styles
automatically using the video ID as the animation seed.

## Troubleshooting

- TTS failed: check internet access and Edge TTS availability.
- No word timings: the pipeline falls back to evenly spaced timings.
- Video too long: shorten the voiceover; videos must be under 59 seconds.
- Font error: check the Vazirmatn package installation.
- Push failed: check GitHub Actions write permission and branch protection.

Remotion licensing terms must be respected.
