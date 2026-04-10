// ===== DGLP Quiz Helper — Content Script v1.2 =====
// Inject เข้าหน้า e-learning.dga.or.th อัตโนมัติ
// ================================================

(function() {
  'use strict';

  // ป้องกัน inject ซ้ำ
  if (window.__dglpHelperInjected) return;
  window.__dglpHelperInjected = true;

  // ============================================
  // API Interceptor — ดัก XHR/Fetch
  // Fixed: ใช้ chrome.storage.local แทน localStorage
  // ============================================
  async function initInterceptor() {
    const config = await getConfig();
    if (!config.interceptor) return;

    const capturedAPIs = [];

    // --- Intercept fetch ---
    const _fetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await _fetch(...args);
      try {
        const clone = response.clone();
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        clone.text().then(text => {
          if (/quiz|test|exam|answer|result|section|question|submit|check/i.test(url)) {
            let json;
            try { json = JSON.parse(text); } catch { json = text; }
            capturedAPIs.push({ url, method: args[1]?.method || 'GET', data: json, time: Date.now() });
            // SECURE: use chrome.storage.local instead of localStorage
            chrome.storage.local.set({ dglp_api_captured: capturedAPIs });
          }
        }).catch(() => {});
      } catch (e) {}
      return response;
    };

    // --- Intercept XMLHttpRequest ---
    const _xhrOpen = XMLHttpRequest.prototype.open;
    const _xhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._dglpUrl = url;
      this._dglpMethod = method;
      return _xhrOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('load', function() {
        try {
          const url = this._dglpUrl || '';
          if (/quiz|test|exam|answer|result|section|question|submit|check/i.test(url)) {
            let json;
            try { json = JSON.parse(this.responseText); } catch { json = this.responseText; }
            capturedAPIs.push({ url, method: this._dglpMethod, data: json, time: Date.now() });
            // SECURE: use chrome.storage.local instead of localStorage
            chrome.storage.local.set({ dglp_api_captured: capturedAPIs });
          }
        } catch (e) {}
      });
      return _xhrSend.apply(this, args);
    };

    console.log('[DGLP Helper] ✅ API Interceptor พร้อมแล้ว');
  }

  // ============================================
  // Message Handler — รับคำสั่งจาก Popup
  // ============================================
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getQuizCount') {
      const qs = document.querySelectorAll('.test-question.question');
      sendResponse({ count: qs.length });
    }

    if (msg.action === 'getApiCount') {
      chrome.storage.local.get('dglp_api_captured', result => {
        const apis = result.dglp_api_captured || [];
        sendResponse({ count: apis.length });
      });
      return true; // async response needed
    }

    return true; // async response
  });

  // ============================================
  // Helper: ดึง Config
  // ============================================
  async function getConfig() {
    return new Promise(resolve => {
      chrome.storage.local.get('dglpConfig', result => {
        resolve(result.dglpConfig || {
          autoCopy: true,
          interceptor: true,
          promptTemplate: ''
        });
      });
    });
  }

  // ============================================
  // Init
  // ============================================
  initInterceptor();
  console.log('[DGLP Helper] ✅ Content Script โหลดเรียบร้อย');
})();
