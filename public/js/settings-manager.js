/* ============================
   A11Y Preferences (Persistence + Apply)
   ============================ */

const GROK_A11Y_KEY = 'grokide:a11y';

function clampNumber(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function normaliseA11y(raw) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const contrast = (obj.contrast === 'high' || obj.contrast === 'normal') ? obj.contrast : 'normal';
  // fontScale is a multiplier: 1 = 100%, 1.1 = 110%, 1.25 = 125%
  const fontScale = clampNumber(obj.fontScale ?? 1, 0.85, 1.6);
  return { contrast, fontScale };
}

function loadA11ySettings() {
  try {
    const raw = localStorage.getItem(GROK_A11Y_KEY);
    return raw ? normaliseA11y(JSON.parse(raw)) : normaliseA11y(null);
  } catch (e) {
    return normaliseA11y(null);
  }
}

function saveA11ySettings(settings) {
  try {
    localStorage.setItem(GROK_A11Y_KEY, JSON.stringify(normaliseA11y(settings)));
  } catch (e) {
    // Ignore quota/private mode errors
  }
}

function applyA11ySettings(settings) {
  const s = normaliseA11y(settings);

  // Contrast hook for CSS to target: :root[data-contrast="high"] { ... }
  document.documentElement.dataset.contrast = s.contrast;

  // Font scaling: simplest + most compatible with rem-based tokens
  // 1.25 => 125%
  document.documentElement.style.fontSize = `${Math.round(s.fontScale * 100)}%`;

  // Optional compatibility var (harmless if unused)
  document.documentElement.style.setProperty('--a11y-font-scale', String(s.fontScale));

  return s;
}

function bindA11yControls(current) {
  // These selectors are intentionally broad; if your UI uses different IDs,
  // nothing breaks — you can wire via window.GrokA11y.set(...) instead.
  const fontEl =
    document.querySelector('#a11y-font-scale, #font-scale, [data-a11y="font-scale"], [name="fontScale"]');
  const contrastEl =
    document.querySelector('#a11y-contrast, #contrast, [data-a11y="contrast"], [name="contrast"]');

  // Initialise control values (if present)
  if (fontEl) {
    const val = (fontEl.value ?? '').toString().trim();
    if (!val) fontEl.value = String(current.fontScale);
  }
  if (contrastEl) {
    const val = (contrastEl.value ?? '').toString().trim();
    if (!val) contrastEl.value = current.contrast;
  }

  // Persist + apply on change
  if (fontEl) {
    const onFontChange = () => {
      const raw = (fontEl.value ?? '').toString().trim();
      const n = Number(raw);
      // Accept "125" as 125% or "1.25" as multiplier
      const nextScale = n > 10 ? (n / 100) : n;
      const next = normaliseA11y({ ...loadA11ySettings(), fontScale: nextScale });
      saveA11ySettings(next);
      applyA11ySettings(next);
    };
    fontEl.addEventListener('change', onFontChange);
    fontEl.addEventListener('input', onFontChange);
  }

  if (contrastEl) {
    contrastEl.addEventListener('change', () => {
      const raw = (contrastEl.value ?? '').toString().trim();
      const nextContrast = (raw === 'high') ? 'high' : 'normal';
      const next = normaliseA11y({ ...loadA11ySettings(), contrast: nextContrast });
      saveA11ySettings(next);
      applyA11ySettings(next);
    });
  }
}

function initA11y() {
  const settings = loadA11ySettings();
  const applied = applyA11ySettings(settings);
  bindA11yControls(applied);

  // Expose a tiny API for manual wiring/testing:
  // window.GrokA11y.set({ fontScale: 1.25 }) or .set({ contrast: 'high' })
  window.GrokA11y = {
    get: () => loadA11ySettings(),
    set: (partial) => {
      const next = normaliseA11y({ ...loadA11ySettings(), ...(partial || {}) });
      saveA11ySettings(next);
      applyA11ySettings(next);
      return next;
    },
    reset: () => {
      const next = normaliseA11y({ contrast: 'normal', fontScale: 1 });
      saveA11ySettings(next);
      applyA11ySettings(next);
      return next;
    }
  };
}

// Initialise once DOM is ready
document.addEventListener('DOMContentLoaded', initA11y);
