/**
 * Whisper Speech-to-Text Pipeline
 * Handles capturing user audio from the microphone and sending it to Whisper API.
 */

export class WhisperSTT {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private silenceCheckFrame: number | null = null;

  constructor() {
    // Initial setups
  }

  /**
   * Starts recording audio from the user's mic.
   */
  public async startRecording(onSilenceDetected?: () => void): Promise<void> {
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

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('WhisperSTT: Mic recording started.');

      if (onSilenceDetected) {
        this.setupSilenceDetection(stream, onSilenceDetected);
      }
    } catch (err) {
      console.error('WhisperSTT: Failed to access microphone:', err);
      throw err;
    }
  }

  private setupSilenceDetection(stream: MediaStream, callback: () => void) {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let silenceStart = 0;
      const threshold = 15; // Volume threshold (0-255 scale)
      const silenceDuration = 1800; // 1.8 seconds of silence to be safe and natural

      const checkSilence = () => {
        if (!this.isRecording || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Average frequency volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (average < threshold) {
          if (silenceStart === 0) {
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > silenceDuration) {
            console.log('WhisperSTT: Auto-silence detected.');
            callback();
            return;
          }
        } else {
          silenceStart = 0;
        }

        this.silenceCheckFrame = requestAnimationFrame(checkSilence);
      };

      this.silenceCheckFrame = requestAnimationFrame(checkSilence);
    } catch (e) {
      console.warn('WhisperSTT: Could not start Web Audio VAD analyser:', e);
    }
  }

  public stopRecording(): Promise<Blob> {
    if (this.silenceCheckFrame) {
      cancelAnimationFrame(this.silenceCheckFrame);
      this.silenceCheckFrame = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;

    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('WhisperSTT: Recording has not started.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
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
  public async transcribe(
    audioBlob: Blob, 
    domContext: any[] = [], 
    serverUrl: string = 'http://localhost:3001'
  ): Promise<{ text: string; response: string; commands?: any[] }> {
    const ext = audioBlob.type.split('/')[1]?.split(';')[0] || 'webm';
    const filename = `recording.${ext}`;

    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    formData.append('domContext', JSON.stringify(domContext));

    try {
      const response = await fetch(`${serverUrl}/api/stt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text || '',
        response: data.response || '',
        commands: data.commands || []
      };
    } catch (err) {
      console.error('WhisperSTT: Transcription request failed:', err);
      throw err;
    }
  }
}
