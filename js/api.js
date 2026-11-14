/**
 * api.js — Public Web (headline, info, gallery, chat, mail, akun)
 * Tanpa kas, tanpa crysta. Konten dari GAS-Content, auth dari GAS-Auth.
 */

const GAS_CONTENT_URL = 'https://script.google.com/macros/s/AKfycbzlxIQc75KaCjn_05YhbQP3VMzP4W0NqpuJrGk8Vjm0F81NixhQ6RE_g55wMq_vf8cPVw/exec';

let _authConfigCache = null, _authConfigCacheTime = 0;
const AUTH_CONFIG_TTL = 5 * 60 * 1000;
let _contentCache = null, _contentPromise = null;

// === FETCH WITH TIMEOUT ===
function fetchWithTimeout(url, options, timeoutMs) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  return fetch(url, Object.assign({}, options, { signal: c.signal }))
    .finally(() => clearTimeout(t));
}

// === AUTH CONFIG ===
let _authConfigNegativeUntil = 0;

async function getAuthConfig() {
  const now = Date.now();
  
  // Cache positif
  if (_authConfigCache && (now - _authConfigCacheTime) < AUTH_CONFIG_TTL) {
    return _authConfigCache;
  }
  
  // Negative cache — jangan spam server
  if (now < _authConfigNegativeUntil) {
    throw new Error('Server sedang sibuk. Coba lagi dalam ' + 
                    Math.ceil((_authConfigNegativeUntil - now) / 1000) + ' detik.');
  }
  
  try {
    const res = await fetchWithTimeout(GAS_CONTENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getAuthConfig' })
    }, 5000);
    const data = await res.json();
    
    if (data.status === 'success' && data.activeUrl) {
      _authConfigCache = {...};
      _authConfigCacheTime = now;
      _authConfigNegativeUntil = 0;  // reset
      return _authConfigCache;
    }
  } catch(e) {
    console.warn('getAuthConfig error:', e.message);
  }
  
  // Gagal — set cooldown 30 detik
  _authConfigNegativeUntil = now + 30000;
  throw new Error('Server sedang sibuk. Coba lagi dalam 30 detik.');
}

window.handleFetchError = function(err, defaultMsg) {
  if (!err) {
    showToast(defaultMsg || '❌ Terjadi kesalahan', true);
    return;
  }
  
  const msg = String(err.message || '');
  
  if (msg.includes('Server sedang sibuk') || msg.includes('Gagal resolve auth URL')) {
    showToast('⚠️ Server sedang sibuk. Coba lagi sebentar lagi.', true);
  } else if (msg.includes('Timeout') || msg.includes('Failed to fetch')) {
    showToast('⚠️ Koneksi lambat. Periksa internet Anda.', true);
  } else {
    showToast(defaultMsg || '❌ Terjadi kesalahan', true);
  }
};

async function reportAuthIssue(failedUrl) {
  try {
    const res = await fetchWithTimeout(GAS_CONTENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'reportAuthIssue',
        uid: simpleHash(window.myUID || ''),   // ← hash, bukan raw
        failedUrl: failedUrl
      })
    }, 5000);
    const data = await res.json();
    if (data.newUrl && data.newUrl !== failedUrl) {
      _authConfigCache = { activeUrl: data.newUrl, active: data.active, total: data.total };
      _authConfigCacheTime = Date.now();
    }
    return data;
  } catch(e) { return null; }
}

function simpleHash(str) {
  if (!str) return 'anon';
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return 'h' + Math.abs(h).toString(36);
}

// === AUTH FETCH ===
async function authFetch(action, payload, options) {
  options = options || {};
  const isWrite = options.isWrite === true;
  const timeout = options.timeout || 12000;
  
  const config = await getAuthConfig();
  const url = config.activeUrl;
  
  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action }, payload))
    }, timeout);
    
    if (res.status >= 500) {
      await reportAuthIssue(url);
      if (!isWrite) {
        const nc = await getAuthConfig();
        if (nc.activeUrl !== url) {
          const r2 = await fetchWithTimeout(nc.activeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(Object.assign({ action }, payload))
          }, timeout);
          return r2.json();
        }
      }
      throw new Error('Server error ' + res.status);
    }
    
    const data = await res.json();
    if (data.status === 'quota_exceeded') {
      await reportAuthIssue(url);
      throw new Error('Server quota habis.');
    }
    return data;
  } catch(e) {
    if (e.name === 'AbortError' || String(e.message).includes('Failed to fetch')) {
      await reportAuthIssue(url);
      if (isWrite) throw new Error('Timeout. Cek dulu sebelum kirim ulang.');
      const nc = await getAuthConfig();
      if (nc.activeUrl !== url) {
        const r2 = await fetchWithTimeout(nc.activeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(Object.assign({ action }, payload))
        }, timeout);
        return r2.json();
      }
    }
    throw e;
  }
}

