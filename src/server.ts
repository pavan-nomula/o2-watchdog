import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

let latestTelemetry: {
  c1Weight: number;
  c2Weight: number;
  c1Valve: "OPEN" | "CLOSED";
  c2Valve: "OPEN" | "CLOSED";
  active: "C1" | "C2" | "NONE";
  lastUpdate: number;
  isRealHardware?: boolean;
} | null = null;

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === "/api/telemetry") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (request.method === "POST") {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          latestTelemetry = {
            c1Weight: Number(body.c1Weight ?? body.c1) || 0,
            c2Weight: Number(body.c2Weight ?? body.c2) || 0,
            c1Valve: body.c1Valve === "OPEN" || body.c1Valve === "ON" ? "OPEN" : "CLOSED",
            c2Valve: body.c2Valve === "OPEN" || body.c2Valve === "ON" ? "OPEN" : "CLOSED",
            active:
              body.active === "C1" || body.active === 1 || body.active === "1"
                ? "C1"
                : body.active === "C2" || body.active === 2 || body.active === "2"
                ? "C2"
                : "NONE",
            lastUpdate: Date.now(),
            isRealHardware: true,
          };
          return new Response(JSON.stringify({ success: true, data: latestTelemetry }), {
            headers: {
              "content-type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }
      }

      return new Response(JSON.stringify(latestTelemetry ?? { isRealHardware: false }), {
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
