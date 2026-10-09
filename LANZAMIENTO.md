# Plan de lanzamiento de Cupid@

## 1. Antes de abrirla al público

**Imprescindible**
- [ ] Rellenar todo lo marcado en amarillo en `privacidad.html` y `terminos.html` (nombre, NIF, dirección, email, fecha, precio).
- [ ] Revisar en Netlify (Usage) cuántos créditos gasta la app tras la primera semana.
- [ ] Probar el flujo completo en el móvil: bienvenida → Abrir con capturas → "Lo he enviado" (animación) → Responder → Chats → Perfil.
- [ ] Instalarla en un Android y en un iPhone y comprobar icono, pantalla completa y sonidos.

**Legal y dinero (España)**
- [ ] No uses el logo de Instagram ni digas que es "oficial". En la web ya pone que Cupid@ no tiene relación con Instagram ni Meta.
- [ ] La app es solo para mayores de 18: no la promociones en espacios para menores.

## 2. Lanzamiento

**Semana 1 — prueba cerrada**
- Pásala a 15-30 amigos mayores de edad. Pregunta: ¿qué mensaje enviaste?, ¿te contestaron?, ¿qué sobra?
- Mira en `/admin` qué mensajes votan mejor y qué sugerencias llegan.

**Semana 2 — público**
- Cuenta de TikTok e Instagram `@cupida.app` (o el nombre libre que encuentres).
- Formato que mejor encaja: vídeo de pantalla de 15-20 s. "Me dejó en visto → le paso la captura a Cupid@ → mensaje Sin filtro → me contesta". Enseña siempre la animación del cupido al final.
- Serie fija: "abridor del día" con una story inventada y las 3 opciones.
- Link en bio directo a la web; la gente la instala desde ahí.

**Mensaje para compartir:**
> Me dejaban en visto hasta que probé Cupid@ 💘 Le pasas la story y te da 3 abridores, del suave al sin filtro. Gratis: [tu dominio]

## 3. Números

**Costes fijos aproximados**

| Qué | Coste |
|---|---|
| Netlify (plan gratuito, permite uso comercial; incluye la IA con 300 créditos al mes) | 0 € para empezar |
| Netlify Personal, cuando crezca | 9 $/mes, 1.000 créditos |
| Dominio | 10-20 € al año |

**Coste de la IA por uso.** La IA se paga con los créditos de Netlify (1 $ = 180 créditos). Con el modelo rápido (`claude-haiku-5-5`, el que viene puesto) cada mensaje generado cuesta muy poco, del orden de una décima de céntimo, algo más si lleva capturas.  Con los 300 créditos gratis del plan Free llegan para cientos de mensajes al mes, pero esos créditos también se gastan en tráfico y deploys: si se acaban, la web se pausa hasta el mes siguiente. Si la app despega, pasa al plan Personal o pon tu propia clave de Anthropic.

**Qué mirar cada semana:** créditos gastados en Netlify (Usage), y lo que dicen en `/admin`.

## 4. Siguiente fase: tiendas de apps

- **Google Play:** la web instalable se puede publicar tal cual como app de Android con la herramienta Bubblewrap (Trusted Web Activity). Cuenta de desarrollador: 25 $ una vez. Google exige política de privacidad y clasifica las apps de ligue como +18.
- **App Store (iPhone):** 99 $/año y un Mac. Apple rechaza a menudo las apps que solo envuelven una web, así que conviene esperar a tener tracción y añadir algo nativo (por ejemplo, compartir una captura directamente desde Instagram a Cupid@). 
