/**
 * ElevenLabs Text-to-Speech Streaming Client
 * Handles real-time streaming voice synthesis playback in the browser.
 */

export class ElevenLabsTTS {
  private audioElement: HTMLAudioElement | null = null;
  public isPlaying = false;

  constructor() {
    // Empty constructor
  }

  /**
   * Streams text to audio synthesis.
   */
  public async speakStream(text: string, serverUrl: string = 'http://localhost:3001'): Promise<void> {
    console.log(`ElevenLabsTTS: Initiating speech synthesis: "${text}"`);
    
    // Dispatch event to sync animation
    const speakEvent = new CustomEvent('lumina:speak', { detail: { text } });
    window.dispatchEvent(speakEvent);

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    return new Promise((resolve, reject) => {
      const encodedText = encodeURIComponent(text);
      this.audioElement = new Audio(`${serverUrl}/api/tts?text=${encodedText}`);
      this.isPlaying = true;

      this.audioElement.onended = () => {
        this.isPlaying = false;
        resolve();
      };

      this.audioElement.onerror = (e) => {
        this.isPlaying = false;
        reject(e);
      };

      this.audioElement.play().catch((err) => {
        this.isPlaying = false;
        reject(err);
      });
    });
  }

  /**
   * Stops any currently playing synthesized speech.
   */
  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
      console.log('ElevenLabsTTS: Speech playback stopped.');
    }
    this.isPlaying = false;
  }
}
