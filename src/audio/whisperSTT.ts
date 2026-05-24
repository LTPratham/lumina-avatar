/**
 * Whisper Speech-to-Text Pipeline
 * Handles capturing user audio from the microphone and sending it to Whisper API.
 */

export class WhisperSTT {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  constructor() {
    // Initial setups
  }

  /**
   * Starts recording audio from the user's mic.
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) return;
    this.audioChunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        console.log('Audio recording completed. Size:', audioBlob.size);
        // Stub: In the future, this blob will be sent to the Whisper API route
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('WhisperSTT: Mic recording started.');
    } catch (err) {
      console.error('WhisperSTT: Failed to access microphone:', err);
      throw err;
    }
  }

  /**
   * Stops recording and returns the raw audio data.
   */
  public stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('WhisperSTT: Recording has not started.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.isRecording = false;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      console.log('WhisperSTT: Mic recording stopped.');
      
      // Stop all tracks to release the microphone lock
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }

  /**
   * Transcribes a recorded audio blob by sending it to the backend server.
   */
  public async transcribe(audioBlob: Blob, serverUrl: string = 'http://localhost:3001'): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await fetch(`${serverUrl}/api/stt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (err) {
      console.error('WhisperSTT: Transcription request failed:', err);
      throw err;
    }
  }
}
