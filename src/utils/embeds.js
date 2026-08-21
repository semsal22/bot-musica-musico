import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "../config.js";
import { formatDuration, progressBar } from "./format.js";

const COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
  info: 0x0099ff,
};

function t(key, locale = config.locale) {
  return translations[key]?.[locale] ?? translations[key]?.["en"] ?? key;
}

const translations = {
  addedToQueue: { "pt-BR": "Adicionado à fila", en: "Added to queue" },
  nowPlaying: { "pt-BR": "Tocando agora", en: "Now playing" },
  upNext: { "pt-BR": "A seguir", en: "Up next" },
  queue: { "pt-BR": "Fila de músicas", en: "Music queue" },
  musicPlayer: { "pt-BR": "🎵 Pulse Music", en: "🎵 Pulse Music" },
  volume: { "pt-BR": "Volume", en: "Volume" },
  requestedBy: { "pt-BR": "Pedida por", en: "Requested by" },
  positionInQueue: { "pt-BR": "Posição na fila", en: "Position in queue" },
  totalDuration: { "pt-BR": "Duração total", en: "Total duration" },
  live: { "pt-BR": "🔴 AO VIVO", en: "🔴 LIVE" },
  loopOff: { "pt-BR": "Repetição desativada", en: "Loop off" },
  loopQueue: { "pt-BR": "Repetindo a fila", en: "Looping queue" },
  loopTrack: { "pt-BR": "Repetindo esta música", en: "Looping this track" },
  paused: { "pt-BR": "Pausado", en: "Paused" },
  playing: { "pt-BR": "Tocando", en: "Playing" },
  searchHint: {
    "pt-BR": "Buscar por título ou URL (YouTube, SoundCloud, Spotify)",
    en: "Search by title or URL (YouTube, SoundCloud, Spotify)",
  },
  tracksInQueue: { "pt-BR": "músicas na fila", en: "tracks in queue" },
  nothingPlaying: {
    "pt-BR": "Nada tocando no momento. Use `/play` para começar!",
    en: "Nothing is playing right now. Use `/play` to start!",
  },
  lyrics: { "pt-BR": "Letra", en: "Lyrics" },
  source: { "pt-BR": "Fonte", en: "Source" },
  requested: { "pt-BR": "Pedido", en: "Request" },
  uptime: { "pt-BR": "Tempo online", en: "Uptime" },
  users: { "pt-BR": "Usuários", en: "Users" },
  servers: { "pt-BR": "Servidores", en: "Servers" },
  commandsTitle: { "pt-BR": "Comandos", en: "Commands" },
  voiceChannelRequired: {
    "pt-BR": "Entre em um canal de voz primeiro!",
    en: "Join a voice channel first!",
  },
  noPermissionVoice: {
    "pt-BR": "Você precisa estar no mesmo canal de voz que eu.",
    en: "You must be in the same voice channel as me.",
  },
  searching: { "pt-BR": "🔎 Buscando música...", en: "🔎 Searching for music..." },
  error: {
    "pt-BR": "Algo deu errado. Tente novamente.",
    en: "Something went wrong. Please try again.",
  },
  queueEmpty: {
    "pt-BR": "A fila está vazia no momento.",
    en: "The queue is empty right now.",
  },
  nowPlayingTitle: {
    "pt-BR": "Reproduzindo agora",
    en: "Now playing",
  },
};

export function createEmbed(data = {}, locale = config.locale) {
  const embed = new EmbedBuilder().setColor(data.color ?? COLORS.primary);
  if (data.title) embed.setTitle(data.title);
  if (data.description) embed.setDescription(data.description);
  if (data.footer) embed.setFooter(data.footer);
  if (data.timestamp) embed.setTimestamp(data.timestamp);
  if (data.thumbnail) embed.setThumbnail(data.thumbnail);
  if (data.image) embed.setImage(data.image);
  if (data.url) embed.setURL(data.url);
  if (data.author) embed.setAuthor(data.author);
  if (data.fields) embed.addFields(data.fields);
  return embed;
}

export function nowPlayingEmbed(track, playback) {
  const current = playback?.current ?? 0;
  const status = playback?.paused
    ? `⏸ ${t("paused", track.locale)}`
    : `▶ ${t("playing", track.locale)}`;
  const live = track.live;

  const description = live
    ? `🔴 ${track.title}\n\n${status} — ${t("live", track.locale)}`
    : `**[${track.title}](${track.url})**\n\n${status} \`${formatDuration(current)}\` ${progressBar(current, track.duration)} \`${formatDuration(track.duration)}\``;

  const embed = createEmbed({
    title: t("nowPlayingTitle", track.locale),
    description,
    color: COLORS.success,
    thumbnail: track.thumbnail,
    footer: { text: `${t("requestedBy", track.locale)}: ${track.requestedBy}` },
    timestamp: Date.now(),
  });

  if (track.author) embed.setAuthor({ name: track.author, iconURL: track.authorAvatar });

  return embed;
}

export function queueEmbed(queue) {
  const list = queue.tracks
    .slice(0, 10)
    .map(
      (tr, i) =>
        `\`${i + 1}\`. **${tr.title}** — \`${formatDuration(tr.duration)}\` <@${tr.requestedId}>`
    )
    .join("\n");

  const totalDuration = queue.tracks.reduce((acc, tr) => acc + (tr.duration || 0), 0);

  const embed = createEmbed({
    title: `${t("queue")} — ${queue.tracks.length} ${t("tracksInQueue")}`,
    description: list || t("queueEmpty"),
    color: COLORS.info,
    fields: [
      {
        name: t("totalDuration"),
        value: formatDuration(totalDuration),
        inline: true,
      },
      {
        name: t("volume"),
        value: `${queue.volume}%`,
        inline: true,
      },
    ],
    footer: { text: t("musicPlayer") },
    timestamp: Date.now(),
  });

  return embed;
}

export function controlsRow(queue) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pause")
      .setEmoji(queue.playing ? "⏸️" : "▶️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("loop")
      .setEmoji(queue.loop === "queue" ? "🔁" : queue.loop === "track" ? "🔂" : "🔃")
      .setStyle(ButtonStyle.Secondary)
  );
}

export function errorEmbed(message, locale = config.locale) {
  return createEmbed({ color: COLORS.danger, description: message });
}

export const COLORS_CONFIG = COLORS;
export { t, translations };
