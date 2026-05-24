import { useEffect, useRef, useState } from 'preact/hooks';
import { Rive } from '@rive-app/canvas';

interface AvatarCanvasProps {
  src?: string; // URL to the .riv file
  stateMachineName?: string;
  className?: string;
}

export const AvatarCanvas = ({
  src = '/avatar.riv', // Locally hosted Rive animation file
  stateMachineName = 'State Machine 1',
  className = ''
}: AvatarCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const riveRef = useRef<Rive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const riveInstance = new Rive({
        src,
        canvas: canvasRef.current,
        autoplay: true,
        stateMachines: stateMachineName,
        onLoad: () => {
          setLoading(false);
          console.log('Rive avatar animation loaded successfully.');
          
          // Access inputs if necessary
          const inputs = riveInstance.stateMachineInputs(stateMachineName);
          console.log('Available state machine inputs:', inputs);
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
  }, [src, stateMachineName]);

  // Listen for custom "speak" events to trigger animation states
  useEffect(() => {
    const handleSpeak = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      console.log('Rive canvas triggered speak state for:', customEvent.detail.text);
      if (riveRef.current) {
        const inputs = riveRef.current.stateMachineInputs(stateMachineName);
        // Look for inputs like "isTalking" or "talk" and toggle them if they exist
        const isTalkingInput = inputs.find(i => i.name === 'isTalking' || i.name === 'Talking');
        if (isTalkingInput) {
          isTalkingInput.value = true;
          // Set back to false after a simulated time or when audio finishes
          setTimeout(() => {
            isTalkingInput.value = false;
          }, 3000);
        }
      }
    };

    window.addEventListener('lumina:speak', handleSpeak);
    return () => {
      window.removeEventListener('lumina:speak', handleSpeak);
    };
  }, [stateMachineName]);

  return (
    <div class={`lumina-avatar-container ${className}`} style={containerStyle}>
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
    </div>
  );
};

// Modern styles for the widget avatar container
const containerStyle = {
  width: '180px',
  height: '180px',
  borderRadius: '50%',
  overflow: 'hidden',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  position: 'relative' as const,
  cursor: 'pointer',
  transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
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
};

const spinnerStyle = {
  width: '32px',
  height: '32px',
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
};

// Global keyframe for spinner animation is added dynamically in index.ts styles
