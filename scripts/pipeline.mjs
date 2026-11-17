import fs from "node:fs";
import { execFileSync } from "node:child_process";

const BANK_PATH = "content_bank.json";
const FIRST_VIDEO_ID = "brain-tired-001";
const FPS = 30;
const ICONS = new Set([
  "brain", "low-battery", "clock", "lightbulb",
  "checklist", "question", "heart", "eye"
]);
const VISUALS = new Set(["neural", "particles", "waves", "geometry"]);
const TRANSITIONS = new Set(["zoom", "slide", "glitch"]);

function writeOutputs(values) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  fs.appendFileSync(
    output,
    Object.entries(values).map(([key, value]) => `${key}=${value}`).join("\n") + "\n"
  );
}

function normalizedTokens(text) {
  return String(text)
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .match(/[\p{L}\p{N}]+/gu) || [];
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
      throw new Error(`${label}: id must be a non-empty string.`);
    }
    if (seenIds.has(video.id)) {
      throw new Error(`Duplicate video id: ${video.id}`);
    }
    seenIds.add(video.id);

    if (!["pending", "done"].includes(video.status)) {
      throw new Error(`${label} (${video.id}): status must be pending or done.`);
    }
    for (const field of ["title", "voiceover", "caption"]) {
      if (typeof video[field] !== "string" || !video[field].trim()) {
        throw new Error(`${label} (${video.id}): ${field} must be non-empty.`);
      }
    }
    if (!templates.has(video.template)) {
      throw new Error(`${label} (${video.id}): invalid template.`);
    }

    const ttsProvider = video.tts_provider ?? "edge";
    const voice = video.voice ?? "fa-IR-DilaraNeural";
    const rate = video.rate ?? "+6%";
    const pitch = video.pitch ?? "+0Hz";
    if (ttsProvider !== "edge") {
      throw new Error(`${label} (${video.id}): only tts_provider=edge is implemented.`);
    }
    if (typeof voice !== "string" || !/^fa-IR-[A-Za-z]+Neural$/.test(voice)) {
      throw new Error(`${label} (${video.id}): voice must be a Persian Edge Neural voice.`);
    }
    if (typeof rate !== "string" || !/^[+-]\d+%$/.test(rate)) {
      throw new Error(`${label} (${video.id}): rate must use a value such as +6%.`);
    }
    if (typeof pitch !== "string" || !/^[+-]\d+Hz$/.test(pitch)) {
      throw new Error(`${label} (${video.id}): pitch must use a value such as +0Hz.`);
    }

    if (!Array.isArray(video.scenes) || video.scenes.length === 0) {
      throw new Error(`${label} (${video.id}): scenes must be a non-empty array.`);
    }

    let previousVisual = null;
    const narrationTokens = [];
    for (const [sceneIndex, scene] of video.scenes.entries()) {
      const sceneLabel = `${label} (${video.id}) scene ${sceneIndex + 1}`;
      if (!scene || typeof scene !== "object" ||
          typeof scene.text_on_screen !== "string" || !scene.text_on_screen.trim()) {
        throw new Error(`${sceneLabel}: text_on_screen must be non-empty.`);
      }
      if (typeof scene.narration !== "string" || !scene.narration.trim()) {
        throw new Error(`${sceneLabel}: narration must be non-empty.`);
      }

      const screenWords = scene.text_on_screen.trim().split(/\s+/u);
      if (screenWords.length < 2 || screenWords.length > 4) {
        throw new Error(`${sceneLabel}: headline must contain 2–4 words; received ${screenWords.length}.`);
      }

      if (scene.highlight !== undefined) {
        if (typeof scene.highlight !== "string" ||
            !normalizedTokens(scene.text_on_screen).includes(normalizedTokens(scene.highlight)[0])) {
          throw new Error(`${sceneLabel}: highlight must be a word contained in text_on_screen.`);
        }
      }
      if (scene.visual !== undefined && !VISUALS.has(scene.visual)) {
        throw new Error(`${sceneLabel}: invalid visual style.`);
      }
      if (scene.visual && previousVisual === scene.visual) {
        throw new Error(`${sceneLabel}: background style must change every scene.`);
      }
      if (scene.visual) previousVisual = scene.visual;

      if (scene.icon !== undefined && !ICONS.has(scene.icon)) {
        throw new Error(`${sceneLabel}: unsupported icon.`);
      }
      if (scene.transition !== undefined && !TRANSITIONS.has(scene.transition)) {
        throw new Error(`${sceneLabel}: transition must be zoom, slide, or glitch.`);
      }
      narrationTokens.push(...normalizedTokens(scene.narration));
    }

    const voiceTokens = normalizedTokens(video.voiceover);
    if (narrationTokens.length !== voiceTokens.length ||
        narrationTokens.some((token, i) => token !== voiceTokens[i])) {
      throw new Error(
        `${label} (${video.id}): scene narration must cover the voiceover exactly, in order, with no missing or extra words.`
      );
    }

    const validHashtags =
      (typeof video.hashtags === "string" && video.hashtags.trim()) ||
      (Array.isArray(video.hashtags) && video.hashtags.length > 0 &&
        video.hashtags.every(tag => typeof tag === "string" && tag.trim()));
    if (!validHashtags) {
      throw new Error(`${label} (${video.id}): hashtags must be a non-empty string or array.`);
    }
  }

  console.log(`Validated ${bank.length} videos, 2–4-word headlines, narration coverage, highlights, icons, transitions and TTS configuration.`);
}

