import { SlashCommandBuilder } from "discord.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause the current song");

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);
  if (!queue?.current) {
    return interaction.reply({ embeds: [errorEmbed(t("nothingPlaying"))], ephemeral: true });
  }
  queue.pause();
  queue.sendNowPlaying();
  return interaction.reply({
    embeds: [
      createEmbed({
        description: `⏸️ **Pausado** — *${queue.current.title}*`,
        color: 0xfee75c,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
