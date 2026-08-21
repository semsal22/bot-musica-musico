# 🎵 Pulse Music — Bot de música universal para Discord

Bot de música **100% grátis**, leve, rápido e bonito. Toca YouTube, SoundCloud e Spotify com slash commands e botões de controle.

> Feito com [Discord.js](https://discord.js.org), [@discordjs/voice](https://github.com/discordjs/voice) e [yt-dlp](https://github.com/yt-dlp/yt-dlp) (o motor mais confiável e atualizado para baixar/transmitir áudio).

---

## ✨ Funcionalidades

| Recurso | Detalhe |
|---|---|
| 🎬 **YouTube** | Vídeos, Shorts, Lives e Playlists |
| ☁️ **SoundCloud** | Faixas e Playlists |
| 🟢 **Spotify** | Faixas, Playlists e Álbuns (via YouTube) |
| 🔎 **Busca inteligente** | `/play` aceita texto ou URL, com autocomplete |
| ⏯ **Controles** | Pausar, retomar, pular, parar |
| 🔁 **Loop** | off → fila inteira → música única |
| 🔀 **Shuffle** | Embaralha a fila |
| 🎚 **Volume** | 0 a 100% |
| 📜 **Fila** | Ver e remover músicas |
| 🎛 **Botões** | Now-playing com botões ⏸⏭⏹🔁 |
| 📊 **Progresso** | Barra de progresso ao vivo no embed |
| 🌍 **i18n** | `pt-BR` ou `en` |
| ⏱ **Auto-leave** | Sai do canal sozinho quando a fila acaba |

---

## 📦 Requisitos

- **Node.js** 20+ (recomendado 22)
- **yt-dlp** (motor de áudio)

```bash
# Instalação do yt-dlp (Linux/macOS)
pip install yt-dlp

# ou no Windows
winget install yt-dlp.yt-dlp
```

- **ffmpeg** (para transcodificar o áudio)

```bash
# Debian/Ubuntu
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

---

## 🚀 Como rodar

### 1. Crie o bot no Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** → dê um nome
3. Aba **Bot** → **Reset Token** e copie o token
4. Ative os intents: **Presence**, **Server Members** e **Message Content**
5. Aba **OAuth2 → URL Generator**:
   - Scopes: `bot` + `applications.commands`
   - Bot Permissions: **Connect**, **Speak**, **Use Voice Activity**
   - Abra a URL gerada e convide o bot para seu servidor

### 2. Configure

```bash
cp .env.example .env
```

Preencha no `.env`:

```env
BOT_TOKEN=seu-token-aqui
CLIENT_ID=id-da-aplicacao
```

### 3. Rode

```bash
npm install
npm start
```

Pronto! Os comandos são registrados automaticamente na primeira execução (pode levar alguns segundos para aparecer no Discord).

---

## 🎵 Spotify (opcional, mas grátis)

O bot toca músicas do Spotify procurando a versão no YouTube. Links de **música única** funcionam sem configuração.

Para habilitar **Playlists e Álbuns** completos do Spotify (ainda grátis):

1. Crie um app gratuito em [developers.spotify.com](https://developers.spotify.com) (Dashboard → Create app)
2. Copie o **Client ID** e **Client Secret**
3. Adicione no `.env`:

```env
SPOTIFY_CLIENT_ID=seu-client-id
SPOTIFY_CLIENT_SECRET=seu-client-secret
```

---

## 📋 Comandos

| Comando | Descrição |
|---|---|
| `/play <música ou URL>` | Toca uma música ou adiciona à fila |
| `/skip` | Pula para a próxima música |
| `/stop` | Para e limpa a fila |
| `/pause` / `/resume` | Pausa / retoma |
| `/volume [0-100]` | Ajusta o volume |
| `/loop` | Alterna repetição |
| `/shuffle` | Embaralha a fila |
| `/queue` | Mostra a fila |
| `/remove <posição>` | Remove uma música da fila |
| `/nowplaying` | Mostra o que está tocando |
| `/help` | Lista os comandos |

Dica: no embed "Tocando agora" há **botões** para controle rápido sem digitar nada.

---

## 🗂 Estrutura

```
src/
├── index.js              # Entrada do bot
├── config.js             # Configurações (.env)
├── manager.js            # Gerenciador de filas por servidor
├── commands/             # Slash commands
├── events/               # ready, interactionCreate
├── structures/
│   ├── Track.js          # Modelo de faixa
│   └── MusicQueue.js     # Fila + player de áudio
└── utils/
    ├── search.js         # Motor yt-dlp (YouTube/SoundCloud)
    ├── spotify.js        # Integração Spotify
    ├── embeds.js         # Embeds bonitos + i18n
    ├── format.js         # Formatação de duração/progresso
    └── voice.js          # Verificações de canal de voz
```

---

## 🤝 Licença

MIT. Use, modifique e divirta-se.
