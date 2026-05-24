# LuminaAvatar Phase 3: Intelligent Interaction & Auto-Silence Detection

This plan implements intelligent LLM-generated companion responses using your Groq API key and integrates client-side Voice Activity Detection (VAD) using the Web Audio API to automatically stop recording when the user pauses speaking.

## Proposed Changes

### 1. Backend LLM Response Generation

#### [MODIFY] [server/index.js](file:///d:/projects/lumina-avatar/server/index.js)
Modify `/api/stt` to take the transcribed text and call the Groq LLaMA completion endpoint (`llama3-8b-8192` model) to generate a friendly, natural companion response. Return both `text` (transcript) and `response` (AI reply).

### 2. Client-Side Voice Activity Detection (VAD)

#### [MODIFY] [whisperSTT.ts](file:///d:/projects/lumina-avatar/src/audio/whisperSTT.ts)
Implement Web Audio API analysis (`AudioContext` and `AnalyserNode`) during microphone recording to monitor input volume. Set up a silence detection trigger that fires when volume remains below a threshold for 1.5 seconds.

### 3. Component Linking

#### [MODIFY] [SpeechBubble.tsx](file:///d:/projects/lumina-avatar/src/components/SpeechBubble.tsx)
Update the microphone toggle logic to start silence detection, automatically trigger stop/transcription when silence is detected, and speak the AI-generated reply.

## Verification Plan

### Manual Verification
- Start the server (`npm run server`) and client (`npm run dev`).
- Click the microphone and speak. Wait 1.5 seconds without talking.
- Verify that the microphone automatically turns off (stops recording) without clicking.
- Verify that the speech bubble displays your transcript, and the avatar speaks the intelligent LLaMA reply aloud.
