require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

// Inicializar Firebase Admin con JSON en la variable de entorno FIREBASE_SERVICE_ACCOUNT
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) {
  console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', e);
  process.exit(1);
}

const db = admin.firestore();
const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 90 }));

// Debug: registrar origen de las peticiones en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    try {
      console.log('[DEBUG REQUEST]', req.method, req.path, 'Origin:', req.headers.origin || '(none)');
    } catch (e) {}
    next();
  });
}

// CORS restrictivo: permitir orígenes configurados (coma-separados) y orígenes comunes
const frontendOriginRaw = process.env.FRONTEND_ORIGIN || '';
const allowedOrigins = frontendOriginRaw.split(',').map(s => s.trim()).filter(Boolean);

// Agregar orígenes de desarrollo locales
const devDefaults = [
  'http://localhost:5500', 
  'http://127.0.0.1:5500', 
  'http://localhost:5501', 
  'http://127.0.0.1:5501'
];
for (const d of devDefaults) if (!allowedOrigins.includes(d)) allowedOrigins.push(d);

// Agregar orígenes de GitHub Pages y Vercel en producción
if (process.env.NODE_ENV === 'production') {
  const prodDefaults = [
    'https://vwmadrid.github.io',  // Tu repo de GitHub Pages
    'https://tu-usuario.github.io', // Ajusta con tu usuario
    'https://gescar-backend.vercel.app' // Tu dominio Vercel (para requests entre servicios)
  ];
  for (const p of prodDefaults) if (!allowedOrigins.includes(p)) allowedOrigins.push(p);
}

function isHostedOrigin(origin) {
  if (!origin) return false;
  const githubPages = /^https:\/\/[a-z0-9-]+\.github\.io$/i;
  const vercelApp = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
  return githubPages.test(origin) || vercelApp.test(origin);
}

let corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isHostedOrigin(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed by server'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Permitir temporalmente todos los orígenes en desarrollo para debug local
if (process.env.NODE_ENV !== 'production') {
  console.warn('CORS: development mode - allowing all origins for local debugging');
  corsOptions = { origin: true, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] };
}

app.use(cors(corsOptions));

// Forzar HTTPS cuando se configure (ENFORCE_HTTPS=true), útil en producción
if (process.env.ENFORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    if (proto && proto !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

// Content Security Policy (CSP) — ajusta según los recursos que uses
const cspDirectives = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://www.gstatic.com", "https://www.youtube.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https://raw.githubusercontent.com", "https://upload.wikimedia.org", "https://www.youtube.com"],
    connectSrc: ["'self'", ...allowedOrigins],
    frameSrc: ["https://www.youtube.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
  }
};
app.use(helmet.contentSecurityPolicy(cspDirectives));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

// Middleware: verificar token Firebase ID (si se requiere)
async function verifyIdToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) return res.status(401).json({ error: 'missing_token' });
  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    return next();
  } catch (e) {
    console.error('Token verification failed', e);
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.admin !== true) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

