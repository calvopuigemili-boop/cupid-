# Cupid@ — web pública y app instalable (Netlify)

Proyecto en Netlify: **cupida-app** → https://cupida-app.netlify.app

## Qué hay en la carpeta

| Ruta | Para qué sirve |
|---|---|
| `public/` | La web: `index.html` (la app entera), iconos, `manifest.webmanifest` y `sw.js` (lo que la hace instalable), privacidad y términos. |
| `server/` | El cerebro: habla con la IA (Claude) con los prompts guardados en el servidor, aplica topes anti-abuso y aprende de los votos. |
| `netlify/functions/` | Publica el servidor en `/api/generate`, `/api/sync` (chats de cada cuenta) y `/api/feedback` (votos, aprendizaje y sugerencias). |
| `client/auth.js` | Inicio de sesión (Netlify Identity). Se empaqueta solo en cada deploy como `public/auth.js`. |
| `public/admin.html` | Tu panel: sugerencias y mensajes que más funcionan. Entra en `/admin` con tu cuenta de dueño iniciada en Cupid@. |
| `netlify.toml` | Configuración de Netlify. |
| `LANZAMIENTO.md` | Checklist, costes y plan de lanzamiento. |
| `CUMPLIMIENTO-UE.md` | Normativa europea: qué está hecho, qué te toca, registro de tratamientos y evaluación de impacto. |
| `scripts/headers.mjs` | Genera en cada build las cabeceras de seguridad (CSP) en `public/_headers`. |
| `netlify/functions/cleanup.mjs` | Limpieza diaria automática de datos caducados. |

Los contadores anti-abuso, los chats de las cuentas y lo aprendido se guardan en **Netlify Blobs**, que viene incluido: no hace falta ninguna base de datos aparte.

**La IA no necesita cuenta de Anthropic.** La pasarela de IA de Netlify (AI Gateway) conecta con Claude sola y lo cobra de los créditos de Netlify. Se activa tras el primer deploy de producción. **No crees la variable `ANTHROPIC_API_KEY`**: si la pones, Netlify deja de usar su pasarela y usa tu clave. Cupid@ es gratis y sin límite visible para la gente. El plan gratuito de Netlify trae 300 créditos al mes; si se acaban, la web se pausa hasta el mes siguiente. Para más uso, pasa al plan Personal o Pro de Netlify, o pon tu propia clave de Anthropic.

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
| `ADMIN_KEY` | No | Clave alternativa para entrar en `/admin` sin cuenta. |
| `SITE_URL` | Ya puesta | `https://cupida-app.netlify.app` (cámbiala si pones dominio propio). |
| `FREE_DAILY`, `READS_DAILY`, `FREE_DAILY_PER_IP` | No | Topes anti-abuso por día (por defecto 150 mensajes y 150 tandas de capturas por móvil, 600 mensajes por red). |
| `MODEL_FREE`, `MODEL_READ` | No | Modelos de IA (por defecto `claude-haiku-5-5`). |

Después de cambiar variables, haz un nuevo deploy (Deploys → Trigger deploy) para que se apliquen.

## Actualizar la app

Cada cambio que se suba al repositorio de GitHub enlazado se publica solo. Cuando cambies archivos de `public/`, sube `VERSION` en `public/sw.js` (`cupida-v2`, `cupida-v3`…) para que los móviles que ya la tienen instalada se actualicen.

## Probar en local

`npm install`, luego `npx netlify-cli dev` dentro de la carpeta (con tus variables en un archivo `.env`).
