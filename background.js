// ===== DGLP Quiz Helper — Background Service Worker =====

// ============================================
// Extension Install
// ============================================
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DGLP Helper] Extension installed');

  // ตั้ง Default Config
  chrome.storage.local.get('dglpConfig', result => {
    if (!result.dglpConfig) {
      chrome.storage.local.set({
        dglpConfig: {
          autoCopy: true,
          autoSubmit: false,
          interceptor: true,
          promptTemplate: 'จากข้อสอบต่อไปนี้ ช่วยตอบคำตอบที่ถูกต้อง ตอบเฉพาะตัวเลือก ก-ง ในแต่ละข้อ:\n\n{questions}'
        }
      });
    }
  });
});

// ============================================
// Badge Update — แสดงจำนวนข้อบน Icon
// ============================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('e-learning.dga.or.th')) {
    // ลอง inject script เพื่อนับ questions
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
