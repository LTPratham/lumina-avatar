import { useState, useEffect } from 'preact/hooks';
import { AvatarCanvas } from './AvatarCanvas';
import { SpeechBubble } from './SpeechBubble';
import { calculateElementAlignment } from '../dom/elementAlign';

interface LuminaWidgetProps {
  themeColor?: string;
  initialMessage?: string;
  targetElementSelector?: string;
}

export const LuminaWidget = ({
  themeColor = '#6366f1',
  initialMessage,
  targetElementSelector
}: LuminaWidgetProps) => {
  const [coords, setCoords] = useState<{ top?: number; left?: number; fixed: boolean }>({
    fixed: true // Default to bottom-right fixed viewport position
  });

  useEffect(() => {
    const handleAlignEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ selector: string }>;
      const selector = customEvent.detail.selector;
      
      const align = calculateElementAlignment(selector, 'left');
      setCoords({
        top: align.top,
        left: align.left,
        fixed: false
      });
    };

    window.addEventListener('lumina:align', handleAlignEvent);
    return () => {
      window.removeEventListener('lumina:align', handleAlignEvent);
    };
  }, []);

  // If a target selector was passed directly at init, align immediately
  useEffect(() => {
    if (targetElementSelector) {
      const align = calculateElementAlignment(targetElementSelector, 'left');
      setCoords({
        top: align.top,
        left: align.left,
        fixed: false
      });
    }
  }, [targetElementSelector]);

  const wrapperStyle = coords.fixed
    ? {} // Default styles from #lumina-avatar-root container (fixed bottom-right)
    : {
        position: 'absolute' as const,
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transition: 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
        pointerEvents: 'none' as const
      };

  return (
    <div style={wrapperStyle} class="lumina-widget-wrapper">
      <SpeechBubble themeColor={themeColor} initialMessage={initialMessage} />
      <AvatarCanvas />
    </div>
  );
};