function mapSceneTimings(scenes, words) {
  const timingTokens = words.flatMap((word, eventIndex) =>
    normalizedTokens(word.text).map(token => ({
      token,
      start: Number(word.start),
      end: Number(word.end),
      eventIndex
    }))
  );

  let cursor = 0;
  const matched = scenes.map((scene, sceneIndex) => {
    const expected = normalizedTokens(scene.narration);
    let found = -1;

    for (let start = cursor; start <= timingTokens.length - expected.length; start++) {
      if (expected.every((token, offset) => timingTokens[start + offset].token === token)) {
        found = start;
        break;
      }
    }
    if (found < 0) {
      throw new Error(
        `Real Edge TTS word timings do not contain scene ${sceneIndex + 1} narration in order. Refusing to estimate sync.`
      );
    }

    const first = timingTokens[found];
    const last = timingTokens[found + expected.length - 1];
    if (!Number.isFinite(first.start) || !Number.isFinite(last.end) || last.end <= first.start) {
      throw new Error(`Invalid real word timings in scene ${sceneIndex + 1}.`);
    }
    cursor = found + expected.length;
    return { first, last };
  });

  return scenes.map((scene, index) => {
    const startSeconds = matched[index].first.start;
    const spokenEndSeconds = matched[index].last.end;
    const endSeconds = index + 1 < matched.length
      ? matched[index + 1].first.start
      : spokenEndSeconds;
    if (endSeconds <= startSeconds) {
      throw new Error(`Scene ${index + 1} has a non-positive duration.`);
    }
    const displayTokens = [...scene.narration.matchAll(/[\p{L}\p{N}]+/gu)];
    if (displayTokens.length !== expected.length) {
      throw new Error(`Scene ${sceneIndex + 1} subtitle token alignment is inconsistent.`);
    }
    const subtitleWords = displayTokens.map((match, offset) => ({
      text: match[0],
      startSeconds: timingTokens[found + offset].start,
      endSeconds: timingTokens[found + offset].end
    }));
    return {
      textOnScreen: scene.text_on_screen,
      subtitleWords,
      narration: scene.narration,
      highlight: scene.highlight || "",
      visual: scene.visual || ["neural", "particles", "waves", "geometry"][index % 4],
      icon: scene.icon || "",
      transition: scene.transition || "zoom",
      startSeconds,
      endSeconds,
      spokenEndSeconds,
      startFrame: Math.max(0, Math.round(startSeconds * FPS)),
      endFrame: Math.max(1, Math.round(endSeconds * FPS))
    };
  });
}

function runTts(args) {
  execFileSync("python3", ["scripts/tts.py", ...args], { stdio: "inherit" });
}

