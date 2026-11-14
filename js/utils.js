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

  window.escapeHtml = escapeHtml;

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
