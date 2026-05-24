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

  public async speakStream(text: string, serverUrl: string = 'http://localhost:3001'): Promise<void> {
    console.log(`ElevenLabsTTS: Initiating speech synthesis: "${text}"`);
    
    // Dispatch event to sync animation
    const speakEvent = new CustomEvent('lumina:speak', { detail: { text } });
    window.dispatchEvent(speakEvent);

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(`${serverUrl}/api/tts?text=${encodedText}`);

      if (!response.ok) {
        throw new Error(`TTS server returned status: ${response.status}`);
      }

      const isMock = response.headers.get('x-tts-mock') === 'true';

      if (isMock) {
        console.log('ElevenLabsTTS: Server is in Mock Mode. Falling back to Browser SpeechSynthesis...');
        return new Promise((resolve) => {
          this.isPlaying = true;
          const utterance = new SpeechSynthesisUtterance(text);
          
          utterance.onend = () => {
            this.isPlaying = false;
            resolve();
          };

          utterance.onerror = () => {
            this.isPlaying = false;
            resolve();
          };

          // Find a nice voice
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google')));
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          window.speechSynthesis.speak(utterance);
        });
      }

      // Live ElevenLabs playback
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise((resolve, reject) => {
        this.audioElement = new Audio(audioUrl);
        this.isPlaying = true;

        this.audioElement.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        this.audioElement.onerror = (e) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          reject(e);
        };

        this.audioElement.play().catch((err) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          reject(err);
        });
      });
    } catch (err) {
      console.warn('ElevenLabsTTS: TTS server request failed, falling back to Browser SpeechSynthesis:', err);
      return new Promise((resolve) => {
        this.isPlaying = true;
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onend = () => {
          this.isPlaying = false;
          resolve();
        };

        utterance.onerror = () => {
          this.isPlaying = false;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    }
  }

  /**
   * Stops any currently playing synthesized speech.
   */
  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    console.log('ElevenLabsTTS: Speech playback stopped.');
  }
}
