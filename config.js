// ============================================================
//  Tu Mano a Uno — Configuración
//  ⚠️  COMPLETÁ estos valores antes de publicar en GitHub Pages
// ============================================================

const CONFIG = {

  // ── Google OAuth ────────────────────────────────────────────
  // 1. Creá un proyecto en https://console.cloud.google.com
  // 2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
  // 3. Application type: Web application
  // 4. Authorized JavaScript origins: https://TU_USUARIO.github.io
  // 5. Pegá el Client ID acá abajo:
  GOOGLE_CLIENT_ID: 'TU_GOOGLE_CLIENT_ID_ACA.apps.googleusercontent.com',

  // ── Google Apps Script (backend) ────────────────────────────
  // 1. Creá el script desde tu Google Sheet (Extensiones → Apps Script)
  // 2. Pegá el código de apps-script.gs
  // 3. Publicá como Web App (cualquiera puede acceder, ejecutar como tú)
  // 4. Pegá la URL del deploy acá abajo:
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec',

  // ── App settings ────────────────────────────────────────────
  APP_NAME: 'Tu Mano a Uno',
  CVU: '0000003100040849915686',
  CARD_DURATION_HOURS: 24,

  // ── Mapa (Buenos Aires por defecto) ─────────────────────────
  DEFAULT_LAT: -34.6118,
  DEFAULT_LNG: -58.3960,
  DEFAULT_ZOOM: 12,

  // ── Seguridad ───────────────────────────────────────────────
  // Dominios de email permitidos (vacío = todos)
  ALLOWED_EMAIL_DOMAINS: [],
  // Máx publicaciones por usuario por día
  MAX_POSTS_PER_DAY: 5,
};

// Freeze para evitar modificaciones en runtime
Object.freeze(CONFIG);
