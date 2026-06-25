const { initFirebase, verifyIdTokenFromHeader } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    await verifyIdTokenFromHeader(req);
    const { db } = initFirebase();
    const id = String((req.body && req.body.id) || '');
    const data = (req.body && req.body.data) || {};
    if (!id) return res.status(400).json({ error: 'missing_id' });

    await db.collection('vehiculos').doc(id).update(data);
    res.json({ ok: true });
  } catch (e) {
    console.error('api/vehiculos/update', e);
    if (e.message === 'missing_token' || e.message === 'invalid_token') return res.status(401).json({ error: e.message });
    res.status(500).json({ error: 'server_error' });
  }
};
