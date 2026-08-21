import { Collection } from "discord.js";
import { MusicQueue } from "./structures/MusicQueue.js";

class Manager {
  constructor() {
    this.queues = new Collection();
  }

  get(guildId) {
    return this.queues.get(guildId);
  }

  create(guild) {
    if (!this.queues.has(guild.id)) {
      this.queues.set(guild.id, new MusicQueue(guild));
    }
    return this.queues.get(guild.id);
  }

  destroy(guildId) {
    this.queues.delete(guildId);
  }
}

export const manager = new Manager();
