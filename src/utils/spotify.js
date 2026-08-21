import { Track } from "../structures/Track.js";
import { config } from "../config.js";
import { youtubeSearch } from "./search.js";

const SPOTIFY_API = "https://api.spotify.com/v1";
const MAX_PLAYLIST = 30;
const CONCURRENCY = 4;

const SP_TRACK_RE = /open\.spotify\.com\/track\/([\w]+)/;
const SP_PLAYLIST_RE = /open\.spotify\.com\/(playlist|album)\/([\w]+)/;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString("base64")}`,
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Spotify auth failed (${res.status})`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 30_000;
  return cachedToken;
}

async function spotifyFetch(path) {
  const token = await getToken();
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API ${res.status}`);
  return res.json();
}

function spItemToMeta(item) {
  return {
    title: item.name,
    artists: (item.artists ?? []).map((a) => a.name).join(", "),
    duration: item.duration_ms ? Math.round(item.duration_ms / 1000) : 0,
  };
}

async function toTrack(spItem, meta) {
  const name = `${spItem.name} ${(spItem.artists ?? []).map((a) => a.name).join(" ")}`;
  const youtube = await youtubeSearch(name, meta).catch(() => []);
  if (!youtube[0]) return null;
  const track = new Track({
    title: spItem.name,
    url: youtube[0].url,
    duration: spItem.duration_ms ? Math.round(spItem.duration_ms / 1000) : youtube[0].duration,
    thumbnail: youtube[0].thumbnail,
    author: (spItem.artists ?? []).map((a) => a.name).join(", ") || youtube[0].author,
    source: "spotify",
    live: false,
    requestedBy: meta.requestedBy,
    requestedId: meta.requestedId,
    locale: meta.locale,
  });
  return track;
}

async function oembedTrack(url, meta) {
  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
  if (!res.ok) return [];
  const data = await res.json();
  const name = data.title ?? "";
  const youtube = await youtubeSearch(name, meta).catch(() => []);
  if (!youtube[0]) return [];
  const track = new Track({
    title: name,
    url: youtube[0].url,
    duration: youtube[0].duration,
    thumbnail: youtube[0].thumbnail,
    author: data.author_name ?? youtube[0].author,
    source: "spotify",
    live: false,
    requestedBy: meta.requestedBy,
    requestedId: meta.requestedId,
    locale: meta.locale,
  });
  return [track];
}

export async function resolveSpotify(url, meta = {}) {
  const trackMatch = url.match(SP_TRACK_RE);
  const listMatch = url.match(SP_PLAYLIST_RE);

  const hasCredentials = Boolean(config.spotifyClientId && config.spotifyClientSecret);

  if (trackMatch && !hasCredentials) {
    return oembedTrack(url, meta);
  }

  if (!hasCredentials) {
    throw new Error(
      "Para usar Spotify completo, adicione SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env (grátis em developers.spotify.com)."
    );
  }

  try {
    if (trackMatch) {
      const item = await spotifyFetch(`/tracks/${trackMatch[1]}`);
      const track = await toTrack(item, meta);
      return track ? [track] : [];
    }

    if (listMatch) {
      const [, type, id] = listMatch;
      const path = type === "album" ? `/albums/${id}/tracks` : `/playlists/${id}/tracks`;
      const data = await spotifyFetch(path);
      const items = (data.items ?? []).slice(0, MAX_PLAYLIST);

      const tracks = [];
      let i = 0;
      async function worker() {
        while (i < items.length) {
          const idx = i++;
          const track = await toTrack(items[idx], meta).catch(() => null);
          if (track) tracks.push(track);
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker())
      );
      return tracks;
    }
  } catch (error) {
    console.error("[spotify]", error.message);
  }

  return [];
}

export { spItemToMeta };
