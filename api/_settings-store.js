const { kv } = require('@vercel/kv');

const SETTINGS_KEY = 'pg:settings';

const defaults = {
  siteName: 'Prompt Generator',
  rules: 'Upload satu foto, prompt akan dibuat otomatis dalam bahasa Inggris siap pakai untuk AI image generator. Jangan upload foto orang lain tanpa izin.',
  watermark: '',
  logo: '', // base64 data url
  password: 'admin123'
};

async function getSettings() {
  try {
    const stored = await kv.get(SETTINGS_KEY);
    if (!stored) return { ...defaults };
    return { ...defaults, ...stored };
  } catch (e) {
    return { ...defaults };
  }
}

async function setSettings(partial) {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await kv.set(SETTINGS_KEY, next);
  return next;
}

function publicView(settings) {
  // Never expose password to the public dashboard
  const { password, ...rest } = settings;
  return rest;
}

module.exports = { getSettings, setSettings, publicView, defaults };
