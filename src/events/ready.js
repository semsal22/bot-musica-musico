import { ActivityType } from "discord.js";

export default function ready(client) {
  client.user.setPresence({
    activities: [
      {
        name: "/play — música grátis",
        type: ActivityType.Listening,
      },
    ],
    status: "online",
  });
  console.log(`[ready] ${client.user.tag} está online em ${client.guilds.cache.size} servidor(es)!`);
}
