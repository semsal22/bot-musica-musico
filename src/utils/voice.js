import { getVoiceConnection } from "@discordjs/voice";
import { t, errorEmbed } from "./embeds.js";
import { manager } from "../manager.js";

export function getVoiceStatus(interaction) {
  const queue = manager.get(interaction.guild.id);
  const memberVoice = interaction.member.voice.channel;

  if (!memberVoice) {
    return { ok: false, reply: { embeds: [errorEmbed(t("voiceChannelRequired"))], ephemeral: true } };
  }

  const connection = getVoiceConnection(interaction.guild.id);
  if (connection && connection.joinConfig.channelId !== memberVoice.id) {
    return { ok: false, reply: { embeds: [errorEmbed(t("noPermissionVoice"))], ephemeral: true } };
  }

  return { ok: true, queue };
}
