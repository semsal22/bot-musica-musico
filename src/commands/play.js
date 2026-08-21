import { SlashCommandBuilder } from "discord.js";
import { manager } from "../manager.js";
import { config } from "../config.js";
import { resolveTracks, searchResults } from "../utils/search.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { formatDuration } from "../utils/format.js";

export const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song or add it to the queue")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Song title or URL (YouTube, SoundCloud, Spotify)")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction) {
  const query = interaction.options.getFocused();
  if (!query) return interaction.respond([]);
  try {
    const results = await searchResults(query);
    return interaction.respond(
      results.map((track) => ({
        name: `${track.title} — ${track.author ?? ""} [${formatDuration(track.duration)}]`.slice(0, 100),
        value: track.url,
      }))
    );
  } catch {
    return interaction.respond([]);
  }
}

export async function execute(interaction) {
  const query = interaction.options.getString("query", true);
  const member = interaction.member;
  const voice = member.voice.channel;

  if (!voice) {
    return interaction.reply({ embeds: [errorEmbed(t("voiceChannelRequired"))], ephemeral: true });
  }

  await interaction.deferReply();

  const queue = manager.create(interaction.guild);
  await queue.join(voice);
  queue.setNpChannel(interaction.channel);

  const meta = {
    requestedBy: interaction.user.username,
    requestedId: interaction.user.id,
    locale: config.locale,
  };

  let tracks;
  try {
    tracks = await resolveTracks(query, meta);
  } catch (error) {
    console.error("resolve error:", error.message);
    return interaction.editReply({ embeds: [errorEmbed(t("error"))] });
  }

  if (tracks.length === 0) {
    return interaction.editReply({ embeds: [errorEmbed(t("queueEmpty"))] });
  }

  const isFirst = !queue.playing && queue.tracks.length === 0 && !queue.current;

  for (const track of tracks) queue.add(track);

  if (isFirst) {
    queue.start();
  }

  const embed = createEmbed({
    title: t("addedToQueue"),
    color: 0x57f287,
    description: tracks
      .slice(0, 10)
      .map(
        (tr, i) =>
          `\`${i + 1}\`. **[${tr.title}](${tr.url})** — \`${formatDuration(tr.duration)}\`\n　└ <@${tr.requestedId}>`
      )
      .join("\n")
      .slice(0, 4096),
    thumbnail: tracks[0]?.thumbnail,
    footer: { text: tracks.length > 10 ? `+${tracks.length - 10} mais` : t("musicPlayer") },
    timestamp: Date.now(),
  });

  return interaction.editReply({ embeds: [embed] });
}
