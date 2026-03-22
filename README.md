# Hey Claude

A voice-activated desktop assistant powered by [Claude](https://www.anthropic.com/claude). Say **"Hey Claude"** to start a hands-free conversation — your speech is transcribed, sent to Claude via the CLI, and the response is spoken back to you.

Built with Electron, React, and TypeScript.

## How It Works

```
"Hey Claude" ──> Speech-to-Text ──> Claude CLI ──> Text-to-Speech
  (Porcupine)    (Web Speech API)   (subprocess)   (Kokoro/ElevenLabs/OpenAI)
```

1. **Wake Word Detection** — Picovoice Porcupine continuously listens for "Hey Claude" in the background using on-device processing
2. **Speech-to-Text** — The Web Speech API captures and transcribes your spoken query in real time
3. **Claude CLI** — Your transcribed prompt is sent to the `claude` CLI as a subprocess, with streaming response output
4. **Text-to-Speech** — Claude's response is spoken aloud using your choice of TTS provider

## Features

- **Always-on wake word detection** — local, low-latency keyword spotting via Picovoice Porcupine
- **Real-time transcription** — see your words appear as you speak
- **Streaming responses** — Claude's reply streams into the UI as it generates
- **Multiple TTS providers** — Kokoro (local/free), Web Speech API (built-in), ElevenLabs, or OpenAI
- **System tray** — runs in the background, always ready
- **Always-on-top window** — frameless, transparent, stays visible during conversations
- **Configurable** — sensitivity, TTS provider, voice selection, and API keys via the settings panel
- **Animated UI** — Framer Motion animations for listening, processing, and speaking states

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Claude CLI** installed and authenticated (`claude` available in your PATH)
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- **Picovoice Access Key** — free tier available at [console.picovoice.ai](https://console.picovoice.ai)
- **Porcupine wake word model** — a `hey-claude.ppn` file in the project root (see [Wake Word Model](#wake-word-model))

## Installation

```bash
git clone https://github.com/Traves-Theberge/Hey-Claude.git
cd Hey-Claude
npm install
```

## Usage

### Development

```bash
npm run dev
```

This builds the renderer with Vite and launches Electron.

For hot-reloading the renderer only (without Electron):

```bash
npm run dev:renderer
```

### Production

```bash
npm run build      # Compile TypeScript + bundle React
npm run start      # Launch the built app
npm run package    # Package as a distributable (electron-builder)
```

### First Run

1. Launch the app with `npm run dev`
2. Click the gear icon to open **Settings**
3. Enter your **Picovoice Access Key**
4. Select a **TTS provider** and configure its API key if needed
5. Close settings — the app will start listening for "Hey Claude"

You can also click the microphone button to start a conversation without the wake word.

## Configuration

Settings are stored in `~/.hey-claude-config.json` and can be changed via the in-app settings panel.

| Setting | Default | Description |
|---------|---------|-------------|
| `picovoiceAccessKey` | `""` | Your Picovoice API key (required for wake word) |
| `ttsProvider` | `"kokoro"` | TTS engine: `kokoro`, `web-speech`, `elevenlabs`, or `openai` |
| `sensitivity` | `0.5` | Wake word sensitivity (0–1). Higher = more sensitive |
| `kokoroVoice` | `"af_bella"` | Voice name for Kokoro TTS |
| `elevenLabsApiKey` | `""` | ElevenLabs API key |
| `elevenLabsVoiceId` | `"pNInz6obpgDQGcFmaJgB"` | ElevenLabs voice ID |
| `openAiApiKey` | `""` | OpenAI API key |
| `openAiVoice` | `"alloy"` | OpenAI voice: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer` |

## TTS Providers

| Provider | Requires API Key | Runs Locally | Quality |
|----------|-----------------|-------------|---------|
| **Kokoro** (default) | No | Yes (ONNX) | Good |
| **Web Speech API** | No | Yes (browser) | Basic |
| **ElevenLabs** | Yes | No | Excellent |
| **OpenAI** | Yes | No | Very Good |

Kokoro runs entirely on-device using an ONNX model — no API key or internet connection required for TTS. Web Speech API uses the browser's built-in synthesis. ElevenLabs and OpenAI offer higher quality voices but require API keys and network access.

## Wake Word Model

The app requires a Porcupine `.ppn` model file for wake word detection. Place it in the project root as `hey-claude.ppn`.

You can create a custom wake word model at the [Picovoice Console](https://console.picovoice.ai):
1. Create an account and get your access key
2. Go to **Porcupine** > **Create Keyword**
3. Enter "Hey Claude" as the wake phrase
4. Download the `.ppn` file for your platform (Linux/macOS/Windows)
5. Place it in the project root as `hey-claude.ppn`

## Architecture

```
src/
├── main/                          # Electron main process (Node.js)
│   ├── main.ts                    # App lifecycle, window, IPC handlers
│   ├── wake-word-detector.ts      # Porcupine wake word integration
│   ├── claude-cli.ts              # Claude CLI subprocess management
│   └── tts/                       # TTS provider implementations
│       ├── tts-manager.ts         # Provider router
│       ├── kokoro-tts.ts          # Kokoro local ONNX TTS
│       ├── elevenlabs-tts.ts      # ElevenLabs API
│       └── openai-tts.ts          # OpenAI API
├── preload/
│   └── preload.ts                 # Secure IPC bridge (contextBridge)
└── renderer/                      # React frontend (Chromium)
    ├── App.tsx                    # Root component
    ├── main.tsx                   # React DOM entry
    ├── index.css                  # Tailwind + Claude theme
    ├── lib/
    │   └── ipc.ts                 # IPC channel constants & config types
    ├── hooks/
    │   ├── useConversation.ts     # Conversation state machine
    │   └── useSpeechRecognition.ts # Web Speech API hook
    └── components/
        ├── VoiceOverlay.tsx       # Main conversation UI
        ├── StatusBar.tsx          # Header with controls
        ├── SettingsPanel.tsx      # Settings modal
        ├── ListeningIndicator.tsx # Animated listening visual
        ├── TranscriptionDisplay.tsx # Speech transcript display
        └── ResponseDisplay.tsx    # Claude response display
```

### Conversation State Machine

The app follows a linear state machine for each conversation:

```
idle ──> listening ──> processing ──> responding ──> idle
  │                                                   │
  └──────────── error <───────────────────────────────┘
```

| State | What's happening |
|-------|-----------------|
| **idle** | Waiting for wake word or microphone click |
| **listening** | Capturing speech via Web Speech API, showing real-time transcript |
| **processing** | Prompt sent to Claude CLI, streaming response chunks into the UI |
| **responding** | TTS playing Claude's response aloud |
| **error** | Something went wrong — displayed with dismiss option |

### IPC Flow

- **STT** runs in the renderer (Web Speech API is a browser API)
- **Claude CLI** runs in the main process (Node.js `child_process.spawn`)
- **TTS** splits: Web Speech API runs in the renderer; API-based providers (Kokoro, ElevenLabs, OpenAI) run in the main process and send audio buffers back to the renderer for playback
- The **preload script** bridges all communication with whitelisted IPC channels

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Build + launch Electron |
| `npm run dev:renderer` | Vite dev server (renderer only, with HMR) |
| `npm run build` | Full production build |
| `npm run build:electron` | Compile main process TypeScript only |
| `npm run start` | Launch already-built app |
| `npm run package` | Package distributable with electron-builder |

## Tech Stack

- **Electron** 35 — desktop runtime
- **React** 19 — UI framework
- **TypeScript** 5.8 — type safety
- **Vite** 7 — bundler with HMR
- **Tailwind CSS** 4 — utility-first styling
- **Framer Motion** 12 — animations
- **Picovoice Porcupine** 4 — wake word detection
- **kokoro-js** 1.1 — local ONNX text-to-speech
- **Web Speech API** — browser-native STT and TTS fallback

## License

MIT
