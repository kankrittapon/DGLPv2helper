// ===== DGLP Quiz Helper — Settings Module v1.2 =====
// Settings tab UI, per-provider API keys, test connection

// ============================================
// Setup Settings Tab
// ============================================
function setupSettingsTab() {
  populateModelDropdowns();
  document.getElementById('btnSaveConfig').addEventListener('click', handleSaveConfig);
  document.getElementById('btnResetConfig').addEventListener('click', handleResetConfig);
  document.getElementById('btnSyncGroq').addEventListener('click', handleSyncGroq);
  document.getElementById('btnSyncGemini').addEventListener('click', handleSyncGemini);
  document.getElementById('btnSyncClaude').addEventListener('click', handleSyncClaude);
  document.getElementById('btnSyncGrok').addEventListener('click', handleSyncGrok);

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

  // Show only relevant settings group
  document.querySelectorAll('.provider-details').forEach(el => el.classList.add('hidden'));
  const activeSettings = document.getElementById(`settings-${selected}`);
  if (activeSettings) {
    activeSettings.classList.remove('hidden');
  }

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

  // Selected Models
  if (currentConfig.selectedModels) {
    if (document.getElementById('modelGemini')) document.getElementById('modelGemini').value = currentConfig.selectedModels.gemini || 'gemini-1.5-flash';
    if (document.getElementById('modelClaude')) document.getElementById('modelClaude').value = currentConfig.selectedModels.claude || 'claude-3-5-sonnet-latest';
    if (document.getElementById('modelGrok')) document.getElementById('modelGrok').value = currentConfig.selectedModels.grok || 'grok-3-mini';
    if (document.getElementById('modelGroq')) document.getElementById('modelGroq').value = currentConfig.selectedModels.groq || 'llama-3.1-8b-instant';
  }

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

  // Save selected models
  currentConfig.selectedModels = {
    gemini: document.getElementById('modelGemini')?.value || 'gemini-1.5-flash',
    claude: document.getElementById('modelClaude')?.value || 'claude-3-5-sonnet-latest',
    grok: document.getElementById('modelGrok')?.value || 'grok-3-mini',
    groq: document.getElementById('modelGroq')?.value || 'llama-3.1-8b-instant'
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
    
    // Ensure selectedModels exists and use currently selected model for testing
    if (!tempConfig.selectedModels) tempConfig.selectedModels = {};
    const modelSelectMap = { gemini: 'modelGemini', claude: 'modelClaude', grok: 'modelGrok', groq: 'modelGroq' };
    const modelSelect = document.getElementById(modelSelectMap[provider]);
    if (modelSelect) {
      tempConfig.selectedModels[provider] = modelSelect.value;
    }
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
// ============================================
// Populate Model Dropdowns
// ============================================
function populateModelDropdowns() {
  const providers = ['gemini', 'claude', 'grok', 'groq'];
  
  providers.forEach(pId => {
    const select = document.getElementById(`model${pId.charAt(0).toUpperCase() + pId.slice(1)}`);
    if (!select) return;
    
    select.innerHTML = ''; // Clear
    const providerData = AI_PROVIDERS[pId];
    
    if (providerData && providerData.models) {
      providerData.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        // Add label [FREE] or [PAID]
        const tag = m.isFree ? '[FREE]' : '[PAID]';
        opt.textContent = `${tag} ${m.name}`;
        select.appendChild(opt);
      });
    }
  });
}
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

// ============================================
// Sync Groq Models
// ============================================
async function handleSyncGroq() {
  const apiKey = document.getElementById('optKeyGroq').value.trim();
  if (!apiKey) {
    alert('❌ กรุณาใส่ API Key ของ Groq ก่อนครับ');
    return;
  }

  const btn = document.getElementById('btnSyncGroq');
  const select = document.getElementById('modelGroq');
  const originalText = btn.textContent;
  
  btn.textContent = '⏳';
  btn.classList.add('rotating');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) throw new Error('เรียกข้อมูลไม่สำเร็จ');
    
    const data = await response.json();
    const models = data.data
      .filter(m => m.id.includes('llama') || m.id.includes('mixtral') || m.id.includes('gemma') || m.id.includes('deepseek'))
      .map(m => ({ id: m.id, name: m.id, isFree: true }));

    if (models.length === 0) throw new Error('ไม่พบโมเดลที่แนะนำ');

    // Update global provider list temporarily or just populate dropdown
    select.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `[AUTO] ${m.name}`;
      select.appendChild(opt);
    });

    alert(`✅ ดึงข้อมูลสำเร็จ! พบ ${models.length} โมเดล`);
  } catch (e) {
    alert(`❌ ดึงข้อมูลไม่สำเร็จ: ${e.message}`);
  } finally {
    btn.textContent = originalText;
    btn.classList.remove('rotating');
  }
}

