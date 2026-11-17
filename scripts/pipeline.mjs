import fs from "node:fs";
import { execFileSync } from "node:child_process";

const BANK_PATH = "content_bank.json";

function writeOutputs(values) {
  const output = process.env.GITHUB_OUTPUT;

  if (output) {
    const text = Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n") + "\n";

    fs.appendFileSync(output, text);
  }
}

function validateBank(bank) {
  const templates = new Set(["facts", "list", "question"]);
  const visuals = new Set(["neural", "particles", "waves", "geometry"]);

  if (!Array.isArray(bank)) {
    throw new Error("content_bank.json must contain a JSON array.");
  }

  const seenIds = new Set();

  for (const [index, video] of bank.entries()) {
    const label = `content_bank.json item ${index + 1}`;

    if (!video || typeof video !== "object" || Array.isArray(video)) {
      throw new Error(`${label} must be an object.`);
    }

    if (typeof video.id !== "string" || !video.id.trim()) {
      throw new Error(`${label}: required field "id" must be a non-empty string.`);
    }

    if (seenIds.has(video.id)) {
      throw new Error(`content_bank.json has duplicate video id: ${video.id}`);
    }
    seenIds.add(video.id);

    if (!["pending", "done"].includes(video.status)) {
      throw new Error(
        `${label} (${video.id}): status must be "pending" or "done".`
      );
    }

    for (const field of ["title", "voiceover", "caption"]) {
      if (typeof video[field] !== "string" || !video[field].trim()) {
        throw new Error(
          `${label} (${video.id}): required field "${field}" must be a non-empty string.`
        );
      }
    }

    if (!templates.has(video.template)) {
      throw new Error(
        `${label} (${video.id}): template must be one of facts, list, question.`
      );
    }

    if (!Array.isArray(video.scenes) || video.scenes.length === 0) {
      throw new Error(
        `${label} (${video.id}): "scenes" must be a non-empty array.`
      );
    }

    for (const [sceneIndex, scene] of video.scenes.entries()) {
      const sceneLabel = `${label} (${video.id}) scene ${sceneIndex + 1}`;

      if (
        !scene ||
        typeof scene !== "object" ||
        typeof scene.text_on_screen !== "string" ||
        !scene.text_on_screen.trim()
      ) {
        throw new Error(
          `${sceneLabel}: required field "text_on_screen" must be a non-empty string.`
        );
      }

      if (
        scene.visual !== undefined &&
        !visuals.has(scene.visual)
      ) {
        throw new Error(
          `${sceneLabel}: visual must be neural, particles, waves, or geometry.`
        );
      }
    }

    const validHashtags =
      (typeof video.hashtags === "string" && video.hashtags.trim()) ||
      (Array.isArray(video.hashtags) &&
        video.hashtags.length > 0 &&
        video.hashtags.every(tag => typeof tag === "string" && tag.trim()));

    if (!validHashtags) {
      throw new Error(
        `${label} (${video.id}): "hashtags" must be a non-empty string or array of strings.`
      );
    }
  }

  console.log(`Validated ${bank.length} video object(s) in content_bank.json.`);
}

async function main() {
  const bank = JSON.parse(
    fs.readFileSync(BANK_PATH, "utf8")
  );

  // Validate every entry before selecting or processing a video.
  validateBank(bank);

  const video = bank.find(item => item.status === "pending");

  if (!video) {
    console.log("No pending videos found.");
    writeOutputs({ has_video: "false" });
    return;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(video.id)) {
    throw new Error("Video ID must use English letters, numbers, _ or -.");
  }

  fs.mkdirSync("out", { recursive: true });
  fs.mkdirSync("public", { recursive: true });

  // 1. Create Persian voiceover and word timings.
  const voicePath = "out/voiceover.txt";
  const audioPath = "public/audio.mp3";
  const wordsPath = "public/words.json";

  fs.writeFileSync(
    voicePath,
    video.voiceover.trim(),
    "utf8"
  );

  console.log("Creating Persian voiceover...");

  execFileSync(
    "python3",
    [
      "scripts/tts.py",
      voicePath,
      audioPath,
      wordsPath
    ],
    { stdio: "inherit" }
  );

  // 2. Read the real audio duration.
  const audioDuration = Number(
    execFileSync(
      "ffprobe",
      [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        audioPath
      ],
      { encoding: "utf8" }
    ).trim()
  );

  if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
    throw new Error("Could not read audio duration.");
  }

  const finalDuration = audioDuration + 1.5;

  if (finalDuration >= 59) {
    throw new Error(
      "Video must be shorter than 59 seconds. Shorten the voiceover."
    );
  }

  const words = JSON.parse(
    fs.readFileSync(wordsPath, "utf8")
  );

  // 3. Convert bank scenes into Remotion background scenes.
  const scenes = video.scenes.map(scene => ({
    textOnScreen: scene.text_on_screen,
    ...(scene.visual ? { visual: scene.visual } : {})
  }));

  // 4. Write caption with no more than five hashtags.
  const hashtagList = Array.isArray(video.hashtags)
    ? video.hashtags
    : String(video.hashtags || "").split(/\s+/);

  const captionHashtags = hashtagList
    .filter(tag => typeof tag === "string" && tag.trim())
    .slice(0, 5)
    .join(" ");

  const captionText = [
    video.caption.trim(),
    captionHashtags
  ].filter(Boolean).join("\n\n");

  const captionPath = `out/${video.id}-caption.txt`;

  fs.writeFileSync(
    captionPath,
    captionText,
    "utf8"
  );

  // 5. Pass render data and the video ID seed to Remotion.
  const props = {
    videoId: video.id,
    title: video.title,
    template: video.template,
    audioDuration,
    scenes,
    words
  };

  const propsPath = "out/props.json";

  fs.writeFileSync(
    propsPath,
    JSON.stringify(props, null, 2),
    "utf8"
  );

  // 6. Render the final 1080x1920 H.264 video.
  const videoPath = `out/${video.id}.mp4`;

  console.log("Rendering original motion-graphics video...");

  execFileSync(
    "npx",
    [
      "remotion",
      "render",
      "src/index.jsx",
      "Video",
      videoPath,
      `--props=${propsPath}`,
      "--codec=h264",
      "--crf=24",
      "--pixel-format=yuv420p",
      "--concurrency=2"
    ],
    { stdio: "inherit" }
  );

  if (!fs.existsSync(videoPath)) {
    throw new Error("Remotion did not produce an MP4.");
  }

  console.log(`Successfully rendered ${video.id}`);

  writeOutputs({
    has_video: "true",
    video_id: video.id,
    video_path: videoPath,
    caption_path: captionPath
  });
}

main().catch(error => {
  console.error("Pipeline failed:", error.message);
  process.exit(1);
});
