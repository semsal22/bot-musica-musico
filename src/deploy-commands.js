import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";

if (!config.token) {
  console.error("[deploy] BOT_TOKEN não definido. Copie .env.example para .env e preencha.");
  process.exit(1);
}

const commands = [];
const dir = join(process.cwd(), "src", "commands");

for (const file of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  const mod = await import(`./commands/${file}`);
  if (mod.data) commands.push(mod.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(config.token);

try {
  console.log(`[deploy] Registrando ${commands.length} comandos...`);
  await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
  console.log("[deploy] Comandos registrados com sucesso!");
} catch (error) {
  console.error("[deploy] Erro:", error);
}
