import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

VOICE = "fa-IR-FaridNeural"
TICKS_PER_SECOND = 10_000_000


def get_audio_duration(audio_path):
    """Read the actual media duration using FFprobe."""
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    duration = float(result.stdout.strip())

    if duration <= 0:
        raise ValueError("FFprobe returned a non-positive audio duration.")

    return duration


async def create_audio(text, audio_path, words_path):
    audio_path = Path(audio_path)
    words_path = Path(words_path)

    audio_path.parent.mkdir(parents=True, exist_ok=True)
    words_path.parent.mkdir(parents=True, exist_ok=True)

    communicator = edge_tts.Communicate(
        text,
        VOICE,
        boundary="WordBoundary",
    )

    words = []

    with audio_path.open("wb") as audio:
        async for chunk in communicator.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])

            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / TICKS_PER_SECOND
                duration = chunk["duration"] / TICKS_PER_SECOND

                words.append({
                    "text": chunk["text"],
                    "start": start,
                    "end": start + duration,
                })

    if not audio_path.exists() or audio_path.stat().st_size == 0:
        raise RuntimeError("Edge TTS did not create an audio file.")

    # Some voices / service responses may omit WordBoundary events.
    # Keep the real audio and estimate evenly spaced word timings.
    if not words:
        duration = get_audio_duration(audio_path)
        tokens = text.split()

        if not tokens:
            raise RuntimeError(
                "Cannot create fallback timings from empty voiceover text."
            )

        print(
            "WARNING: Edge TTS returned no WordBoundary events for "
            f"{VOICE}. Using evenly distributed timings over the "
            f"measured audio duration ({duration:.3f} seconds).",
            file=sys.stderr,
        )

        interval = duration / len(tokens)
        words = [
            {
                "text": token,
                "start": index * interval,
                "end": (index + 1) * interval,
            }
            for index, token in enumerate(tokens)
        ]

    with words_path.open("w", encoding="utf-8") as file:
        json.dump(words, file, ensure_ascii=False, indent=2)

    print(f"Generated {len(words)} word timings.")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python tts.py input.txt audio.mp3 words.json")
        sys.exit(1)

    input_path, audio_path, words_path = sys.argv[1:]

    text = Path(input_path).read_text(encoding="utf-8").strip()

    if not text:
        raise ValueError("Voiceover is empty.")

    asyncio.run(create_audio(text, audio_path, words_path))
