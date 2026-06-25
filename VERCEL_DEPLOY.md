# 🚀 Despliegue del Backend en Vercel

Este documento te guía para desplegar el backend proxy en Vercel, permitiendo que la app funcione tanto localmente como desde GitHub Pages.

## Paso 1: Preparar la Cuenta de Firebase Service Account

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `gestion-flotas-vw`
3. Configuración (⚙️) > **Cuentas de servicio**
4. Pestaña **"Node.js"** > **Generar nueva clave privada**
5. Se descargará un archivo JSON. **Cópialo completamente** (todo en una línea sin saltos).

## Paso 2: Conectar Vercel a GitHub

1. Ve a [vercel.com](https://vercel.com)
2. **Sign in with GitHub** (o crea cuenta)
3. **"Import Project"** > Selecciona tu repositorio

## Paso 3: Configurar Variables de Entorno en Vercel

En el dashboard de Vercel:

1. **Settings** > **Environment Variables**
2. Añade estas variables:

| Variable | Valor | Scope |
|----------|-------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | El JSON de Firebase (paso 1) | Production |
| `FRONTEND_ORIGIN` | `https://vwmadrid.github.io,https://tu-usuario.github.io` | Production |
| `NODE_ENV` | `production` | Production |
| `ENFORCE_HTTPS` | `true` | Production |

**Importante:** Reemplaza `vwmadrid.github.io` con tu dominio real de GitHub Pages.

## Paso 4: Desplegar

1. Vercel debería detectar automáticamente `vercel.json`
2. Haz clic en **"Deploy"**
3. Espera a que termine (2-3 minutos)
4. Tu backend estará en: `https://gescar-backend.vercel.app`

## Paso 5: Actualizar el Frontend

Asegúrate de que [Entregas-main/index.html](../Entregas-main/index.html) tenga:

```javascript
window.API_BASE = 'https://gescar-backend.vercel.app';  // En producción
```

El código ya hace esto automáticamente (detecta si está en localhost o en producción).

## Verificación

### Localmente (sin Vercel):
```bash
npm install
node server.js  # o: npm start
```
Abre: `http://localhost:5500`
Frontend → `http://localhost:3000` ✅

### En GitHub Pages:
Abre: `https://vwmadrid.github.io/entregas`
Frontend → `https://gescar-backend.vercel.app` ✅

## Troubleshooting

**Error: "CORS not allowed"**
- Asegúrate de que `FRONTEND_ORIGIN` en Vercel contiene tu dominio
- Verifica que `NODE_ENV=production` está configurado

**Error: "FIREBASE_SERVICE_ACCOUNT not set"**
- Verifica que la variable está en Vercel > Settings > Environment Variables
- El JSON debe estar en UNA SOLA LÍNEA (sin saltos)

**Error: "Firebase Auth init failed"**
- Verifica que el JSON de Firebase es válido
- Prueba localmente primero: `node server.js` con `.env` correcto

## URLs Importantes

- **Backend en Vercel:** https://gescar-backend.vercel.app
- **Frontend en GitHub:** https://vwmadrid.github.io
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Firebase Console:** https://console.firebase.google.com/

---

**Notas:**
- El frontend detecta automáticamente si está en localhost o producción
- En producción, SIEMPRE usa HTTPS (`https://`)
- Las credenciales de Firebase están seguras en Vercel (no se exponen al frontend)
