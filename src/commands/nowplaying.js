import { SlashCommandBuilder } from "discord.js";
import { nowPlayingEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("nowplaying")
  .setDescription("Show what is currently playing");

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);

  if (!queue?.current) {
    return interaction.reply({ embeds: [errorEmbed(t("nothingPlaying"))], ephemeral: true });
  }

  return interaction.reply({
    embeds: [nowPlayingEmbed(queue.current, queue.status)],
  });
}
