import { SlashCommandBuilder } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { manager } from "../manager.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop playback and clear the queue");

export async function execute(interaction) {
  const { ok, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);

  const queue = manager.get(interaction.guild.id);
  if (queue) {
    await queue.clearNowPlaying();
    manager.destroy(interaction.guild.id);
  }

  const connection = getVoiceConnection(interaction.guild.id);
  if (connection) connection.destroy();

  return interaction.reply({
    embeds: [
      createEmbed({
        description: "⏹️ **Parado**",
        color: 0xed4245,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
