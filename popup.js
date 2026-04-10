// ===== DGLP Quiz Helper — Popup Main v1.2 =====
// Entry point — initializes all modules

document.addEventListener('DOMContentLoaded', async () => {
  // Load config first
  await loadConfig();
  applyConfigToUI();

  // Initialize modules
  setupTabs();
  setupExtractTab();
  setupFillTab();
  setupSettingsTab();
  setupAIProviderUI();
  setupHistoryTab();

  // Initialize Supabase auth
  try {
    await initAuth();
    updateAuthUI();
  } catch (e) {
    console.error('[DGLP] Supabase init failed:', e);
  }

  // Check quiz status
  checkQuizStatus();
});

// ============================================
// Tab Navigation
// ============================================
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// ============================================
// Check Quiz Status
// ============================================
async function checkQuizStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.includes('e-learning.dga.or.th')) {
      setStatus('offline', 'ไม่ใช่เว็บ DGA');
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const qs = document.querySelectorAll('.test-question.question');
        return { count: qs.length, url: location.href };
      }
    });

    const data = results?.[0]?.result;
    if (data?.count > 0) {
      setStatus('online', `พบ ${data.count} ข้อ`);
    } else {
      setStatus('offline', 'ไม่พบ Quiz');
    }
  } catch (e) {
    setStatus('offline', 'ไม่สามารถเข้าถึงหน้า');
  }
}

function setStatus(type, text) {
  const badge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  badge.className = `status-badge status-${type}`;
  statusText.textContent = text;
}

// ============================================
// TAB 1: ดึงข้อสอบ + ถาม AI
// ============================================
function setupExtractTab() {
  document.getElementById('btnExtract').addEventListener('click', extractQuiz);
  document.getElementById('btnCopyAgain').addEventListener('click', copyAgain);
  document.getElementById('btnAskAI').addEventListener('click', handleAskAI);
  document.getElementById('btnUseAIAnswer').addEventListener('click', useAIAnswer);
}

async function extractQuiz() {
  const btn = document.getElementById('btnExtract');
  btn.disabled = true;
  btn.innerHTML = '⏳ กำลังดึง...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractQuizFromPage
    });

    const data = results?.[0]?.result;
    if (!data || data.questions.length === 0) {
      btn.innerHTML = '❌ ไม่พบคำถาม';
      setTimeout(() => { resetExtractBtn(btn); }, 2000);
      return;
    }

    // Save topic info
    lastTopicInfo = data.topicInfo || null;

    // Update topic badge
    if (lastTopicInfo?.topicName) {
      const topicBadge = document.getElementById('topicBadge');
      if (topicBadge) {
        topicBadge.textContent = `📌 ${lastTopicInfo.topicName}`;
        topicBadge.classList.remove('hidden');
      }
    }

    // Format text
    lastExtractedText = formatQuizText(data);
    const promptText = currentConfig.promptTemplate.replace('{questions}', lastExtractedText);

    // Show result
    document.getElementById('extractResult').classList.remove('hidden');
    document.getElementById('extractCount').textContent = `${data.questions.length} ข้อ`;
    document.getElementById('extractPreview').textContent = lastExtractedText;

    // Auto copy
    if (currentConfig.autoCopy) {
      await copyToClipboard(promptText);
      showCopied();
    }

    setStatus('online', `พบ ${data.questions.length} ข้อ`);
    resetExtractBtn(btn);

  } catch (e) {
    console.error(e);
    btn.innerHTML = '❌ เกิดข้อผิดพลาด';
    setTimeout(() => { resetExtractBtn(btn); }, 2000);
  }
}

