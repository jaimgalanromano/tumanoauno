// ============================================================
//  Auth — Google OAuth via Google Identity Services (GIS)
// ============================================================

const Auth = (() => {
  let _user = null;
  let _tokenClient = null;

  // ── Sanitize user input ─────────────────────────────────────
  function sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }

  // ── Parse JWT (sin verificación de firma — solo UI) ─────────
  function parseJwt(token) {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // ── Validate domain (if restricted) ─────────────────────────
  function isAllowedEmail(email) {
    if (!CONFIG.ALLOWED_EMAIL_DOMAINS || CONFIG.ALLOWED_EMAIL_DOMAINS.length === 0) return true;
    const domain = email.split('@')[1];
    return CONFIG.ALLOWED_EMAIL_DOMAINS.includes(domain);
  }

  // ── Init Google Identity Services ───────────────────────────
  function init() {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(check);

          google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          resolve();
        }
      }, 100);
    });
  }

  // ── Handle Google login response ─────────────────────────────
  function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    if (!payload) {
      App.showToast('Error al iniciar sesión. Intentá de nuevo.', 'error');
      return;
    }

    if (!isAllowedEmail(payload.email)) {
      App.showToast('Email no permitido para esta aplicación.', 'error');
      return;
    }

    _user = {
      id: sanitize(payload.sub),
      name: sanitize(payload.name),
      email: sanitize(payload.email),
      photo: payload.picture || '',  // URL externa, no sanitizar con HTML
      token: response.credential,
    };

    // Persist session (sessionStorage — no persiste entre pestañas ni reinicios)
    try {
      sessionStorage.setItem('tmu_user', JSON.stringify({
        id: _user.id,
        name: _user.name,
        email: _user.email,
        photo: _user.photo,
      }));
    } catch { /* storage puede estar bloqueado */ }

    App.onLoginSuccess(_user);
  }

  // ── Try restore session ──────────────────────────────────────
  function restoreSession() {
    try {
      const stored = sessionStorage.getItem('tmu_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validación básica
        if (parsed && parsed.id && parsed.email) {
          _user = parsed;
          return true;
        }
      }
    } catch { /* ignore */ }
    return false;
  }

  // ── Logout ───────────────────────────────────────────────────
  function logout() {
    _user = null;
    try { sessionStorage.removeItem('tmu_user'); } catch { /* ignore */ }
    if (window.google && window.google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
    App.onLogout();
  }

  // ── Trigger Google sign-in ────────────────────────────────────
  function signIn() {
    if (window.google && window.google.accounts) {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: render button programmatically en invisible div
          const tmp = document.createElement('div');
          tmp.style.display = 'none';
          document.body.appendChild(tmp);
          google.accounts.id.renderButton(tmp, { type: 'standard' });
          // Trigger click manually
          const btn = tmp.querySelector('[role="button"]');
          if (btn) btn.click();
          setTimeout(() => tmp.remove(), 3000);
        }
      });
    }
  }

  // ── Getters ─────────────────────────────────────────────────
  function getUser() { return _user; }
  function isLoggedIn() { return !!_user; }

  return { init, signIn, logout, restoreSession, getUser, isLoggedIn, sanitize };
})();
