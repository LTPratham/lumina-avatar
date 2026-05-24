# LuminaAvatar Phase 2: Voice & Audio Integration Plan

This phase implements real-time audio capture and streaming synthesis. We will build the client-side audio recorders/players and set up a local Node/Express backend server to securely proxy requests to third-party APIs (OpenAI/ElevenLabs) without leaking API keys in the client widget bundle.

## User Review Required

> [!IMPORTANT]
> - **API Key Security**: For safety and B2B SaaS architecture, API keys (OpenAI and ElevenLabs) must never be embedded directly into the client-side widget. We will set up a local Node/Express server (`server/index.js`) to act as a secure gateway.
> - **Audio Latency**: Real-time voice interaction requires low latency. We will configure ElevenLabs TTS streaming using their chunked HTTP/WebSocket API and decode the raw audio in the browser.

## Open Questions

> [!IMPORTANT]
> 1. Do you have OpenAI and ElevenLabs API keys ready for testing? (If not, we can use mock local responses that simulate typing and voice output for offline development).

## Proposed Changes

### Backend Proxy Gateway

#### [NEW] [server/index.js](file:///d:/projects/lumina-avatar/server/index.js)
A lightweight Node/Express server that exposes `/api/stt` (transcribes client audio using Whisper API) and `/api/tts` (streams audio from ElevenLabs API).

#### [NEW] [.env.example](file:///d:/projects/lumina-avatar/.env.example)
Template for setting environment variables (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`).

### Client-Side Audio Integration

#### [MODIFY] [whisperSTT.ts](file:///d:/projects/lumina-avatar/src/audio/whisperSTT.ts)
Implement the microphone recording engine using browser `MediaRecorder` and send captured audio blobs to the `/api/stt` endpoint.

#### [MODIFY] [elevenLabsTTS.ts](file:///d:/projects/lumina-avatar/src/audio/elevenLabsTTS.ts)
Implement stream fetching from `/api/tts` and schedule chunked playback using the browser's Web Audio API (`AudioContext`).

### Verification Plan

### Automated/Manual Tests
- Start the server (`npm run server`) and widget client in dev mode.
- Press the microphone button in the demo page: speak, verify that audio is sent to the local proxy, and ensure transcript text is displayed in the speech bubble.
- Trigger the speak action: verify that synthetic audio chunks load and play back through the browser speaker.
