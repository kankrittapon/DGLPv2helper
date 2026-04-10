// ===== DGLP Quiz Helper — History Module v1.2 =====
// History tab, compare attempts, score modal

let historyAttempts = [];
let selectedCompare = [];
let currentHistoryOffset = 0;
const HISTORY_PAGE_SIZE = 10;

// ============================================
// Setup History Tab
// ============================================
function setupHistoryTab() {
  document.getElementById('topicFilter')?.addEventListener('change', loadHistory);
  document.getElementById('btnLoadMore')?.addEventListener('click', loadMoreHistory);
  document.getElementById('btnCompare')?.addEventListener('click', showComparison);

  // Load data when history tab is clicked
  document.querySelector('[data-tab="history"]')?.addEventListener('click', async () => {
    await loadTopics();
    await loadHistory();
  });
}

// ============================================
// Load Topics Dropdown
// ============================================
async function loadTopics() {
  try {
    const topics = await getUniqueTopics();
    const dropdown = document.getElementById('topicFilter');
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">ทุกหัวข้อ</option>';

    // Deduplicate
    const seen = new Set();
    topics?.forEach(t => {
      const key = `${t.course_id}|${t.section_id}`;
      if (!seen.has(key) && (t.course_id || t.topic_name)) {
        seen.add(key);
        const option = document.createElement('option');
        option.value = key;
        option.textContent = t.topic_name || `Course ${t.course_id}`;
        dropdown.appendChild(option);
      }
    });
  } catch (e) {
    console.error('[DGLP] Failed to load topics:', e);
  }
}

// ============================================
// Load / Paginate History
// ============================================
async function loadHistory() {
  currentHistoryOffset = 0;
  historyAttempts = [];
  selectedCompare = [];

  await fetchAttempts();
  renderHistory();
}

async function loadMoreHistory() {
  await fetchAttempts();
  renderHistory();
}

async function fetchAttempts() {
  try {
    const dropdown = document.getElementById('topicFilter');
    const filterValue = dropdown?.value || '';

    let courseId = null, sectionId = null;
    if (filterValue) {
      const parts = filterValue.split('|');
      courseId = parts[0] || null;
      sectionId = parts[1] || null;
    }

    const data = await getAttempts(courseId, sectionId, HISTORY_PAGE_SIZE, currentHistoryOffset);

    if (data?.length) {
      historyAttempts.push(...data);
      currentHistoryOffset += data.length;
    }

    // Show/hide load more button
    const btnLoadMore = document.getElementById('btnLoadMore');
    if (btnLoadMore) {
      btnLoadMore.classList.toggle('hidden', !data?.length || data.length < HISTORY_PAGE_SIZE);
    }
  } catch (e) {
    console.error('[DGLP] Failed to fetch attempts:', e);
  }
}

