// Snow effect toggle handler
(function() {
  'use strict';

  // Check if it's December (month 11, 0-indexed)
  const isDecember = new Date().getMonth() === 11;

  if (!isDecember) {
    return; // Exit early if not December
  }

  // Initialize snow state from localStorage
  const getSnowState = () => {
    const stored = localStorage.getItem('snowActive');
    return stored !== 'false'; // Default to true if not set
  };

  // Initialize or get snow instance
  const initSnow = () => {
    if (window.snow) {
      return window.snow;
    }

    if (typeof window.Snowflakes !== 'undefined') {
      window.snow = new window.Snowflakes({
        color: "#e8f4f7"
      });
      return window.snow;
    }

    return null;
  };

  // Toggle snow effect
  const toggleSnow = (show) => {
    const snowInstance = initSnow();
    if (!snowInstance) {
      console.warn('Snowflakes library not loaded yet');
      return;
    }

    if (show) {
      snowInstance.show();
    } else {
      snowInstance.hide();
    }
  };

  // Initialize snow on page load
  const initializeSnow = () => {
    const snowActive = getSnowState();
    const snowInstance = initSnow();
    
    if (snowInstance) {
      if (snowActive) {
        snowInstance.show();
      } else {
        snowInstance.hide();
      }
    }
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSnow);
  } else {
    initializeSnow();
  }

  // Expose toggle function globally
  window.toggleSnowEffect = function() {
    const currentState = getSnowState();
    const newState = !currentState;
    
    localStorage.setItem('snowActive', String(newState));
    toggleSnow(newState);
    
    // Update button state
    const button = document.getElementById('snow-toggle-btn');
    if (button) {
      button.setAttribute('aria-pressed', String(newState));
      button.classList.toggle('active', newState);
    }
    
    return newState;
  };

  // Initialize button state and visibility
  const initButton = () => {
    const button = document.getElementById('snow-toggle-btn');
    if (button) {
      // Show button only in December
      if (isDecember) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
        return;
      }
      
      const snowActive = getSnowState();
      button.setAttribute('aria-pressed', String(snowActive));
      button.classList.toggle('active', snowActive);
    }
  };

  // Initialize button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButton);
  } else {
    initButton();
  }
})();

