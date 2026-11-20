import argparse
import math
import wave
from pathlib import Path

import numpy as np

SAMPLE_RATE = 44100

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--duration", type=float, required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    if args.duration <= 0 or args.duration >= 59:
        raise ValueError("Demo audio duration must be between 0 and 59 seconds.")
    count = int(args.duration * SAMPLE_RATE)
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    fade_in = np.clip(t / 0.8, 0, 1)
    fade_out = np.clip((args.duration - t) / 1.0, 0, 1)
    envelope = fade_in * fade_out * (0.72 + 0.12 * np.sin(2 * math.pi * 0.08 * t))
    signal = (
        0.42 * np.sin(2 * math.pi * 110.0 * t) +
        0.27 * np.sin(2 * math.pi * 164.81 * t + 0.35) +
        0.18 * np.sin(2 * math.pi * 220.0 * t + 0.8) +
        0.08 * np.sin(2 * math.pi * 329.63 * t + 1.3)
    )
    samples = np.clip(signal * envelope * 0.20, -0.9, 0.9)
    pcm = (samples * 32767).astype("<i2")
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(pcm.tobytes())
    print("Generated deterministic demo audio bed: " + str(output))

if __name__ == "__main__":
    main()