// ============================================
// Sync Gemini Models
// ============================================
async function handleSyncGemini() {
  const apiKey = document.getElementById('optKeyGemini').value.trim();
  if (!apiKey) {
    alert('❌ กรุณาใส่ API Key ของ Gemini ก่อนครับ');
    return;
  }

  const btn = document.getElementById('btnSyncGemini');
  const select = document.getElementById('modelGemini');
  const originalText = btn.textContent;
  
  btn.textContent = '⏳';
  btn.classList.add('rotating');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) throw new Error('เรียกข้อมูลไม่สำเร็จ (ตรวจสอบ Key)');
    
    const data = await response.json();
    if (!data.models) throw new Error('ไม่พบโมเดลในบัญชีนี้');

    const models = data.models
      .filter(m => m.supportedGenerationMethods.includes('generateContent'))
      .map(m => {
        const id = m.name.replace('models/', '');
        return { id, name: id, isFree: true };
      });

    select.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `[AUTO] ${m.name}`;
      select.appendChild(opt);
    });

    alert(`✅ ดึงข้อมูลสำเร็จ! พบ ${models.length} โมเดล`);
  } catch (e) {
    alert(`❌ ดึงข้อมูลไม่สำเร็จ: ${e.message}`);
  } finally {
    btn.textContent = originalText;
    btn.classList.remove('rotating');
  }
}

// ============================================
// Sync Claude Models
// ============================================
async function handleSyncClaude() {
  const apiKey = document.getElementById('optKeyClaude').value.trim();
  if (!apiKey) {
    alert('❌ กรุณาใส่ API Key ของ Claude ก่อนครับ');
    return;
  }

  const btn = document.getElementById('btnSyncClaude');
  const select = document.getElementById('modelClaude');
  const originalText = btn.textContent;
  
  btn.textContent = '⏳';
  btn.classList.add('rotating');

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    if (!response.ok) throw new Error('เรียกข้อมูลไม่สำเร็จ (ตรวจสอบ Key)');
    
    const data = await response.json();
    if (!data.data) throw new Error('ไม่พบข้อมูลโมเดล');

    const models = data.data
      .filter(m => m.type === 'model')
      .map(m => ({ id: m.id, name: m.display_name || m.id }));

    select.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `[AUTO] ${m.name}`;
      select.appendChild(opt);
    });

    alert(`✅ ดึงข้อมูลสำเร็จ! พบ ${models.length} โมเดล`);
  } catch (e) {
    alert(`❌ ดึงข้อมูลไม่สำเร็จ: ${e.message}`);
  } finally {
    btn.textContent = originalText;
    btn.classList.remove('rotating');
  }
}

// ============================================
// Sync Grok Models
// ============================================
async function handleSyncGrok() {
  const apiKey = document.getElementById('optKeyGrok').value.trim();
  if (!apiKey) {
    alert('❌ กรุณาใส่ API Key ของ Grok ก่อนครับ');
    return;
  }

  const btn = document.getElementById('btnSyncGrok');
  const select = document.getElementById('modelGrok');
  const originalText = btn.textContent;
  
  btn.textContent = '⏳';
  btn.classList.add('rotating');

  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) throw new Error('เรียกข้อมูลไม่สำเร็จ (ตรวจสอบ Key)');
    
    const data = await response.json();
    if (!data.data) throw new Error('ไม่พบข้อมูลโมเดล');

    const models = data.data.map(m => ({ id: m.id, name: m.id }));

    select.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `[AUTO] ${m.name}`;
      select.appendChild(opt);
    });

    alert(`✅ ดึงข้อมูลสำเร็จ! พบ ${models.length} โมเดล`);
  } catch (e) {
    alert(`❌ ดึงข้อมูลไม่สำเร็จ: ${e.message}`);
  } finally {
    btn.textContent = originalText;
    btn.classList.remove('rotating');
  }
}
