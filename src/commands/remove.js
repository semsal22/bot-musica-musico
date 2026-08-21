import { SlashCommandBuilder } from "discord.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Remove a song from the queue by its number")
  .addIntegerOption((option) =>
    option
      .setName("position")
      .setDescription("Song position in the queue")
      .setRequired(true)
      .setMinValue(1)
  );

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);

  const position = interaction.options.getInteger("position", true);

  if (!queue || queue.tracks.length === 0) {
    return interaction.reply({ embeds: [errorEmbed(t("queueEmpty"))], ephemeral: true });
  }
  if (position > queue.tracks.length) {
    return interaction.reply({ embeds: [errorEmbed(t("queueEmpty"))], ephemeral: true });
  }

  const [removed] = queue.tracks.splice(position - 1, 1);

  return interaction.reply({
    embeds: [
      createEmbed({
        description: `🗑️ **Removida:** ${removed.title}`,
        color: 0xed4245,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
