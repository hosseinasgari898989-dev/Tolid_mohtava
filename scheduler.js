const GITHUB_URL =
  "https://api.github.com/repos/hosseinasgari898989-dev/Tolid_mohtava/actions/workflows/daily.yml/dispatches";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 3;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const retryDelay = attempt => 1_000 * (2 ** (attempt - 1));
const isRetryableStatus = status => status === 408 || status === 429 || status >= 500;
const isRetryableError = error =>
  error?.name === "AbortError" ||
  error?.name === "TimeoutError" ||
  error instanceof TypeError;

async function dispatchGitHub(env) {
  if (!env.GITHUB_PAT) {
    throw new Error("GITHUB_PAT secret is missing.");
  }

  const headers = {
    Authorization: `Bearer ${env.GITHUB_PAT}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "Zehn-Khan-Video-Factory"
  };
  const body = JSON.stringify({ ref: "main" });
  let lastFailure = "unknown error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("GitHub request timed out"), REQUEST_TIMEOUT_MS);

    try {
      console.log(`GitHub workflow dispatch attempt ${attempt}/${MAX_ATTEMPTS}.`);
      const response = await fetch(GITHUB_URL, {
        method: "POST",
        headers,
        body,
        signal: controller.signal
      });

      if (response.status === 204) {
        console.log("GitHub accepted the workflow dispatch.");
        return { accepted: true };
      }

      if (response.status === 200) {
        const payload = await response.json();
        const runId = Number(payload?.workflow_run_id);
        console.log("GitHub accepted the workflow dispatch.", runId ? `Run ID: ${runId}` : "");
        return { accepted: true, runId: Number.isSafeInteger(runId) ? runId : undefined };
      }

      if (!isRetryableStatus(response.status)) {
        // Do not log the response body: it may contain account or workflow details.
        throw new Error(
          `GitHub rejected the dispatch (HTTP ${response.status}). Check GITHUB_PAT, Actions write permission, and workflow availability.`
        );
      }

      lastFailure = `GitHub temporary response HTTP ${response.status}`;
      console.error(`${lastFailure} on attempt ${attempt}/${MAX_ATTEMPTS}.`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("GitHub rejected the dispatch")) {
        throw error;
      }
      if (!isRetryableError(error)) {
        throw new Error("GitHub dispatch failed with a non-retryable request error.");
      }
      lastFailure = error?.name === "AbortError" || error?.name === "TimeoutError"
        ? "GitHub request timed out"
        : "GitHub network request failed";
      console.error(`${lastFailure} on attempt ${attempt}/${MAX_ATTEMPTS}.`);
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = retryDelay(attempt);
      console.log(`Retrying GitHub dispatch in ${delay}ms.`);
      await wait(delay);
    }
  }

  throw new Error(
    `GitHub workflow dispatch failed after ${MAX_ATTEMPTS} attempts (${lastFailure}).`
  );
}

export default {
  // Cron Triggers run on UTC time. Configure the cron expression in Cloudflare.
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      dispatchGitHub(env).catch(error => {
        console.error("Scheduled dispatch failed:", error.message);
      })
    );
  },

  // Protected manual trigger; the key is accepted only in a request header.
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/trigger") {
      return new Response("Not found", { status: 404 });
    }
    if (request.method !== "POST") {
      return new Response("POST required", {
        status: 405,
        headers: { Allow: "POST" }
      });
    }
    if (!env.MANUAL_TRIGGER_KEY) {
      return new Response("Manual trigger is not configured.", { status: 503 });
    }

    const suppliedKey = request.headers.get("x-trigger-key");
    if (!suppliedKey || suppliedKey !== env.MANUAL_TRIGGER_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const result = await dispatchGitHub(env);
      return new Response(JSON.stringify({
        ok: true,
        message: "Video workflow dispatch accepted.",
        run_id: result.runId ?? null
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    } catch (error) {
      console.error("Manual dispatch failed:", error.message);
      return new Response(JSON.stringify({
        ok: false,
        message: error.message
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
  }
};
