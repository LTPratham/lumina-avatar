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

  const [pose, setPose] = useState<'idle' | 'walk' | 'run' | 'kick' | 'stomp' | 'hang'>('idle');

  // Listen for pose triggers
  useEffect(() => {
    const handlePose = (e: Event) => {
      const customEvent = e as CustomEvent<{ pose: any }>;
      if (customEvent.detail && customEvent.detail.pose) {
        setPose(customEvent.detail.pose);
      }
    };
    window.addEventListener('lumina:pose', handlePose);
    return () => {
      window.removeEventListener('lumina:pose', handlePose);
    };
  }, []);

  const getActiveAnimations = () => {
    const activePose = isMoving && pose === 'idle' ? 'walk' : pose;

    let bodyAnim = '';
    let shadowAnim = '';

    switch (activePose) {
      case 'walk':
        bodyAnim = 'lumina-walk 0.4s linear infinite';
        shadowAnim = 'lumina-shadow-walk 0.4s linear infinite';
        break;
      case 'run':
        bodyAnim = 'lumina-walk 0.28s linear infinite';
        shadowAnim = 'lumina-shadow-walk 0.28s linear infinite';
        break;
      case 'stomp':
        bodyAnim = 'lumina-stomp 0.8s ease-out forwards';
        shadowAnim = 'lumina-shadow-stomp 0.8s ease-out forwards';
        break;
      case 'kick':
        bodyAnim = 'lumina-hang-kick 1.0s ease-in-out forwards';
        shadowAnim = 'lumina-shadow-kick 1.0s ease-in-out forwards';
        break;
      case 'hang':
        bodyAnim = 'lumina-hang 0.6s ease-in-out infinite';
        shadowAnim = 'lumina-shadow-hang 0.6s ease-in-out infinite';
        break;
      case 'idle':
      default:
        if (isSpeaking) {
          bodyAnim = 'lumina-speaking-breath 1.2s ease-in-out infinite';
          shadowAnim = 'lumina-shadow-speak 1.2s ease-in-out infinite';
        } else {
          bodyAnim = 'lumina-resting-breath 4s ease-in-out infinite';
          shadowAnim = 'lumina-shadow-breath 4s ease-in-out infinite';
        }
        break;
    }
    return { bodyAnim, shadowAnim };
  };

  const getBackgroundPosition = () => {
    if (pose === 'walk' || pose === 'run' || pose === 'hang' || pose === 'kick' || pose === 'stomp') {
      return '0% 100%'; // Side profile walking sprite for active motion and actions
    }
    return isMoving ? '0% 100%' : bgPosition;
  };

  const { bodyAnim, shadowAnim } = getActiveAnimations();

  const handleMouseEnter = () => {
    if (pose === 'idle' && !isMoving) {
      window.dispatchEvent(new CustomEvent('lumina:pose', { detail: { pose: 'stomp' } }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('lumina:pose', { detail: { pose: 'idle' } }));
      }, 800); // match stomp duration
    }
  };

  return (
    <div 
      className={`lumina-avatar-container ${className}`} 
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
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

      {/* The Animated Character Body (either Image Div or Rive Canvas) */}
      <div
        className="lumina-avatar-body"
        style={{
          width: '100%',
          height: '92%', // Leave space at bottom for shadow
          position: 'absolute' as const,
          top: 0,
          left: 0,
          animation: bodyAnim
        }}
      >
        {isImageAvatar ? (
          <div 
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${src})`,
              backgroundSize: '200% 200%', // 2x2 grid mapping
              backgroundPosition: getBackgroundPosition(), // Side profile (bottom-left) when moving or acting
              transform: isMoving && moveDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)', // Flip when moving left
              transition: 'background-position 0.15s ease-out, transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              backgroundRepeat: 'no-repeat',
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

      {/* Grounded Shadow */}
      <div 
        className="lumina-avatar-shadow"
        style={{
          width: '44px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          filter: 'blur(2px)',
          position: 'absolute' as const,
          bottom: '1px',
          left: 'calc(50% - 22px)',
          zIndex: -1,
          animation: shadowAnim
        }}
      />
    </div>
  );
};

// Modern styles for the widget avatar container
const containerStyle = {
  width: '75px', // width of the full-body character
  height: '135px', // height of the full-body character
  overflow: 'visible', // let shadow and hover bubble overflow cleanly
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
  backgroundColor: 'transparent',
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
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderRadius: '12px',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  zIndex: 10
};