function resetExtractBtn(btn) {
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg> ดึงข้อสอบ`;
  btn.disabled = false;
}

async function copyAgain() {
  // Fixed: use lastExtractedText instead of reading from DOM
  const promptText = currentConfig.promptTemplate.replace('{questions}', lastExtractedText);
  await copyToClipboard(promptText);
  showCopied();
}

// ============================================
// Ask AI — With Fallback + Rate Limit
// ============================================
async function handleAskAI() {
  if (!lastExtractedText) {
    alert('❌ กรุณาดึงข้อสอบก่อน');
    return;
  }

  // Rate limit check
  if (isAIBusy) {
    alert('⏳ กำลังประมวลผลอยู่ กรุณารอ...');
    return;
  }

  isAIBusy = true;
  const btnAskAI = document.getElementById('btnAskAI');
  btnAskAI.disabled = true;

  // Show UI
  const aiSection = document.getElementById('aiSection');
  const aiLoader = document.getElementById('aiLoader');
  const aiResponse = document.getElementById('aiResponse');
  const aiActions = document.getElementById('aiActions');
  const aiStatusText = document.getElementById('aiStatusText');
  const aiProviderBadge = document.getElementById('aiProviderBadge');
  const aiFallbackLog = document.getElementById('aiFallbackLog');

  aiSection.classList.remove('hidden');
  aiLoader.classList.remove('hidden');
  aiResponse.classList.add('hidden');
  aiActions.classList.add('hidden');
  if (aiFallbackLog) aiFallbackLog.classList.add('hidden');

  aiStatusText.textContent = 'กำลังถาม AI...';
  aiProviderBadge.textContent = AI_PROVIDERS[currentConfig.aiProvider]?.name || 'AI';

  const promptText = currentConfig.promptTemplate.replace('{questions}', lastExtractedText);

  try {
    const result = await askAIWithFallback(promptText, currentConfig);

    // Show result
    aiLoader.classList.add('hidden');
    aiResponse.classList.remove('hidden');
    aiResponse.textContent = result.answer;
    aiActions.classList.remove('hidden');
    aiStatusText.textContent = `✅ ได้เฉลยจาก ${result.provider} แล้ว`;
    aiProviderBadge.textContent = result.provider;

    // Show fallback log if multiple providers were tried
    if (result.fallbackLog?.length > 1 && aiFallbackLog) {
      renderFallbackLog(result.fallbackLog);
    }

  } catch (e) {
    console.error('AI Error:', e);
    aiLoader.classList.add('hidden');
    aiResponse.classList.remove('hidden');
    aiResponse.textContent = `❌ Error: ${e.message}`;
    aiStatusText.textContent = 'เกิดข้อผิดพลาด';

    if (e.fallbackLog && aiFallbackLog) {
      renderFallbackLog(e.fallbackLog);
    }
  } finally {
    isAIBusy = false;
    btnAskAI.disabled = false;
  }
}

function renderFallbackLog(log) {
  const container = document.getElementById('aiFallbackLog');
  if (!container) return;

  container.classList.remove('hidden');
  const icons = { success: '✅', error: '❌', skip: '⏭️', cooldown: '⏳' };

  container.innerHTML = log.map(entry => {
    const icon = icons[entry.status] || '❓';
    return `<div class="fallback-entry fallback-${entry.status}">${icon} ${entry.provider}: ${entry.reason}</div>`;
  }).join('');
}

// Use AI Answer → Fill tab
function useAIAnswer() {
  const aiText = document.getElementById('aiResponse').textContent;
  if (!aiText) return;

  // Switch to fill tab
  document.querySelectorAll('.tab')[1].click();

  // Paste into textarea
  document.getElementById('answerInput').value = aiText;

  // Auto parse
  parseAnswers();
}

// ============================================
// TAB 2: ใส่คำตอบ
// ============================================
function setupFillTab() {
  document.getElementById('btnParse').addEventListener('click', parseAnswers);
  document.getElementById('btnFill').addEventListener('click', fillAnswers);

  document.getElementById('answerInput').addEventListener('input', () => {
    document.getElementById('btnFill').disabled = true;
    document.getElementById('parsedResult').classList.add('hidden');
    document.getElementById('fillResult').classList.add('hidden');
  });
}

async function fillAnswers() {
  const btn = document.getElementById('btnFill');
  btn.disabled = true;
  btn.textContent = '⏳ กำลังใส่...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const answers = { ...parsedAnswers };

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillAnswersOnPage,
      args: [answers]
    });

    const data = results?.[0]?.result;

    const resultBox = document.getElementById('fillResult');
    const statusEl = document.getElementById('fillStatus');
    resultBox.classList.remove('hidden');

    let html = '';
    data.log.forEach(l => {
      const cls = l.ok ? 'fill-ok' : 'fill-err';
      html += `<div class="${cls}">${l.text}</div>`;
    });
    html += `<div class="fill-summary">🎯 เติมสำเร็จ ${data.filled} / ${data.total} ข้อ</div>`;
    statusEl.innerHTML = html;

    btn.textContent = '⚡ ใส่คำตอบอัตโนมัติ';
    btn.disabled = false;

    // Save attempt to Supabase & show score modal
    if (supabaseSession && lastTopicInfo) {
      showScoreModal(data.total, async (score) => {
        try {
          await saveAttempt({
            topicName: lastTopicInfo.topicName,
            courseId: lastTopicInfo.courseId,
            sectionId: lastTopicInfo.sectionId,
            totalQuestions: data.total,
            answers: parsedAnswers,
            aiProvider: currentConfig.aiProvider,
            score
          });
          console.log('[DGLP] Attempt saved to Supabase');
        } catch (e) {
          console.error('[DGLP] Failed to save attempt:', e);
        }
      });
    }

  } catch (e) {
    console.error(e);
    btn.textContent = '❌ เกิดข้อผิดพลาด';
    setTimeout(() => {
      btn.textContent = '⚡ ใส่คำตอบอัตโนมัติ';
      btn.disabled = false;
    }, 2000);
  }
}

// ============================================
// Auth UI Helpers
// ============================================
function updateAuthUI() {
  const authStatus = document.getElementById('authStatus');
  const authEmailSection = document.getElementById('authEmailSection');

  if (!authStatus) return;

  const user = getUser();
  if (!user) {
    authStatus.innerHTML = '<span class="status-offline">❌ ยังไม่ได้ Login</span>';
    if (authEmailSection) authEmailSection.classList.remove('hidden');
    
    // Check if logout button exists, if yes, remove it
    const existingLogOutBtn = document.getElementById('btnLogOut');
    if(existingLogOutBtn) {
        existingLogOutBtn.remove();
    }
    return;
  }

  authStatus.innerHTML = `<span class="status-online">✅ ${user.email}</span> <button id="btnLogOut" class="btn btn-secondary btn-xs" style="margin-left:8px;">Logout</button>`;
  
  if (authEmailSection) authEmailSection.classList.add('hidden');

  document.getElementById('btnLogOut').addEventListener('click', async () => {
      await signOut();
      updateAuthUI();
  });
}
