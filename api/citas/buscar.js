const { initFirebase } = require('../_firebase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const { db } = initFirebase();
    const matriculaRaw = String((req.body && req.body.matricula) || '');
    const matricula = matriculaRaw.toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z0-9\-]{1,20}$/.test(matricula)) return res.status(400).json({ error: 'invalid_matricula' });

    const snap = await db.collection('citas_agenda').where('matricula', '==', matricula).get();
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results });
  } catch (e) {
    console.error('api/citas/buscar', e);
    res.status(500).json({ error: 'server_error' });
  }
};
