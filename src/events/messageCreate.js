import { getVoiceConnection } from "@discordjs/voice";
import { manager } from "../manager.js";
import { config } from "../config.js";
import { resolveTracks } from "../utils/search.js";
import { createEmbed, errorEmbed, nowPlayingEmbed, controlsRow, t } from "../utils/embeds.js";
import { formatDuration } from "../utils/format.js";
import { getVoiceStatus } from "../utils/voice.js";

export default async function messageCreate(client, message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  const text = args.join(" ");

  try {
    switch (command) {
      case "play":
      case "p":
        return play(message, text);
      case "skip":
      case "s":
        return skip(message);
      case "stop":
        return stop(message);
      case "pause":
        return pause(message);
      case "resume":
      case "unpause":
        return resume(message);
      case "volume":
      case "vol":
        return volume(message, args);
      case "loop":
      case "repeat":
        return loop(message);
      case "shuffle":
      case "sh":
        return shuffle(message);
      case "queue":
      case "q":
        return queue(message);
      case "remove":
      case "rm":
        return remove(message, args);
      case "nowplaying":
      case "np":
        return nowplaying(message);
      case "help":
      case "h":
        return help(message);
      default:
        return;
    }
  } catch (error) {
    console.error(`[prefix:${command}]`, error.message);
    return message.channel.send({ embeds: [errorEmbed(t("error"))] });
  }
}

function voiceCheck(message) {
  const { ok, queue, reply } = getVoiceStatus(message);
  if (!ok) {
    message.channel.send(reply);
    return null;
  }
  return queue;
}

async function play(message, text) {
  const query = text.trim();
  if (!query) {
    return message.channel.send({
      embeds: [
        createEmbed({
          description: `${config.prefix}play <música ou URL>\n${t("searchHint")}`,
          color: 0xed4245,
        }),
      ],
    });
  }

  const voice = message.member.voice.channel;
  if (!voice) {
    return message.channel.send({ embeds: [errorEmbed(t("voiceChannelRequired"))] });
  }

  const queue = manager.create(message.guild);
  await queue.join(voice);
  queue.setNpChannel(message.channel);

  const meta = {
    requestedBy: message.author.username,
    requestedId: message.author.id,
    locale: config.locale,
  };

  let tracks;
  try {
    tracks = await resolveTracks(query, meta);
  } catch (error) {
    return message.channel.send({ embeds: [errorEmbed(error.message || t("error"))] });
  }

  if (tracks.length === 0) {
    return message.channel.send({ embeds: [errorEmbed(t("queueEmpty"))] });
  }

  const isFirst = !queue.playing && queue.tracks.length === 0 && !queue.current;
  for (const track of tracks) queue.add(track);
  if (isFirst) queue.start();

  return message.channel.send({
    embeds: [
      createEmbed({
        title: t("addedToQueue"),
        color: 0x57f287,
        description: tracks
          .slice(0, 10)
          .map((tr, i) => `\`${i + 1}\`. **[${tr.title}](${tr.url})** — \`${formatDuration(tr.duration)}\``)
          .join("\n")
          .slice(0, 4096),
        thumbnail: tracks[0]?.thumbnail,
        footer: { text: tracks.length > 10 ? `+${tracks.length - 10} mais` : t("musicPlayer") },
      }),
    ],
  });
}

async function skip(message) {
  const queue = voiceCheck(message);
  if (!queue || !queue.playing || !queue.current) return;
  const title = queue.current.title;
  queue.skip();
  return message.channel.send({
    embeds: [createEmbed({ description: `⏭️ **${title}**`, color: 0xfee75c })],
  });
}

async function stop(message) {
  const { ok } = getVoiceStatus(message);
  if (!ok) return;
  const queue = manager.get(message.guild.id);
  if (queue) {
    await queue.clearNowPlaying();
    manager.destroy(message.guild.id);
  }
  getVoiceConnection(message.guild.id)?.destroy();
  return message.channel.send({
    embeds: [createEmbed({ description: "⏹️ **Parado**", color: 0xed4245 })],
  });
}

async function pause(message) {
  const queue = voiceCheck(message);
  if (!queue?.current) return;
  queue.pause();
  queue.sendNowPlaying();
  return message.channel.send({
    embeds: [createEmbed({ description: `⏸️ **Pausado** — *${queue.current.title}*`, color: 0xfee75c })],
  });
}

async function resume(message) {
  const queue = voiceCheck(message);
  if (!queue?.current) return;
  queue.resume();
  queue.sendNowPlaying();
  return message.channel.send({
    embeds: [createEmbed({ description: `▶️ **Continuando** — *${queue.current.title}*`, color: 0x57f287 })],
  });
}

