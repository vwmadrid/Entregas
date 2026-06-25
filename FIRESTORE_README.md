cd "C:\Users\manue\OneDrive\Escritorio\APP VW\clientes"Aplicar reglas de Firestore (pasos rápidos)

1) Instala Firebase CLI si no la tienes:

```bash
npm install -g firebase-tools
```

2) Inicia sesión y selecciona tu proyecto:

```bash
firebase login
firebase projects:list
firebase use <PROJECT_ID>
```

3) Sube las reglas desde `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

Notas:
- Estas reglas son intencionalmente estrictas (bloquean todo el acceso desde clientes). El backend con la cuenta de servicio (Admin SDK) seguirá teniendo acceso total.
- Si necesitas permitir lecturas públicas para una colección específica, edita `firestore.rules` y añade una regla explícita.
- Revisa la consola de Firebase -> Rules para ver la evaluación y el simulador.
