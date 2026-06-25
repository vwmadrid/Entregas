require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERROR: falta la variable de entorno FIREBASE_SERVICE_ACCOUNT en .env');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  console.error('ERROR: no se pudo parsear FIREBASE_SERVICE_ACCOUNT. Asegúrate de que sea JSON válido.');
  console.error(e.message);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const uid = process.argv[2];
const mode = process.argv[3] || 'true';
if (!uid) {
  console.error('Uso: node set-admin-claim.js <USER_UID> [true|false]');
  console.error('Ejemplo: node set-admin-claim.js abc123 true');
  process.exit(1);
}

const isAdmin = !(mode === 'false' || mode === '0');
const claims = { admin: isAdmin };

admin.auth().setCustomUserClaims(uid, claims)
  .then(() => {
    console.log(`Custom claim aplicado a UID ${uid}:`, claims);
    console.log('El usuario debe volver a iniciar sesión para que el nuevo token refleje el claim.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error al asignar custom claim:', err);
    process.exit(1);
  });
