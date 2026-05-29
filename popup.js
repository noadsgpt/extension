// NOADSGPT Popup Script
(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    try {
      const statusIndicator = document.getElementById('statusIndicator');
      const statusText = document.getElementById('statusText');
      const statusDescription = document.getElementById('statusDescription');
      const adsBlocked = document.getElementById('adsBlocked');
      const timeSaved = document.getElementById('timeSaved');
      const toggleProtection = document.getElementById('toggleProtection');
      const coffeeButton = document.getElementById('coffeeButton');
      const settingsLink = document.getElementById('settingsLink');
      const aboutLink = document.getElementById('aboutLink');
      const landingLink = document.getElementById('landingLink');

      if (!statusIndicator || !statusText || !adsBlocked || !toggleProtection) {
        console.error('NOADSGPT: Required DOM elements not found');
        return;
      }

      // Format numbers with commas
      function formatNumber(num) {
        try {
          return (num || 0).toLocaleString();
        } catch (e) {
          return String(num || 0);
        }
      }

      // Calculate time saved (assuming 5 seconds per ad)
      function calculateTimeSaved(adsCount) {
        const secondsPerAd = 5;
        const totalSeconds = (adsCount || 0) * secondsPerAd;
        const minutes = Math.floor(totalSeconds / 60);
        return minutes;
      }

      // Load protection state
      try {
        chrome.storage.local.get(['protectionEnabled', 'adsBlockedCount'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('NOADSGPT: Storage error', chrome.runtime.lastError);
            return;
          }
          
          const isEnabled = result.protectionEnabled !== false; // Default to true
          if (toggleProtection) {
            toggleProtection.checked = isEnabled;
          }
          updateProtectionStatus(isEnabled);

          const count = result.adsBlockedCount || 0;
          if (adsBlocked) adsBlocked.textContent = formatNumber(count);
          if (timeSaved) timeSaved.textContent = formatNumber(calculateTimeSaved(count));
        });
      } catch (e) {
        console.error('NOADSGPT: Error loading state', e);
      }

      // Toggle protection
      if (toggleProtection) {
        toggleProtection.addEventListener('change', (e) => {
          try {
            const isEnabled = e.target.checked;
            chrome.storage.local.set({ protectionEnabled: isEnabled }, () => {
              if (chrome.runtime.lastError) {
                console.error('NOADSGPT: Error saving state', chrome.runtime.lastError);
                e.target.checked = !isEnabled; // Revert on error
                return;
              }
              updateProtectionStatus(isEnabled);
            });
          } catch (e) {
            console.error('NOADSGPT: Error toggling protection', e);
          }
        });
      }

      // Update protection status UI
      function updateProtectionStatus(isEnabled) {
        if (!statusIndicator || !statusText || !statusDescription) return;
        
        if (isEnabled) {
          statusIndicator.classList.remove('inactive', 'warning');
          statusText.textContent = 'Protection Active';
          statusDescription.textContent = 'Blocking ads on ChatGPT';
        } else {
          statusIndicator.classList.add('inactive');
          statusText.textContent = 'Protection Disabled';
          statusDescription.textContent = 'Ads will not be blocked';
        }
      }

      // Check if extension is active on current tab
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error('NOADSGPT: Tabs query error', chrome.runtime.lastError);
            return;
          }
          
          if (tabs[0] && tabs[0].url && (tabs[0].url.includes('chatgpt.com') || tabs[0].url.includes('chat.openai.com'))) {
            // Already on ChatGPT
          } else {
            if (statusIndicator) statusIndicator.classList.add('warning');
            if (statusText) statusText.textContent = 'Not on ChatGPT';
            if (statusDescription) statusDescription.textContent = 'Navigate to chatgpt.com to activate';
          }
        });
      } catch (e) {
        console.error('NOADSGPT: Error checking tab', e);
      }

      // Update stats periodically
      const statsInterval = setInterval(() => {
        try {
          chrome.storage.local.get(['adsBlockedCount'], (result) => {
            if (chrome.runtime.lastError) return;
            
            const count = result.adsBlockedCount || 0;
            if (adsBlocked) adsBlocked.textContent = formatNumber(count);
            if (timeSaved) timeSaved.textContent = formatNumber(calculateTimeSaved(count));
          });
        } catch (e) {
          clearInterval(statsInterval);
        }
      }, 5000);

      // Coffee button - opens Buy Me a Coffee page
      if (coffeeButton) {
        coffeeButton.addEventListener('click', (e) => {
          e.preventDefault();
          try {
            chrome.tabs.create({ url: 'https://buymeacoffee.com/ridoway' });
          } catch (e) {
            console.error('NOADSGPT: Error opening coffee link', e);
          }
        });
      }

      // Settings link
      if (settingsLink) {
        settingsLink.addEventListener('click', (e) => {
          e.preventDefault();
          alert('Settings page coming soon!');
        });
      }

      // Landing page link
      if (landingLink) {
        landingLink.addEventListener('click', (e) => {
          e.preventDefault();
          try {
            chrome.tabs.create({ url: 'https://noadsgpt.online' });
          } catch (e) {
            console.error('NOADSGPT: Error opening landing page', e);
          }
        });
      }

      // About link
      if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
          e.preventDefault();
          alert('NOADSGPT v1.1.0\n\nOpen-source ad blocker for ChatGPT.\nRemoves sponsored content, ad cards, and blocks ad tracking.\n\nVisit: noadsgpt.online');
        });
      }
    } catch (e) {
      console.error('NOADSGPT: Initialization error', e);
    }
  }
})();

