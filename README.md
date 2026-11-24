# KOEL Abogados · Sitio web corporativo

React + TypeScript + Vite, CSS con variables de diseño y Anime.js (única biblioteca de animación).

## Ejecutar

```bash
npm install
npm run dev        # desarrollo en http://localhost:5174 (fijo: la API valida el origen exacto)
npm run build      # tsc + vite build → dist/ (incluye dist/chatbot-content.json)
npm run preview    # sirve dist/ en http://localhost:4174
npm test           # pruebas del widget de chat (Vitest + fetch simulado)
```

## Estructura

- `src/config/contact.ts` — datos reales de contacto (tipados). Lo que esté en `null` / `[]` se oculta.
- `src/siteContent.ts` — fuente única de textos: la usan los componentes y el build para generar `/chatbot-content.json`. Aquí está `companySlug`.
- `src/components/` — secciones y componentes reutilizables.
- `src/hooks/` — animaciones (Anime.js), revelado del cursor, sección activa, movimiento reducido.
- `src/styles/` — `tokens.css` (paleta y medidas), `base`, `layout`, `hero`, `sections`.
- `public/img/` — logo y el paisaje (paisaje-ciudad.webp (foto de ciudad al amanecer, Unsplash, licencia Unsplash; ambos ambientes salen de la misma foto con filtros CSS)).

## Datos de contacto de KOEL (en `src/config/contact.ts`)

| Campo | Estado |
| --- | --- |
| `phone` (solo llamadas) | `+57 333 602 9371` |
| `whatsapp` (solo dígitos con indicativo) | `573116747801` (311 674 7801) |
| `emails` (`{ label, address }`) | `coordinador@koelabogados.com` |
| `address` | pendiente |
| `schedule` | pendiente |
| `social` (`{ label, url }`) | pendiente |
| `privacyUrl` (política de tratamiento de datos) | pendiente |

El sitio no tiene formulario. La sección **Contacto** muestra solo los canales confirmados: al completar `whatsapp` aparece un botón destacado “Escribir por WhatsApp” (con un mensaje inicial predefinido) y el resto de canales se listan debajo y en el pie de página. Mientras no haya ninguno, se muestra un aviso de “próximamente”. Los datos de Consultorías Jurídicas BPO no se usan.

## Chat Fontanachat

- Cliente oficial copiado sin cambios en `src/fontanachat-client/` (de `ApiFontanachat/client/src`).
- `VITE_API_BASE_URL`: `.env.development` → `http://localhost:10000`; `.env.production` / `.env.example` → `https://apifontanachat.onrender.com`. Sin la variable, el chat no se carga y el sitio funciona igual.
- `src/lib/chat.ts` (cliente, validación de `waUrl`, errores), `src/hooks/useChatController.ts` (lógica), `src/components/ChatWidget.tsx` + `src/styles/chat.css` (vista), `src/config/chatText.ts` (textos de la interfaz).
- El widget solo aparece cuando la API responde. Los botones «Solicitar contacto empresarial» / «Solicitar orientación» abren el chat si está conectado; si no, llevan a Contacto.
- El chat nunca arma enlaces de WhatsApp: solo usa el `waUrl` del servidor que empiece por `https://wa.me/`. El botón verde de la sección Contacto es un canal del sitio (configurado en `src/config/contact.ts`), independiente del chat.
- `companySlug = 'koel-abogados'` está pendiente: la API respondió «Empresa no encontrada» el 24/11/2026.

## Despliegue en Vercel

La configuración vive en `vercel.json` (equivalente al *blueprint* de Render):

- Instala con `npm ci`, construye con `npm run build` y publica `dist/`. Usa Node 22 (`engines` en `package.json`).
- Fija `VITE_API_BASE_URL=https://apifontanachat.onrender.com` en el build, así que no hay que cargar variables a mano en Vercel.
- `/chatbot-content.json` se sirve como JSON, sin caché y sin redirecciones. `/assets/` lleva caché de un año (archivos con hash) e `/img/`, de 30 días.
- Encabezados de seguridad: `nosniff`, `Referrer-Policy`, `X-Frame-Options` y `Permissions-Policy`.

Formas de publicar:

1. **Desde GitHub (recomendado):** subir el proyecto a un repositorio. En Vercel: *Add New → Project → Import*. Vercel lee `vercel.json`, así que no hay que tocar nada más. Cada push a `main` publica.
2. **Desde la terminal:** `npx vercel` (vista previa) y `npx vercel --prod` (producción). La primera vez pide iniciar sesión y vincular el proyecto.

Después de publicar, en el panel de Fontanachat registra el dominio exacto que sirve el sitio (si usas `www`, regístralo con `www` y sin barra final). La URL del contenido es `https://<dominio>/chatbot-content.json`.
