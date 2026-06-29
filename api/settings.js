const { getSettings, setSettings, publicView } = require('./_settings-store');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const settings = await getSettings();
    res.status(200).json(publicView(settings));
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { currentPassword, siteName, rules, watermark, logo, newPassword } = body || {};

      const current = await getSettings();

      if (currentPassword !== current.password) {
        res.status(401).json({ error: 'Password admin salah.' });
        return;
      }

      const update = {};
      if (typeof siteName === 'string') update.siteName = siteName.trim().slice(0, 80);
      if (typeof rules === 'string') update.rules = rules.trim().slice(0, 2000);
      if (typeof watermark === 'string') update.watermark = watermark.trim().slice(0, 120);
      if (typeof logo === 'string' && logo.startsWith('data:image/')) {
        // basic size guard ~ 1.5MB base64
        if (logo.length > 2_000_000) {
          res.status(400).json({ error: 'Ukuran logo terlalu besar, gunakan gambar yang lebih kecil.' });
          return;
        }
        update.logo = logo;
      }
      if (typeof newPassword === 'string' && newPassword.length > 0) {
        if (newPassword.length < 4) {
          res.status(400).json({ error: 'Password baru minimal 4 karakter.' });
          return;
        }
        update.password = newPassword;
      }

      const saved = await setSettings(update);
      res.status(200).json(publicView(saved));
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan setting: ' + err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
