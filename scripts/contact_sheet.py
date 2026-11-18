import argparse
import json
import subprocess
from fractions import Fraction
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps


TILE_WIDTH = 300
TILE_HEIGHT = 533
LABEL_HEIGHT = 48
SAMPLE_SECONDS = [0, 1, 3, 6, 10, 15, 20]


def probe_video(path):
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
            "-show_entries", "stream=avg_frame_rate,nb_read_frames",
            "-show_entries", "format=duration",
            "-of", "json", str(path)
        ],
        check=True,
        capture_output=True,
        text=True
    )
    data = json.loads(result.stdout)
    stream = data["streams"][0]
    duration = float(data["format"]["duration"])
    fps = float(Fraction(stream["avg_frame_rate"]))
    frame_count = int(stream["nb_read_frames"])
    if fps <= 0 or frame_count < 2:
        raise RuntimeError("Could not determine the rendered video's frame rate and frame count.")
    return fps, frame_count, duration


def extract_frames(video, frame_indices, fps, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = []

    # Seek and scale each still independently. This avoids select/pad filters that
    # are not present in Remotion's intentionally small bundled FFmpeg build.
    for sample_index, frame_index in enumerate(frame_indices):
        output_path = output_dir / ("sample_" + str(sample_index + 1).zfill(2) + ".png")
        timestamp = frame_index / fps
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", "{:.6f}".format(timestamp),
                "-i", str(video),
                "-map", "0:v:0",
                "-vf", "scale=360:640",
                "-frames:v", "1",
                "-update", "1",
                str(output_path)
            ],
            check=True
        )
        paths.append(output_path)

    missing = [str(path) for path in paths if not path.exists() or path.stat().st_size == 0]
    if missing:
        raise RuntimeError("FFmpeg did not extract every requested still frame: " + ", ".join(missing))
    return paths


def make_contact_sheet(paths, labels, output_path):
    columns = 4
    rows = 2
    cell_height = TILE_HEIGHT + LABEL_HEIGHT
    sheet = Image.new("RGB", (columns * TILE_WIDTH, rows * cell_height), "#080d20")
    draw = ImageDraw.Draw(sheet)
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    try:
        font = ImageFont.truetype(font_path, 23)
    except OSError:
        font = ImageFont.load_default()

    for index, (path, label) in enumerate(zip(paths, labels)):
        column = index % columns
        row = index // columns
        x = column * TILE_WIDTH
        y = row * cell_height
        image = Image.open(path).convert("RGB")
        image = ImageOps.fit(image, (TILE_WIDTH, TILE_HEIGHT), method=Image.Resampling.LANCZOS)
        sheet.paste(image, (x, y + LABEL_HEIGHT))
        draw.text((x + 12, y + 10), label, fill="#ffe082", font=font)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, format="PNG", optimize=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    video = Path(args.video)
    output = Path(args.output)
    if not video.exists() or video.stat().st_size == 0:
        raise RuntimeError("The rendered MP4 is missing or empty.")

    fps, frame_count, duration = probe_video(video)
    last_frame = frame_count - 1
    requested = [round(seconds * fps) for seconds in SAMPLE_SECONDS]
    if duration <= SAMPLE_SECONDS[-1] or any(index >= frame_count for index in requested):
        raise RuntimeError("The rendered video is too short for all requested still-frame timestamps.")
    frame_indices = requested + [last_frame]
    if len(set(frame_indices)) != len(frame_indices):
        raise RuntimeError("A requested sample timestamp overlaps the final frame.")

    frame_dir = output.parent / "contact-sheet-frames"
    paths = extract_frames(video, frame_indices, fps, frame_dir)
    first = np.asarray(Image.open(paths[0]).convert("RGB"), dtype=np.int16)
    last = np.asarray(Image.open(paths[-1]).convert("RGB"), dtype=np.int16)
    mean_absolute_error = float(np.abs(first - last).mean())
    changed_pixel_percent = float((np.max(np.abs(first - last), axis=2) > 24).mean() * 100)

    print("Contact-sheet frames: " + ", ".join(str(value) + "s" for value in SAMPLE_SECONDS) + ", last frame.")
    print("First/last frame comparison: MAE={:.3f}, pixels with channel delta >24={:.3f}%.".format(
        mean_absolute_error, changed_pixel_percent
    ))
    if mean_absolute_error > 5.0 or changed_pixel_percent > 2.0:
        raise RuntimeError(
            "The final frame does not visually match the first cover frame closely enough."
        )

    labels = [str(seconds) + "s" for seconds in SAMPLE_SECONDS] + ["Last frame"]
    make_contact_sheet(paths, labels, output)
    print("Created contact sheet: " + str(output))


if __name__ == "__main__":
    main()
