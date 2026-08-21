import { SlashCommandBuilder } from "discord.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle the queue");

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);
  if (!queue || queue.tracks.length === 0) {
    return interaction.reply({ embeds: [errorEmbed(t("queueEmpty"))], ephemeral: true });
  }
  queue.shuffle();
  return interaction.reply({
    embeds: [
      createEmbed({
        description: `🔀 **Embaralhado** — ${queue.tracks.length} músicas`,
        color: 0x5865f2,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
