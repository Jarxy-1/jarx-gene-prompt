const { getSettings } = require('./_settings-store');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { password } = body || {};
    const settings = await getSettings();
    if (password === settings.password) {
      res.status(200).json({ ok: true });
    } else {
      res.status(401).json({ ok: false, error: 'Password salah.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
