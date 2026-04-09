// ===== DGLP Quiz Helper — Popup Logic =====

// ============================================
// Config Defaults
// ============================================
const DEFAULT_CONFIG = {
  autoCopy: true,
  autoSubmit: false,
  interceptor: true,
  promptTemplate: 'จากข้อสอบต่อไปนี้ ช่วยตอบคำตอบที่ถูกต้อง ตอบเฉพาะตัวเลือก ก-ง ในแต่ละข้อ:\n\n{questions}'
};

let currentConfig = { ...DEFAULT_CONFIG };
let parsedAnswers = {};

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupTabs();
  setupExtractTab();
  setupFillTab();
  setupSettingsTab();
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
// Check Quiz Status — ตรวจว่าอยู่หน้า Quiz ไหม
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
// TAB 1: ดึงข้อสอบ
// ============================================
function setupExtractTab() {
  document.getElementById('btnExtract').addEventListener('click', extractQuiz);
  document.getElementById('btnCopyAgain').addEventListener('click', copyAgain);
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
      setTimeout(() => {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg> ดึงข้อสอบ`;
        btn.disabled = false;
      }, 2000);
      return;
    }

    // สร้างข้อความ
    const text = formatQuizText(data);
    const promptText = currentConfig.promptTemplate.replace('{questions}', text);

    // แสดงผล
    document.getElementById('extractResult').classList.remove('hidden');
    document.getElementById('extractCount').textContent = `${data.questions.length} ข้อ`;
    document.getElementById('extractPreview').textContent = text;

    // Auto copy
    if (currentConfig.autoCopy) {
      await copyToClipboard(promptText);
      showCopied();
    }

    // Update badge
    setStatus('online', `พบ ${data.questions.length} ข้อ`);

    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg> ดึงข้อสอบ`;
    btn.disabled = false;

  } catch (e) {
    console.error(e);
    btn.innerHTML = '❌ เกิดข้อผิดพลาด';
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg> ดึงข้อสอบ`;
      btn.disabled = false;
    }, 2000);
  }
}

// ฟังก์ชันที่ inject เข้าไปในหน้าเว็บ
function extractQuizFromPage() {
  const data = { questions: [], sectionName: '' };

  data.sectionName = document.querySelector('.section-name strong')?.innerText?.trim() || 'DGLP Quiz';

  const questions = document.querySelectorAll('.test-question.question');
  questions.forEach((q, idx) => {
    const qNum  = q.querySelector('strong.main-color')?.innerText?.trim() || `คำถาม ${idx+1}:`;
    const qDesc = q.querySelector('[data-qa="question-desc"]')?.innerText?.trim() || '';

    const choices = [];
    q.querySelectorAll('.choice').forEach(c => {
      const label = c.querySelector('.m-r-5')?.innerText?.trim() || '';
      const desc  = c.querySelector('[data-qa="choice-desc"]')?.innerText?.trim() || '';
      choices.push({ label, desc });
    });

    data.questions.push({ qNum, qDesc, choices });
  });

  return data;
}

function formatQuizText(data) {
  const lines = [];
  data.questions.forEach((q, i) => {
    lines.push(`${q.qNum} ${q.qDesc}`);
    q.choices.forEach(c => {
      lines.push(`   ${c.label} ${c.desc}`);
    });
    lines.push('');
  });
  return lines.join('\n').trim();
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function showCopied() {
  const el = document.getElementById('extractCopied');
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

async function copyAgain() {
  const text = document.getElementById('extractPreview').textContent;
  const promptText = currentConfig.promptTemplate.replace('{questions}', text);
  await copyToClipboard(promptText);
  showCopied();
}

// ============================================
// TAB 2: ใส่คำตอบ
// ============================================
function setupFillTab() {
  document.getElementById('btnParse').addEventListener('click', parseAnswers);
  document.getElementById('btnFill').addEventListener('click', fillAnswers);

  // Live parse on input
  document.getElementById('answerInput').addEventListener('input', () => {
    document.getElementById('btnFill').disabled = true;
    document.getElementById('parsedResult').classList.add('hidden');
    document.getElementById('fillResult').classList.add('hidden');
  });
}

function parseAnswers() {
  const raw = document.getElementById('answerInput').value.trim();
  if (!raw) return;

  parsedAnswers = {};

  // แปลงจากอังกฤษเป็นไทย
  const engToThai = { 'A': 'ก', 'B': 'ข', 'C': 'ค', 'D': 'ง', 'a': 'ก', 'b': 'ข', 'c': 'ค', 'd': 'ง' };

  const lines = raw.split('\n');
  for (const line of lines) {
    // รองรับหลาย format:
    // "1. ข", "1: ข", "Q1: B", "ข้อ 1: ข", "คำถาม 1: ข", "1.ข", "1)ข"
    const match = line.match(/(?:Q|ข้อ|คำถาม)?\s*(\d+)\s*[.:)\-]\s*([กขคงA-Da-d])/);
    if (match) {
      const num = parseInt(match[1]);
      let answer = match[2].trim();
      // แปลง A-D → ก-ง
      if (engToThai[answer]) answer = engToThai[answer];
      parsedAnswers[num] = answer;
    }
  }

  const count = Object.keys(parsedAnswers).length;

  if (count === 0) {
    document.getElementById('parsedResult').classList.add('hidden');
    document.getElementById('btnFill').disabled = true;
    alert('❌ ไม่สามารถ parse เฉลยได้ — ตรวจสอบ format อีกครั้ง');
    return;
  }

  // แสดง parsed list
  document.getElementById('parsedResult').classList.remove('hidden');
  document.getElementById('parsedCount').textContent = `${count} ข้อ`;

  const listEl = document.getElementById('parsedList');
  listEl.innerHTML = '';
  Object.entries(parsedAnswers)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([num, ans]) => {
      const item = document.createElement('div');
      item.className = 'parsed-item';
      item.innerHTML = `<span class="q-num">${num}.</span> <span class="q-ans">${ans}</span>`;
      listEl.appendChild(item);
    });

  document.getElementById('btnFill').disabled = false;
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

    // แสดงผล
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

  } catch (e) {
    console.error(e);
    btn.textContent = '❌ เกิดข้อผิดพลาด';
    setTimeout(() => {
      btn.textContent = '⚡ ใส่คำตอบอัตโนมัติ';
      btn.disabled = false;
    }, 2000);
  }
}

// ฟังก์ชันที่ inject เข้าหน้าเว็บเพื่อเลือกคำตอบ
function fillAnswersOnPage(answerMap) {
  const questions = document.querySelectorAll('.test-question.question');
  const result = { filled: 0, total: questions.length, log: [] };

  questions.forEach((q, idx) => {
    const qIndex = idx + 1;
    const correctLabel = answerMap[qIndex];

    if (!correctLabel) {
      result.log.push({ ok: false, text: `⏭️ ข้อ ${qIndex}: ไม่มีเฉลย` });
      return;
    }

    const choices = q.querySelectorAll('.choice');
    let clicked = false;

    choices.forEach(choice => {
      const label = choice.querySelector('.m-r-5')?.innerText?.trim();
      if (label && label.replace('.', '').trim() === correctLabel) {
        const radio = choice.querySelector('.el-radio__input')
                   || choice.querySelector('input[type="radio"]')
                   || choice.querySelector('.el-radio');
        if (radio) {
          radio.click();
          clicked = true;
        } else {
          choice.click();
          clicked = true;
        }
      }
    });

    if (clicked) {
      result.filled++;
      result.log.push({ ok: true, text: `✅ ข้อ ${qIndex}: เลือก ${correctLabel}` });
    } else {
      result.log.push({ ok: false, text: `⚠️ ข้อ ${qIndex}: หา "${correctLabel}" ไม่เจอ` });
    }
  });

  return result;
}

// ============================================
// TAB 3: Settings
// ============================================
function setupSettingsTab() {
  document.getElementById('btnSaveConfig').addEventListener('click', saveConfig);
  document.getElementById('btnResetConfig').addEventListener('click', resetConfig);
}

async function loadConfig() {
  try {
    const stored = await chrome.storage.local.get('dglpConfig');
    if (stored.dglpConfig) {
      currentConfig = { ...DEFAULT_CONFIG, ...stored.dglpConfig };
    }
  } catch (e) {
    currentConfig = { ...DEFAULT_CONFIG };
  }

  // Apply to UI
  document.getElementById('optAutoCopy').checked = currentConfig.autoCopy;
  document.getElementById('optAutoSubmit').checked = currentConfig.autoSubmit;
  document.getElementById('optInterceptor').checked = currentConfig.interceptor;
  document.getElementById('optPrompt').value = currentConfig.promptTemplate;
}

async function saveConfig() {
  currentConfig.autoCopy = document.getElementById('optAutoCopy').checked;
  currentConfig.autoSubmit = document.getElementById('optAutoSubmit').checked;
  currentConfig.interceptor = document.getElementById('optInterceptor').checked;
  currentConfig.promptTemplate = document.getElementById('optPrompt').value;

  await chrome.storage.local.set({ dglpConfig: currentConfig });

  const btn = document.getElementById('btnSaveConfig');
  btn.textContent = '✅ บันทึกแล้ว!';
  setTimeout(() => { btn.textContent = '💾 บันทึก'; }, 2000);
}

async function resetConfig() {
  if (!confirm('Reset ค่าทั้งหมดเป็น Default?')) return;

  currentConfig = { ...DEFAULT_CONFIG };
  await chrome.storage.local.set({ dglpConfig: currentConfig });

  document.getElementById('optAutoCopy').checked = currentConfig.autoCopy;
  document.getElementById('optAutoSubmit').checked = currentConfig.autoSubmit;
  document.getElementById('optInterceptor').checked = currentConfig.interceptor;
  document.getElementById('optPrompt').value = currentConfig.promptTemplate;

  const btn = document.getElementById('btnResetConfig');
  btn.textContent = '✅ Reset แล้ว!';
  setTimeout(() => { btn.textContent = '🗑️ Reset ทั้งหมด'; }, 2000);
}