// ============================================
// Render History Table
// ============================================
function renderHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;

  if (historyAttempts.length === 0) {
    container.innerHTML = '<p class="empty-state">📭 ยังไม่มีประวัติ — ลองทำข้อสอบแล้วใส่คำตอบดูครับ</p>';
    return;
  }

  let html = '<table class="history-table"><thead><tr>';
  html += '<th></th><th>วันที่</th><th>AI</th><th>คะแนน</th><th></th>';
  html += '</tr></thead><tbody>';

  historyAttempts.forEach((attempt, idx) => {
    const date = new Date(attempt.created_at).toLocaleDateString('th-TH', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    const score = attempt.score !== null && attempt.score !== undefined
      ? `${attempt.score}/${attempt.total_questions}`
      : '-';
    const provider = attempt.ai_provider || 'manual';
    const isChecked = selectedCompare.includes(idx) ? 'checked' : '';

    html += `<tr>`;
    html += `<td><input type="checkbox" class="compare-check" data-idx="${idx}" ${isChecked}></td>`;
    html += `<td class="td-date">${date}</td>`;
    html += `<td><span class="badge badge-sm">${provider}</span></td>`;
    html += `<td class="td-score">${score}</td>`;
    html += `<td><button class="btn btn-xs btn-secondary btn-use" data-idx="${idx}">ใช้</button></td>`;
    html += `</tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  // Attach event listeners
  container.querySelectorAll('.compare-check').forEach(cb => {
    cb.addEventListener('change', () => handleCompareCheck(parseInt(cb.dataset.idx)));
  });
  container.querySelectorAll('.btn-use').forEach(btn => {
    btn.addEventListener('click', () => useHistoryAttempt(parseInt(btn.dataset.idx)));
  });

  updateCompareButton();
}

// ============================================
// Compare Selection
// ============================================
function handleCompareCheck(idx) {
  const checkbox = document.querySelector(`.compare-check[data-idx="${idx}"]`);

  if (checkbox.checked) {
    if (selectedCompare.length >= 2) {
      // Uncheck the oldest
      const oldIdx = selectedCompare.shift();
      const oldCheckbox = document.querySelector(`.compare-check[data-idx="${oldIdx}"]`);
      if (oldCheckbox) oldCheckbox.checked = false;
    }
    selectedCompare.push(idx);
  } else {
    selectedCompare = selectedCompare.filter(i => i !== idx);
  }

  updateCompareButton();
}

function updateCompareButton() {
  const btn = document.getElementById('btnCompare');
  if (btn) {
    btn.disabled = selectedCompare.length !== 2;
  }
}

// ============================================
// Use History Attempt → Fill Tab
// ============================================
function useHistoryAttempt(idx) {
  const attempt = historyAttempts[idx];
  if (!attempt?.answers) return;

  // Switch to fill tab
  document.querySelectorAll('.tab')[1].click();

  // Format answers and put in textarea
  const lines = Object.entries(attempt.answers)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([num, ans]) => `${num}. ${ans}`);

  document.getElementById('answerInput').value = lines.join('\n');
  parseAnswers();
}

// ============================================
// Compare Two Attempts
// ============================================
function showComparison() {
  if (selectedCompare.length !== 2) return;

  const a = historyAttempts[selectedCompare[0]];
  const b = historyAttempts[selectedCompare[1]];

  if (!a?.answers || !b?.answers) return;

  const container = document.getElementById('compareResult');
  if (!container) return;

  const allKeys = new Set([...Object.keys(a.answers), ...Object.keys(b.answers)]);
  const sortedKeys = Array.from(allKeys).sort((x, y) => Number(x) - Number(y));

  let html = `<div class="compare-header">`;
  html += `<span class="badge badge-ai">${a.ai_provider || 'A'} ${a.score != null ? a.score + '/' + a.total_questions : ''}</span>`;
  html += `<span class="compare-vs">vs</span>`;
  html += `<span class="badge badge-ai">${b.ai_provider || 'B'} ${b.score != null ? b.score + '/' + b.total_questions : ''}</span>`;
  html += `</div>`;

  let diffCount = 0;
  html += '<div class="compare-list">';
  sortedKeys.forEach(key => {
    const ansA = a.answers[key] || '-';
    const ansB = b.answers[key] || '-';
    const same = ansA === ansB;
    if (!same) diffCount++;
    const cls = same ? 'compare-same' : 'compare-diff';

    html += `<div class="compare-item ${cls}">`;
    html += `<span class="compare-num">ข้อ ${key}:</span>`;
    html += `<span class="compare-ans">${ansA}</span>`;
    html += `<span class="compare-sep">|</span>`;
    html += `<span class="compare-ans">${ansB}</span>`;
    html += `<span class="compare-label">${same ? '✅' : '⚠️ ต่างกัน!'}</span>`;
    html += `</div>`;
  });
  html += '</div>';

  html += `<div class="compare-summary">ต่างกัน ${diffCount} / ${sortedKeys.length} ข้อ</div>`;

  container.innerHTML = html;
  container.classList.remove('hidden');
}

// ============================================
// Score Modal
// ============================================
function showScoreModal(totalQuestions, callback) {
  const modal = document.getElementById('scoreModal');
  if (!modal) {
    // No modal — skip
    if (callback) callback(null);
    return;
  }

  document.getElementById('scoreTotalQuestions').textContent = totalQuestions;
  document.getElementById('scoreInput').value = '';
  document.getElementById('scoreInput').max = totalQuestions;

  modal.classList.remove('hidden');

  // Remove old listeners
  const btnSave = document.getElementById('btnSaveScore');
  const btnSkip = document.getElementById('btnSkipScore');
  const newBtnSave = btnSave.cloneNode(true);
  const newBtnSkip = btnSkip.cloneNode(true);
  btnSave.parentNode.replaceChild(newBtnSave, btnSave);
  btnSkip.parentNode.replaceChild(newBtnSkip, btnSkip);

  newBtnSave.addEventListener('click', () => {
    const score = parseInt(document.getElementById('scoreInput').value);
    modal.classList.add('hidden');
    if (callback) callback(isNaN(score) ? null : score);
  });

  newBtnSkip.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (callback) callback(null);
  });
}
