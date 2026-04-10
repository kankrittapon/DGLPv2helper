// ===== DGLP Quiz Helper — Fill Module v1.2 =====
// Answer parsing + auto-fill on page

let parsedAnswers = {};

// ============================================
// Parse Answers from Text
// ============================================
function parseAnswers() {
  const raw = document.getElementById('answerInput').value.trim();
  if (!raw) return;

  parsedAnswers = {};
  const engToThai = { 'A': 'ก', 'B': 'ข', 'C': 'ค', 'D': 'ง', 'a': 'ก', 'b': 'ข', 'c': 'ค', 'd': 'ง' };

  const lines = raw.split('\n');
  for (const line of lines) {
    const match = line.match(/(?:Q|ข้อ|คำถาม)?\s*(\d+)\s*[.:)\-]\s*([กขคงA-Da-d])/);
    if (match) {
      const num = parseInt(match[1]);
      let answer = match[2].trim();
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

// ============================================
// Fill Answers on Page (injected into web page)
// ============================================
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
