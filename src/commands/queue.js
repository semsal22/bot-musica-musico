import { SlashCommandBuilder } from "discord.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("Show the current queue");

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);
  if (!queue || (queue.tracks.length === 0 && !queue.current)) {
    return interaction.reply({ embeds: [errorEmbed(t("queueEmpty"))], ephemeral: true });
  }

  const description = [];

  if (queue.current) {
    description.push(
      `**▶ Tocando agora:** [${queue.current.title}](${queue.current.url})`
    );
  }

  if (queue.tracks.length > 0) {
    description.push("", `**${t("upNext")}**`);
    queue.tracks
      .slice(0, 10)
      .forEach((tr, i) => {
        description.push(
          `\`${i + 1}\`. **[${tr.title}](${tr.url})** — <@${tr.requestedId}>`
        );
      });
    if (queue.tracks.length > 10) {
      description.push(`... e mais ${queue.tracks.length - 10} músicas`);
    }
  }

  return interaction.reply({
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
