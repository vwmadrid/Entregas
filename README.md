Backend proxy minimal para GesCar

Instrucciones rápidas:

1) Copia `.env.example` a `.env` y rellena `FIREBASE_SERVICE_ACCOUNT` con el JSON de la cuenta de servicio de Firebase (sin comillas adicionales).

2) Instala dependencias:

```bash
npm install
```

3) Ejecuta localmente:

```bash
node server.js
# o para desarrollo con nodemon
npx nodemon server.js
```

Endpoints de ejemplo:
- `POST /api/citas/buscar` { matricula }
- `POST /api/vehiculos/buscar` { q }

Siguiente pasos recomendados:
- Verificar y mover todas las llamadas sensibles del frontend a estos endpoints.
- Añadir verificación de tokens (Firebase Auth) con `admin.auth().verifyIdToken(idToken)` antes de operaciones críticas.
- Desplegar en Vercel/Render y configurar `FIREBASE_SERVICE_ACCOUNT` como variable de entorno secreta.
