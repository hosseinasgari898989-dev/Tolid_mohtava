import argparse
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

TICKS_PER_SECOND = 10_000_000
MAX_ATTEMPTS = 3
ATTEMPT_TIMEOUT_SECONDS = 180


async def _stream_once(text, audio_path, words_path, voice, rate, pitch):
    audio_path = Path(audio_path)
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    kwargs = {"text": text, "voice": voice, "rate": rate, "pitch": pitch}
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
                words.append({"text": chunk["text"], "start": start, "end": start + duration})

    if not audio_path.exists() or audio_path.stat().st_size == 0:
        raise RuntimeError("Edge TTS did not create an audio file.")
    if words_path is not None:
        if not words:
            raise RuntimeError("Edge TTS returned no WordBoundary events; exact subtitle sync cannot be validated.")
        destination = Path(words_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(words)


async def create_edge_voice(text, audio_path, words_path, voice, rate, pitch):
    """Generate Edge Neural audio with bounded retries and real word boundaries."""
    audio_path = Path(audio_path)
    words_destination = Path(words_path) if words_path is not None else None
    last_error = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            audio_path.unlink(missing_ok=True)
            if words_destination is not None:
                words_destination.unlink(missing_ok=True)
            word_count = await asyncio.wait_for(
                _stream_once(text, audio_path, words_path, voice, rate, pitch),
                timeout=ATTEMPT_TIMEOUT_SECONDS
            )
            if words_path is not None:
                print(f"Generated {word_count} real word timings for {voice}.")
            print(f"Generated voice audio with {voice}.")
            return
        except Exception as error:
            last_error = error
            audio_path.unlink(missing_ok=True)
            if words_destination is not None:
                words_destination.unlink(missing_ok=True)
            print(
                f"Edge TTS attempt {attempt}/{MAX_ATTEMPTS} failed "
                f"({type(error).__name__}).",
                file=sys.stderr
            )
            if attempt < MAX_ATTEMPTS:
                delay = 1.5 * (2 ** (attempt - 1))
                print(f"Retrying TTS in {delay:.1f}s.", file=sys.stderr)
                await asyncio.sleep(delay)
    raise RuntimeError(
        f"Edge TTS failed after {MAX_ATTEMPTS} attempts; last error: {last_error}"
    ) from last_error


async def create_voice(provider, text, audio_path, words_path, voice, rate, pitch):
    """Dispatch through the provider registry; only free Edge TTS is enabled."""
    providers = {"edge": create_edge_voice}
    adapter = providers.get(provider)
    if adapter is None:
        raise ValueError(f"Unsupported tts_provider '{provider}'. Available: {', '.join(providers)}")
    await adapter(text, audio_path, words_path, voice, rate, pitch)


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
            args.provider, args.text.strip(), args.output, None,
            args.voice, args.rate, args.pitch
        ))
        return

    if not args.input or not args.audio or not args.words:
        raise ValueError(
            "Usage: tts.py INPUT AUDIO WORDS [--provider edge] "
            "[--voice fa-IR-DilaraNeural] [--rate +6%] [--pitch +0Hz]"
        )
    text = Path(args.input).read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError("Voiceover is empty.")
    asyncio.run(create_voice(
        args.provider, text, args.audio, args.words,
        args.voice, args.rate, args.pitch
    ))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"TTS failed: {error}", file=sys.stderr)
        raise
