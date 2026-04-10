// ===== DGLP Quiz Helper — Extract Module v1.2 =====
// Quiz extraction + topic detection + clipboard helpers

let lastExtractedText = '';
let lastTopicInfo = null;

// ============================================
// Extract Quiz from Page (injected into web page)
// ============================================
function extractQuizFromPage() {
  const data = { questions: [], sectionName: '', topicInfo: {} };

  // Section name from DOM
  data.sectionName = document.querySelector('.section-name strong')?.innerText?.trim() || 'DGLP Quiz';

  // Topic info from URL params + DOM
  const params = new URLSearchParams(location.search);
  data.topicInfo = {
    courseId: params.get('course_id') || '',
    sectionId: params.get('course_sectionid') || '',
    topicName: data.sectionName
  };

  // Extract questions
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

// ============================================
// Format Quiz Text
// ============================================
function formatQuizText(data) {
  const lines = [];
  data.questions.forEach((q) => {
    lines.push(`${q.qNum} ${q.qDesc}`);
    q.choices.forEach(c => {
      lines.push(`   ${c.label} ${c.desc}`);
    });
    lines.push('');
  });
  return lines.join('\n').trim();
}

// ============================================
// Clipboard Helpers
// ============================================
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
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
