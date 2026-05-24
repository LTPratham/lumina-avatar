import { render, h } from 'preact';
import { LuminaWidget } from '../components/LuminaWidget';
import { ElevenLabsTTS } from '../audio/elevenLabsTTS';



// Define configuration interfaces
export interface LuminaTheme {
  primaryColor?: string;
  accentColor?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export interface LuminaConfig {
  projectId: string;
  theme?: LuminaTheme;
  persona?: string;
  targetElement?: string;
  onReady?: () => void;
}

class LuminaAvatarSDK {
  private config: LuminaConfig | null = null;
  private container: HTMLDivElement | null = null;
  private isInitialized = false;
  private tts = new ElevenLabsTTS();

  constructor() {
    this.processQueue();
  }

  /**
   * Initializes the SDK with configuration options.
   */
  public init(config: LuminaConfig) {
    if (this.isInitialized) {
      console.warn('LuminaAvatar is already initialized.');
      return;
    }
    this.config = config;
    this.isInitialized = true;
    
    // Create widget container
    this.container = document.createElement('div');
    this.container.id = 'lumina-avatar-root';
    document.body.appendChild(this.container);

    // Apply styles to container
    this.applyStyles();

    // Render the initial UI
    this.renderUI();

    // Trigger onReady callback if provided
    if (config.onReady) {
      config.onReady();
    }
    console.log('LuminaAvatar successfully initialized for project:', config.projectId);
  }

  /**
   * Triggers the avatar to speak a phrase.
   */
  public speak(text: string) {
    if (!this.isInitialized) {
      console.error('LuminaAvatar: SDK not initialized. Call "init" first.');
      return;
    }
    console.log('LuminaAvatar speaking:', text);
    this.tts.speakStream(text).catch(err => {
      console.error('LuminaAvatar TTS playback failed:', err);
    });
  }

  /**
   * Aligns the avatar relative to a specific DOM element.
   */
  public alignTo(selector: string) {
    if (!this.isInitialized) return;
    const target = document.querySelector(selector);
    if (!target) {
      console.warn(`LuminaAvatar target element "${selector}" not found.`);
      return;
    }
    console.log('LuminaAvatar aligning to target:', selector);
    const event = new CustomEvent('lumina:align', { detail: { selector } });
    window.dispatchEvent(event);
  }

  /**
   * Process any calls queued before the main SDK script loaded.
   */
  private processQueue() {
    const globalName = (window as any).LuminaAvatarObject || 'LuminaAvatar';
    const queue = (window as any)[globalName]?.q || [];

    // Replace the global function with our direct SDK caller
    (window as any)[globalName] = (cmd: string, ...args: any[]) => {
      this.executeCommand(cmd, args);
    };

    // Execute queued commands in order
    for (const item of queue) {
      const cmd = item[0];
      const args = Array.prototype.slice.call(item, 1);
      this.executeCommand(cmd, args);
    }
  }

  private executeCommand(cmd: string, args: any[]) {
    switch (cmd) {
      case 'init':
        if (args[0]) this.init(args[0]);
        break;
      case 'speak':
        if (typeof args[0] === 'string') this.speak(args[0]);
        break;
      case 'align':
        if (typeof args[0] === 'string') this.alignTo(args[0]);
        break;
      case 'chat':
        if (typeof args[0] === 'string') {
          console.log('LuminaAvatar SDK dispatching chat event:', args[0]);
          const event = new CustomEvent('lumina:chat', { detail: { text: args[0] } });
          window.dispatchEvent(event);
        }
        break;
      default:
        console.warn(`LuminaAvatar: Unknown command "${cmd}"`);
    }
  }

  private applyStyles() {
    if (!this.container) return;
    const style = document.createElement('style');
    style.id = 'lumina-avatar-styles';
    style.textContent = `
      #lumina-avatar-root {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #lumina-avatar-root * {
        box-sizing: border-box;
        pointer-events: auto;
      }
      
      @keyframes lumina-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes lumina-blink {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
      
      @keyframes lumina-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      @keyframes lumina-resting-breath {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.015); }
      }

      @keyframes lumina-speaking-breath {
        0%, 100% { transform: scale(1.015); }
        50% { transform: scale(1.04); }
      }
    `;
    document.head.appendChild(style);
  }

  private renderUI() {
    if (!this.container || !this.config) return;
    render(
      h(LuminaWidget, {
        themeColor: this.config.theme?.primaryColor,
        targetElementSelector: this.config.targetElement,
      }),
      this.container
    );
  }
}

// Instantiate and expose globally
const sdkInstance = new LuminaAvatarSDK();
export default sdkInstance;
