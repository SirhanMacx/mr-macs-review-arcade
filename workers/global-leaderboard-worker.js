/* Mr. Mac's Review Arcade · Global Leaderboard Worker

   Cloudflare Worker contract:
     GET  /scores?gameId=snake-pit&limit=10
     POST /scores
       { gameId, score, displayName, clientId, meta, submittedAt }
     DELETE /scores?gameId=snake-pit&entryId=...
       Requires header: x-arcade-admin-token: <ADMIN_TOKEN>

   Bindings:
     ARCADE_LEADERBOARD  KV namespace
     ADMIN_TOKEN         secret, optional but required for DELETE
*/

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,x-arcade-admin-token",
  "access-control-max-age": "86400"
};

const PER_GAME_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const BLOCKED_STEMS = [
  "fuck","fck","fuk","shit","sht","piss","cunt","cnt","dick","cock","cok",
  "pussy","pusy","penis","vagina","boob","tit","tts","anal","anus","ass",
  "arse","sex","porn","prn","cum","jizz","slut","whore","hoe","bitch",
  "btch","bastrd","bastard","blowjob","handjob","jerk","wank","masturb",
  "nigg","ngr","fag","fgt","retard","retrd","rtrd","spic","chink","kike",
  "wetback","trann","tranny","gook","jap","beaner","cracker","honky",
  "dyke","queer","homo","kill","hitler","heil","nazi","isis","kkk",
  "lynch","rape","rpe","jihad","azz","azs","biotch","b1tch","b!tch"
];

const LEET_MAP = { "0":"o","1":"i","!":"i","|":"i","3":"e","4":"a","@":"a","5":"s","$":"s","7":"t","+":"t","8":"b","9":"g" };

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function normalizeForFilter(value) {
  const input = String(value ?? "").toLowerCase();
  let out = "";
  for (const ch of input) {
    if (LEET_MAP[ch]) out += LEET_MAP[ch];
    else if (ch >= "a" && ch <= "z") out += ch;
  }
  return out;
}

function hasPiiShape(value) {
  const s = String(value ?? "").trim();
  return /@/.test(s) ||
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(s) ||
    /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(s) ||
    /\b(?:19|20)\d{2}\b/.test(s) ||
    /\b(?:snap|tiktok|insta|discord|gmail|email|phone|address)\b/i.test(s);
}

function isBlockedName(value) {
  const norm = normalizeForFilter(value);
  if (!norm) return false;
  return BLOCKED_STEMS.some(stem => norm.includes(stem)) || hasPiiShape(value);
}

function safeGameId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeHandle(value) {
  if (isBlockedName(value)) return "PLAYER-000";
  const raw = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14);
  if (raw.length < 3 || !/\d/.test(raw) || isBlockedName(raw)) return "PLAYER-000";
  return raw;
}

function safeClientId(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 48) || "unknown";
}

function safeMeta(meta) {
  const allowed = new Set(["course","mode","accuracy","durationMs","rounds","wave","level","source","date","gameType"]);
  const out = {};
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return out;
  for (const [key, value] of Object.entries(meta)) {
    if (!allowed.has(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
    else if (typeof value === "string" && !hasPiiShape(value)) out[key] = value.replace(/[<>]/g, "").slice(0, 40);
  }
  return out;
}

function keyFor(gameId) {
  return `scores:${gameId}`;
}

function rankRows(rows) {
  return rows
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.ts || 0) - Number(b.ts || 0))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

async function readRows(env, gameId) {
  const raw = await env.ARCADE_LEADERBOARD.get(keyFor(gameId));
  const parsed = raw ? JSON.parse(raw) : [];
  return Array.isArray(parsed) ? rankRows(parsed) : [];
}

async function writeRows(env, gameId, rows) {
  await env.ARCADE_LEADERBOARD.put(keyFor(gameId), JSON.stringify(rankRows(rows).slice(0, PER_GAME_LIMIT)));
}

async function handleGet(env, url) {
  const gameId = safeGameId(url.searchParams.get("gameId"));
  if (!gameId) return json({ error: "missing gameId" }, 400);
  const limit = Math.max(1, Math.min(25, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));
  const rows = await readRows(env, gameId);
  return json({ rows: rows.slice(0, limit), top: rows.slice(0, limit) });
}

async function handlePost(env, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const gameId = safeGameId(body.gameId);
  const score = Math.round(Number(body.score));
  const displayName = safeHandle(body.displayName);
  const clientId = safeClientId(body.clientId);
  if (!gameId || !Number.isFinite(score)) return json({ error: "invalid score" }, 400);
  if (score < 0 || score > 1000000000) return json({ error: "score out of range" }, 400);

  const rows = await readRows(env, gameId);
  const existing = rows.find(row => row.clientId === clientId);
  const entry = {
    entryId: `${clientId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`,
    gameId,
    score,
    displayName,
    clientId,
    ts: Date.now(),
    meta: safeMeta(body.meta)
  };
  let next = rows;
  if (!existing || score > Number(existing.score || 0)) {
    next = rows.filter(row => row.clientId !== clientId).concat(entry);
    await writeRows(env, gameId, next);
  }
  const ranked = rankRows(next).slice(0, DEFAULT_LIMIT);
  return json({ ok: true, entry, top: ranked, rows: ranked });
}

async function handleDelete(env, request, url) {
  const token = request.headers.get("x-arcade-admin-token") || "";
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json({ error: "forbidden" }, 403);
  const gameId = safeGameId(url.searchParams.get("gameId"));
  const entryId = String(url.searchParams.get("entryId") || "");
  if (!gameId || !entryId) return json({ error: "missing gameId or entryId" }, 400);
  const rows = await readRows(env, gameId);
  const next = rows.filter(row => row.entryId !== entryId);
  await writeRows(env, gameId, next);
  return json({ ok: true, deleted: rows.length - next.length, rows: rankRows(next).slice(0, DEFAULT_LIMIT) });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (!env.ARCADE_LEADERBOARD) return json({ error: "missing KV binding" }, 500);
    const url = new URL(request.url);
    if (!url.pathname.endsWith("/scores")) return json({ error: "not found" }, 404);
    if (request.method === "GET") return handleGet(env, url);
    if (request.method === "POST") return handlePost(env, request);
    if (request.method === "DELETE") return handleDelete(env, request, url);
    return json({ error: "method not allowed" }, 405);
  }
};
