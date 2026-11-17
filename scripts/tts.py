import asyncio
import json
import sys
from pathlib import Path

import edge_tts

VOICE = "fa-IR-FaridNeural"
TICKS_PER_SECOND = 10_000_000


async def create_audio(text, audio_path, words_path):
    communicator = edge_tts.Communicate(
        text,
        VOICE,
        boundary="WordBoundary"
    )

    words = []

    with open(audio_path, "wb") as audio:
        async for chunk in communicator.stream():

            if chunk["type"] == "audio":
                audio.write(chunk["data"])

            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / TICKS_PER_SECOND
                duration = chunk["duration"] / TICKS_PER_SECOND

                words.append({
                    "text": chunk["text"],
                    "start": start,
                    "end": start + duration
                })

    if not Path(audio_path).exists() or not words:
        raise RuntimeError(
            "Audio or word timing generation failed."
        )

    with open(words_path, "w", encoding="utf-8") as file:
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

    asyncio.run(
        create_audio(text, audio_path, words_path)
    )