async function main() {
  const bank = JSON.parse(fs.readFileSync(BANK_PATH, "utf8"));
  validateBank(bank);

  const requestedId = (process.env.VIDEO_ID || "").trim();
  const video = requestedId
    ? bank.find(item => item.id === requestedId)
    : bank.find(item => item.status === "pending");

  if (!video) {
    if (requestedId) throw new Error(`Requested video id not found: ${requestedId}`);
    console.log("No pending videos found.");
    writeOutputs({ has_video: "false", has_voice_samples: "false" });
    return;
  }

  const ttsConfig = {
    provider: video.tts_provider ?? "edge",
    voice: video.voice ?? "fa-IR-DilaraNeural",
    rate: video.rate ?? "+6%",
    pitch: video.pitch ?? "+0Hz"
  };

  if (!/^[a-zA-Z0-9_-]+$/.test(video.id)) {
    throw new Error("Video ID must use English letters, numbers, _ or -.");
  }

  fs.mkdirSync("out", { recursive: true });
  fs.mkdirSync("public", { recursive: true });

  const voicePath = "out/voiceover.txt";
  const rawVoicePath = "public/voice-raw.mp3";
  const wordsPath = "public/words.json";
  const audioPath = "public/audio.mp3";

  fs.writeFileSync(voicePath, video.voiceover.trim(), "utf8");
  console.log(`Creating ${video.voice} voiceover (${video.rate}, ${video.pitch})...`);

  runTts([
    voicePath, rawVoicePath, wordsPath,
    "--provider", ttsConfig.provider,
    "--voice", ttsConfig.voice,
    "--rate", ttsConfig.rate,
    "--pitch", ttsConfig.pitch
  ]);

  const audioDuration = Number(execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration",
     "-of", "default=noprint_wrappers=1:nokey=1", rawVoicePath],
    { encoding: "utf8" }
  ).trim());

  if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
    throw new Error("Could not read the generated voice duration.");
  }

  const finalDuration = audioDuration + 1.5;
  if (finalDuration >= 59) {
    throw new Error("Video must be shorter than 59 seconds. Shorten the voiceover.");
  }

  const words = JSON.parse(fs.readFileSync(wordsPath, "utf8"));
  const scenes = mapSceneTimings(video.scenes, words);

  fs.writeFileSync(
    "out/audio-scenes.json",
    JSON.stringify(scenes.map(scene => ({
      startSeconds: scene.startSeconds,
      transition: scene.transition,
      highlight: scene.highlight
    })), null, 2) + "\n",
    "utf8"
  );

  console.log("Mixing narration, ducked music and scene sound effects...");
  execFileSync("python3", [
    "scripts/mix_audio.py",
    "--voice", rawVoicePath,
    "--output", audioPath,
    "--duration", String(finalDuration),
    "--video-id", video.id,
    "--scenes", "out/audio-scenes.json"
  ], { stdio: "inherit" });

  const hashtagList = Array.isArray(video.hashtags)
    ? video.hashtags
    : String(video.hashtags || "").split(/\s+/);
  const captionHashtags = hashtagList
    .filter(tag => typeof tag === "string" && tag.trim())
    .slice(0, 5)
    .join(" ");
  const captionText = [video.caption.trim(), captionHashtags].filter(Boolean).join("\n\n");
  const captionPath = `out/${video.id}-caption.txt`;
  fs.writeFileSync(captionPath, captionText, "utf8");

  const props = {
    videoId: video.id,
    title: video.title,
    template: video.template,
    audioDuration,
    scenes,
    words
  };
  const propsPath = "out/props.json";
  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2), "utf8");

  const videoPath = `out/${video.id}.mp4`;
  console.log("Rendering the V3 polished motion-graphics video (10-minute render guard)...");
  execFileSync("npx", [
    "remotion", "render", "src/index.jsx", "Video", videoPath,
    `--props=${propsPath}`,
    "--codec=h264", "--crf=23", "--pixel-format=yuv420p",
    "--concurrency=2"
  ], { stdio: "inherit", timeout: 10 * 60 * 1000 });

  if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
    throw new Error("Remotion did not produce a non-empty MP4.");
  }

  const renderedDuration = Number(execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration",
     "-of", "default=noprint_wrappers=1:nokey=1", videoPath],
    { encoding: "utf8" }
  ).trim());
  if (!Number.isFinite(renderedDuration) || renderedDuration < audioDuration) {
    throw new Error("Rendered video duration is shorter than its narration.");
  }

  console.log(`Successfully rendered V3 ${video.id} (${renderedDuration.toFixed(2)}s).`);

  const contactSheetPath = "out/" + video.id + "-contact-sheet.png";
  console.log("Extracting requested sample frames and verifying the loop cover match...");
  execFileSync("python3", [
    "scripts/contact_sheet.py",
    "--video", videoPath,
    "--output", contactSheetPath
  ], { stdio: "inherit" });

  const outputs = {
    has_video: "true",
    video_id: video.id,
    video_path: videoPath,
    caption_path: captionPath,
    contact_sheet_path: contactSheetPath,
    has_voice_samples: "false"
  };

  if (video.id === FIRST_VIDEO_ID) {
    const firstSentence = video.voiceover.match(/^.*?[.!؟](?:\s|$)/u)?.[0]?.trim();
    if (!firstSentence) {
      throw new Error("Could not isolate the first sentence for voice comparison.");
    }
    console.log("Creating Farid and Dilara comparison samples from the first sentence...");
    const faridPath = "out/voice-test-farid.mp3";
    const dilaraPath = "out/voice-test-dilara.mp3";
    for (const [voice, output] of [
      ["fa-IR-FaridNeural", faridPath],
      ["fa-IR-DilaraNeural", dilaraPath]
    ]) {
      runTts([
        "--sample", "--text", firstSentence, "--output", output,
        "--provider", "edge", "--voice", voice,
        "--rate", ttsConfig.rate, "--pitch", ttsConfig.pitch
      ]);
    }
    outputs.has_voice_samples = "true";
    outputs.voice_sample_farid_path = faridPath;
    outputs.voice_sample_dilara_path = dilaraPath;
  }

  writeOutputs(outputs);
}

main().catch(error => {
  console.error("Pipeline failed:", error.message);
  process.exit(1);
});
