/**
 * Accessibility helper utilities for the Equipment Lending System
 * Provides utilities to enhance accessibility compliance
 */

/**
 * Announce content to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management utility
 * @param {string} selector - CSS selector for element to focus
 * @param {number} delay - Delay before focusing (ms)
 */
export const focusElement = (selector, delay = 0) => {
  if (typeof window === 'undefined') return;

  setTimeout(() => {
    const element = document.querySelector(selector);
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, delay);
};

/**
 * Skip link functionality
 * @param {string} targetId - ID of target element
 */
export const skipToContent = (targetId) => {
  if (typeof window === 'undefined') return;

  const target = document.getElementById(targetId);
  if (target) {
    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate animation duration based on user preference
 * @param {number} normalDuration - Normal animation duration in ms
 * @param {number} reducedDuration - Reduced animation duration in ms
 * @returns {number} Appropriate duration
 */
export const getAnimationDuration = (normalDuration = 300, reducedDuration = 0) => {
  return prefersReducedMotion() ? reducedDuration : normalDuration;
};

/**
 * Keyboard navigation helper
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} handlers - Object with key handlers
 */
export const handleKeyboardNavigation = (event, handlers) => {
  const { key } = event;
  
  if (handlers[key]) {
    event.preventDefault();
    handlers[key](event);
  }
};

/**
 * Generate unique ID for accessibility
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateAccessibleId = (prefix = 'accessible') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate color contrast (simplified check)
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {Object} Contrast information
 */
export const checkColorContrast = (foreground, background) => {
  // This is a simplified implementation
  // In production, you might want to use a more robust library
  
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getLuminance = (rgb) => {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return { ratio: null, level: 'unknown' };
  }

  const fgLum = getLuminance(fg);
  const bgLum = getLuminance(bg);
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

  let level = 'fail';
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  else if (ratio >= 3) level = 'AA-large';

  return { ratio: Math.round(ratio * 100) / 100, level };
};

/**
 * Accessibility testing helper
 * @returns {Object} Accessibility test results
 */
export const runAccessibilityChecks = () => {
  if (typeof window === 'undefined') return {};

  const results = {
    images: [],
    links: [],
    headings: [],
    forms: []
  };

  // Check images for alt text
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    results.images.push({
      index,
      hasAlt: img.hasAttribute('alt'),
      altText: img.getAttribute('alt'),
      src: img.src
    });
  });

  // Check links for accessible names
  const links = document.querySelectorAll('a');
  links.forEach((link, index) => {
    const text = link.textContent.trim();
    const ariaLabel = link.getAttribute('aria-label');
    const title = link.getAttribute('title');
    
    results.links.push({
      index,
      hasAccessibleName: !!(text || ariaLabel || title),
      text,
      ariaLabel,
      href: link.href
    });
  });

  // Check heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading, index) => {
    results.headings.push({
      index,
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent.trim(),
      hasId: heading.hasAttribute('id')
    });
  });

  // Check form elements for labels
  const formElements = document.querySelectorAll('input, select, textarea');
  formElements.forEach((element, index) => {
    const id = element.getAttribute('id');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;
    
    results.forms.push({
      index,
      type: element.type || element.tagName.toLowerCase(),
      hasLabel: !!(label || ariaLabel || ariaLabelledby),
      id,
      ariaLabel
    });
  });

  return results;
};

export default {
  announceToScreenReader,
  focusElement,
  skipToContent,
  prefersReducedMotion,
  getAnimationDuration,
  handleKeyboardNavigation,
  generateAccessibleId,
  checkColorContrast,
  runAccessibilityChecks
};