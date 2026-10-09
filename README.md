# Cupid@ — web pública y app instalable (Netlify)

Proyecto en Netlify: **cupida-app** → https://cupida-app.netlify.app

## Qué hay en la carpeta

| Ruta | Para qué sirve |
|---|---|
| `public/` | La web: `index.html` (la app entera), iconos, `manifest.webmanifest` y `sw.js` (lo que la hace instalable), privacidad y términos. |
| `server/` | El cerebro: habla con la IA (Claude) con los prompts guardados en el servidor, aplica el límite gratis y gestiona Premium con Stripe. |
| `netlify/functions/` | Publica el servidor en `/api/generate`, `/api/checkout`, `/api/license`, `/api/portal`, `/api/sync` (chats de cada cuenta) y `/api/feedback` (votos, aprendizaje y sugerencias). |
| `client/auth.js` | Inicio de sesión (Netlify Identity). Se empaqueta solo en cada deploy como `public/auth.js`. |
| `public/admin.html` | Tu panel: sugerencias y mensajes que más funcionan. Entra en `/admin` con tu `ADMIN_KEY`. |
| `netlify.toml` | Configuración de Netlify. |
| `LANZAMIENTO.md` | Checklist, costes y plan de lanzamiento. |

Los contadores del plan gratis y los códigos Premium se guardan en **Netlify Blobs**, que viene incluido: no hace falta ninguna base de datos aparte.

**La IA no necesita cuenta de Anthropic.** La pasarela de IA de Netlify (AI Gateway) conecta con Claude sola y lo cobra de los créditos de Netlify. Se activa tras el primer deploy de producción. **No crees la variable `ANTHROPIC_API_KEY`**: si la pones, Netlify deja de usar su pasarela y usa tu clave. El plan gratuito trae 300 créditos al mes; si se acaban, la web se pausa hasta el mes siguiente. Para más uso, pasa al plan Personal o Pro de Netlify, o pon tu propia clave de Anthropic.

## Cuentas (Netlify Identity)

Se activan una vez desde el panel de Netlify: **Project configuration → Identity → Enable Identity**. Recomendado:
- **Registration**: Open.
- **Emails → Confirmation template**: marca *autoconfirm* si no quieres que la gente tenga que confirmar el email (más fácil, pero cualquiera puede registrarse con un email que no es suyo).
- **External providers**: añade **Google** para el botón "Continuar con Google".

## Cómo aprende

Cada mensaje generado va firmado. Cuando alguien lo vota, lo marca como enviado o la otra persona contesta, el servidor guarda ese mensaje anonimizado con su puntuación (`me gusta` +1, `enviado` +2, `le contestaron` +3, `no me gusta` −2). Al generar, los 6 mejores y los 3 peores de ese mismo nivel entran en el prompt como ejemplos de estilo. Lo ves todo en `/admin`.

## Variables de entorno

En Netlify → Project configuration → Environment variables (con alcance **Functions**):

| Variable | Obligatoria | Qué es |
|---|---|---|
| `COMP_LICENSES` | Ya puesta | Códigos Premium regalados, separados por comas. Para quitar uno, bórralo de la lista y vuelve a desplegar. |
| `FEEDBACK_SECRET`, `ADMIN_KEY` | Ya puestas | Firma de los mensajes y clave del panel `/admin`. |
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
