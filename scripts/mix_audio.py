import argparse
import hashlib
import json
import math
import os
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

SAMPLE_RATE = 44100


def write_wav(path, samples):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    clipped = np.clip(samples, -1.0, 1.0)
    pcm = (clipped * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def stable_index(video_id, count, salt=""):
    digest = hashlib.sha256(f"{video_id}:{salt}".encode("utf-8")).hexdigest()
    return int(digest[:12], 16) % count


def make_ambient(path, duration, seed_text):
    count = int(math.ceil(duration * SAMPLE_RATE))
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    seed = int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)

    slow = 0.72 + 0.18 * np.sin(2 * np.pi * 0.055 * t)
    pad = (
        0.13 * np.sin(2 * np.pi * 110.0 * t) +
        0.09 * np.sin(2 * np.pi * 164.81 * t + 0.4) +
        0.06 * np.sin(2 * np.pi * 220.0 * t + 1.1) +
        0.025 * np.sin(2 * np.pi * 329.63 * t + np.sin(2 * np.pi * 0.08 * t))
    )
    # A very quiet filtered-feeling noise bed adds air without a sampled asset.
    noise = rng.normal(0.0, 0.004, count)
    noise[1:] = 0.65 * noise[1:] + 0.35 * noise[:-1]
    write_wav(path, 0.24 * slow * pad + noise)


def make_procedural_sfx(path, duration, events, seed_text):
    count = int(math.ceil(duration * SAMPLE_RATE))
    track = np.zeros(count, dtype=np.float64)
    rng = np.random.default_rng(
        int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:8], 16)
    )

    for event in events:
        start = max(0.0, float(event["time"]))
        kind = event["kind"]
        length = 0.52 if kind == "whoosh" else 0.18
        offset = int(start * SAMPLE_RATE)
        size = min(int(length * SAMPLE_RATE), count - offset)
        if size <= 0:
            continue

        t = np.arange(size, dtype=np.float64) / SAMPLE_RATE
        if kind == "whoosh":
            envelope = np.sin(np.pi * np.clip(t / length, 0.0, 1.0)) ** 2
            frequency = 180.0 + 1150.0 * np.clip(t / length, 0.0, 1.0)
            phase = 2 * np.pi * np.cumsum(frequency) / SAMPLE_RATE
            noise = rng.normal(0.0, 0.22, size)
            noise[1:] = 0.72 * noise[1:] + 0.28 * noise[:-1]
            sound = 0.11 * envelope * (np.sin(phase) + noise)
        else:
            envelope = np.exp(-t * 24.0)
            frequency = 1050.0 - 580.0 * np.clip(t / length, 0.0, 1.0)
            phase = 2 * np.pi * np.cumsum(frequency) / SAMPLE_RATE
            sound = 0.14 * envelope * np.sin(phase)
        track[offset:offset + size] += sound

    write_wav(path, track)


def build_events(scenes, duration):
    events = []
    for index, scene in enumerate(scenes):
        start = min(max(0.0, float(scene["startSeconds"])), max(0.0, duration - 0.1))
        if index > 0:
            events.append({"time": start, "kind": "whoosh"})
        if scene.get("highlight"):
            events.append({"time": min(duration - 0.05, start + 0.12), "kind": "pop"})
    return events


def loudnorm_report(stderr):
    matches = re.findall(r'\{\s*"input_i".*?\}', stderr, flags=re.DOTALL)
    if not matches:
        raise RuntimeError("FFmpeg loudnorm did not return its measurement JSON.")
    try:
        return json.loads(matches[-1])
    except json.JSONDecodeError as error:
        raise RuntimeError("Could not parse FFmpeg loudnorm measurement JSON.") from error


def finite_measurement(report, key):
    try:
        value = float(report[key])
    except (KeyError, TypeError, ValueError) as error:
        raise RuntimeError(f"FFmpeg loudnorm measurement '{key}' is missing or invalid.") from error
    if not math.isfinite(value):
        raise RuntimeError(f"FFmpeg loudnorm measurement '{key}' is not finite.")
    return value


