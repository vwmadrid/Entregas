const { initFirebase } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const { db } = initFirebase();
    const qRaw = String((req.body && req.body.q) || '');
    const q = qRaw.toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z0-9\-]{1,30}$/.test(q)) return res.status(400).json({ error: 'invalid_query' });

    const snap = await db.collection('vehiculos').where('matricula', '==', q).get();
    const byMat = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (byMat.length) return res.json({ results: byMat });

    const snap2 = await db.collection('vehiculos').where('bastidor', '==', q).get();
    const byBas = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results: byBas });
  } catch (e) {
    console.error('api/vehiculos/buscar', e);
    res.status(500).json({ error: 'server_error' });
  }
};
