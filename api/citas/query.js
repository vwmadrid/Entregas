const { initFirebase } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const { db } = initFirebase();
    const field = String((req.body && req.body.field) || '');
    const value = req.body && req.body.value;
    if (!field) return res.status(400).json({ error: 'missing_field' });

    const snap = await db.collection('citas_agenda').where(field, '==', value).get();
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results });
  } catch (e) {
    console.error('api/citas/query', e);
    res.status(500).json({ error: 'server_error' });
  }
};
