// ===== DGLP Quiz Helper — AI Providers Module v1.2 =====
// AI Provider definitions, fallback system, cooldown, testing

// ============================================
// AI Provider Config
// ============================================
const AI_PROVIDERS = {
  gemini: {
    name: 'Gemini',
    label: '🔑 Gemini API Key',
    hint: 'รับฟรีที่ <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com</a>',
    buildRequest: (prompt, apiKey) => ({
      // SECURE: ใช้ x-goog-api-key header แทน URL query param
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      },
      parseResponse: (json) => json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    })
  },
  claude: {
    name: 'Claude',
    label: '🔑 Claude API Key',
    hint: 'ใช้ API Key จาก <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a>',
    // SECURE: proxy ผ่าน background.js — ลบ anthropic-dangerous-direct-browser-access
    buildRequest: (prompt, apiKey) => ({
      useProxy: true,
      url: 'https://api.anthropic.com/v1/messages',
      apiKey: apiKey,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      }),
      parseResponse: (json) => json?.content?.[0]?.text || ''
    })
  },
  grok: {
    name: 'Grok',
    label: '🔑 Grok API Key',
    hint: 'ใช้ API Key จาก <a href="https://console.x.ai/" target="_blank">console.x.ai</a> ($25 เครดิตฟรี/เดือน)',
    buildRequest: (prompt, apiKey) => ({
      url: 'https://api.x.ai/v1/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      },
      parseResponse: (json) => json?.choices?.[0]?.message?.content || ''
    })
  },
  groq: {
    name: 'Groq',
    label: '🔑 Groq API Key',
    hint: 'ใช้ API Key จาก <a href="https://console.groq.com/" target="_blank">console.groq.com</a> (เร็วมาก!)',
    buildRequest: (prompt, apiKey) => ({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }]
        })
      },
      parseResponse: (json) => json?.choices?.[0]?.message?.content || ''
    })
  },
  local: {
    name: 'Local LLM',
    label: '🌐 Local LLM',
    hint: 'Ollama, LM Studio, vLLM หรือ OpenAI-compatible endpoint',
    buildRequest: (prompt, _, config) => ({
      useProxy: true,
      url: config.localEndpoint,
      apiKey: '',
      body: JSON.stringify({
        model: config.localModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      }),
      parseResponse: (json) => json?.choices?.[0]?.message?.content || json?.message?.content || ''
    })
  }
};

// ============================================
// Cooldown & Rate Limit
// ============================================
const providerCooldowns = {}; // { provider: timestampWhenCooldownEnds }
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let isAIBusy = false; // Rate limit lock

function isProviderInCooldown(provider) {
  const cooldownUntil = providerCooldowns[provider];
  if (!cooldownUntil) return false;
  if (Date.now() >= cooldownUntil) {
    delete providerCooldowns[provider];
    return false;
  }
  return true;
}

function setProviderCooldown(provider) {
  providerCooldowns[provider] = Date.now() + COOLDOWN_MS;
}

function getCooldownRemaining(provider) {
  const cooldownUntil = providerCooldowns[provider];
  if (!cooldownUntil) return 0;
  const remaining = cooldownUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

// ============================================
// Call Single Provider
// ============================================
async function callProvider(provider, prompt, config) {
  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig) throw new Error(`Unknown provider: ${provider}`);

  const apiKey = provider === 'local' ? '' : (config.apiKeys?.[provider] || '');
  if (provider !== 'local' && !apiKey) {
    throw new Error(`ไม่มี API Key สำหรับ ${providerConfig.name}`);
  }

  const request = providerConfig.buildRequest(prompt, apiKey, config);
  let json;

  if (request.useProxy) {
    // Send through background.js service worker (Claude)
    const response = await chrome.runtime.sendMessage({
      action: 'proxyAPICall',
      url: request.url,
      apiKey: request.apiKey,
      body: request.body,
      provider: provider
    });

    if (!response.ok) {
      throw new Error(response.error || 'Proxy call failed');
    }
    json = response.data;
  } else {
    const response = await fetch(request.url, request.options);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${response.status}: ${errText.substring(0, 200)}`);
    }
    json = await response.json();
  }

  const answer = request.parseResponse(json);
  if (!answer) throw new Error('AI ไม่ได้ส่งคำตอบกลับมา');

  return answer;
}

// ============================================
// Ask AI With Fallback
// ============================================
async function askAIWithFallback(prompt, config) {
  const fallbackLog = [];
  const providersToTry = config.fallbackEnabled
    ? config.fallbackOrder
    : [config.aiProvider];

  // Primary provider first
  const primary = config.aiProvider;
  const ordered = [primary, ...providersToTry.filter(p => p !== primary)];

  for (const provider of ordered) {
    const providerConfig = AI_PROVIDERS[provider];
    if (!providerConfig) continue;

    // Skip providers without API key (except local)
    if (provider !== 'local' && !config.apiKeys?.[provider]) {
      fallbackLog.push({
        provider: providerConfig.name,
        status: 'skip',
        reason: 'ไม่มี API Key'
      });
      continue;
    }

    // Skip providers in cooldown
    if (isProviderInCooldown(provider)) {
      const remaining = Math.ceil(getCooldownRemaining(provider) / 1000);
      fallbackLog.push({
        provider: providerConfig.name,
        status: 'cooldown',
        reason: `Cooldown อีก ${remaining}s`
      });
      continue;
    }

    try {
      const startTime = Date.now();
      const answer = await callProvider(provider, prompt, config);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      fallbackLog.push({
        provider: providerConfig.name,
        status: 'success',
        reason: `สำเร็จ (${elapsed}s)`
      });

      return { answer, provider: providerConfig.name, fallbackLog };
    } catch (e) {
      setProviderCooldown(provider);
      fallbackLog.push({
        provider: providerConfig.name,
        status: 'error',
        reason: e.message.substring(0, 100)
      });
    }
  }

  throw { message: 'ไม่มี AI Provider ที่ใช้งานได้', fallbackLog };
}

// ============================================
// Test Provider Connection
// ============================================
async function testProviderConnection(provider, config) {
  const testPrompt = 'Reply with exactly: OK';
  const startTime = Date.now();

  try {
    await callProvider(provider, testPrompt, config);
    const elapsed = Date.now() - startTime;
    return { ok: true, time: elapsed };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
