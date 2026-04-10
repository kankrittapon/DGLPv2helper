// ===== DGLP Quiz Helper — Settings Module v1.2 =====
// Settings tab UI, per-provider API keys, test connection

// ============================================
// Setup Settings Tab
// ============================================
function setupSettingsTab() {
  document.getElementById('btnSaveConfig').addEventListener('click', handleSaveConfig);
  document.getElementById('btnResetConfig').addEventListener('click', handleResetConfig);

  // Toggle visibility for each provider key
  document.querySelectorAll('.btn-toggle-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🔒';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // Test API key buttons
  document.querySelectorAll('.btn-test-key').forEach(btn => {
    btn.addEventListener('click', () => handleTestKey(btn));
  });

  // Link email form
  const btnSignUp = document.getElementById('btnSignUp');
  if (btnSignUp) {
    btnSignUp.addEventListener('click', handleSignUp);
  }

  const btnSignIn = document.getElementById('btnSignIn');
  if (btnSignIn) {
    btnSignIn.addEventListener('click', handleSignIn);
  }

  // Edit / Reset Database Event Listeners
  const btnEditDb = document.getElementById('btnEditDb');
  if (btnEditDb) {
    btnEditDb.addEventListener('click', () => {
      document.getElementById('dbStatusSection').classList.add('hidden');
      document.getElementById('dbInputSection').classList.remove('hidden');
    });
  }

  const btnResetDb = document.getElementById('btnResetDb');
  if (btnResetDb) {
    btnResetDb.addEventListener('click', () => {
      document.getElementById('optSupabaseUrl').value = '';
      document.getElementById('optSupabaseKey').value = '';
      currentConfig.supabaseUrl = '';
      currentConfig.supabaseKey = '';
      saveConfig();
      applyConfigToUI();
    });
  }
}

// ============================================
// AI Provider UI
// ============================================
function setupAIProviderUI() {
  const radios = document.querySelectorAll('input[name="aiProvider"]');
  radios.forEach(radio => {
    radio.addEventListener('change', updateProviderUI);
  });

  const providerRadio = document.querySelector(`input[name="aiProvider"][value="${currentConfig.aiProvider}"]`);
  if (providerRadio) providerRadio.checked = true;
  updateProviderUI();
}

function updateProviderUI() {
  const selected = document.querySelector('input[name="aiProvider"]:checked')?.value || 'gemini';
  const provider = AI_PROVIDERS[selected];

  const localLLMGroup = document.getElementById('localLLMGroup');
  const footerAI = document.getElementById('aiProviderFooter');

  if (selected === 'local') {
    localLLMGroup.classList.remove('hidden');
  } else {
    localLLMGroup.classList.add('hidden');
  }

  if (footerAI) footerAI.textContent = `AI: ${provider.name}`;
}

// ============================================
// Apply Config to UI
// ============================================
function applyConfigToUI() {
  document.getElementById('optAutoCopy').checked = currentConfig.autoCopy;
  document.getElementById('optInterceptor').checked = currentConfig.interceptor;
  document.getElementById('optPrompt').value = currentConfig.promptTemplate;

  // Per-provider API keys
  document.getElementById('optKeyGemini').value = currentConfig.apiKeys?.gemini || '';
  document.getElementById('optKeyClaude').value = currentConfig.apiKeys?.claude || '';
  document.getElementById('optKeyGrok').value = currentConfig.apiKeys?.grok || '';
  document.getElementById('optKeyGroq').value = currentConfig.apiKeys?.groq || '';

  document.getElementById('optLocalEndpoint').value = currentConfig.localEndpoint || DEFAULT_CONFIG.localEndpoint;
  document.getElementById('optLocalModel').value = currentConfig.localModel || DEFAULT_CONFIG.localModel;

  // Supabase Config
  document.getElementById('optSupabaseUrl').value = currentConfig.supabaseUrl || '';
  document.getElementById('optSupabaseKey').value = currentConfig.supabaseKey || '';

  const isCustomDb = currentConfig.supabaseUrl && currentConfig.supabaseKey;
  const dbStatusText = document.getElementById('dbStatusText');
  
  if (isCustomDb) {
    dbStatusText.innerHTML = '✅ <span style="color:var(--accent-color)">ใช้ฐานข้อมูลของคุณเอง</span>';
  } else {
    dbStatusText.innerHTML = '✅ ใช้ฐานข้อมูลหลัก';
  }
  
  document.getElementById('dbStatusSection').classList.remove('hidden');
  document.getElementById('dbInputSection').classList.add('hidden');
}

// ============================================
// Save Config
// ============================================
async function handleSaveConfig() {
  currentConfig.autoCopy = document.getElementById('optAutoCopy').checked;
  currentConfig.interceptor = document.getElementById('optInterceptor').checked;
  currentConfig.promptTemplate = document.getElementById('optPrompt').value;
  currentConfig.aiProvider = document.querySelector('input[name="aiProvider"]:checked')?.value || 'gemini';

  // Per-provider API keys
  currentConfig.apiKeys = {
    gemini: document.getElementById('optKeyGemini').value.trim(),
    claude: document.getElementById('optKeyClaude').value.trim(),
    grok: document.getElementById('optKeyGrok').value.trim(),
    groq: document.getElementById('optKeyGroq').value.trim()
  };

  currentConfig.localEndpoint = document.getElementById('optLocalEndpoint').value;
  currentConfig.localModel = document.getElementById('optLocalModel').value;

  // Supabase Config
  currentConfig.supabaseUrl = document.getElementById('optSupabaseUrl').value.trim();
  currentConfig.supabaseKey = document.getElementById('optSupabaseKey').value.trim();

  await saveConfig();
  applyConfigToUI();

  const btn = document.getElementById('btnSaveConfig');
  btn.textContent = '✅ บันทึกแล้ว!';
  setTimeout(() => { btn.textContent = '💾 บันทึก'; }, 2000);
}

// ============================================
// Reset Config
// ============================================
async function handleResetConfig() {
  if (!confirm('Reset ค่าทั้งหมดเป็น Default?')) return;

  await resetConfig();
  applyConfigToUI();

  const providerRadio = document.querySelector('input[name="aiProvider"][value="gemini"]');
  if (providerRadio) providerRadio.checked = true;
  updateProviderUI();

  const btn = document.getElementById('btnResetConfig');
  btn.textContent = '✅ Reset แล้ว!';
  setTimeout(() => { btn.textContent = '🗑️ Reset ทั้งหมด'; }, 2000);
}

// ============================================
// Test API Key / Local LLM
// ============================================
async function handleTestKey(btn) {
  const provider = btn.dataset.provider;
  const resultEl = btn.parentElement.querySelector('.test-result');

  // Build temp config to test
  const tempConfig = { ...currentConfig };
  tempConfig.apiKeys = { ...currentConfig.apiKeys };

  if (provider === 'local') {
    tempConfig.localEndpoint = document.getElementById('optLocalEndpoint').value.trim() || DEFAULT_CONFIG.localEndpoint;
    tempConfig.localModel = document.getElementById('optLocalModel').value.trim() || DEFAULT_CONFIG.localModel;
    
    // Auto-save local configs for better UX
    currentConfig.localEndpoint = tempConfig.localEndpoint;
    currentConfig.localModel = tempConfig.localModel;
    saveConfig();
  } else {
    // Get current key from input
    const inputMap = { gemini: 'optKeyGemini', claude: 'optKeyClaude', grok: 'optKeyGrok', groq: 'optKeyGroq' };
    const keyInput = document.getElementById(inputMap[provider]);

    if (!keyInput?.value.trim()) {
      if (resultEl) {
        resultEl.textContent = '❌ ใส่ API Key ก่อน';
        resultEl.className = 'test-result test-error';
      }
      return;
    }
    tempConfig.apiKeys[provider] = keyInput.value.trim();
  }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳';
  if (resultEl) {
    resultEl.textContent = 'กำลังทดสอบ...';
    resultEl.className = 'test-result test-pending';
  }

  const result = await testProviderConnection(provider, tempConfig);

  btn.disabled = false;
  btn.textContent = originalText;

  if (result.ok) {
    if (resultEl) {
      resultEl.textContent = `✅ สำเร็จ (${result.time}ms)`;
      resultEl.className = 'test-result test-success';
    }
  } else {
    if (resultEl) {
      resultEl.textContent = `❌ ${result.error?.substring(0, 60)}`;
      resultEl.className = 'test-result test-error';
    }
  }

  // Auto-hide after 5s
  setTimeout(() => {
    if (resultEl) {
      resultEl.textContent = '';
      resultEl.className = 'test-result';
    }
  }, 5000);
}

// ============================================
// Auth — Sign Up / Sign In
// ============================================
async function handleSignUp() {
  const email = document.getElementById('authEmailInput')?.value.trim();
  const password = document.getElementById('authPasswordInput')?.value.trim();

  if (!email || !password) {
    alert('❌ กรุณากรอก Email และ Password');
    return;
  }

  if (password.length < 6) {
    alert('❌ Password ต้องมีอย่างน้อย 6 ตัวอักษร');
    return;
  }

  const btn = document.getElementById('btnSignUp');
  btn.disabled = true;
  btn.textContent = '⏳ กำลังสมัคร...';

  try {
    const res = await signUpWithEmail(email, password);
    // ถ้า Supabase บังคับยืนยันอีเมล
    if (res?.user && !res?.session) {
      alert('✅ สมัครสมาชิกสำเร็จ! (อาจต้องยืนยัน Email ตามที่ตั้งค่าใน Supabase)');
    } else {
      alert('✅ สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!');
    }
    updateAuthUI();
  } catch (e) {
    alert(`❌ สมัครไม่สำเร็จ: ${e.message}`);
  } finally {
    btn.textContent = '📝 สมัครสมาชิก';
    btn.disabled = false;
  }
}

async function handleSignIn() {
  const email = document.getElementById('authEmailInput')?.value.trim();
  const password = document.getElementById('authPasswordInput')?.value.trim();

  if (!email || !password) {
    alert('❌ กรุณากรอก Email และ Password');
    return;
  }

  const btn = document.getElementById('btnSignIn');
  btn.disabled = true;
  btn.textContent = '⏳ กำลัง Login...';

  try {
    await signInWithEmail(email, password);
    btn.textContent = '✅ Login สำเร็จ!';
    setTimeout(() => {
      btn.textContent = '🔑 Login';
      btn.disabled = false;
    }, 1500);
    updateAuthUI();
    // Reload history if on history tab
    if (document.getElementById('tab-history')?.classList.contains('active')) {
      loadHistory();
    }
  } catch (e) {
    alert(`❌ Login ไม่สำเร็จ: ${e.message}`);
    btn.textContent = '🔑 Login';
    btn.disabled = false;
  }
}
