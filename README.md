# Cupid@ — web pública y app instalable (Netlify)

Proyecto en Netlify: **cupida-app** → https://cupida-app.netlify.app

## Qué hay en la carpeta

| Ruta | Para qué sirve |
|---|---|
| `public/` | La web: `index.html` (la app entera), iconos, `manifest.webmanifest` y `sw.js` (lo que la hace instalable), privacidad y términos. |
| `server/` | El cerebro: habla con la IA (Claude) con los prompts guardados en el servidor, aplica el límite gratis y gestiona Premium con Stripe. |
| `netlify/functions/` | Publica el servidor en `/api/generate`, `/api/checkout`, `/api/license` y `/api/portal`. |
| `netlify.toml` | Configuración de Netlify. |
| `LANZAMIENTO.md` | Checklist, costes y plan de lanzamiento. |

Los contadores del plan gratis y los códigos Premium se guardan en **Netlify Blobs**, que viene incluido: no hace falta ninguna base de datos aparte.

## Variables de entorno

En Netlify → Project configuration → Environment variables (con alcance **Functions**):

| Variable | Obligatoria | Qué es |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | Tu clave de [console.anthropic.com](https://console.anthropic.com). Ponle un límite de gasto mensual allí. |
| `SITE_URL` | Ya puesta | `https://cupida-app.netlify.app` (cámbiala si pones dominio propio). |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` | Para cobrar | Clave secreta de Stripe y el `price_...` de tu suscripción mensual. Sin ellas, Premium dice "muy pronto". |
| `FREE_DAILY`, `PREMIUM_DAILY`, `READS_DAILY`, `READS_DAILY_PREMIUM`, `FREE_DAILY_PER_IP` | No | Límites (por defecto 8, 100, 30, 150, 40). |
| `MODEL_FREE`, `MODEL_PREMIUM`, `MODEL_READ` | No | Modelos de IA (por defecto `claude-haiku-5-5`). |

Después de cambiar variables, haz un nuevo deploy (Deploys → Trigger deploy) para que se apliquen.

## Activar Premium (cuando quieras cobrar)

1. En [stripe.com](https://stripe.com) crea un producto "Cupid@ Premium" con precio mensual recurrente.
2. Pon `STRIPE_SECRET_KEY` y `STRIPE_PRICE_ID` en Netlify y vuelve a desplegar.
3. Activa el portal de clientes en Stripe (Settings → Billing → Customer portal) para que la gente pueda cancelar sola.
4. Prueba primero con claves `sk_test_...` y la tarjeta `4242 4242 4242 4242`.
5. Si no cobras 4,99 €, cambia `PRICE_TEXT` en `public/index.html` y el precio en `public/terminos.html`.

## Actualizar la app

Cada cambio que se suba al repositorio de GitHub enlazado se publica solo. Cuando cambies archivos de `public/`, sube `VERSION` en `public/sw.js` (`cupida-v2`, `cupida-v3`…) para que los móviles que ya la tienen instalada se actualicen.

## Probar en local

`npm install`, luego `npx netlify-cli dev` dentro de la carpeta (con tus variables en un archivo `.env`).
