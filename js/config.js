// ===== DGLP Quiz Helper — Config Module v1.2 =====
// Single source of truth for all configuration

// ============================================
// Config Defaults
// ============================================
const DEFAULT_CONFIG = {
  autoCopy: true,
  interceptor: true,
  aiProvider: 'gemini',
  apiKeys: {
    gemini: '',
    claude: '',
    grok: '',
    groq: ''
  },
  selectedModels: {
    gemini: 'gemini-1.5-flash',
    claude: 'claude-3-5-sonnet-latest',
    grok: 'grok-3-mini',
    groq: 'llama-3.1-8b-instant'
  },
  localEndpoint: 'http://localhost:11434/v1/chat/completions',
  localModel: 'llama3',
  fallbackEnabled: true,
  fallbackOrder: ['gemini', 'groq', 'local', 'grok', 'claude'],
  promptTemplate: 'จากข้อสอบต่อไปนี้ ช่วยตอบคำตอบที่ถูกต้อง ตอบเฉพาะตัวเลือก ก-ง ในแต่ละข้อ โดยตอบในรูปแบบ:\n1. ก\n2. ข\n...\n\n{questions}',
  
  // Database Config
  supabaseUrl: '',
  supabaseKey: ''
};

let currentConfig = { ...DEFAULT_CONFIG };

// ============================================
// Config Migration — v1.1 → v1.2
// ============================================
function migrateConfig(stored) {
  // Migrate single apiKey to per-provider apiKeys
  if (stored.apiKey !== undefined && stored.apiKeys === undefined) {
    const provider = stored.aiProvider || 'gemini';
    stored.apiKeys = { gemini: '', claude: '', grok: '', groq: '' };
    stored.apiKeys[provider] = stored.apiKey;
    delete stored.apiKey;
  }

  // Remove deprecated autoSubmit
  delete stored.autoSubmit;

  // Add fallback defaults if missing
  if (stored.fallbackEnabled === undefined) stored.fallbackEnabled = true;
  if (!stored.fallbackOrder) stored.fallbackOrder = ['gemini', 'claude', 'grok', 'groq', 'local'];

  // Add supabase defaults if missing
  if (stored.supabaseUrl === undefined) stored.supabaseUrl = '';
  if (stored.supabaseKey === undefined) stored.supabaseKey = '';

  // Add selectedModels defaults if missing
  if (!stored.selectedModels) {
    stored.selectedModels = { ...DEFAULT_CONFIG.selectedModels };
  }

  return stored;
}

// ============================================
// API Key Encryption (WebCrypto + PBKDF2 + AES-GCM)
// ============================================
async function getEncryptionKey() {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(chrome.runtime.id),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('dglp-quiz-helper-v12-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptApiKeys(keys) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(keys));
    const cryptoKey = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  } catch (e) {
    console.error('[DGLP] Encryption failed:', e);
    return null;
  }
}

async function decryptApiKeys(encryptedObj) {
  try {
    const cryptoKey = await getEncryptionKey();
    const iv = new Uint8Array(encryptedObj.iv);
    const data = new Uint8Array(encryptedObj.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    console.error('[DGLP] Decryption failed:', e);
    return null;
  }
}

// ============================================
// Load / Save / Reset
// ============================================
async function loadConfig() {
  try {
    const stored = await chrome.storage.local.get(['dglpConfig', 'dglpApiKeys']);
    if (stored.dglpConfig) {
      const config = migrateConfig({ ...stored.dglpConfig });
      currentConfig = { ...DEFAULT_CONFIG, ...config };
    }

    // Load encrypted API keys
    if (stored.dglpApiKeys) {
      const decrypted = await decryptApiKeys(stored.dglpApiKeys);
      if (decrypted) {
        currentConfig.apiKeys = { ...DEFAULT_CONFIG.apiKeys, ...decrypted };
      }
    }

    // Also try session storage
    try {
      const session = await chrome.storage.session.get('dglpApiKeys');
      if (session.dglpApiKeys) {
        currentConfig.apiKeys = { ...currentConfig.apiKeys, ...session.dglpApiKeys };
      }
    } catch (e) { }
  } catch (e) {
    console.error('[DGLP] Failed to load config:', e);
    currentConfig = { ...DEFAULT_CONFIG };
  }
}

async function saveConfig() {
  // Separate API keys from config for security
  const { apiKeys, ...configWithoutKeys } = currentConfig;

  // Save config (without keys) to local storage
  await chrome.storage.local.set({ dglpConfig: configWithoutKeys });

  // Save API keys encrypted to local storage
  const encrypted = await encryptApiKeys(apiKeys);
  if (encrypted) {
    await chrome.storage.local.set({ dglpApiKeys: encrypted });
  }

  try {
    await chrome.storage.session.set({ dglpApiKeys: apiKeys });
  } catch (e) { }
}

async function resetConfig() {
  currentConfig = { ...DEFAULT_CONFIG };
  await chrome.storage.local.remove(['dglpConfig', 'dglpApiKeys']);
  try {
    await chrome.storage.session.remove('dglpApiKeys');
  } catch (e) { }
}
