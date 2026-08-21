import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { config } from "../config.js";
import { formatDuration } from "../utils/format.js";
import { playStream } from "../utils/search.js";

export class MusicQueue {
  constructor(guild) {
    this.guild = guild;
    this.tracks = [];
    this.playing = false;
    this.loop = "off"; // off | track | queue
    this.volume = config.defaultVolume;
    this.current = null;
    this.npChannel = null;
    this.npMessage = null;

    this.player = createAudioPlayer();
    this.player.on("error", (error) => {
      console.error(`[${guild.id}] player error:`, error.message);
    });

    this.player.on(AudioPlayerStatus.Idle, () => this.onIdle());
    this.player.on(AudioPlayerStatus.Playing, () => {
      this.playing = true;
    });
    this.player.on(AudioPlayerStatus.Paused, () => {
      this.playing = false;
    });
  }

  setNpChannel(channel) {
    this.npChannel = channel;
  }

  async sendNowPlaying() {
    if (!this.npChannel || !this.current) return;
    const { nowPlayingEmbed, controlsRow } = await import("../utils/embeds.js");
    const embed = nowPlayingEmbed(this.current, this.status);
    const row = controlsRow(this);
    try {
      if (this.npMessage) {
        await this.npMessage.edit({ embeds: [embed], components: [row] });
      } else {
        this.npMessage = await this.npChannel.send({ embeds: [embed], components: [row] });
      }
    } catch (error) {
      if (this.npMessage) this.npMessage = null;
      if (error.code !== 10008) {
        console.error(`[${this.guild.id}] np message error:`, error.message);
      }
    }
  }

  async clearNowPlaying() {
    if (this.npMessage) {
      try {
        await this.npMessage.delete();
      } catch {}
      this.npMessage = null;
    }
  }

  async join(channel) {
    if (getVoiceConnection(this.guild.id)) return true;
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: this.guild.id,
      adapterCreator: this.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    connection.on("stateChange", async (oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        try {
          await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
        } catch {
          connection.destroy();
          this.cleanup();
        }
      }
      if (newState.status === VoiceConnectionStatus.Connected) {
        connection.subscribe(this.player);
      }
    });
    return true;
  }

  async play(track) {
    this.current = track;
    this.playing = true;
    try {
      const stream = await playStream(track);
      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
      resource.volume?.setVolume(this.volume / 100);
      this.player.play(resource);
      this.sendNowPlaying();
    } catch (error) {
      console.error(`[${this.guild.id}] failed to play "${track.title}":`, error.message);
      this.current = null;
      this.playing = false;
      this.start();
    }
  }

  async start() {
    if (this.current) return;
    if (this.tracks.length === 0) {
      this.playing = false;
      this.scheduleLeave();
      return;
    }
    const track = this.tracks.shift();
    await this.play(track);
  }

  onIdle() {
    if (this.loop === "track" && this.current) {
      this.play(this.current);
    } else if (this.loop === "queue" && this.current) {
      this.tracks.push(this.current);
      this.current = null;
      this.playing = false;
      this.start();
    } else {
      this.current = null;
      this.playing = false;
      this.start();
    }
  }

  async next() {
    this.onIdle();
  }

  add(track) {
    this.tracks.push(track);
  }

  skip() {
    if (this.loop === "track") this.loop = "off";
    this.player.stop();
  }

  pause() {
    this.player.pause();
    this.playing = false;
    return true;
  }

  resume() {
    this.player.unpause();
    this.playing = true;
    return true;
  }

  setVolume(value) {
    this.volume = Math.min(Math.max(value, 0), 100);
    const resource = this.player.state.resource;
    if (resource?.volume) resource.volume.setVolume(this.volume / 100);
    return this.volume;
  }

  toggleLoop() {
    this.loop = this.loop === "off" ? "queue" : this.loop === "queue" ? "track" : "off";
    return this.loop;
  }

  shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  clear() {
    this.tracks = [];
  }

  get status() {
    const state = this.player.state;
    return {
      playing: this.playing,
      paused: state.status === AudioPlayerStatus.Paused,
      current: state.resource ? state.resource.playbackDuration / 1000 : 0,
    };
  }

  scheduleLeave() {
    setTimeout(() => {
      const connection = getVoiceConnection(this.guild.id);
      if (connection && !this.playing && this.tracks.length === 0) {
        connection.destroy();
        this.cleanup();
      }
    }, config.autoLeaveMs);
  }

  cleanup() {
    this.player.stop();
    this.current = null;
    this.tracks = [];
    this.playing = false;
    this.clearNowPlaying();
  }

  summary() {
    if (!this.current) return null;
    return {
      title: this.current.title,
      url: this.current.url,
      duration: formatDuration(this.current.duration),
      thumbnail: this.current.thumbnail,
      author: this.current.author,
    };
  }
}