def normalize_two_pass(input_path, output_path):
    target_i = -14.0
    target_tp = -1.5
    target_lra = 11.0

    print("Loudness normalization pass 1/2: measuring the final mix...")
    analysis = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-nostats", "-i", str(input_path),
            "-af", f"loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}:print_format=json",
            "-f", "null", "-"
        ],
        check=True,
        capture_output=True,
        text=True
    )
    measured = loudnorm_report(analysis.stderr)
    measured_i = finite_measurement(measured, "input_i")
    measured_tp = finite_measurement(measured, "input_tp")
    measured_lra = finite_measurement(measured, "input_lra")
    measured_thresh = finite_measurement(measured, "input_thresh")
    offset = finite_measurement(measured, "target_offset")

    second_pass_filter = (
        f"loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}:"
        f"measured_I={measured_i:.6f}:measured_TP={measured_tp:.6f}:"
        f"measured_LRA={measured_lra:.6f}:measured_thresh={measured_thresh:.6f}:"
        f"offset={offset:.6f}:linear=true:print_format=json"
    )

    print("Loudness normalization pass 2/2: applying measured -14 LUFS / -1.5 dBTP targets...")
    normalized = subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-nostats", "-i", str(input_path),
            "-af", second_pass_filter,
            "-ar", str(SAMPLE_RATE), "-c:a", "libmp3lame", "-b:a", "192k",
            str(output_path)
        ],
        check=True,
        capture_output=True,
        text=True
    )
    final_report = loudnorm_report(normalized.stderr)
    output_i = finite_measurement(final_report, "output_i")
    output_tp = finite_measurement(final_report, "output_tp")

    if abs(output_i - target_i) > 0.6:
        raise RuntimeError(
            f"Final loudness is {output_i:.2f} LUFS; expected approximately {target_i:.1f} LUFS."
        )
    if output_tp > target_tp + 0.15:
        raise RuntimeError(
            f"Final true peak is {output_tp:.2f} dBTP; it exceeds the {target_tp:.1f} dBTP target."
        )

    print(f"Verified final loudness: {output_i:.2f} LUFS, true peak {output_tp:.2f} dBTP.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--duration", required=True, type=float)
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--scenes", required=True)
    args = parser.parse_args()

    duration = args.duration
    if duration <= 2.1:
        raise ValueError("Mixed audio duration must be greater than 2.1 seconds.")

    scene_data = json.loads(Path(args.scenes).read_text(encoding="utf-8"))
    events = build_events(scene_data, duration)

    music_files = sorted(Path("assets/music").glob("*.mp3")) if Path("assets/music").exists() else []
    sfx_files = sorted(Path("assets/sfx").glob("*.mp3")) if Path("assets/sfx").exists() else []

    command = ["ffmpeg", "-y", "-i", args.voice]
    if music_files:
        music = music_files[stable_index(args.video_id, len(music_files), "music")]
        command += ["-stream_loop", "-1", "-i", str(music)]
        music_label = "1:a"
        print(f"Using music asset: {music.name}")
    else:
        ambient_path = "out/procedural-ambient.wav"
        make_ambient(ambient_path, duration, args.video_id)
        command += ["-i", ambient_path]
        music_label = "1:a"
        print("No assets/music MP3 found; using the procedural ambient pad.")

    bundled_fallback = os.environ.get("REMOTION_FFMPEG_FALLBACK") == "1"
    if bundled_fallback:
        # Remotion's lean FFmpeg build intentionally omits afade and sidechaincompress.
        # Keep the music bed quiet and use only filters confirmed by the CI preflight.
        filters = [
            f"[0:a]apad=pad_dur=1.5,atrim=duration={duration:.3f},asetpts=PTS-STARTPTS[voice_mix]",
            f"[{music_label}]atrim=duration={duration:.3f},asetpts=PTS-STARTPTS,"
            "volume=0.08[music]",
            "[voice_mix][music]amix=inputs=2:duration=first:dropout_transition=0[mix0]",
        ]
    else:
        filters = [
            f"[0:a]apad=pad_dur=1.5,atrim=duration={duration:.3f},asetpts=PTS-STARTPTS,"
            "asplit=2[voice_sc][voice_mix]",
            f"[{music_label}]atrim=duration={duration:.3f},asetpts=PTS-STARTPTS,"
            f"afade=t=in:st=0:d=1,afade=t=out:st={duration - 2.0:.3f}:d=2,"
            "volume=0.12[music]",
            "[music][voice_sc]sidechaincompress=threshold=0.02:ratio=5:attack=20:release=420[ducked]",
            "[voice_mix][ducked]amix=inputs=2:duration=first:dropout_transition=0[mix0]",
        ]

    sfx_labels = []
    if sfx_files:
        for index, event in enumerate(events):
            kind = event["kind"]
            candidates = [path for path in sfx_files if kind in path.stem.lower()]
            if not candidates:
                candidates = sfx_files
            selected = candidates[stable_index(args.video_id, len(candidates), kind + str(index))]
            input_index = 2 + index
            command += ["-i", str(selected)]
            delay_ms = int(max(0.0, event["time"]) * 1000)
            label = f"sfx{index}"
            filters.append(
                f"[{input_index}:a]atrim=duration=0.65,asetpts=PTS-STARTPTS,"
                f"volume=0.14,adelay={delay_ms}:all=1[{label}]"
            )
            sfx_labels.append(f"[{label}]")
        print(f"Using {len(sfx_labels)} transition/highlight SFX asset(s).")
    else:
        sfx_path = "out/procedural-sfx.wav"
        make_procedural_sfx(sfx_path, duration, events, args.video_id)
        command += ["-i", sfx_path]
        filters.append("[2:a]volume=0.22[sfx0]")
        sfx_labels.append("[sfx0]")
        print("No assets/sfx MP3 found; using procedural whoosh/pop sounds.")

    mix_inputs = "[mix0]" + "".join(sfx_labels)
    filters.append(
        f"{mix_inputs}amix=inputs={1 + len(sfx_labels)}:duration=first:"
        "dropout_transition=0[out]"
    )

    premaster_path = Path("out/final-mix-premaster.wav")
    command += [
        "-filter_complex", ";".join(filters),
        "-map", "[out]",
        "-t", f"{duration:.3f}",
        "-ar", str(SAMPLE_RATE),
        "-c:a", "pcm_s16le",
        str(premaster_path),
    ]
    subprocess.run(command, check=True)
    if not premaster_path.exists() or premaster_path.stat().st_size == 0:
        raise RuntimeError("FFmpeg did not create the final premaster mix.")

    output_path = Path(args.output)
    normalize_two_pass(premaster_path, output_path)
    if not output_path.exists() or output_path.stat().st_size == 0:
        raise RuntimeError("FFmpeg did not create the normalized final audio track.")
    print(f"Mixed and two-pass loudness-normalized audio: {output_path}")


if __name__ == "__main__":
    main()
