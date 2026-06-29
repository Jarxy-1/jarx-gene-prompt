module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server belum dikonfigurasi: GEMINI_API_KEY belum diset di Environment Variables Vercel.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { image, mimeType } = body || {};

    if (!image || !mimeType) {
      res.status(400).json({ error: 'Foto tidak ditemukan dalam request.' });
      return;
    }
    // Rough size guard (~6MB base64) to avoid abuse / huge payloads
    if (image.length > 8_000_000) {
      res.status(400).json({ error: 'Ukuran foto terlalu besar.' });
      return;
    }

    const instruction = "Analyze this image carefully and break it down into a structured AI image-generation prompt. Output ONLY the following lines, in this exact order, each on its own line, each label followed by a colon and a detailed English description on the same line. Do not add any intro, outro, numbering, markdown, or extra commentary — output nothing except these lines:\n" +
      "Subject: (who/what is the main subject, including key physical details)\n" +
      "Camera Angle/Framing: (camera angle, shot type, framing, distance, perspective)\n" +
      "Outfit: (clothing, accessories, materials, colors — write \"N/A\" if not applicable)\n" +
      "Pose: (body pose, gesture, facial expression, action)\n" +
      "Lighting: (light source, direction, quality, time of day, shadows)\n" +
      "Background/Setting: (location, environment, background elements)\n" +
      "Final Style: (art style, rendering style, color palette, mood, level of detail, comparable medium e.g. photo/illustration/3D)\n" +
      "Negative Prompt: (comma-separated list of things to avoid in regeneration, e.g. blurry, extra limbs, watermark, bad anatomy, lowres — tailor a few specific ones to this image too)";

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: instruction },
            { inline_data: { mime_type: mimeType, data: image } }
          ]
        }]
      })
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = (data && data.error && data.error.message) ? data.error.message : ('HTTP ' + geminiRes.status);
      res.status(502).json({ error: 'Gagal memproses foto: ' + msg });
      return;
    }

    let text = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      text = data.candidates[0].content.parts.map(p => p.text || '').join('').trim();
    }

    if (!text) {
      res.status(502).json({ error: 'Tidak ada hasil dari AI. Coba foto lain.' });
      return;
    }

    res.status(200).json({ prompt: text });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan server: ' + err.message });
  }
};
