const { initFirebase, verifyIdTokenFromHeader } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const decoded = await verifyIdTokenFromHeader(req);
    const { db } = initFirebase();
    const id = String((req.body && req.body.id) || '');
    const data = (req.body && req.body.data) || {};
    if (!id) return res.status(400).json({ error: 'missing_id' });

    const docRef = db.collection('citas_agenda').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'not_found' });

    const owner = doc.data().owner;
    if (!(decoded.admin === true || decoded.uid === owner)) return res.status(403).json({ error: 'forbidden' });

    const allowed = ['phone', 'status', 'notes', 'time', 'date', 'cliente', 'email', 'entregaVO', 'agente'];
    const safe = {};
    for (const k of allowed) if (k in data) safe[k] = data[k];
    if (!Object.keys(safe).length) return res.status(400).json({ error: 'no_allowed_fields' });

    await docRef.update(safe);
    res.json({ ok: true });
  } catch (e) {
    console.error('api/citas/update', e);
    if (e.message === 'missing_token' || e.message === 'invalid_token') return res.status(401).json({ error: e.message });
    res.status(500).json({ error: 'server_error' });
  }
};
