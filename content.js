// NoAdsGPT - Content Script
// Removes sponsored ads and promotional content from ChatGPT interface.
// Works via CSS injection (blocker.css) + DOM observation for dynamically loaded ads.

(function() {
  'use strict';

  // Ad selectors targeting ChatGPT's known ad structure
  // ChatGPT ads appear as "Sponsored" tinted boxes below responses
  // They use bzrcdn.openai.com for ad assets and track via /bazaar/event
  const AD_SELECTORS = [
    // Sponsored content data attributes
    '[data-testid*="sponsored"]',
    '[data-testid*="ad-unit"]',
    '[data-testid*="ad_unit"]',
    '[data-testid*="advertiser"]',

    // Sponsored class patterns
    '[class*="sponsored"]',
    '[class*="Sponsored"]',

    // Ad unit type containers
    '[class*="single_advertiser"]',
    '[class*="multi_advertiser"]',

    // Ad carousel cards
    '[class*="ad-carousel"]',
    '[class*="ad_carousel"]',

    // Generic ad containers
    'div[class*="adUnit"]',
    'div[class*="ad-unit"]',
    'div[class*="AdUnit"]',
    'section[class*="sponsor"]',
    'aside[class*="sponsor"]',

    // Bazaar CDN ad images
    'img[src*="bzrcdn.openai.com"]',

    // CPC tracking links (ad click-throughs)
    'a[href*="utm_source=chatgpt"][href*="utm_medium=cpc"]'
  ];

  const COMBINED_SELECTOR = AD_SELECTORS.join(', ');

  let blockedCount = 0;
  let isEnabled = true;

  // Load protection state
  try {
    chrome.storage.local.get(['protectionEnabled'], (result) => {
      if (chrome.runtime.lastError) return;
      isEnabled = result.protectionEnabled !== false;
      if (isEnabled) {
        blockAds();
        startObserver();
      }
    });
  } catch (e) {
    // If storage fails, default to enabled
    isEnabled = true;
    blockAds();
    startObserver();
  }

  // Listen for toggle changes from popup
  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.protectionEnabled) {
        isEnabled = changes.protectionEnabled.newValue !== false;
        if (isEnabled) {
          blockAds();
        }
      }
    });
  } catch (e) {
    // Silently fail
  }

  // Main ad blocking function
  function blockAds() {
    if (!isEnabled) return 0;

    let count = 0;

    try {
      const elements = document.querySelectorAll(COMBINED_SELECTOR);
      elements.forEach(element => {
        if (element.dataset.noadsgptHidden) return;
        element.style.setProperty('display', 'none', 'important');
        element.dataset.noadsgptHidden = 'true';
        count++;
      });

      // Also check for elements containing "Sponsored" text that might be ad labels
      // Only target small elements (likely labels, not content)
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node) {
            if (node.dataset && node.dataset.noadsgptChecked) {
              return NodeFilter.FILTER_REJECT;
            }
            // Only check small elements that could be ad labels
            const text = node.textContent.trim();
            if (text === 'Sponsored' || text === 'Ad' || text === 'Sponsored ·') {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        node.dataset.noadsgptChecked = 'true';
        // Walk up to find the ad container (usually 3-5 levels up)
        let container = node;
        for (let i = 0; i < 6; i++) {
          if (!container.parentElement || container.parentElement === document.body) break;
          container = container.parentElement;
          // Check if this looks like an ad container (has link with CPC params or bzrcdn image)
          const hasCpcLink = container.querySelector('a[href*="utm_medium=cpc"]');
          const hasBzrImage = container.querySelector('img[src*="bzrcdn.openai.com"]');
          if (hasCpcLink || hasBzrImage) {
            if (!container.dataset.noadsgptHidden) {
              container.style.setProperty('display', 'none', 'important');
              container.dataset.noadsgptHidden = 'true';
              count++;
            }
            break;
          }
        }
      }
    } catch (e) {
      // Silently fail
    }

    // Update blocked count
    if (count > 0) {
      blockedCount += count;
      updateStoredCount(count);
    }

    return count;
  }

  // Block network requests to ad tracking endpoints
  function blockAdTracking() {
    if (!isEnabled) return;

    // Override fetch to block bazaar tracking calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.url || args[0] || '';
      if (typeof url === 'string' && url.includes('/bazaar/event')) {
        // Block ad tracking request silently
        return Promise.resolve(new Response('{}', { status: 200 }));
      }
      return originalFetch.apply(this, args);
    };

    // Override XMLHttpRequest for bazaar tracking
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (typeof url === 'string' && url.includes('/bazaar/event')) {
        // Redirect to a no-op
        this._noadsgptBlocked = true;
      }
      return originalXHROpen.call(this, method, url, ...rest);
    };

    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(...args) {
      if (this._noadsgptBlocked) {
        // Don't send the tracking request
        return;
      }
      return originalXHRSend.apply(this, args);
    };
  }

  // Update stored count
  function updateStoredCount(newCount) {
    try {
      chrome.storage.local.get(['adsBlockedCount'], (result) => {
        if (chrome.runtime.lastError) return;
        const currentCount = result.adsBlockedCount || 0;
        chrome.storage.local.set({ adsBlockedCount: currentCount + newCount });
      });
    } catch (e) {
      // Silently fail
    }
  }

  // MutationObserver for dynamically loaded ads
  let observer = null;

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;

      let shouldCheck = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
      }

      if (shouldCheck) {
        // Debounce: wait for DOM to settle
        requestAnimationFrame(() => {
          blockAds();
        });
      }
    });

    const target = document.body || document.documentElement;
    if (target) {
      observer.observe(target, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize
  function init() {
    blockAds();
    blockAdTracking();
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
