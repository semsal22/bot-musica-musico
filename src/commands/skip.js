import { SlashCommandBuilder } from "discord.js";
import { manager } from "../manager.js";
import { createEmbed, errorEmbed, t } from "../utils/embeds.js";
import { getVoiceStatus } from "../utils/voice.js";

export const data = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip the current song");

export async function execute(interaction) {
  const { ok, queue, reply } = getVoiceStatus(interaction);
  if (!ok) return interaction.reply(reply);

  if (!queue?.playing && !queue?.current) {
    return interaction.reply({
      embeds: [errorEmbed(t("nothingPlaying"))],
      ephemeral: true,
    });
  }

  const title = queue.current?.title;
  queue.skip();

  return interaction.reply({
    embeds: [
      createEmbed({
        description: `⏭️ **${title ?? ""}**`,
        color: 0xfee75c,
        footer: { text: t("musicPlayer") },
      }),
    ],
  });
}
