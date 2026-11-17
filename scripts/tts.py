import argparse
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

TICKS_PER_SECOND = 10_000_000


async def create_edge_voice(text, audio_path, words_path, voice, rate, pitch):
    """Generate Edge Neural audio and, when requested, its real word timings."""
    audio_path = Path(audio_path)
    audio_path.parent.mkdir(parents=True, exist_ok=True)

    kwargs = {
        "text": text,
        "voice": voice,
        "rate": rate,
        "pitch": pitch,
    }
    if words_path is not None:
        kwargs["boundary"] = "WordBoundary"

    communicator = edge_tts.Communicate(**kwargs)
    words = []

    with audio_path.open("wb") as audio:
        async for chunk in communicator.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif words_path is not None and chunk["type"] == "WordBoundary":
                start = chunk["offset"] / TICKS_PER_SECOND
                duration = chunk["duration"] / TICKS_PER_SECOND
                words.append({
                    "text": chunk["text"],
                    "start": start,
                    "end": start + duration,
                })

    if not audio_path.exists() or audio_path.stat().st_size == 0:
        raise RuntimeError("Edge TTS did not create an audio file.")

    if words_path is not None:
        if not words:
            raise RuntimeError(
                "Edge TTS returned no WordBoundary events. "
                "Exact scene/subtitle sync cannot be validated."
            )
        words_path = Path(words_path)
        words_path.parent.mkdir(parents=True, exist_ok=True)
        words_path.write_text(
            json.dumps(words, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Generated {len(words)} real word timings for {voice}.")

    print(f"Generated voice audio with {voice}.")


async def create_voice(provider, text, audio_path, words_path, voice, rate, pitch):
    """Provider boundary for future TTS backends; only free Edge TTS is enabled."""
    if provider == "edge":
        await create_edge_voice(
            text, audio_path, words_path, voice, rate, pitch
        )
        return

    # Future providers may read their own credential from os.environ here.
    # No credential or external provider is used by this version.
    raise ValueError(
        f"Unsupported tts_provider '{provider}'. This version supports only 'edge'."
    )


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", nargs="?")
    parser.add_argument("audio", nargs="?")
    parser.add_argument("words", nargs="?")
    parser.add_argument("--provider", default="edge")
    parser.add_argument("--voice", default="fa-IR-DilaraNeural")
    parser.add_argument("--rate", default="+6%")
    parser.add_argument("--pitch", default="+0Hz")
    parser.add_argument("--sample", action="store_true")
    parser.add_argument("--text", default="")
    parser.add_argument("--output", default="")
    return parser.parse_args()


def main():
    args = parse_args()

    if args.sample:
        if not args.text.strip() or not args.output:
            raise ValueError("--sample requires non-empty --text and --output.")
        asyncio.run(create_voice(
            args.provider,
            args.text.strip(),
            args.output,
            None,
            args.voice,
            args.rate,
            args.pitch,
        ))
        return

    if not args.input or not args.audio or not args.words:
        raise ValueError(
            "Usage: tts.py INPUT AUDIO WORDS "
            "[--provider edge] [--voice fa-IR-DilaraNeural] "
            "[--rate +6%] [--pitch +0Hz]"
        )

    text = Path(args.input).read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError("Voiceover is empty.")

    asyncio.run(create_voice(
        args.provider,
        text,
        args.audio,
        args.words,
        args.voice,
        args.rate,
        args.pitch,
    ))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"TTS failed: {error}", file=sys.stderr)
        raise
