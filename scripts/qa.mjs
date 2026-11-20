import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { validateContentBank, validateSubtitleTimings } from "./content_bank.mjs";
import { collectTextFitDiagnostics, isKeyContentAreaSafe, isProductionLayoutSafe, KEY_CONTENT_AREA, KEY_CONTENT_SAFE_AREA, PRODUCTION_VISUAL_AREA, SUBTITLE_AREA } from "../src/kit/layout-utils.js";

const PASS = "PASS";
const FAIL = "FAIL";
const SKIP = "SKIP";
const checks = [];

const cli = {};
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  cli[key] = next && !next.startsWith("--") ? next : "true";
}
const required = name => {
  if (!cli[name] || cli[name] === "true") throw new Error("Missing required --" + name);
  return cli[name];
};
function check(name, ok, details = {}) {
  checks.push({ name, status: ok ? PASS : FAIL, ...details });
}
function skip(name, reason) {
  checks.push({ name, status: SKIP, reason });
}
function run(command, args, { raw = false, timeout = 60000, maxBuffer = 48 * 1024 * 1024 } = {}) {
  const result = spawnSync(command, args, {
    encoding: raw ? null : "utf8",
    timeout,
    maxBuffer,
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = raw ? "binary command" : String(result.stderr || result.stdout).slice(-1800);
    throw new Error(command + " exited with " + result.status + ": " + detail);
  }
  return raw ? result.stdout : String(result.stdout || "") + String(result.stderr || "");
}
function probeVideo(path) {
  return JSON.parse(run("ffprobe", [
    "-v", "error", "-show_streams", "-show_format", "-of", "json", path
  ]));
}
function measureLoudness(path) {
  const output = run("ffmpeg", [
    "-hide_banner", "-nostats", "-i", path,
    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
    "-f", "null", "-"
  ], { timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  const blocks = [...output.matchAll(/\{\s*"input_i".*?\}/gs)];
  if (!blocks.length) throw new Error("FFmpeg loudnorm returned no measurement JSON.");
  const result = JSON.parse(blocks[blocks.length - 1][0]);
  const integratedLufs = Number(result.input_i);
  const truePeakDbtp = Number(result.input_tp);
  if (!Number.isFinite(integratedLufs) || !Number.isFinite(truePeakDbtp)) {
    throw new Error("FFmpeg loudnorm measurements are missing or invalid.");
  }
  return { integratedLufs, truePeakDbtp };
}
function readFrame(path, seconds) {
  return run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-ss", seconds.toFixed(3), "-i", path,
    "-vf", "scale=270:480", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"
  ], { raw: true, timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
}
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function borderMetrics(buf, width = 270, height = 480) {
  const rects = {
    topLeft: [0, 0, 18, 18], topRight: [width - 18, 0, width, 18],
    bottomLeft: [0, height - 18, 18, height], bottomRight: [width - 18, height - 18, width, height],
    top: [0, 0, width, 5], bottom: [0, height - 5, width, height],
    left: [0, 0, 5, height], right: [width - 5, 0, width, height]
  };
  const output = {};
  for (const [name, [x1, y1, x2, y2]] of Object.entries(rects)) {
    let total = 0, black = 0, count = 0;
    for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) {
      const offset = (y * width + x) * 3;
      const r = buf[offset], g = buf[offset + 1], b = buf[offset + 2];
      total += luma(r, g, b);
      if (r <= 3 && g <= 3 && b <= 3) black++;
      count++;
    }
    output[name] = { meanLuma: total / count, pureBlackFraction: black / count };
  }
  return output;
}
function inspectFrames(path, duration) {
  const failures = [];
  let samples = 0;
  for (let seconds = 0; seconds < duration - 0.2; seconds += 1.5) {
    const frame = readFrame(path, seconds);
    if (frame.length !== 270 * 480 * 3) {
      failures.push("Could not decode complete sample at " + seconds.toFixed(1) + "s.");
      continue;
    }
    samples++;
    const metrics = borderMetrics(frame);
    for (const name of ["topLeft", "topRight", "bottomLeft", "bottomRight"]) {
      const item = metrics[name];
      if (item.meanLuma < 3.8 || item.meanLuma > 76 || item.pureBlackFraction > 0.02) {
        failures.push(seconds.toFixed(1) + "s: " + name + " is outside navy brightness range.");
      }
    }
    for (const name of ["top", "bottom", "left", "right"]) {
      const item = metrics[name];
      if (item.meanLuma < 4 || item.meanLuma > 78 || item.pureBlackFraction > 0.01) {
        failures.push(seconds.toFixed(1) + "s: " + name + " edge strip is black or outside navy brightness range.");
      }
    }
  }
  return { samples, failures };
}
function visibleHookRatio(frame) {
  let count = 0;
  const pixels = 270 * 480;
  for (let i = 0; i < frame.length; i += 3) {
    const r = frame[i], g = frame[i + 1], b = frame[i + 2];
    const visibleText = (r > 185 && g > 175 && b > 165) ||
      (r > 185 && g > 135 && g < 245 && b < 185);
    if (visibleText) count++;
  }
  return count / pixels;
}
function countGoldPixels(frame) {
  let count = 0;
  for (let i = 0; i < frame.length; i += 3) {
    const r = frame[i], g = frame[i + 1], b = frame[i + 2];
    if (r > 175 && g > 125 && g < 245 && b < 185) count++;
  }
  return count;
}
function checkOutro(path, totalFrames, fps) {
  const first = Math.max(0, totalFrames - 45 + 2);
  const last = Math.max(first, totalFrames - 45 + 39);
  const filter = "select='between(n," + first + "," + last + ")',crop=900:260:90:930,scale=450:130";
  const raw = run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-i", path, "-vf", filter,
    "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"
  ], { raw: true, timeout: 90000, maxBuffer: 24 * 1024 * 1024 });
  const frameBytes = 450 * 130 * 3;
  const measures = [];
  for (let offset = 0; offset + frameBytes <= raw.length; offset += frameBytes) {
    measures.push(countGoldPixels(raw.subarray(offset, offset + frameBytes)));
  }
  const qualifying = measures.filter(value => value >= 90).length;
  let longest = 0, current = 0;
  for (const value of measures) {
    current = value >= 90 ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  const requiredFrames = Math.ceil(1.2 * fps);
  return { framesSampled: measures.length, qualifyingFrames: qualifying, longestConsecutiveFrames: longest, requiredFrames };
}
function fitIssues(props) {
  const scenes = (props.scenes || []).map(scene => ({
    ...scene,
    textOnScreen: scene.textOnScreen || scene.text_on_screen
  }));
  return collectTextFitDiagnostics(scenes).filter(item => item.requiresBelowMinimum || item.overflow);
}
function checkFitting(props, name) {
  const issues = fitIssues(props);
  const total = collectTextFitDiagnostics((props.scenes || []).map(scene => ({
    ...scene, textOnScreen: scene.textOnScreen || scene.text_on_screen
  }))).length;
  check(name, issues.length === 0, { checkedTextElements: total, issues });
}

function main() {
  const videoPath = required("video");
  const profile = cli.profile || "production";
  const outputPath = cli.output || "out/qa-report.json";
  if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
    throw new Error("Rendered MP4 is missing or empty: " + videoPath);
  }

  const probe = probeVideo(videoPath);
  const video = probe.streams?.find(stream => stream.codec_type === "video");
  const audio = probe.streams?.find(stream => stream.codec_type === "audio");
  const duration = Number(probe.format?.duration);
  const fpsText = video?.avg_frame_rate || "";
  const fps = fpsText.includes("/")
    ? Number(fpsText.split("/")[0]) / Number(fpsText.split("/")[1])
    : Number(fpsText);
  const videoOk = video?.codec_name === "h264" && video?.width === 1080 &&
    video?.height === 1920 && Math.abs(fps - 30) < 0.001 &&
    Number.isFinite(duration) && duration > 0 && duration < 59;
  check("ffprobe: H.264, 1080x1920, 30 fps, duration under 59 seconds", videoOk, {
    codec: video?.codec_name, width: video?.width, height: video?.height, fps, duration
  });

  const frameQuality = inspectFrames(videoPath, duration);
  check("Frames every 1.5 seconds: navy background and non-black edge/corner regions",
    frameQuality.failures.length === 0, frameQuality);

  const firstFrame = readFrame(videoPath, 0);
  const hookRatio = firstFrame.length === 270 * 480 * 3 ? visibleHookRatio(firstFrame) : 0;
  check("First frame contains visible hook/content", hookRatio >= 0.001, { brightAccentPixelRatio: hookRatio });
  check("Key content stays within the 12%-72% vertical safe area", isKeyContentAreaSafe(), { contentArea: KEY_CONTENT_AREA, safeArea: KEY_CONTENT_SAFE_AREA });
  if (profile === "production") check("Production visual content and subtitles occupy separate safe-area regions", isProductionLayoutSafe(), { visualArea: PRODUCTION_VISUAL_AREA, subtitleArea: SUBTITLE_AREA, safeArea: KEY_CONTENT_SAFE_AREA });

  const props = cli.props && fs.existsSync(cli.props)
    ? JSON.parse(fs.readFileSync(cli.props, "utf8"))
    : null;

  if (profile === "production") {
    const loop = cli["contact-report"] && fs.existsSync(cli["contact-report"])
      ? JSON.parse(fs.readFileSync(cli["contact-report"], "utf8"))
      : null;
    const loopOk = Boolean(loop && Number(loop.mean_absolute_error) <= 5 &&
      Number(loop.changed_pixel_percent) <= 2 && loop.loop_check_skipped !== true);
    check("Last frame matches first frame (existing loop MAE test)", loopOk, loop || { error: "Contact-sheet loop report missing." });

    const cta = checkOutro(videoPath, Math.round(duration * fps), fps);
    check("Closing line visible for at least 1.2 seconds near the end",
      cta.longestConsecutiveFrames >= cta.requiredFrames, cta);

    check("An audio stream is present", Boolean(audio), { audioCodec: audio?.codec_name || null });
    let loudness = null, loudnessError = null;
    if (audio) {
      try { loudness = measureLoudness(videoPath); }
      catch (error) { loudnessError = error.message; }
    }
    const loudnessOk = Boolean(loudness && loudness.integratedLufs >= -14.5 &&
      loudness.integratedLufs <= -13.5 && loudness.truePeakDbtp <= -1.5);
    check("Integrated loudness -14 ±0.5 LUFS and true peak <= -1.5 dBTP", loudnessOk, {
      ...(loudness || {}), error: loudnessError
    });

    if (!props) {
      check("Content bank validation", false, { error: "Render props JSON is missing." });
      check("Subtitle timing", false, { error: "Render props JSON is missing." });
      check("Text fitting", false, { error: "Render props JSON is missing." });
    } else {
      if (cli.bank && fs.existsSync(cli.bank)) {
        try {
          const bank = JSON.parse(fs.readFileSync(cli.bank, "utf8"));
          const validation = validateContentBank(bank, cli.bank);
          const hasItem = validation.ids.includes(props.videoId);
          check("Content bank: unique ids, status, topic, layout, required fields, fact source and max five hashtags",
            hasItem, { itemCount: validation.count, renderedId: props.videoId, itemFound: hasItem });
        } catch (error) {
          check("Content bank: unique ids, status, topic, layout, required fields, fact source and max five hashtags",
            false, { error: error.message });
        }
      } else {
        check("Content bank validation", false, { error: "Selected content bank file is missing." });
      }
      const timingErrors = validateSubtitleTimings(props.scenes, Number(props.audioDuration));
      check("Subtitle words are monotonic and do not exceed audio duration",
        timingErrors.length === 0, { errors: timingErrors });
      checkFitting(props, "Text fitting: no overflow or shrink below minimum font sizes");
    }
  } else if (profile === "demo") {
    skip("Closing CTA duration", "The kit-demo is a component showcase, not a story video.");
    skip("First/last loop comparison", "The kit-demo has no story-video loop cover.");
    if (props) checkFitting(props, "Text fitting in Motion Kit demo layouts");
    else check("Text fitting in Motion Kit demo layouts", false, { error: "Demo QA props file is missing." });
    check("An audio stream is present", Boolean(audio), { audioCodec: audio?.codec_name || null });
    let loudness = null, errorText = null;
    if (audio) {
      try { loudness = measureLoudness(videoPath); }
      catch (error) { errorText = error.message; }
    }
    check("Integrated loudness -14 ±0.5 LUFS and true peak <= -1.5 dBTP",
      Boolean(loudness && loudness.integratedLufs >= -14.5 && loudness.integratedLufs <= -13.5 && loudness.truePeakDbtp <= -1.5),
      { ...(loudness || {}), error: errorText });
  } else {
    throw new Error("Unknown QA profile: " + profile);
  }

  const failed = checks.filter(item => item.status === FAIL);
  const report = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    video: videoPath,
    profile,
    result: failed.length ? FAIL : PASS,
    summary: {
      passed: checks.filter(item => item.status === PASS).length,
      failed: failed.length,
      skipped: checks.filter(item => item.status === SKIP).length
    },
    checks
  };
  fs.mkdirSync(outputPath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log("QA summary: " + JSON.stringify(report.summary));
  for (const item of checks) {
    console.log("[" + item.status + "] " + item.name);
    if (item.status === FAIL) console.error(JSON.stringify(item).slice(0, 2200));
  }
  if (failed.length) {
    console.error("QA FAILED: " + failed.length + " quality gate(s) failed. Report: " + outputPath);
    process.exitCode = 1;
  } else {
    console.log("QA PASSED. Report: " + outputPath);
  }
}

try {
  main();
} catch (error) {
  console.error("QA FAILED FAST: " + error.message);
  process.exitCode = 1;
}