// === AUTH GET (untuk endpoint GET seperti getGateQuestion) ===
async function authGet(action, params) {
  const config = await getAuthConfig();
  let url = config.activeUrl + '?action=' + action;
  params = params || {};
  for (const k in params) {
    if (params[k] !== undefined && params[k] !== null) {
      url += '&' + k + '=' + encodeURIComponent(params[k]);
    }
  }
  const res = await fetchWithTimeout(url, {}, 10000);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// === CONTENT FETCH ===
async function contentFetch(action, params) {
  params = params || {};
  let url = GAS_CONTENT_URL + '?action=' + action;
  for (const k in params) {
    if (params[k] !== undefined && params[k] !== null) {
      url += '&' + k + '=' + encodeURIComponent(params[k]);
    }
  }
  const res = await fetchWithTimeout(url, {}, 10000);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// === API WRAPPER ===
const API = {
  // === CONTENT (public only) ===
  async getContent() {
    if (_contentCache) return _contentCache;
    if (_contentPromise) return _contentPromise;
    _contentPromise = contentFetch('getPublicContent')
      .then(data => { _contentCache = data; _contentPromise = null; return data; })
      .catch(err => { _contentPromise = null; throw err; });
    return _contentPromise;
  },
  
  async refreshContent() {
    _contentCache = null;
    _contentPromise = null;
    return this.getContent();
  },
  
  // === GATE ===
  async checkAccessCode(code, userAgent) {
    return authFetch('checkAccessCode', { code, userAgent }, { isWrite: true });
  },
  
  // === GUEST SESSION ===
  async createGuestSession(userAgent) {
    return authFetch('createGuestSession', { userAgent }, { isWrite: true });
  },
  
  async validateGuestSession(uid, token) {
    return authFetch('validateGuestSession', { uid, token });
  },
  
  // === MAIL ===
  async sendMail(uid, ign, msg, category) {
    const token = localStorage.getItem('umbrella_session_token') || '';
    return authFetch('sendMail', { uid, ign, msg, category, token }, { isWrite: true });
  },
  
  async getMailList(uid, token) {
    return authFetch('getMailList', { uid, token });
  },
  
  async getMailHistory(uid, token) {
    return authFetch('getMailHistory', { uid, token });
  },
  
  // === ACCOUNT ===
  async checkAccountStatus(uid) {
    return authFetch('checkAccountStatus', { uid });
  },
  
  async verifyActivationCode(code, mode) {
    return authFetch('verifyActivationCode', { code, mode }, { isWrite: true });
  },
  
  async activateAccount(uid, idLogin, password, localUid, sessionToken) {
    return authFetch('activateAccount', {
      uid, idLogin, password, localUid, sessionToken
    }, { isWrite: true });
  },
  
  async loginWithIdPassword(idLogin, password, userAgent) {
    return authFetch('loginWithIdPassword', {
      idLogin, password, userAgent
    }, { isWrite: true });
  },
  
  async changeMemberPassword(uid, oldPassword, newPassword, sessionToken) {
    return authFetch('changeMemberPassword', {
      uid, oldPassword, newPassword, sessionToken
    }, { isWrite: true });
  },
  
  async resetMemberPassword(uid, code, idLogin, password) {
    return authFetch('resetMemberPassword', {
      uid, code, idLogin, password
    }, { isWrite: true });
  },
  
  async validateMemberSession(uid, token) {
    return authFetch('validateMemberSession', { uid, token });
  },
  
  async memberLogout(token) {
    return authFetch('memberLogout', { token }, { isWrite: true });
  },
  
  // === CHAT ===
  async getChats(uid, ign, isMuted, muteExpiry) {
    const token = localStorage.getItem('umbrella_session_token') || '';
    const ua = (navigator.userAgent || 'unknown').substring(0, 100);
    return authFetch('getChats', {
      uid, ign,
      isMuted: isMuted || false,
      muteExpiry: muteExpiry || 0,
      token, userAgent: ua
    });
  },
  
  async sendChat(uid, ign, msg, type) {
    const token = localStorage.getItem('umbrella_session_token') || '';
    const ua = (navigator.userAgent || 'unknown').substring(0, 100);
    return authFetch('sendChat', {
      uid, ign, msg,
      type: type || 'msg',
      token, userAgent: ua
    }, { isWrite: true });
  },
  
  async sendPresence(mode) {
    const token = localStorage.getItem('umbrella_session_token') || '';
    return authFetch('sendPresence', { token, mode });
  },
  
  // === SARAN ===
  async submitSaran(uid, token, message) {
    return authFetch('submitSaran', { uid, token, message }, { isWrite: true });
  }
};

window.API = API;
window.authFetch = authFetch;
window.authGet = authGet;
window.contentFetch = contentFetch;
window.getAuthConfig = getAuthConfig;
window.fetchWithTimeout = fetchWithTimeout;
window.reportAuthIssue = reportAuthIssue;

console.log('✅ api.js loaded (public — clean, no kas/crysta)');
