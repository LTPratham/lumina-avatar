/**
 * Element Alignment Utility
 * Calculates positions and offsets of DOM elements to guide the avatar flow next to target features.
 */

export interface AlignmentPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'viewport' | 'center' | 'hang-left' | 'hang-right';
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
      top: window.innerHeight - 175,
      left: window.innerWidth - 105,
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
      top = rect.top + scrollTop - 135 - offset; // Height is 135px
      left = rect.left + scrollLeft + (rect.width / 2) - 37; // Center avatar (width 75px)
      break;
    case 'bottom':
      top = rect.bottom + scrollTop + offset;
      left = rect.left + scrollLeft + (rect.width / 2) - 37;
      break;
    case 'left':
      top = rect.top + scrollTop + (rect.height / 2) - 67;
      left = rect.left + scrollLeft - 75 - offset;
      break;
    case 'right':
      top = rect.top + scrollTop + (rect.height / 2) - 67;
      left = rect.right + scrollLeft + offset;
      break;
    case 'center':
      top = rect.top + scrollTop + (rect.height / 2) - 67;
      left = rect.left + scrollLeft + (rect.width / 2) - 37;
      break;
    case 'hang-left':
      top = rect.top + scrollTop - 40; // overlap vertically
      left = rect.left + scrollLeft - 60; // overlap edge
      break;
    case 'hang-right':
      top = rect.top + scrollTop - 40;
      left = rect.right + scrollLeft - 15;
      break;
    default:
      top = rect.top + scrollTop;
      left = rect.right + scrollLeft + offset;
  }

  // Constrain inside viewport boundaries
  top = Math.max(offset, Math.min(top, document.documentElement.scrollHeight - 250 - offset));
  left = Math.max(offset, Math.min(left, document.documentElement.scrollWidth - 150 - offset));

  return {
    top,
    left,
    width: rect.width,
    height: rect.height,
    placement: preferredPlacement
  };
}
