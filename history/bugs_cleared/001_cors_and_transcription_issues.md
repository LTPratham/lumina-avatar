# Bug Log: CORS and Transcription Formatting Issues Resolved

This entry documents the issues resolved during the initial local validation phase of the LuminaAvatar widget.

## Issues Identified & Cleared

### 1. Rive Canvas CORS Failure
* **Symptom:** Avatar container rendered the warning: `⚠️ Failed to load avatar animation`.
* **Cause:** The browser blocked requests to the third-party Rive URL due to CORS security policies, or the third-party Rive asset URL was modified.
* **Solution:** Downloaded the animation asset directly to the local project folder (`public/avatar.riv`) and modified `AvatarCanvas.tsx` to load locally from `/avatar.riv`.

### 2. Rive State Machine Name Conflict
* **Symptom:** Rive canvas threw `onLoadError` even when pointing to the local file.
* **Cause:** The default placeholder `vehicles.riv` does not contain a state machine named `"State Machine 1"`. Rive's constructor aborts file loading if a requested state machine doesn't exist.
* **Solution:** Updated `AvatarCanvas.tsx` to skip state machine loading when using the placeholder asset, and wrapped all state machine input interactions inside `try-catch` blocks to prevent unhandled runtime errors.

### 3. Absolute Position Placement Mismatch
* **Symptom:** Widget completely disappeared from the screen after the 4-second alignment timeout.
* **Cause:** The parent container `#lumina-avatar-root` was configured with `position: fixed`. When the child widget attempted to position itself using absolute coordinate offsets, it positioned itself relative to the parent context instead of the viewport, pushing the widget off-screen.
* **Solution:** Updated `LuminaWidget.tsx` to apply absolute coordinates directly to the parent container element (`#lumina-avatar-root`) using a stateful `useEffect` hook, resetting it to bottom-right fixed positioning when alignment is inactive.

### 4. Audio Transcription 500 Error
* **Symptom:** Browser console showed `POST http://localhost:3001/api/stt 500 (Internal Server Error)` on microphone submit.
* **Cause:** 
  1. The SDK hardcoded the upload filename to `recording.wav` but the browser was recording in WebM format. The Whisper/Groq API requires files to have matching extensions.
  2. Multer was saving uploaded files without extensions (e.g. `uploads/7f3b8b...`), preventing the OpenAI Node SDK from detecting the file format.
* **Solution:** 
  1. Configured `whisperSTT.ts` to dynamically fetch the browser's recording MIME type (e.g., `audio/webm`) and upload with the correct extension.
  2. Updated `server/index.js` to use `multer.diskStorage` and retain file extensions for the uploaded files on disk.

### 5. Mock TTS Playback Error
* **Symptom:** Console logged `LuminaAvatar TTS playback failed` when clicking "Trigger Speak Command".
* **Cause:** The tiny base64 MP3 used for offline mock mode was invalid and couldn't decode, triggering browser media errors.
* **Solution:** Downloaded a valid 3-second melody to `public/beep.mp3` and configured the Express proxy to serve the local file in Mock Mode.
