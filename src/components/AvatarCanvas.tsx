import { useEffect, useRef, useState } from 'preact/hooks';
import { Rive } from '@rive-app/canvas';

interface AvatarCanvasProps {
  src?: string; // URL to the .riv file or image
  stateMachineName?: string;
  className?: string;
  isMoving?: boolean;
  moveDirection?: 'left' | 'right';
}

export const AvatarCanvas = ({
  src = '/avatar.png', // Default to our beautiful new custom cartoon avatar sheet!
  stateMachineName = 'State Machine 1',
  className = '',
  isMoving = false,
  moveDirection = 'left'
}: AvatarCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const riveRef = useRef<Rive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isImageAvatar = src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.webp');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bgPosition, setBgPosition] = useState('0% 0%');

  // Handle Rive initialization if it is a .riv file
  useEffect(() => {
    if (isImageAvatar || !canvasRef.current) {
      setLoading(false);
      return;
    }

    try {
      const riveInstance = new Rive({
        src,
        canvas: canvasRef.current,
        autoplay: true,
        stateMachines: src === '/avatar.riv' ? undefined : stateMachineName,
        onLoad: () => {
          setLoading(false);
          console.log('Rive avatar animation loaded successfully.');
        },
        onLoadError: (err) => {
          console.error('Error loading Rive file:', err);
          setError('Failed to load avatar animation.');
          setLoading(false);
        }
      });

      riveRef.current = riveInstance;
    } catch (e) {
      console.error('Failed to initialize Rive instance:', e);
      setError('WebGL not supported or Rive initialization failed.');
      setLoading(false);
    }

    return () => {
      if (riveRef.current) {
        riveRef.current.cleanup();
        riveRef.current = null;
      }
    };
  }, [src, stateMachineName, isImageAvatar]);

  // Listen for speech triggers from the TTS pipeline
  useEffect(() => {
    const handleSpeak = () => {
      setIsSpeaking(true);
      
      // Also trigger Rive animation if active
      if (riveRef.current && !isImageAvatar) {
        try {
          const inputs = riveRef.current.stateMachineInputs(stateMachineName) || [];
          const isTalkingInput = inputs.find(i => i.name === 'isTalking' || i.name === 'Talking');
          if (isTalkingInput) {
            isTalkingInput.value = true;
          }
        } catch (err) {
          console.warn('LuminaAvatar: Failed to set talk state inputs:', err);
        }
      }
    };

    const handleSpeakEnd = () => {
      setIsSpeaking(false);
      
      if (riveRef.current && !isImageAvatar) {
        try {
          const inputs = riveRef.current.stateMachineInputs(stateMachineName) || [];
          const isTalkingInput = inputs.find(i => i.name === 'isTalking' || i.name === 'Talking');
          if (isTalkingInput) {
            isTalkingInput.value = false;
          }
        } catch (err) {
          console.warn('LuminaAvatar: Failed to clear talk state inputs:', err);
        }
      }
    };

    window.addEventListener('lumina:speak', handleSpeak);
    window.addEventListener('lumina:speak-end', handleSpeakEnd);
    
    return () => {
      window.removeEventListener('lumina:speak', handleSpeak);
      window.removeEventListener('lumina:speak-end', handleSpeakEnd);
    };
  }, [stateMachineName, isImageAvatar]);

  // Image Avatar Animation loop when speaking
  useEffect(() => {
    if (!isImageAvatar || !isSpeaking || isMoving) {
      setBgPosition('0% 0%'); // Default front resting view
      return;
    }

    let frame = 0;
    const interval = setInterval(() => {
      // Alternate between Front-facing quadrant (0% 0%) and Three-Quarter quadrant (100% 0%)
      // This mimics talking/head movements dynamically!
      setBgPosition(frame % 2 === 0 ? '100% 0%' : '0% 0%');
      frame++;
    }, 220); // Sync animation speed

    return () => clearInterval(interval);
  }, [isSpeaking, isImageAvatar, isMoving]);

  return (
    <div 
      className={`lumina-avatar-container ${className}`} 
      style={{
        ...containerStyle,
        // Add subtle breathing visual effect or walking wobble!
        animation: isMoving 
          ? 'lumina-walk 0.4s linear infinite' 
          : isSpeaking 
            ? 'lumina-speaking-breath 1.2s ease-in-out infinite' 
            : 'lumina-resting-breath 4s ease-in-out infinite'
      }}
    >
      {loading && (
        <div style={shimmerStyle}>
          <div style={spinnerStyle}></div>
        </div>
      )}
      {error && (
        <div style={errorStyle}>
          <span>⚠️</span>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{error}</p>
        </div>
      )}

      {isImageAvatar ? (
        <div 
          style={{
            width: '120%', // Make it slightly larger to zoom in on chest/face quadrant nicely
            height: '120%',
            position: 'absolute' as const,
            top: '-5%', // Shift up to center the head/body properly
            left: '-10%',
            backgroundImage: `url(${src})`,
            backgroundSize: '200% 200%', // 2x2 grid mapping
            backgroundPosition: isMoving ? '0% 100%' : bgPosition, // Side profile (bottom-left) when moving
            transform: isMoving && moveDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)', // Flip when moving left
            transition: 'background-position 0.15s ease-out, transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{
            width: '100%',
            height: '100%',
            opacity: loading || error ? 0 : 1,
            transition: 'opacity 0.5s ease',
            display: 'block'
          }}
        />
      )}
    </div>
  );
};

// Modern styles for the widget avatar container
const containerStyle = {
  width: '150px', // slightly more compact and clean profile widget circle
  height: '150px',
  borderRadius: '50%',
  overflow: 'hidden',
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  position: 'relative' as const,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

const shimmerStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(20, 20, 25, 0.85)',
  zIndex: 10
};

const spinnerStyle = {
  width: '28px',
  height: '28px',
  border: '3px solid rgba(99, 102, 241, 0.1)',
  borderTop: '3px solid #6366f1',
  borderRadius: '50%',
  animation: 'lumina-spin 1s linear infinite',
};

const errorStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  color: '#ef4444',
  textAlign: 'center' as const,
  backgroundColor: 'rgba(20, 20, 25, 0.95)',
  zIndex: 10
};
