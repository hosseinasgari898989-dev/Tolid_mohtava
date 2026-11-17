import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const BANK_PATH = "content_bank.json";
const HISTORY_PATH = "used_clips.json";

const wait = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

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
      if (
        !scene ||
        typeof scene.text_on_screen !== "string" ||
        !scene.text_on_screen.trim()
      ) {
        throw new Error(
          `${label} (${video.id}): scene ${sceneIndex + 1} needs non-empty "text_on_screen".`
        );
      }

      const keywords = scene.stock_keywords;
      const validKeywords =
        (typeof keywords === "string" && keywords.trim()) ||
        (Array.isArray(keywords) &&
          keywords.length > 0 &&
          keywords.every(item => typeof item === "string" && item.trim()));

      if (!validKeywords) {
        throw new Error(
          `${label} (${video.id}): scene ${sceneIndex + 1} needs non-empty "stock_keywords".`
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

function chooseFile(files) {
  const mp4 = (files || []).filter(file => {
    const width = Number(file.width);
    const height = Number(file.height);

    return (
      file.file_type === "video/mp4" &&
      file.link &&
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0 &&
      Math.max(width, height) < 3840
    );
  });

  if (!mp4.length) return null;

  const vertical = mp4.filter(file =>
    Number(file.height) > Number(file.width)
  );

  const goodQuality = vertical.filter(file =>
    Number(file.width) >= 720
  );

  const pool = goodQuality.length
    ? goodQuality
    : vertical.length
      ? vertical
      : mp4;

  // Choose the available non-4K MP4 closest to 1080 pixels wide.
  pool.sort((a, b) =>
    Math.abs(Number(a.width) - 1080) -
    Math.abs(Number(b.width) - 1080)
  );

  return pool[0];
}

async function searchPexels(query, page, key) {
  const params = new URLSearchParams({
    query,
    orientation: "portrait",
    per_page: "40",
    page: String(page)
  });

  const url =
    `https://api.pexels.com/v1/videos/search?${params}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url, {
      headers: {
        Authorization: key
      },
      signal: AbortSignal.timeout(60000)
    });

    if (response.ok) {
      return response.json();
    }

    const message = await response.text();

    if (
      attempt < 3 &&
      (response.status === 429 || response.status >= 500)
    ) {
      await wait(attempt * 2000);
      continue;
    }

    throw new Error(
      `Pexels error ${response.status}: ${message.slice(0, 200)}`
    );
  }

  throw new Error("Pexels search failed.");
}

async function findUnusedVideo(query, usedIds, apiKey) {
  for (let page = 1; page <= 4; page++) {
    const data = await searchPexels(query, page, apiKey);

    for (const video of data.videos || []) {
      const id = String(video.id);

      if (usedIds.has(id)) continue;

      const file = chooseFile(video.video_files);

      if (file) {
        return { video, file };
      }
    }
  }

  throw new Error(
    `No unused, non-4K Pexels clip found for: ${query}`
  );
}

async function downloadClip(file, destination) {
  const response = await fetch(file.link, {
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    throw new Error(
      `Clip download failed: HTTP ${response.status}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 1000) {
    throw new Error("Downloaded clip is too small.");
  }

  fs.writeFileSync(destination, buffer);
}

async function main() {
  const bank = JSON.parse(
    fs.readFileSync(BANK_PATH, "utf8")
  );

  // Validate every entry before selecting or processing a video.
  validateBank(bank);

  const video = bank.find(item =>
    item.status === "pending"
  );

  if (!video) {
    console.log("No pending videos found.");
    writeOutputs({ has_video: "false" });
    return;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(video.id)) {
    throw new Error("Video ID must use English letters, numbers, _ or -.");
  }

  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is missing.");
  }

  fs.mkdirSync("out", { recursive: true });
  fs.mkdirSync("public/clips", { recursive: true });

  let history = { used_ids: [] };

  if (fs.existsSync(HISTORY_PATH)) {
    history = JSON.parse(
      fs.readFileSync(HISTORY_PATH, "utf8")
    );
  }

  const usedIds = new Set(
    (history.used_ids || []).map(String)
  );

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

  // 2. Read the actual audio duration.
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

  if (finalDuration > 59) {
    throw new Error(
      "Video would exceed 59 seconds. Shorten the voiceover."
    );
  }

  const words = JSON.parse(
    fs.readFileSync(wordsPath, "utf8")
  );

  // 3. Download one unique clip for each scene.
  const selectedClips = [];
  const scenes = [];

  let sceneNumber = 0;

  for (const scene of video.scenes) {
    sceneNumber++;

    const keywords = Array.isArray(scene.stock_keywords)
      ? scene.stock_keywords.join(" ")
      : scene.stock_keywords;

    console.log(
      `Finding unused clip for scene ${sceneNumber}...`
    );

    const result = await findUnusedVideo(
      String(keywords),
      usedIds,
      apiKey
    );

    const videoId = String(result.video.id);

    usedIds.add(videoId);

    const filename = `scene_${sceneNumber}.mp4`;
    const destination = path.join("public/clips", filename);

    await downloadClip(result.file, destination);

    selectedClips.push({
      id: videoId,
      creator: result.video.user?.name || "Pexels creator",
      url: result.video.url || "https://www.pexels.com/"
    });

    scenes.push({
      textOnScreen: scene.text_on_screen,
      clipPath: `clips/${filename}`
    });

    await wait(300);
  }

  // 4. Keep the caption separate from the stock-footage credits.
  const hashtagList = Array.isArray(video.hashtags)
    ? video.hashtags
    : String(video.hashtags || "").split(/\s+/);

  const captionHashtags = hashtagList
    .filter(tag => typeof tag === "string" && tag.trim())
    .slice(0, 5)
    .join(" ");

  const captionText = [
    video.caption || "",
    captionHashtags
  ].filter(Boolean).join("\n\n");

  const captionPath = `out/${video.id}-caption.txt`;

  fs.writeFileSync(
    captionPath,
    captionText,
    "utf8"
  );

  const creditLines = selectedClips.map(clip =>
    `- ${clip.creator}: ${clip.url}`
  );

  const creditsText = [
    "Stock footage credits (Pexels):",
    ...creditLines
  ].join("\n");

  const creditsPath = `out/${video.id}-credits.txt`;

  fs.writeFileSync(
    creditsPath,
    creditsText,
    "utf8"
  );

  // 5. Pass render data to Remotion.
  const props = {
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

  // 6. Render the final video.
  const videoPath = `out/${video.id}.mp4`;

  console.log("Rendering 1080x1920 video...");

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

  // Save history only after successful rendering.
  fs.writeFileSync(
    HISTORY_PATH,
    JSON.stringify(
      { used_ids: [...usedIds] },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`Successfully rendered ${video.id}`);

  writeOutputs({
    has_video: "true",
    video_id: video.id,
    video_path: videoPath,
    caption_path: captionPath,
    credits_path: creditsPath
  });
}

main().catch(error => {
  console.error("Pipeline failed:", error.message);
  process.exit(1);
});
