/**
 * Element Alignment Utility
 * Calculates positions and offsets of DOM elements to guide the avatar flow next to target features.
 */

export interface AlignmentPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'viewport';
}

/**
 * Computes coordinates of a target element and determines optimal placement of the avatar widget.
 */
export function calculateElementAlignment(
  targetSelector: string,
  preferredPlacement: AlignmentPosition['placement'] = 'left',
  offset: number = 24
): AlignmentPosition {
  const target = document.querySelector(targetSelector);
  
  if (!target) {
    // Fallback: If target doesn't exist, place in bottom-right viewport corner
    return {
      top: window.innerHeight - 250,
      left: window.innerWidth - 300,
      width: 0,
      height: 0,
      placement: 'viewport'
    };
  }

  const rect = target.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  let top = rect.top + scrollTop;
  let left = rect.left + scrollLeft;

  switch (preferredPlacement) {
    case 'top':
      top = rect.top + scrollTop - 200 - offset; // Estimate avatar height as ~200px
      left = rect.left + scrollLeft + (rect.width / 2) - 90; // Center avatar
      break;
    case 'bottom':
      top = rect.bottom + scrollTop + offset;
      left = rect.left + scrollLeft + (rect.width / 2) - 90;
      break;
    case 'left':
      top = rect.top + scrollTop + (rect.height / 2) - 100;
      left = rect.left + scrollLeft - 180 - offset; // Estimate avatar width as ~180px
      break;
    case 'right':
      top = rect.top + scrollTop + (rect.height / 2) - 100;
      left = rect.right + scrollLeft + offset;
      break;
    default:
      // Fallback
      top = rect.top + scrollTop;
      left = rect.right + scrollLeft + offset;
  }

  // Constrain inside viewport boundaries
  top = Math.max(offset, Math.min(top, document.documentElement.scrollHeight - 250 - offset));
  left = Math.max(offset, Math.min(left, document.documentElement.scrollWidth - 200 - offset));

  return {
    top,
    left,
    width: rect.width,
    height: rect.height,
    placement: preferredPlacement
  };
}
