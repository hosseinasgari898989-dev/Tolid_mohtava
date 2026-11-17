# Zehn-Khan Video Factory

A free Phase 1 Persian short-video factory.

## Features

- Persian voice generation using Edge TTS
- fa-IR-FaridNeural voice
- Word-level subtitle timings
- Pexels vertical stock footage
- Used clip ID tracking
- Three Remotion templates:
  - facts
  - list
  - question
- Vazirmatn bundled font
- RTL Persian text
- Animated subtitles
- 1080x1920 video
- 30 FPS
- H.264 MP4
- GitHub Releases
- Automatic content status updates

## Requirements

- GitHub repository
- Free Pexels API key
- Cloudflare Worker
- Fine-grained GitHub token

## GitHub Secrets

Add this repository secret:

PEXELS_API_KEY

Do not put API keys in source code.

## Workflow

The workflow only uses workflow_dispatch.

It processes one pending video per run.

When a video is finished:

1. MP4 is rendered.
2. Caption TXT is created.
3. Both files are uploaded to GitHub Releases.
4. The video status becomes done.
5. Used Pexels clip IDs are saved.
6. Changes are committed to main.

## Release naming

Each video gets this release tag:

video-<id>

Example:

video-brain-tired-001

## Cloudflare

The Worker sends a workflow_dispatch request every day.

Required Worker secrets:

- GITHUB_PAT
- MANUAL_TRIGGER_KEY

Cron triggers use UTC.

## Adding a video

Edit content_bank.json.

Add a new object with:

- A unique ID
- status: pending
- A template name
- Persian voiceover
- At least one scene
- English Pexels keywords
- Caption
- Hashtags

Allowed templates:

facts, list, question

## Troubleshooting

### No video generated
Check whether a pending video exists.

### Pexels 401
Check PEXELS_API_KEY.

### Pexels 429
The API rate limit may have been reached.
Try again later.

### TTS failed
Check the voice name and Edge TTS availability.

### Video is too long
Shorten the Persian voiceover.
The pipeline rejects videos longer than 59 seconds.

### No word timings
Check whether Edge TTS returned WordBoundary events.

### Remotion render failed
Check FFmpeg, Node packages and video files.

### Git push failed
Check GITHUB_TOKEN write permission and branch protection.

### GitHub release already exists
The workflow uploads assets again using --clobber.

### Repeated stock footage
Check used_clips.json.
Do not delete the clip history.

## Important

This project creates video files.
It does not automatically publish to Instagram, TikTok or YouTube.

Pexels footage must follow the applicable Pexels license and API rules.

Remotion licensing terms must also be respected.
