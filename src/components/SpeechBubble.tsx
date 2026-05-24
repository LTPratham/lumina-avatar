import { useState, useEffect } from 'preact/hooks';

interface SpeechBubbleProps {
  initialMessage?: string;
  themeColor?: string;
}

export const SpeechBubble = ({
  initialMessage = "Hey! I'm your onboarding companion. Let's explore the platform together!",
  themeColor = '#6366f1'
}: SpeechBubbleProps) => {
  const [message, setMessage] = useState(initialMessage);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

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

  const handleMicToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      console.log('LuminaAvatar: Speech recording started.');
      // Stub: Trigger Whisper STT capture
    } else {
      console.log('LuminaAvatar: Speech recording stopped.');
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
          style={{
            ...micButtonStyle,
            backgroundColor: isListening ? '#ef4444' : themeColor,
            boxShadow: isListening ? '0 0 12px #ef4444' : `0 4px 10px ${themeColor}40`,
          }}
          title={isListening ? 'Stop Listening' : 'Speak to Companion'}
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