async function volume(message, args) {
  const queue = voiceCheck(message);
  if (!queue) return;
  const level = parseInt(args[0], 10);
  if (Number.isNaN(level)) {
    return message.channel.send({
      embeds: [createEmbed({ description: `${t("volume")}: **${queue?.volume ?? config.defaultVolume}%**`, color: 0x0099ff })],
    });
  }
  queue.setVolume(level);
  return message.channel.send({
    embeds: [createEmbed({ description: `${t("volume")}: **${level}%**`, color: 0x0099ff })],
  });
}

async function loop(message) {
  const queue = voiceCheck(message);
  if (!queue?.current) return;
  const mode = queue.toggleLoop();
  const label = mode === "off" ? t("loopOff") : mode === "queue" ? t("loopQueue") : t("loopTrack");
  const icon = mode === "off" ? "🔃" : mode === "queue" ? "🔁" : "🔂";
  return message.channel.send({
    embeds: [createEmbed({ description: `${icon} **${label}**`, color: 0x0099ff })],
  });
}

async function shuffle(message) {
  const queue = voiceCheck(message);
  if (!queue) return;
  if (queue.tracks.length === 0) {
    return message.channel.send({ embeds: [errorEmbed(t("queueEmpty"))] });
  }
  queue.shuffle();
  return message.channel.send({
    embeds: [createEmbed({ description: `🔀 **Embaralhado** — ${queue.tracks.length} músicas`, color: 0x5865f2 })],
  });
}

async function queue(message) {
  const queue = voiceCheck(message);
  if (!queue) return;
  if (queue.tracks.length === 0 && !queue.current) {
    return message.channel.send({ embeds: [errorEmbed(t("queueEmpty"))] });
  }
  const description = [];
  if (queue.current) description.push(`**▶ Tocando agora:** [${queue.current.title}](${queue.current.url})`);
  if (queue.tracks.length > 0) {
    description.push("", `**${t("upNext")}**`);
    queue.tracks.slice(0, 10).forEach((tr, i) => {
      description.push(`\`${i + 1}\`. **[${tr.title}](${tr.url})**`);
    });
    if (queue.tracks.length > 10) description.push(`... e mais ${queue.tracks.length - 10} músicas`);
  }
  return message.channel.send({
    embeds: [
      createEmbed({
        title: `📜 ${t("queue")}`,
        description: description.join("\n").slice(0, 4096),
        color: 0x0099ff,
        footer: { text: `${queue.tracks.length} ${t("tracksInQueue")}` },
      }),
    ],
  });
}

async function remove(message, args) {
  const queue = voiceCheck(message);
  if (!queue || queue.tracks.length === 0) return;
  const position = parseInt(args[0], 10);
  if (Number.isNaN(position) || position < 1 || position > queue.tracks.length) return;
  const [removed] = queue.tracks.splice(position - 1, 1);
  return message.channel.send({
    embeds: [createEmbed({ description: `🗑️ **Removida:** ${removed.title}`, color: 0xed4245 })],
  });
}

async function nowplaying(message) {
  const queue = voiceCheck(message);
  if (!queue) return;
  if (!queue.current) {
    return message.channel.send({ embeds: [errorEmbed(t("nothingPlaying"))] });
  }
  return message.channel.send({
    embeds: [nowPlayingEmbed(queue.current, queue.status)],
    components: [controlsRow(queue)],
  });
}

async function help(message) {
  const embed = createEmbed({
    title: "🎵 Pulse Music",
    description: `Prefixo: \`${config.prefix}\` — ou use os comandos com barra (/play, /skip...)`,
    color: 0x5865f2,
    fields: [
      {
        name: "📋 Comandos por prefixo",
        value: [
          `\`${config.prefix}play <música/URL>\` — toca ou adiciona à fila`,
          `\`${config.prefix}skip\` — pula a música`,
          `\`${config.prefix}stop\` — para e limpa a fila`,
          `\`${config.prefix}pause\` / \`${config.prefix}resume\``,
          `\`${config.prefix}volume 0-100\``,
          `\`${config.prefix}loop\` / \`${config.prefix}shuffle\``,
          `\`${config.prefix}queue\` / \`${config.prefix}remove <nº>\``,
          `\`${config.prefix}nowplaying\` / \`${config.prefix}help\``,
        ].join("\n"),
      },
      {
        name: "💡 Dica",
        value: "Também funcionam via slash command: `/play`, `/skip`, `/queue`...",
      },
    ],
    footer: { text: "Pulse Music — 100% de graça" },
    timestamp: Date.now(),
  });
  return message.channel.send({ embeds: [embed] });
}
