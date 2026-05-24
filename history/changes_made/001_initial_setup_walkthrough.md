# LuminaAvatar Initial Setup Walkthrough

We have completed the project configuration and established the skeleton architecture for the embeddable LuminaAvatar voice companion widget.

## Changes Made

### 1. Build and Tooling Configuration
* **[package.json](file:///D:/projects/lumina-avatar/package.json)**: Configured dependencies for Preact (for rendering interactive elements) and `@rive-app/canvas` (for low-overhead vector animations).
* **[tsconfig.json](file:///D:/projects/lumina-avatar/tsconfig.json)**: Set up strict TypeScript rules using `"jsx": "react-jsx"` and `"jsxImportSource": "preact"` for automatic compilation.
* **[vite.config.ts](file:///D:/projects/lumina-avatar/vite.config.ts)**: Configured Vite library build mode with `vite-plugin-css-injected-by-js` to output a single, minified, self-contained IIFE bundle (`dist/lumina-avatar.js`).

### 2. Core SDK Architecture
* **[loader.ts](file:///D:/projects/lumina-avatar/src/sdk/loader.ts)**: Implemented an asynchronous script injector snippet and programmatic script loader helper.
* **[index.ts](file:///D:/projects/lumina-avatar/src/sdk/index.ts)**: Implemented the global entry point class `LuminaAvatarSDK` to process initial queued commands, attach custom event listeners, and mount the UI to a custom DOM container.

### 3. Widget UI Components (Preact)
* **[LuminaWidget.tsx](file:///D:/projects/lumina-avatar/src/components/LuminaWidget.tsx)**: Root controller linking coordinate alignment, SpeechBubble subtitles, and the Canvas component.
* **[AvatarCanvas.tsx](file:///D:/projects/lumina-avatar/src/components/AvatarCanvas.tsx)**: Handles Rive animation runtime instances, error states, and listens for the `lumina:speak` event to trigger character speaking animations.
* **[SpeechBubble.tsx](file:///D:/projects/lumina-avatar/src/components/SpeechBubble.tsx)**: Real-time subtitle bubbles featuring typing micro-animations, record/mic toggle control bar, and interactive state indicators.

### 4. DOM and Audio API Stubs
* **[elementAlign.ts](file:///D:/projects/lumina-avatar/src/dom/elementAlign.ts)**: Coordinates positioning engine computing boundaries for absolute/relative placements of the avatar near selected DOM elements.
* **[whisperSTT.ts](file:///D:/projects/lumina-avatar/src/audio/whisperSTT.ts)**: MediaRecorder-based voice recorder for future OpenAI Whisper API transcription streaming.
* **[elevenLabsTTS.ts](file:///D:/projects/lumina-avatar/src/audio/elevenLabsTTS.ts)**: Real-time audio stream buffer controller for ElevenLabs text-to-speech output.

---

## Verification & Testing

### 1. Build Verification
Ran `npm run build` to verify compilation.
* Result: **Success**
* Compiled bundle: `dist/lumina-avatar.js` (Size: 175.09 kB; Gzipped: 54.21 kB).
* This bundle contains all logic, components, styling, and the Rive runtime, making it fully self-contained and zero-configuration for clients.

### 2. Local Demo
* Created **[demo/index.html](file:///D:/projects/lumina-avatar/demo/index.html)**: Contains an mock client implementation. The page initializes the widget via the asynchronous loader snippet and provides buttons to trigger SDK actions (`speak`, `align`).
