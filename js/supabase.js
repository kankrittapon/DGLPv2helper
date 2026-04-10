// ===== DGLP Quiz Helper — Supabase Module v1.2 =====
// REST API client — Email / Password Auth

let supabaseSession = null;

// ใส่ Default Database ของคุณไว้เป็นท่ามารตฐาน
const DEFAULT_SUPABASE_URL = 'https://zaqsyzahunifxfeanalr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphcXN5emFodW5pZnhmZWFuYWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzE5NjUsImV4cCI6MjA5MTMwNzk2NX0.XVBfINlq_h7W49-bZ_z0FlkOnfdm9G1pBlY7Be0__r8';

function getSupabaseConfig() {
  return {
    url: currentConfig.supabaseUrl?.trim() || DEFAULT_SUPABASE_URL,
    key: currentConfig.supabaseKey?.trim() || DEFAULT_SUPABASE_KEY
  };
}

// ============================================
// HTTP Helper
// ============================================
async function supabaseRequest(method, path, body = null, extraHeaders = {}) {
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

  const headers = {
    'apikey': supabaseKey,
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  if (supabaseSession?.access_token) {
    headers['Authorization'] = `Bearer ${supabaseSession.access_token}`;
  } else {
    headers['Authorization'] = `Bearer ${supabaseKey}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${supabaseUrl}${path}`, options);

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = errText.substring(0, 200);
    try {
      const errObj = JSON.parse(errText);
      if (errObj.msg || errObj.message) errMsg = errObj.msg || errObj.message;
    } catch (e) {}
    throw new Error(errMsg);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ============================================
// Auth — Session Management
// ============================================
async function initAuth() {
  try {
    const stored = await chrome.storage.local.get('dglpSupabaseSession');
    if (stored.dglpSupabaseSession) {
      supabaseSession = stored.dglpSupabaseSession;

      if (isSessionExpired()) {
        await refreshSession();
      }
    }
  } catch (e) {
    console.error('[DGLP] Failed to restore session:', e);
  }
}

function isSessionExpired() {
  if (!supabaseSession?.expires_at) return true;
  return Date.now() / 1000 >= supabaseSession.expires_at - 60;
}

async function refreshSession() {
  if (!supabaseSession?.refresh_token) return;

  try {
    const data = await supabaseRequest('POST', '/auth/v1/token?grant_type=refresh_token', {
      refresh_token: supabaseSession.refresh_token
    });

    if (data?.access_token) {
      supabaseSession = {
        ...supabaseSession,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at || (Date.now() / 1000 + 3600),
        user: data.user || supabaseSession.user
      };
      await chrome.storage.local.set({ dglpSupabaseSession: supabaseSession });
    }
  } catch (e) {
    console.error('[DGLP] Session refresh failed:', e);
    supabaseSession = null;
    await chrome.storage.local.remove('dglpSupabaseSession');
  }
}

// ============================================
// Auth — Email / Password
// ============================================
async function signUpWithEmail(email, password) {
  const data = await supabaseRequest('POST', '/auth/v1/signup', {
    email,
    password
  });

  if (data?.session?.access_token || data?.access_token) {
    const token = data.session ? data.session.access_token : data.access_token;
    const refresh = data.session ? data.session.refresh_token : data.refresh_token;
    const user = data.user;
    
    supabaseSession = {
      access_token: token,
      refresh_token: refresh,
      expires_at: (Date.now() / 1000 + 3600),
      user: user
    };
    await chrome.storage.local.set({ dglpSupabaseSession: supabaseSession });
  }

  return data;
}

async function signInWithEmail(email, password) {
  const data = await supabaseRequest('POST', '/auth/v1/token?grant_type=password', {
    email,
    password
  });

  if (data?.access_token) {
    supabaseSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || (Date.now() / 1000 + 3600),
      user: data.user
    };
    await chrome.storage.local.set({ dglpSupabaseSession: supabaseSession });
  }

  return data;
}

async function signOut() {
  supabaseSession = null;
  await chrome.storage.local.remove('dglpSupabaseSession');
}

function getUser() {
  return supabaseSession?.user || null;
}

// ============================================
// CRUD — Quiz Attempts
// ============================================
async function saveAttempt({ topicName, courseId, sectionId, totalQuestions, answers, aiProvider, score }) {
  if (isSessionExpired()) await refreshSession();
  if (!supabaseSession) throw new Error('กรุณา Login ก่อนบันทึกประวัติ');

  return supabaseRequest('POST', '/rest/v1/quiz_attempts', {
    user_id: supabaseSession.user.id,
    topic_name: topicName,
    course_id: courseId,
    section_id: sectionId,
    total_questions: totalQuestions,
    answers,
    ai_provider: aiProvider,
    score: score || null
  }, {
    'Prefer': 'return=representation'
  });
}

async function getAttempts(courseId, sectionId, limit = 10, offset = 0) {
  if (isSessionExpired()) await refreshSession();
  if (!supabaseSession) return [];

  let query = `/rest/v1/quiz_attempts?user_id=eq.${supabaseSession.user.id}&order=created_at.desc&limit=${limit}&offset=${offset}`;
  if (courseId) query += `&course_id=eq.${encodeURIComponent(courseId)}`;
  if (sectionId) query += `&section_id=eq.${encodeURIComponent(sectionId)}`;

  return supabaseRequest('GET', query);
}

async function getUniqueTopics() {
  if (isSessionExpired()) await refreshSession();
  if (!supabaseSession) return [];

  return supabaseRequest('GET',
    `/rest/v1/quiz_attempts?user_id=eq.${supabaseSession.user.id}&select=topic_name,course_id,section_id&order=created_at.desc`
  );
}

async function updateScore(attemptId, score) {
  if (isSessionExpired()) await refreshSession();
  if (!supabaseSession) throw new Error('กรุณา Login ก่อนอัพเดทคะแนน');

  return supabaseRequest('PATCH', `/rest/v1/quiz_attempts?id=eq.${attemptId}`, {
    score
  });
}
