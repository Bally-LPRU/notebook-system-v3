/**
 * Gesture Support Utilities for Mobile Equipment Management
 * Provides touch gesture recognition and handling for mobile devices
 */

export class GestureRecognizer {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      swipeThreshold: 50,
      swipeTimeout: 300,
      tapTimeout: 200,
      doubleTapTimeout: 300,
      longPressTimeout: 500,
      ...options
    };
    
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.endX = 0;
    this.endY = 0;
    this.endTime = 0;
    this.lastTap = 0;
    this.longPressTimer = null;
    this.isLongPress = false;
    
    this.callbacks = {
      swipeLeft: null,
      swipeRight: null,
      swipeUp: null,
      swipeDown: null,
      tap: null,
      doubleTap: null,
      longPress: null,
      pinch: null,
      pan: null
    };
    
    this.init();
  }
  
  init() {
    if (!this.element) return;
    
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isLongPress = false;
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      if (this.callbacks.longPress) {
        this.callbacks.longPress({
          x: this.startX,
          y: this.startY,
          target: e.target
        });
      }
    }, this.options.longPressTimeout);
  }
  
  handleTouchMove(e) {
    // Clear long press timer on move
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    
    // Pan gesture
    if (this.callbacks.pan) {
      this.callbacks.pan({
        deltaX,
        deltaY,
        startX: this.startX,
        startY: this.startY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        target: e.target
      });
    }
  }
  
  handleTouchEnd(e) {
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Don't process if it was a long press
    if (this.isLongPress) {
      return;
    }
    
    const touch = e.changedTouches[0];
    this.endX = touch.clientX;
    this.endY = touch.clientY;
    this.endTime = Date.now();
    
    const deltaX = this.endX - this.startX;
    const deltaY = this.endY - this.startY;
    const deltaTime = this.endTime - this.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check for swipe gestures
    if (distance > this.options.swipeThreshold && deltaTime < this.options.swipeTimeout) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      
      if (Math.abs(angle) < 45) {
        // Swipe right
        if (this.callbacks.swipeRight) {
          this.callbacks.swipeRight({
            distance,
            deltaX,
            deltaY,
            target: e.target
          });
        }
      } else if (Math.abs(angle) > 135) {
        // Swipe left
        if (this.callbacks.swipeLeft) {
          this.callbacks.swipeLeft({
            distance,
            deltaX,
            deltaY,
            target: e.target
          });
        }
      } else if (angle > 45 && angle < 135) {
        // Swipe down
        if (this.callbacks.swipeDown) {
          this.callbacks.swipeDown({
            distance,
            deltaX,
            deltaY,
            target: e.target
          });
        }
      } else if (angle < -45 && angle > -135) {
        // Swipe up
        if (this.callbacks.swipeUp) {
          this.callbacks.swipeUp({
            distance,
            deltaX,
            deltaY,
            target: e.target
          });
        }
      }
    } else if (distance < 10 && deltaTime < this.options.tapTimeout) {
      // Check for double tap
      const now = Date.now();
      if (now - this.lastTap < this.options.doubleTapTimeout) {
        if (this.callbacks.doubleTap) {
          this.callbacks.doubleTap({
            x: this.endX,
            y: this.endY,
            target: e.target
          });
        }
      } else {
        // Single tap
        if (this.callbacks.tap) {
          this.callbacks.tap({
            x: this.endX,
            y: this.endY,
            target: e.target
          });
        }
      }
      this.lastTap = now;
    }
  }
  
  handleTouchCancel(e) {
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
  
  // Register callbacks
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }
  
  // Remove callbacks
  off(event) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = null;
    }
  }
  
  // Destroy gesture recognizer
  destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchmove', this.handleTouchMove);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
      this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    }
  }
}

/**
 * Touch Target Size Utilities
 * Ensures touch targets meet accessibility guidelines (minimum 44px)
 */
export const TouchTargetUtils = {
  // Check if element meets minimum touch target size
  isValidTouchTarget(element) {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  },
  
  // Add touch target padding to small elements
  enhanceTouchTarget(element, minSize = 44) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    if (rect.width < minSize || rect.height < minSize) {
      const paddingX = Math.max(0, (minSize - rect.width) / 2);
      const paddingY = Math.max(0, (minSize - rect.height) / 2);
      
      element.style.padding = `${paddingY}px ${paddingX}px`;
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
    }
  },
  
  // Get all touch targets in container and validate them
  validateTouchTargets(container) {
    const touchElements = container.querySelectorAll('button, a, input, [role="button"], [tabindex]');
    const invalidTargets = [];
    
    touchElements.forEach(element => {
      if (!this.isValidTouchTarget(element)) {
        invalidTargets.push(element);
      }
    });
    
    return invalidTargets;
  }
};

/**
 * Haptic Feedback Utilities
 * Provides tactile feedback for touch interactions
 */
export const HapticFeedback = {
  // Light haptic feedback for button taps
  light() {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  // Medium haptic feedback for selections
  medium() {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  // Heavy haptic feedback for important actions
  heavy() {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  
  // Success feedback
  success() {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
  },
  
  // Error feedback
  error() {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 20, 50, 20, 50]);
    }
  },
  
  // Check if haptic feedback is supported
  isSupported() {
    return 'vibrate' in navigator;
  }
};

/**
 * Mobile Viewport Utilities
 * Handle mobile viewport and safe area considerations
 */
export const ViewportUtils = {
  // Get safe area insets
  getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
    };
  },
  
  // Check if device is in landscape mode
  isLandscape() {
    return window.innerWidth > window.innerHeight;
  },
  
  // Get viewport dimensions excluding safe areas
  getUsableViewport() {
    const insets = this.getSafeAreaInsets();
    return {
      width: window.innerWidth - insets.left - insets.right,
      height: window.innerHeight - insets.top - insets.bottom
    };
  },
  
  // Prevent zoom on double tap
  preventZoom() {
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  }
};

/**
 * Scroll Utilities for Mobile
 * Handle mobile-specific scrolling behaviors
 */
export const ScrollUtils = {
  // Smooth scroll to element with mobile considerations
  scrollToElement(element, options = {}) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
      ...options
    };
    
    // Add offset for mobile keyboards and navigation bars
    const offset = options.offset || 100;
    const elementRect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset + elementRect.top - offset;
    
    window.scrollTo({
      top: scrollTop,
      behavior: defaultOptions.behavior
    });
  },
  
  // Lock scroll (useful for modals)
  lockScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  },
  
  // Unlock scroll
  unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  },
  
  // Check if element is in viewport
  isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= windowHeight + threshold &&
      rect.right <= windowWidth + threshold
    );
  }
};

export default {
  GestureRecognizer,
  TouchTargetUtils,
  HapticFeedback,
  ViewportUtils,
  ScrollUtils
};