const { initFirebase } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const gasUrl = process.env.GAS_URL;
    if (!gasUrl) return res.status(500).json({ error: 'gas_not_configured' });

    const body = req.body || {};
    const nativeFetch = (typeof fetch !== 'undefined') ? fetch : (await import('node-fetch')).default;
    const response = await nativeFetch(gasUrl, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
    const text = await response.text();
    res.status(200).send(text);
  } catch (e) {
    console.error('api/proxy/gas', e);
    res.status(500).json({ error: 'server_error' });
  }
};
