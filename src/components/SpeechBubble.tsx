import { useState, useEffect, useRef } from 'preact/hooks';
import { WhisperSTT } from '../audio/whisperSTT';

interface SpeechBubbleProps {
  initialMessage?: string;
  themeColor?: string;
}

export const SpeechBubble = ({
  initialMessage = "Hey! I'm your onboarding companion. Let's explore the platform together!",
  themeColor = '#6366f1'
}: SpeechBubbleProps) => {
  const [message, setMessage] = useState(initialMessage);
  const stt = useRef(new WhisperSTT());
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Simulated text typing effect for premium micro-interaction feeling
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (index < message.length) {
        setDisplayedText((prev) => prev + message.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25); // Fast typing speed

    return () => clearInterval(interval);
  }, [message]);

  // Listen for speech triggers from the global SDK instance
  useEffect(() => {
    const handleSpeakEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      setMessage(customEvent.detail.text);
    };

    window.addEventListener('lumina:speak', handleSpeakEvent);
    return () => {
      window.removeEventListener('lumina:speak', handleSpeakEvent);
    };
  }, []);

  const getDOMContext = () => {
    try {
      const elements = Array.from(document.querySelectorAll('input, button, p, h1, h2, h3, a, span, label, div[id]'))
        .filter(el => {
          const textContent = el.textContent ? el.textContent.trim() : '';
          const hasText = textContent.length > 0 && textContent.length < 500;
          const isInput = el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA';
          return hasText || isInput;
        })
        .map(el => {
          const id = el.id;
          const tagName = el.tagName.toLowerCase();
          const name = (el as HTMLInputElement).name;
          const placeholder = (el as HTMLInputElement).placeholder;
          const text = el.textContent ? el.textContent.trim() : '';
          
          let selector = '';
          if (id) {
            selector = `#${id}`;
          } else if (tagName === 'input' && name) {
            selector = `input[name="${name}"]`;
          } else if (tagName === 'button' && text) {
            selector = `button`;
          }

          return {
            tag: tagName,
            id: id || undefined,
            name: name || undefined,
            placeholder: placeholder || undefined,
            text: text || undefined,
            selector: selector || undefined
          };
        })
        .filter(el => el.selector || el.text);
      
      return elements;
    } catch (e) {
      console.warn('LuminaAvatar: Failed to collect DOM context:', e);
      return [];
    }
  };

  const highlightElement = (el: HTMLElement) => {
    const originalTransition = el.style.transition;
    const originalOutline = el.style.outline;
    
    el.style.transition = 'outline 0.3s ease';
    el.style.outline = `3px solid ${themeColor}`;
    
    setTimeout(() => {
      el.style.outline = originalOutline;
      setTimeout(() => {
        el.style.transition = originalTransition;
      }, 300);
    }, 2000);
  };

  const executeDOMCommands = (commands: any[]) => {
    commands.forEach((cmd, idx) => {
      setTimeout(() => {
        const { action, selector, value } = cmd;
        console.log(`LuminaAvatar executing command:`, action, selector, value);
        
        if (!selector) return;
        
        const element = document.querySelector(selector) as HTMLElement;
        if (!element) {
          console.warn(`LuminaAvatar: Selector "${selector}" not found on page.`);
          return;
        }

        switch (action) {
          case 'click':
            highlightElement(element);
            setTimeout(() => {
              element.click();
            }, 600);
            break;
            
          case 'fill':
            highlightElement(element);
            setTimeout(() => {
              if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                element.value = value || '';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }, 600);
            break;
            
          case 'align':
            const globalName = (window as any).LuminaAvatarObject || 'LuminaAvatar';
            if ((window as any)[globalName]) {
              (window as any)[globalName]('align', selector);
            }
            break;
            
          case 'highlight':
            highlightElement(element);
            break;
        }
      }, idx * 1500);
    });
  };

  const stopAndProcessAudio = async () => {
    if (!isListeningRef.current) return;
    setIsListening(false);
    isListeningRef.current = false;
    setIsProcessing(true);
    
    try {
      setDisplayedText('Processing speech...');
      const audioBlob = await stt.current.stopRecording();
      setDisplayedText('Transcribing...');
      const domContext = getDOMContext();
      console.log('Sending DOM Context to server:', domContext);
      const result = await stt.current.transcribe(audioBlob, domContext);
      
      // Show user transcription first
      setMessage(`You: "${result.text}"`);
      
      // Let the companion speak the actual LLaMA response generated by the server
      setTimeout(() => {
        const globalName = (window as any).LuminaAvatarObject || 'LuminaAvatar';
        if ((window as any)[globalName] && result.response) {
          (window as any)[globalName]('speak', result.response);
        }
        
        // Execute commands
        if (result.commands && result.commands.length > 0) {
          executeDOMCommands(result.commands);
        }
      }, 1000);
    } catch (err) {
      console.error('LuminaAvatar: Failed to transcribe audio:', err);
      setMessage("Sorry, I couldn't transcribe your audio. Make sure the local dev server is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicToggle = async () => {
    if (!isListening) {
      try {
        setIsListening(true);
        isListeningRef.current = true;
        await stt.current.startRecording(() => {
          console.log('SpeechBubble: silence detected, auto-stopping...');
          stopAndProcessAudio();
        });
      } catch (err) {
        console.error('LuminaAvatar: Failed to start recording:', err);
        setIsListening(false);
        isListeningRef.current = false;
      }
    } else {
      await stopAndProcessAudio();
    }
  };

  return (
    <div style={bubbleContainerStyle}>
      {/* Speech Bubble Content */}
      <div style={bubbleBodyStyle}>
        <p style={textStyle}>
          {displayedText}
          {isTyping && <span style={cursorStyle}>|</span>}
        </p>
      </div>

      {/* Control / Micro-Input Bar */}
      <div style={controlsContainerStyle}>
        <button
          onClick={handleMicToggle}
          disabled={isProcessing}
          style={{
            ...micButtonStyle,
            backgroundColor: isListening ? '#ef4444' : isProcessing ? '#4b5563' : themeColor,
            boxShadow: isListening ? '0 0 12px #ef4444' : isProcessing ? 'none' : `0 4px 10px ${themeColor}40`,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
          }}
          title={isListening ? 'Stop Listening' : isProcessing ? 'Processing...' : 'Speak to Companion'}
        >
          {isListening ? (
            <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>
            </svg>
          ) : (
            <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8"/>
            </svg>
          )}
        </button>

        <div style={statusTextStyle}>
          {isListening ? (
            <span style={{ color: '#ef4444', animation: 'lumina-pulse 1.5s infinite' }}>Listening...</span>
          ) : isProcessing ? (
            <span style={{ color: themeColor, animation: 'lumina-pulse 1.5s infinite' }}>Processing...</span>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Click mic to talk</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const bubbleContainerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'flex-end',
  maxWidth: '280px',
  marginBottom: '12px',
  transition: 'all 0.3s ease',
};

const bubbleBodyStyle = {
  backgroundColor: 'rgba(15, 15, 20, 0.85)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px 16px 4px 16px',
  padding: '12px 16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
  width: '100%',
};

const textStyle = {
  margin: 0,
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#f3f4f6',
  fontWeight: '400',
  letterSpacing: '-0.01em',
};

const cursorStyle = {
  display: 'inline-block',
  marginLeft: '2px',
  fontWeight: 'bold',
  color: '#6366f1',
  animation: 'lumina-blink 0.8s infinite',
};

const controlsContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '8px',
  gap: '8px',
  padding: '2px 4px',
};

const micButtonStyle = {
  border: 'none',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.3s, box-shadow 0.3s',
  outline: 'none',
};

const iconStyle = {
  width: '16px',
  height: '16px',
};

const statusTextStyle = {
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
};
