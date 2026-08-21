import { getVoiceConnection } from "@discordjs/voice";
import { manager } from "../manager.js";
import { nowPlayingEmbed, errorEmbed, t } from "../utils/embeds.js";

export default async function interactionCreate(interaction) {
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch {
        await interaction.respond([]);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    return handleButton(interaction);
  }

  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[command:${interaction.commandName}]`, error);
      const reply = { embeds: [errorEmbed(t("error"))], ephemeral: true };
      if (interaction.deferred) await interaction.editReply(reply).catch(() => {});
      else await interaction.reply(reply).catch(() => {});
    }
  }
}

async function handleButton(interaction) {
  const { customId, guild, member } = interaction;
  const queue = manager.get(guild.id);

  if (!queue?.current) {
    return interaction.reply({ embeds: [errorEmbed(t("nothingPlaying"))], ephemeral: true });
  }

  const connection = getVoiceConnection(guild.id);
  if (connection && connection.joinConfig.channelId !== member.voice?.channelId) {
    return interaction.reply({
      embeds: [errorEmbed(t("noPermissionVoice"))],
      ephemeral: true,
    });
  }

  switch (customId) {
    case "pause":
      if (queue.status.paused) queue.resume();
      else queue.pause();
      break;
    case "skip":
      queue.skip();
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (!queue.current) {
        return interaction.update({
          embeds: [errorEmbed(t("nothingPlaying"))],
          components: [],
        });
      }
      return interaction.deferUpdate();
    case "stop": {
      connection?.destroy();
      manager.destroy(guild.id);
      return interaction.reply({ content: "⏹️", ephemeral: false });
    }
    case "loop":
      queue.toggleLoop();
      break;
    default:
      return interaction.reply({ content: "❓", ephemeral: true });
  }

  return interaction.update({
    embeds: [nowPlayingEmbed(queue.current, queue.status)],
  });
}
