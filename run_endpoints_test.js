require('dotenv').config();
const admin = require('firebase-admin');
const fetch = require('node-fetch');

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('FIREBASE_SERVICE_ACCOUNT no configurada en .env');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  // API key desde el frontend (si cambia, actualiza aquí)
  const API_KEY = 'AIzaSyCRfERugbIVfAXtKa7mGdLLTm6xwxb5wlE';

  const email = `test+${Date.now()}@example.com`;
  const password = 'Test1234!';

  console.log('Creando usuario de prueba:', email);
  let user;
  try {
    user = await admin.auth().createUser({ email, password });
  } catch (e) {
    console.error('Error creando usuario:', e);
    process.exit(1);
  }
  console.log('Usuario creado UID=', user.uid);

  // Iniciar sesión (REST) para obtener idToken
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const signResp = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const signJson = await signResp.json();
  if (!signJson.idToken) {
    console.error('Error al iniciar sesión:', signJson);
    await admin.auth().deleteUser(user.uid).catch(()=>{});
    process.exit(1);
  }
  const idToken = signJson.idToken;
  console.log('ID token obtenido (longitud):', idToken.length);

  // Llamar /api/citas/create
  console.log('Llamando /api/citas/create');
  const createRes = await fetch('http://localhost:3000/api/citas/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + idToken },
    body: JSON.stringify({ data: { matricula: 'TEST123', phone: '600700800', date: '2026-07-01', time: '10:00', notes: 'Prueba' } })
  });
  const createJson = await createRes.json();
  console.log('/api/citas/create =>', createJson);
  if (!createJson.id) {
    console.error('No se creó la cita, abortando.');
    await admin.auth().deleteUser(user.uid).catch(()=>{});
    process.exit(1);
  }
  const docId = createJson.id;

  // Llamar /api/citas/arrivar
  console.log('Llamando /api/citas/arrivar');
  const arrRes = await fetch('http://localhost:3000/api/citas/arrivar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + idToken },
    body: JSON.stringify({ id: docId })
  });
  const arrJson = await arrRes.json();
  console.log('/api/citas/arrivar =>', arrJson);

  // Llamar /api/citas/update
  console.log('Llamando /api/citas/update');
  const upRes = await fetch('http://localhost:3000/api/citas/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + idToken },
    body: JSON.stringify({ id: docId, data: { phone: '600111222', notes: 'Actualizado por test' } })
  });
  const upJson = await upRes.json();
  console.log('/api/citas/update =>', upJson);

  // Leer doc final desde Admin SDK
  const doc = await db.collection('citas_agenda').doc(docId).get();
  console.log('Documento final:', { id: doc.id, data: doc.data() });

  // Limpieza: borrar cita y usuario
  await db.collection('citas_agenda').doc(docId).delete().catch(()=>{});
  await admin.auth().deleteUser(user.uid).catch(()=>{});
  console.log('Limpieza completada. Test finalizado correctamente.');
  process.exit(0);
}

main().catch((e)=>{ console.error('Error test:', e); process.exit(1); });
