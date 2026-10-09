# Plan de lanzamiento de Cupid@

## 1. Antes de abrirla al público

**Imprescindible**
- [ ] Rellenar todo lo marcado en amarillo en `privacidad.html` y `terminos.html` (nombre, NIF, dirección, email, fecha, precio).
- [ ] Límite de gasto mensual puesto en la consola de Anthropic.
- [ ] Probar el flujo completo en el móvil: bienvenida → Abrir con capturas → "Lo he enviado" (animación) → Responder → Chats → Perfil.
- [ ] Probar que al pasar de 8 mensajes salta la pantalla de Premium.
- [ ] Probar el pago en modo test (tarjeta `4242 4242 4242 4242`), restaurar el código en otro navegador y cancelar desde "Gestionar suscripción".
- [ ] Instalarla en un Android y en un iPhone y comprobar icono, pantalla completa y sonidos.

**Legal y dinero (España)**
- [ ] Si vas a cobrar, consulta con una gestoría cómo darte de alta (autónomo o sociedad) y declarar los ingresos e IVA. Stripe te pedirá estos datos.
- [ ] No uses el logo de Instagram ni digas que es "oficial". En la web ya pone que Cupid@ no tiene relación con Instagram ni Meta.
- [ ] La app es solo para mayores de 18: no la promociones en espacios para menores.

## 2. Lanzamiento

**Semana 1 — prueba cerrada**
- Pásala a 15-30 amigos mayores de edad. Pregunta: ¿qué mensaje enviaste?, ¿te contestaron?, ¿qué sobra?
- Mira cuántos llegan al límite de 8: si casi nadie llega, puedes bajar a 5; si muchos, Premium tiene tirón.

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
| Netlify (plan gratuito, permite uso comercial) | 0 € para empezar |
| Dominio | 10-20 € al año |
| Stripe | comisión por cada pago, sin cuota fija |

**Coste de la IA por uso.** Con el modelo rápido (`claude-haiku-5-5`, el que viene puesto) cada mensaje generado cuesta muy poco, del orden de una décima de céntimo, algo más si lleva capturas. Un usuario gratis que gaste sus 8 diarios sale por céntimos al mes. Comprueba la tarifa exacta en la [página de precios de Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) antes de lanzar.

**Premium.** Con Haiku y 100 mensajes al día, a 4,99 €/mes te queda margen incluso con los que más lo usan. Si quieres ofrecer "un cerebro más listo" poniendo `MODEL_PREMIUM=claude-sonnet-5-5`, cada mensaje cuesta bastante más: sube el precio (por ejemplo 9,99 €) y baja `PREMIUM_DAILY` a 40-60, o perderás dinero con los usuarios intensos.

**Qué mirar cada semana:** gasto en la consola de Anthropic, número de suscripciones en Stripe y cuántos usuarios llegan al límite gratis.

## 4. Siguiente fase: tiendas de apps

- **Google Play:** la web instalable se puede publicar tal cual como app de Android con la herramienta Bubblewrap (Trusted Web Activity). Cuenta de desarrollador: 25 $ una vez. Google exige política de privacidad y clasifica las apps de ligue como +18.
- **App Store (iPhone):** 99 $/año y un Mac. Apple rechaza a menudo las apps que solo envuelven una web, así que conviene esperar a tener tracción y añadir algo nativo (por ejemplo, compartir una captura directamente desde Instagram a Cupid@). Además, los pagos dentro de apps de iPhone tienen que ir por el sistema de Apple, no por Stripe.
