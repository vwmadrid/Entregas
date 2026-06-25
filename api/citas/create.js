const { initFirebase, verifyIdTokenFromHeader } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const decoded = await verifyIdTokenFromHeader(req);
    const { db } = initFirebase();

    const data = (req.body && req.body.data) || {};
    const allowed = ['matricula', 'phone', 'date', 'time', 'notes', 'status', 'vehicleId', 'modelo', 'bastidor', 'cliente', 'email', 'entregaVO', 'agente', 'creadoEn', 'lopdAceptada'];
    const safe = {};
    for (const k of allowed) if (k in data) safe[k] = data[k];

    if (!Object.keys(safe).length) return res.status(400).json({ error: 'invalid_data' });
    safe.owner = decoded.uid;

    const ref = await db.collection('citas_agenda').add(safe);
    res.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error('api/citas/create', e);
    if (e.message === 'missing_token' || e.message === 'invalid_token') return res.status(401).json({ error: e.message });
    res.status(500).json({ error: 'server_error' });
  }
};
