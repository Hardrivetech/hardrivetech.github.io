/**
 * VeloWeb Site Tracking Script
 *
 * This script should be added to user websites to send performance and analytics data
 * to the VeloWeb platform. Add this script to the <head> section of your website.
 *
 * Usage:
 * 1. Replace YOUR_SITE_ID with the actual site ID from your VeloWeb dashboard
 * 2. Add this script to your website's <head> section
 * 3. The script will automatically collect performance metrics and page view events
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    siteId: 'YOUR_SITE_ID', // Replace with actual site ID from VeloWeb dashboard
    apiEndpoint: 'https://veloweb.pages.dev/api', // Replace with your actual domain
    collectPerformance: true,
    collectAnalytics: true,
    sampleRate: 1.0 // 100% sampling, can be reduced for high-traffic sites
  };

  // Only run if not already loaded and sample rate allows
  function getSecureRandom() {
    if (window.crypto && window.crypto.getRandomValues) {
      // Use cryptographically secure random number generator
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] / (0xFFFFFFFF + 1); // Convert to float between 0 and 1
    } else {
      // Fallback to Math.random() for older browsers
      return Math.random();
    }
  }

  if (window.veloWebTracker || getSecureRandom() > config.sampleRate) {
    return;
  }

  window.veloWebTracker = { version: '1.0.0' };

  // Utility functions
  const utils = {
    // Get current timestamp
    now: function() {
      return new Date().toISOString();
    },

    // Generate unique session ID
    generateSessionId: function() {
      if (window.crypto && window.crypto.randomUUID) {
        // Use cryptographically secure random UUID
        return 'session_' + window.crypto.randomUUID() + '_' + Date.now();
      } else {
        // Fallback for older browsers
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      }
    },

    // Get or create session ID
    getSessionId: function() {
      let sessionId = sessionStorage.getItem('veloWeb_session_id');
      if (!sessionId) {
        sessionId = utils.generateSessionId();
        sessionStorage.setItem('veloWeb_session_id', sessionId);
      }
      return sessionId;
    },

    // Get user ID (if available)
    getUserId: function() {
      return localStorage.getItem('veloWeb_user_id') || null;
    },

    // Send data to API
    sendToAPI: function(endpoint, data) {
      const url = `${config.apiEndpoint}/${endpoint}`;
      const payload = {
        ...data,
        siteId: config.siteId,
        sessionId: utils.getSessionId(),
        userId: utils.getUserId(),
        timestamp: utils.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null
      };

      // Use sendBeacon for better reliability on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, JSON.stringify(payload));
      } else {
        // Fallback to fetch
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(err => console.warn('VeloWeb tracking error:', err));
      }
    }
  };

  // Performance monitoring
  const performanceMonitor = {
    collectMetrics: function() {
      if (!config.collectPerformance || !window.performance) {
        return null;
      }

      const navigation = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      const layoutShiftEntries = performance.getEntriesByType('layout-shift');

      if (!navigation) {
        return null;
      }

      const metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: paintEntries.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0,
        cumulativeLayoutShift: layoutShiftEntries.reduce((sum, entry) => sum + entry.value, 0),
        firstInputDelay: 0 // Would need to measure separately
      };

      return metrics;
    },

    sendMetrics: function() {
      const metrics = this.collectMetrics();
      if (metrics) {
        utils.sendToAPI('performance', {
          eventType: 'performance_metrics',
          data: metrics
        });
      }
    }
  };

  // Analytics tracking
  const analyticsTracker = {
    trackPageView: function() {
      if (!config.collectAnalytics) {
        return;
      }

      utils.sendToAPI('analytics', {
        eventType: 'page_view',
        data: {
          pageTitle: document.title,
          pageUrl: window.location.href,
          pagePath: window.location.pathname
        }
      });
    },

    trackEvent: function(eventName, properties = {}) {
      if (!config.collectAnalytics) {
        return;
      }

      utils.sendToAPI('analytics', {
        eventType: eventName,
        data: properties
      });
    },

    // Auto-track common events
    setupAutoTracking: function() {
      if (!config.collectAnalytics) {
        return;
      }

      // Track form submissions
      document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.tagName === 'FORM') {
          analyticsTracker.trackEvent('form_submit', {
            formName: form.name || form.id || 'unnamed_form',
            formAction: form.action
          });
        }
      });

      // Track button clicks
      document.addEventListener('click', function(e) {
        const button = e.target.closest('button, input[type="submit"], input[type="button"]');
        if (button) {
          analyticsTracker.trackEvent('button_click', {
            buttonText: button.textContent || button.value || 'No text',
            buttonType: button.type || 'button'
          });
        }
      });

      // Track link clicks
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith('http')) {
          analyticsTracker.trackEvent('link_click', {
            linkUrl: link.href,
            linkText: link.textContent || 'No text'
          });
        }
      });
    }
  };

  // Initialize tracking
  function init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Track page view
    analyticsTracker.trackPageView();

    // Set up auto-tracking
    analyticsTracker.setupAutoTracking();

    // Send performance metrics
    performanceMonitor.sendMetrics();

    // Track page unload (for bounce rate, etc.)
    window.addEventListener('beforeunload', function() {
      utils.sendToAPI('analytics', {
        eventType: 'page_unload',
        data: {
          timeOnPage: Date.now() - window.veloWebTracker.startTime
        }
      });
    });

    // Set start time for time on page calculation
    window.veloWebTracker.startTime = Date.now();

    console.log('VeloWeb tracking initialized for site:', config.siteId);
  }

  // Start initialization
  init();

  // Expose public API for manual tracking
  window.veloWebTracker.trackEvent = analyticsTracker.trackEvent;
  window.veloWebTracker.trackPageView = analyticsTracker.trackPageView;

})();
