Guía rápida: desplegar en Vercel (desde GitHub)

1) Requisitos
- Cuenta en Vercel
- Repo en GitHub con este proyecto (push al repo)

2) Conectar GitHub → Vercel
- En Vercel, "New Project" → Import from GitHub → selecciona el repo.
- Vercel detectará la carpeta raíz y el framework (sitio estático).

3) Variables de entorno (Project Settings → Environment Variables)
- `FIREBASE_SERVICE_ACCOUNT` : pega el JSON completo de la cuenta de servicio (una sola línea o con saltos).
- `GAS_URL` : (opcional) URL del Google Apps Script si lo usas.
- `FRONTEND_ORIGIN` : dominio del frontend (p. ej. https://tudominio.vercel.app) o http://localhost:5500 para pruebas locales.

4) Estructura en repo
- `index.html` y carpeta `api/` con funciones serverless creadas.
- Vercel desplegará `index.html` como sitio estático y expondrá las funciones en `https://<proyecto>.vercel.app/api/...`.

5) Pruebas
- Después del deploy, abre la URL del proyecto y prueba acciones (buscar matrícula, reservar cita).
- Para acciones protegidas (crear/editar citas, feedback), la app obtendrá ID tokens desde Firebase Auth (anónimo o real) y los enviará en `Authorization: Bearer <token>`.

6) Notas
- Si prefieres mantener un servidor Node persistente, puedes desplegar `server.js` en Render/Heroku en lugar de convertirlo a serverless.
- Revisa límites de ejecución de Vercel (time limits) si alguna operación es lenta.

Si quieres, hago también:
- Archivo `vercel.json` con rewrites si necesitas rutas personalizadas.
- Instrucciones para autorizar dominios en la consola de Firebase.
