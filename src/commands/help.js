import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const COMMANDS = [
  { name: "/play", desc: "Toca uma música por título ou URL (YouTube, SoundCloud, Spotify)" },
  { name: "/skip", desc: "Pula para a próxima música" },
  { name: "/stop", desc: "Para a reprodução e limpa a fila" },
  { name: "/pause", desc: "Pausa a música atual" },
  { name: "/resume", desc: "Retoma a música pausada" },
  { name: "/volume [0-100]", desc: "Ajusta o volume" },
  { name: "/loop", desc: "Alterna repetição: off → fila → música única" },
  { name: "/shuffle", desc: "Embaralha a fila" },
  { name: "/queue", desc: "Mostra a fila atual" },
  { name: "/remove <posição>", desc: "Remove uma música da fila" },
  { name: "/nowplaying", desc: "Mostra o que está tocando agora" },
  { name: "/help", desc: "Mostra esta lista de comandos" },
];

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all available commands");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🎵 Pulse Music")
    .setDescription("Bot de música universal e grátis — YouTube, SoundCloud e Spotify")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "📋 Comandos",
        value: COMMANDS.map((c) => `\`${c.name}\` — ${c.desc}`).join("\n"),
        inline: false,
      },
      {
        name: "💡 Dicas",
        value:
          "Use `/play` com um link ou texto de busca.\nControles rápidos: `/pause`, `/skip`, `/volume`.",
        inline: false,
      }
    )
    .setFooter({ text: "Pulse Music — 100% de graça" })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
