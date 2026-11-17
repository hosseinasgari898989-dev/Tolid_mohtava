const GITHUB_URL =
  "https://api.github.com/repos/hosseinasgari898989-dev/Tolid_mohtava/actions/workflows/daily.yml/dispatches";

const wait = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function dispatchGitHub(env) {
  if (!env.GITHUB_PAT) {
    throw new Error("GITHUB_PAT is missing.");
  }

  const headers = {
    "Authorization": `Bearer ${env.GITHUB_PAT}`,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Zehn-Khan-Video-Factory"
  };

  const body = JSON.stringify({
    ref: "main"
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `GitHub dispatch attempt ${attempt}/3`
      );

      const response = await fetch(GITHUB_URL, {
        method: "POST",
        headers,
        body
      });

      if (response.status === 204) {
        console.log("GitHub workflow dispatched successfully.");
        return true;
      }

      const errorText = await response.text();

      console.error(
        `GitHub returned ${response.status}:`,
        errorText.slice(0, 300)
      );

    } catch (error) {
      console.error(
        `Attempt ${attempt} failed:`,
        error.message
      );
    }

    if (attempt < 3) {
      await wait(attempt * 2000);
    }
  }

  throw new Error(
    "GitHub workflow dispatch failed after 3 attempts."
  );
}

export default {
  // Automatic daily trigger.
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      dispatchGitHub(env).catch(error => {
        console.error("Scheduled dispatch error:", error.message);
      })
    );
  },

  // Protected manual trigger.
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/trigger") {
      return new Response("Not found", {
        status: 404
      });
    }

    if (request.method !== "POST") {
      return new Response("POST required", {
        status: 405,
        headers: {
          "Allow": "POST"
        }
      });
    }

    if (!env.MANUAL_TRIGGER_KEY) {
      return new Response("Manual trigger is not configured.", {
        status: 503
      });
    }

    const suppliedKey =
      request.headers.get("x-trigger-key");

    if (suppliedKey !== env.MANUAL_TRIGGER_KEY) {
      return new Response("Unauthorized", {
        status: 401
      });
    }

    try {
      await dispatchGitHub(env);

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Video workflow dispatched."
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    } catch (error) {
      console.error("Manual dispatch failed:", error.message);

      return new Response(
        JSON.stringify({
          ok: false,
          message: "GitHub dispatch failed."
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};
