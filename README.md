GesCar Frontend estático para GitHub Pages

Este proyecto puede funcionar como un sitio estático en GitHub Pages usando `index.html`.

## Qué hace esta versión
- `index.html` se conecta directamente a Firebase Firestore desde el navegador.
- No necesita servidor Node ni backend proxy para funcionar.
- GitHub Pages sólo sirve los archivos estáticos: `index.html`, `manifest.json`, `images/`, etc.

## Qué archivos son necesarios
- `index.html`
- `manifest.json`
- `images/` y otros activos estáticos
- `README.md` para documentación

## Qué puede ignorarse si usas sólo GitHub Pages
- `server.js`
- `api/`
- `vercel.json`
- `package.json` / `package-lock.json`
- `.env` / `.env.example`
- `README_VERCEL.md` / `VERCEL_DEPLOY.md`

## Cómo publicar en GitHub Pages
1. Sube el repo a GitHub.
2. En tu repositorio, ve a `Settings` → `Pages`.
3. Selecciona la rama `main` y la carpeta raíz `/`.
4. Guarda y espera a que se publique.

Tu página estará disponible en `https://<tu-usuario>.github.io/<tu-repo>/`.

## Recomendaciones
- Si la app accede a Firestore, asegúrate de que tus reglas de Firestore permitan el acceso que necesitas.
- Si necesitas proteger datos sensibles o usar Firebase Admin, entonces sí vale la pena un backend separado.
- Para pruebas locales, sólo abre `index.html` en un servidor estático o usa Live Server.
