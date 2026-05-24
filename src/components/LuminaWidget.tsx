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

  // Side effect to update parent element styles dynamically for absolute coordinates
  useEffect(() => {
    const root = document.getElementById('lumina-avatar-root');
    if (!root) return;

    if (coords.fixed) {
      root.style.position = 'fixed';
      root.style.bottom = '24px';
      root.style.right = '24px';
      root.style.top = 'auto';
      root.style.left = 'auto';
    } else {
      root.style.position = 'absolute';
      root.style.top = `${coords.top}px`;
      root.style.left = `${coords.left}px`;
      root.style.bottom = 'auto';
      root.style.right = 'auto';
    }
  }, [coords]);

  return (
    <div class="lumina-widget-wrapper">
      <SpeechBubble themeColor={themeColor} initialMessage={initialMessage} />
      <AvatarCanvas />
    </div>
  );
};
