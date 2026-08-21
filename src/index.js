import { Client, Collection, GatewayIntentBits } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";
import { manager } from "./manager.js";

if (!config.token) {
  console.error("[start] BOT_TOKEN não definido. Copie .env.example para .env e preencha.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.manager = manager;

const commandsDir = join(import.meta.dirname, "commands");
for (const file of readdirSync(commandsDir).filter((f) => f.endsWith(".js"))) {
  const mod = await import(`./commands/${file}`);
  if (mod.data) client.commands.set(mod.data.name, mod);
}

const eventsDir = join(import.meta.dirname, "events");
for (const file of readdirSync(eventsDir).filter((f) => f.endsWith(".js"))) {
  const handler = (await import(`./events/${file}`)).default;
  const name = file.replace(/\.js$/, "");
  client.on(name, (...args) => handler(client, ...args));
}

client.once("ready", async () => {
  try {
    await client.application.commands.set(
      [...client.commands.values()].map((c) => c.data.toJSON())
    );
    console.log(`[start] ${client.commands.size} comandos registrados globalmente.`);
  } catch (error) {
    console.error("[start] Falha ao registrar comandos:", error.message);
  }
});

client.login(config.token);

process.on("SIGINT", async () => {
  console.log("\n[sigint] Encerrando...");
  for (const queue of client.manager.queues.values()) {
    queue.cleanup();
  }
  client.destroy();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  console.error("[error] unhandledRejection:", reason);
});
