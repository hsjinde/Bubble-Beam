#!/usr/bin/env node
/**
 * fetch-yt.mjs — pokopia 建築影片更新用的 YouTube 抓取／查證工具。
 * Node 18+（用全域 fetch），無相依。
 *
 * 子命令：
 *   channels @handle1 @handle2 ...   各頻道 videos 頁的近期影片（id/title/views/time/length）
 *   playlist <listId|url>            播放清單內的影片（id/title/channel/length）
 *   verify   <id1> <id2> ...         逐支 oEmbed 查證存在 + 取官方 title/channel
 *
 * 選項：
 *   --json <path>   除了印到 stdout，另存一份到檔案
 *   --limit <n>     channels 模式每個頻道最多輸出幾支（預設 30）
 *
 * 為什麼要這支腳本：
 * 1) YouTube 的頻道 videos 頁已改用 lockupViewModel 結構（不再是 videoRenderer），
 *    解析要走 contentImage 縮圖 url 取 id、metadata 取觀看數／相對時間——這段容易踩雷，
 *    封裝起來每次更新就不用重摸一次。
 * 2) oEmbed 查證是「不捏造 video id」的守門員：回 200 才代表影片存在，且它回的官方
 *    title 能一眼看出是不是混入的他遊戲影片（同一主播常做多款遊戲）。
 */

const HEADERS = { "Accept-Language": "en-US" };

async function fetchText(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractYtInitialData(html) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error("找不到 ytInitialData（YouTube 版面可能改了，需人工檢查）");
  return JSON.parse(m[1]);
}

function parseViews(s) {
  if (!s) return 0;
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*([KMB]?)/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  if (u === "K") n *= 1e3;
  else if (u === "M") n *= 1e6;
  else if (u === "B") n *= 1e9;
  return Math.round(n);
}

// 把 "3 weeks ago" 這類相對時間粗略換算成天數，供「近期」門檻判斷
function ageDays(s) {
  if (!s) return 9999;
  const m = s.match(/(\d+)\s+(hour|day|week|month|year)/i);
  if (!m) return 9999;
  const n = parseInt(m[1]);
  const mult = { hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 }[m[2].toLowerCase()];
  return Math.round(n * mult);
}

// 頻道 videos 頁的一個 lockupViewModel → 影片欄位
function parseLockup(lv) {
  const meta = lv.metadata?.lockupMetadataViewModel;
  const title = meta?.title?.content ?? "";
  const idm = JSON.stringify(lv.contentImage ?? {}).match(/\/vi\/([\w-]{11})\//);
  const id = idm ? idm[1] : (lv.contentId ?? "");
  const parts = [];
  const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
  for (const row of rows)
    for (const p of row.metadataParts ?? []) if (p.text?.content) parts.push(p.text.content);
  const views = parts.find((t) => /view|回視聴|觀看/i.test(t)) ?? "";
  const time = parts.find((t) => /ago|前/i.test(t)) ?? "";
  let length = "";
  const overlays = JSON.stringify(lv.contentImage?.thumbnailViewModel?.overlays ?? []);
  const lm = overlays.match(/"text":"(\d+:\d+(?::\d+)?)"/);
  if (lm) length = lm[1];
  return { id, title, views, viewsNum: parseViews(views), time, ageDays: ageDays(time), length };
}

function collectLockups(data) {
  const out = [];
  const seen = new Set();
  (function walk(node) {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") {
      if (node.lockupViewModel) {
        const v = parseLockup(node.lockupViewModel);
        if (v.id && !seen.has(v.id)) {
          seen.add(v.id);
          out.push(v);
        }
      }
      Object.values(node).forEach(walk);
    }
  })(data);
  return out;
}

function collectPlaylist(data) {
  const out = [];
  (function walk(node) {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") {
      if (node.playlistVideoRenderer) {
        const r = node.playlistVideoRenderer;
        out.push({
          id: r.videoId,
          title: r.title?.runs?.[0]?.text ?? "",
          channel: r.shortBylineText?.runs?.[0]?.text ?? "",
          channelUrl:
            r.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ?? "",
          length: r.lengthText?.simpleText ?? "",
        });
      }
      Object.values(node).forEach(walk);
    }
  })(data);
  return out;
}

async function cmdChannels(handles, limit) {
  const result = {};
  for (const h of handles) {
    const handle = h.replace(/^@/, "");
    const html = await fetchText(`https://www.youtube.com/@${handle}/videos`);
    result[handle] = collectLockups(extractYtInitialData(html)).slice(0, limit);
  }
  return result;
}

async function cmdPlaylist(arg) {
  const listId = arg.match(/[?&]list=([\w-]+)/)?.[1] ?? arg;
  const html = await fetchText(`https://www.youtube.com/playlist?list=${listId}`);
  return collectPlaylist(extractYtInitialData(html));
}

async function cmdVerify(ids) {
  const out = [];
  for (const id of ids) {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        out.push({ id, ok: false, status: res.status });
        continue;
      }
      const j = await res.json();
      out.push({ id, ok: true, title: j.title, channel: j.author_name });
    } catch (e) {
      out.push({ id, ok: false, error: e.message });
    }
  }
  return out;
}

// ── CLI ──
const [, , cmd, ...rest] = process.argv;
let jsonPath = null;
let limit = 30;
const args = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === "--json") jsonPath = rest[++i];
  else if (rest[i] === "--limit") limit = parseInt(rest[++i], 10);
  else args.push(rest[i]);
}

const runners = {
  channels: () => cmdChannels(args, limit),
  playlist: () => cmdPlaylist(args[0]),
  verify: () => cmdVerify(args),
};

if (!runners[cmd] || args.length === 0) {
  console.error(`用法：
  node fetch-yt.mjs channels @handle1 @handle2 ...   # 各頻道近期影片（含觀看數/發布時間）
  node fetch-yt.mjs playlist <listId|url>            # 播放清單影片
  node fetch-yt.mjs verify   <id1> <id2> ...         # oEmbed 查證 + 官方 title/channel
選項：--json <path>（另存檔）、--limit <n>（channels 每頻道上限，預設 30）`);
  process.exit(1);
}

const data = await runners[cmd]();
const json = JSON.stringify(data, null, 2);
console.log(json);
if (jsonPath) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(jsonPath, json);
  console.error(`\n已寫入 ${jsonPath}`);
}
