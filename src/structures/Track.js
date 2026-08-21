export class Track {
  constructor(data) {
    this.title = data.title;
    this.url = data.url;
    this.duration = data.duration ?? 0;
    this.thumbnail = data.thumbnail ?? null;
    this.author = data.author ?? null;
    this.authorAvatar = data.authorAvatar ?? null;
    this.source = data.source ?? "youtube";
    this.live = Boolean(data.live) || data.duration === 0 && this.source === "youtube";
    this.requestedBy = data.requestedBy ?? "Unknown";
    this.requestedId = data.requestedId ?? null;
    this.locale = data.locale ?? "pt-BR";
  }
}
