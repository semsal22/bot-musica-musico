import { SlashCommandBuilder } from "discord.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

const labels = {
  off: t("loopOff"),
  queue: t("loopQueue"),
  track: t("loopTrack"),
};

export const data = new SlashCommandBuilder()
  .setName("loop")
  .setDescription("Toggle loop: off → queue → single track");

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);
  if (!queue?.current) {
    return interaction.reply({ embeds: [errorEmbed(t("nothingPlaying"))], ephemeral: true });
  }

  const mode = queue.toggleLoop();
  return interaction.reply({
    embeds: [
      createEmbed({
        description: `${mode === "off" ? "🔃" : mode === "queue" ? "🔁" : "🔂"} **${labels[mode]}**`,
        color: 0x0099ff,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
