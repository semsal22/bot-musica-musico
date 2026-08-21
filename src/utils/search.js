import { spawn } from "node:child_process";
import { Track } from "../structures/Track.js";
import { resolveSpotify } from "./spotify.js";

const YT_RE = /(youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)/;
const YT_PLAYLIST_RE = /youtube\.com\/playlist\?list=/;
const SC_RE = /soundcloud\.com\/[^/]+\/(?:sets\/)?[^/]+/;
const SP_RE = /open\.spotify\.com\/(?:track|playlist|album)\/([\w]+)/;

const MAX_PLAYLIST = 30;

function ytdlp(args, { timeout = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("yt-dlp timed out"));
    }, timeout);
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(err.trim().split("\n").pop() || `yt-dlp exited with code ${code}`));
    });
  });
}

async function ytdlpJson(args) {
  const out = await ytdlp(["-J", "--no-warnings", ...args]);
  return JSON.parse(out);
}

function toTrack(entry, { requestedBy, requestedId, locale }) {
  const duration =
    entry.duration_string ? entry.duration : entry.duration ?? 0;
  return new Track({
    title: entry.title || entry.track || "Desconhecido",
    url: entry.webpage_url || entry.url,
    duration: Number.isFinite(duration) ? duration : 0,
    thumbnail: entry.thumbnail ?? null,
    author: entry.channel || entry.uploader || entry.artist || null,
    authorAvatar: entry.channel_id ? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg` : null,
    source: entry.extractor_key === "Soundcloud" ? "soundcloud" : "youtube",
    live: Boolean(entry.is_live) || !Number.isFinite(duration),
    requestedBy,
    requestedId,
    locale,
  });
}

async function youtubeInfo(url, meta) {
  const info = await ytdlpJson([url]);
  return [toTrack(info, meta)];
}

async function youtubePlaylist(url, meta) {
  const info = await ytdlpJson(["--flat-playlist", url]);
  const entries = (info.entries ?? []).slice(0, MAX_PLAYLIST);
  return entries.map((e) => toTrack(e, meta));
}

async function soundcloudInfo(url, meta) {
  const info = await ytdlpJson([url]);
  if (info.entries?.length) {
    return info.entries.slice(0, MAX_PLAYLIST).map((e) => toTrack(e, meta));
  }
  return [toTrack(info, meta)];
}

async function youtubeSearch(query, meta) {
  const info = await ytdlpJson(["--flat-playlist", `ytsearch1:${query}`]);
  return info.entries?.slice(0, 1).map((e) => toTrack(e, meta)) ?? [];
}

export { youtubeSearch };

async function soundcloudSearch(query, meta) {
  const info = await ytdlpJson(["--flat-playlist", `scsearch1:${query}`]);
  return info.entries?.slice(0, 1).map((e) => toTrack(e, meta)) ?? [];
}

export async function resolveTracks(input, meta = {}) {
  if (YT_PLAYLIST_RE.test(input)) return youtubePlaylist(input, meta);
  if (YT_RE.test(input)) return youtubeInfo(input, meta);
  if (SC_RE.test(input)) return soundcloudInfo(input, meta);
  if (SP_RE.test(input)) return resolveSpotify(input, meta);

  try {
    return await youtubeSearch(input, meta);
  } catch {
    return soundcloudSearch(input, meta);
  }
}

export async function searchResults(input, meta = {}) {
  const info = await ytdlpJson(["--flat-playlist", `ytsearch5:${input}`]);
  return (info.entries ?? []).slice(0, 5).map((e) => toTrack(e, meta));
}

export function playStream(track) {
  const args = [
    "-f", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
    "-o", "-",
    "--no-part",
    "--no-warnings",
    "--no-progress",
    track.url,
  ];
  const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
  let err = "";
  child.stderr.on("data", (d) => (err += d));
  child.on("close", (code) => {
    if (code !== 0) {
      child.stdout.destroy(new Error(err.trim().split("\n").pop() || `yt-dlp exit ${code}`));
    }
  });
  return child.stdout;
}
