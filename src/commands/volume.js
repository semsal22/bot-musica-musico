import { SlashCommandBuilder } from "discord.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("volume")
  .setDescription("Set the music volume")
  .addIntegerOption((option) =>
    option
      .setName("level")
      .setDescription("Volume between 0 and 100")
      .setMinValue(0)
      .setMaxValue(100)
  );

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);

  const level = interaction.options.getInteger("level");

  if (level === null) {
    return interaction.reply({
      embeds: [
        createEmbed({
          description: `${t("volume")}: **${queue?.volume ?? 60}%**`,
          color: 0x0099ff,
        }),
      ],
    });
  }

  queue.setVolume(level);
  return interaction.reply({
    embeds: [
      createEmbed({
        description: `${t("volume")}: **${level}%**`,
        color: 0x0099ff,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
