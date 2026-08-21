export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "LIVE";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function parseDuration(value) {
  const match = String(value).match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$|^(\d{1,3}):(\d{2})$/);
  if (!match) return null;
  const [, h, m, s, m2, s2] = match;
  if (h !== undefined) return Number(h) * 3600 + Number(m) * 60 + Number(s);
  return Number(m2) * 60 + Number(s2);
}

export function progressBar(current, total, size = 18) {
  if (!total || total <= 0) return "🔴 LIVE";
  const pct = Math.max(0, Math.min(1, current / total));
  const filled = Math.round(size * pct);
  const bar = "─".repeat(Math.max(0, filled - 1)) + "●" + "─".repeat(Math.max(0, size - filled));
  return bar;
}