// Middleware: permitir propietario del documento o admin
async function requireOwnerOrAdmin(req, res, next) {
  const id = String(req.body.id || req.query.id || '');
  if (!id) return res.status(400).json({ error: 'missing_id' });
  try {
    const doc = await db.collection('citas_agenda').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'not_found' });
    const owner = doc.data().owner;
    if (req.user && (req.user.admin === true || req.user.uid === owner)) return next();
    return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    console.error('requireOwnerOrAdmin error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
// Healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Endpoint: buscar citas por matrícula
app.post('/api/citas/buscar', async (req, res) => {
  try {
    const matriculaRaw = String(req.body.matricula || '');
    const matricula = matriculaRaw.toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z0-9\-]{1,20}$/.test(matricula)) return res.status(400).json({ error: 'invalid_matricula' });

    const snap = await db.collection('citas_agenda').where('matricula', '==', matricula).get();
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results });
  } catch (e) {
    console.error('Error /api/citas/buscar', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: buscar vehículo por matrícula o bastidor
app.post('/api/vehiculos/buscar', async (req, res) => {
  try {
    const qRaw = String(req.body.q || '');
    const q = qRaw.toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z0-9\-]{1,30}$/.test(q)) return res.status(400).json({ error: 'invalid_query' });

    const snap = await db.collection('vehiculos').where('matricula', '==', q).get();
    const byMat = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (byMat.length) return res.json({ results: byMat });

    const snap2 = await db.collection('vehiculos').where('bastidor', '==', q).get();
    const byBas = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results: byBas });
  } catch (e) {
    console.error('Error /api/vehiculos/buscar', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: obtener todos los vehículos
app.get('/api/vehiculos/all', async (req, res) => {
  try {
    const snap = await db.collection('vehiculos').get();
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results });
  } catch (e) {
    console.error('Error /api/vehiculos/all', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: actualizar vehículo por id
app.post('/api/vehiculos/update', verifyIdToken, requireAdmin, async (req, res) => {
  try {
    const id = String(req.body.id || '');
    const data = req.body.data || {};
    if (!id) return res.status(400).json({ error: 'missing_id' });
    await db.collection('vehiculos').doc(id).update(data);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error /api/vehiculos/update', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: crear o sobrescribir cita (set) - owner o admin
app.post('/api/citas/set', verifyIdToken, async (req, res) => {
  try {
    const id = String(req.body.id || '');
    const data = req.body.data || {};
    if (!id) return res.status(400).json({ error: 'missing_id' });

    const docRef = db.collection('citas_agenda').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
      const owner = doc.data().owner;
      if (!(req.user && (req.user.admin === true || req.user.uid === owner))) return res.status(403).json({ error: 'forbidden' });
      await docRef.set(data, { merge: true });
      return res.json({ ok: true });
    }

    // crear nuevo documento y asignar owner si no existe
    data.owner = req.user.uid;
    await docRef.set(data);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error /api/citas/set', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: borrar cita - owner o admin
app.post('/api/citas/delete', verifyIdToken, async (req, res) => {
  try {
    const id = String(req.body.id || '');
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const docRef = db.collection('citas_agenda').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'not_found' });
    const owner = doc.data().owner;
    if (!(req.user && (req.user.admin === true || req.user.uid === owner))) return res.status(403).json({ error: 'forbidden' });
    await docRef.delete();
    res.json({ ok: true });
  } catch (e) {
    console.error('Error /api/citas/delete', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: crear feedback (id opcional) - cualquier usuario autenticado
app.post('/api/feedback/create', verifyIdToken, async (req, res) => {
  try {
    const id = req.body.id ? String(req.body.id) : null;
    const data = req.body.data || {};
    // asignar owner para poder auditar
    data.owner = req.user && req.user.uid ? req.user.uid : null;
    if (id) {
      await db.collection('app_feedback').doc(id).set(data);
      return res.json({ ok: true });
    }
    const ref = await db.collection('app_feedback').add(data);
    res.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error('Error /api/feedback/create', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: crear cita (usuarios autenticados)
app.post('/api/citas/create', verifyIdToken, async (req, res) => {
  try {
    const data = req.body.data || {};
    const allowed = ['matricula','phone','date','time','notes','status','vehicleId'];
    const safe = {};
    for (const k of allowed) if (k in data) safe[k] = data[k];
    safe.owner = req.user.uid;
    const ref = await db.collection('citas_agenda').add(safe);
    res.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error('Error /api/citas/create', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: marcar llegada (solo owner o admin)
app.post('/api/citas/arrivar', verifyIdToken, requireOwnerOrAdmin, async (req, res) => {
  try {
    const id = String(req.body.id || '');
    if (!id) return res.status(400).json({ error: 'missing_id' });
    await db.collection('citas_agenda').doc(id).update({ status: 'arrived', arrivedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (e) {
    console.error('Error /api/citas/arrivar', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: actualizar campos permitidos de una cita (owner o admin)
app.post('/api/citas/update', verifyIdToken, requireOwnerOrAdmin, async (req, res) => {
  try {
    const id = String(req.body.id || '');
    const data = req.body.data || {};
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const allowed = ['phone','status','notes','time','date'];
    const safe = {};
    for (const k of allowed) if (k in data) safe[k] = data[k];
    if (!Object.keys(safe).length) return res.status(400).json({ error: 'no_allowed_fields' });
    await db.collection('citas_agenda').doc(id).update(safe);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error /api/citas/update', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint: consultar citas por campo (campo exacto)
app.post('/api/citas/query', async (req, res) => {
  try {
    const field = String(req.body.field || '');
    const value = req.body.value;
    if (!field) return res.status(400).json({ error: 'missing_field' });

    const snap = await db.collection('citas_agenda').where(field, '==', value).get();
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ results });
  } catch (e) {
    console.error('Error /api/citas/query', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Proxy para Google Apps Script (reenvía body al URL configurado en GAS_URL)
app.post('/api/proxy/gas', async (req, res) => {
  try {
    const gasUrl = process.env.GAS_URL;
    if (!gasUrl) return res.status(500).json({ error: 'gas_not_configured' });
    const fetch = require('node-fetch');
    const response = await fetch(gasUrl, { method: 'POST', body: JSON.stringify(req.body), headers: { 'Content-Type': 'application/json' } });
    const text = await response.text();
    res.send(text);
  } catch (e) {
    console.error('Error /api/proxy/gas', e);
    res.status(500).json({ error: 'server_error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on port ${port}`));
