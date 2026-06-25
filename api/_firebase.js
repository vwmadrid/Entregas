const admin = require('firebase-admin');

function initFirebase() {
  if (global.__FIREBASE_ADMIN__) return global.__FIREBASE_ADMIN__;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  global.__FIREBASE_ADMIN__ = { admin, db, app };
  return global.__FIREBASE_ADMIN__;
}

async function verifyIdTokenFromHeader(req) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error('missing_token');
  const idToken = m[1];
  const { admin } = initFirebase();
  return await admin.auth().verifyIdToken(idToken);
}

module.exports = { initFirebase, verifyIdTokenFromHeader };
