import dotenv from "dotenv";

dotenv.config();

export const config = {
  token: process.env.BOT_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  prefix: process.env.PREFIX || "p!",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || "",
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
  defaultVolume: Math.min(
    Math.max(Number(process.env.DEFAULT_VOLUME) || 60, 0),
    100
  ),
  allowBotUsers: process.env.ALLOW_BOT_USERS === "true",
  locale: process.env.LOCALE === "en" ? "en" : "pt-BR",
  autoLeaveMs: Number(process.env.AUTO_LEAVE_MS) || 60_000,
};
