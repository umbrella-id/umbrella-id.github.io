/**
 * utils.js — Utility helpers (single source of truth)
 * Load PERTAMA setelah config.js, sebelum file JS lain.
 */
(function() {
  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      if (m === '"') return '&quot;';
      if (m === "'") return '&#39;';
      return m;
    });
  }

  function escapeJs(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  window.escapeHtml = escapeHtml;
  window.escapeJs = escapeJs;

  // ==========================================
  // SANITIZE HTML — DOMPurify wrapper (centralized)
  // ==========================================
  const _PURIFY_CONFIG_STANDARD = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'span', 'div',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
  };

  // Text-only — untuk konteks yang tidak render gambar & link (brosur)
  const _PURIFY_CONFIG_TEXT_ONLY = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  };

  window.sanitizeHtml = function(html) {
    if (!html) return '';
    if (typeof DOMPurify === 'undefined') {
      console.warn('⚠️ DOMPurify tidak ter-load, fallback ke escapeHtml');
      return escapeHtml(html);
    }
    return DOMPurify.sanitize(html, _PURIFY_CONFIG_STANDARD);
  };

  window.sanitizeHtmlText = function(html) {
    if (!html) return '';
    if (typeof DOMPurify === 'undefined') {
      return escapeHtml(html);
    }
    return DOMPurify.sanitize(html, _PURIFY_CONFIG_TEXT_ONLY);
  };

  window.requireSession = async function() {
    if (window.myUID && localStorage.getItem('umbrella_session_token')) {
      return true;
    }
    
    if (typeof window.ensureGuestSession !== 'function') {
      console.error('❌ ensureGuestSession() belum ter-load. Cek urutan script di HTML.');
      return false;
    }
    
    try {
      const session = await window.ensureGuestSession();
      return !!session;
    } catch(e) {
      console.error('requireSession error:', e);
      return false;
    }
  };

  window.getFriendlyErrorMessage = function(err, fallback) {
  if (!err) return fallback || 'Terjadi kesalahan';
  const msg = String(err.message || '');
  
  if (msg.includes('Server sedang sibuk') || msg.includes('Gagal resolve auth URL')) {
    return '⚠️ Server sedang sibuk. Coba lagi sebentar lagi.';
  }
  if (msg.includes('Timeout') || msg.includes('Failed to fetch') || 
      msg.includes('NetworkError') || msg.includes('Load failed')) {
    return '⚠️ Koneksi lambat. Periksa internet Anda.';
  }
  return fallback || 'Terjadi kesalahan';
};

  console.log('✅ utils.js loaded');
})();
