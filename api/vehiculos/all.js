const { initFirebase } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    const { db } = initFirebase();
    const snap = await db.collection('vehiculos').get();
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results });
  } catch (e) {
    console.error('api/vehiculos/all', e);
    res.status(500).json({ error: 'server_error' });
  }
};
