import { SlashCommandBuilder } from "discord.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("resume")
  .setDescription("Resume the paused song");

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);
  if (!queue?.current) {
    return interaction.reply({ embeds: [errorEmbed(t("nothingPlaying"))], ephemeral: true });
  }
  queue.resume();
  queue.sendNowPlaying();
  return interaction.reply({
    embeds: [
      createEmbed({
        description: `▶️ **Continuando** — *${queue.current.title}*`,
        color: 0x57f287,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
