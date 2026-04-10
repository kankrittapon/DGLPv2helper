// ===== DGLP Quiz Helper — Background Service Worker v1.2 =====

// ============================================
// Extension Install
// ============================================
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DGLP Helper] Extension installed/updated to v1.2');
  // Config is now managed by js/config.js — no duplicate defaults here
});

// ============================================
// Badge Update — แสดงจำนวนข้อบน Icon
// ============================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('e-learning.dga.or.th')) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.querySelectorAll('.test-question.question').length
    }).then(results => {
      const count = results?.[0]?.result || 0;
      if (count > 0) {
        chrome.action.setBadgeText({ text: String(count), tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#7c5cfc', tabId });
      } else {
        chrome.action.setBadgeText({ text: '', tabId });
      }
    }).catch(() => {
      chrome.action.setBadgeText({ text: '', tabId });
    });
  }
});

// ============================================
// API Proxy — For Claude & other CORS-restricted APIs
// Runs in service worker context (no CORS restrictions)
// ============================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'proxyAPICall') {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Provider-specific headers
    if (msg.provider === 'claude') {
      headers['x-api-key'] = msg.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      // No anthropic-dangerous-direct-browser-access needed in service worker!
    } else {
      headers['Authorization'] = `Bearer ${msg.apiKey}`;
    }

    fetch(msg.url, {
      method: 'POST',
      headers,
      body: msg.body
    })
    .then(async r => {
      if (!r.ok) {
        const errText = await r.text();
        sendResponse({ ok: false, error: `${r.status}: ${errText.substring(0, 200)}` });
      } else {
        const json = await r.json();
        sendResponse({ ok: true, data: json });
      }
    })
    .catch(err => {
      sendResponse({ ok: false, error: err.message });
    });

    return true; // async response
  }
});
