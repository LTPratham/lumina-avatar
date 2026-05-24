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
  public alignTo(selector: string, placement?: string) {
    if (!this.isInitialized) return;
    const target = document.querySelector(selector);
    if (!target) {
      console.warn(`LuminaAvatar target element "${selector}" not found.`);
      return;
    }
    console.log('LuminaAvatar aligning to target:', selector, placement);
    const event = new CustomEvent('lumina:align', { detail: { selector, placement } });
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
        if (typeof args[0] === 'string') this.alignTo(args[0], args[1]);
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
        transition: all 1.6s cubic-bezier(0.25, 1, 0.5, 1);
      }
      #lumina-avatar-root * {
        box-sizing: border-box;
        pointer-events: auto;
      }
      
      .lumina-widget-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
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
        0%, 100% { transform: scale(1, 1) translateY(0); }
        50% { transform: scale(1.02, 0.98) translateY(2px); }
      }

      @keyframes lumina-speaking-breath {
        0%, 100% { transform: scale(1, 1) translateY(0); }
        50% { transform: scale(1.04, 0.96) translateY(3px); }
      }

      @keyframes lumina-walk {
        0%, 100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
        25% { transform: translateY(-14px) scale(0.93, 1.07) rotate(-7deg); }
        50% { transform: translateY(0) scale(1.07, 0.93) rotate(0deg); }
        75% { transform: translateY(-14px) scale(0.93, 1.07) rotate(7deg); }
      }

      @keyframes lumina-hang {
        0%, 100% { transform: rotate(15deg) translateY(0); }
        50% { transform: rotate(25deg) translateY(-2px); }
      }

      @keyframes lumina-stomp {
        0% { transform: translateY(0) scale(1, 1) rotate(0deg); }
        15% { transform: translateY(-50px) scale(0.85, 1.15) rotate(-10deg); }
        35% { transform: translateY(-55px) scale(0.85, 1.15) rotate(-15deg); }
        50% { transform: translateY(0) scale(1.2, 0.8) rotate(0deg); } /* Smash impact! */
        70% { transform: translateY(-8px) scale(0.95, 1.05) rotate(5deg); }
        100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
      }

      @keyframes lumina-hang-kick {
        0% { transform: translateY(0) scale(1, 1) rotate(0deg); }
        15% { transform: translateY(-25px) rotate(-30deg) translateX(-15px); } /* Jump & Grab Edge */
        40% { transform: translateY(-20px) rotate(22deg) translateX(30px) scaleX(1.1); } /* Swing & Kick Strike! */
        65% { transform: translateY(-25px) rotate(-15deg) translateX(-10px); } /* Swing back */
        85% { transform: translateY(0) scale(1.05, 0.95) rotate(0deg); } /* Drop down */
        100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
      }

      @keyframes lumina-shadow-breath {
        0%, 100% { transform: scale(1); opacity: 0.25; }
        50% { transform: scale(1.06); opacity: 0.2; }
      }

      @keyframes lumina-shadow-speak {
        0%, 100% { transform: scale(1); opacity: 0.25; }
        50% { transform: scale(1.1); opacity: 0.15; }
      }

      @keyframes lumina-shadow-walk {
        0%, 100% { transform: scale(1); opacity: 0.25; }
        25% { transform: scale(0.65); opacity: 0.1; }
        50% { transform: scale(1); opacity: 0.25; }
        75% { transform: scale(0.65); opacity: 0.1; }
      }

      @keyframes lumina-shadow-hang {
        0%, 50%, 100% { transform: scale(0.5); opacity: 0.05; }
      }

      @keyframes lumina-shadow-stomp {
        0% { transform: scale(1); opacity: 0.25; }
        15%, 35% { transform: scale(0.35); opacity: 0.05; }
        50% { transform: scale(1.4); opacity: 0.45; } /* Impact splash */
        70% { transform: scale(0.9); opacity: 0.2; }
        100% { transform: scale(1); opacity: 0.25; }
      }

      @keyframes lumina-shadow-kick {
        0% { transform: scale(1); opacity: 0.25; }
        15% { transform: scale(0.6) translateX(-5px); opacity: 0.1; }
        40% { transform: scale(0.9) translateX(10px); opacity: 0.2; }
        65% { transform: scale(0.6) translateX(-3px); opacity: 0.1; }
        85% { transform: scale(1.1); opacity: 0.3; }
        100% { transform: scale(1); opacity: 0.25; }
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
