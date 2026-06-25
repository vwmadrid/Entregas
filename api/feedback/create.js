const { initFirebase, verifyIdTokenFromHeader } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    await verifyIdTokenFromHeader(req);
    const { db } = initFirebase();
    const id = req.body && req.body.id ? String(req.body.id) : null;
    const data = req.body && req.body.data ? req.body.data : {};
    if (id) {
      await db.collection('app_feedback').doc(id).set(data);
      return res.json({ ok: true });
    }
    const ref = await db.collection('app_feedback').add(data);
    res.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error('api/feedback/create', e);
    if (e.message === 'missing_token' || e.message === 'invalid_token') return res.status(401).json({ error: e.message });
    res.status(500).json({ error: 'server_error' });
  }
};
