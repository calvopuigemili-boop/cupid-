# Cupid@ y la normativa europea

Documento interno del titular de Cupid@. Recoge qué normas aplican, qué está hecho en la web y lo que te toca a ti. **No es asesoramiento jurídico**: antes de crecer o de cobrar por la app, que lo revise un abogado.

Última revisión: 10 de octubre de 2026.

## 1. Lo que te toca a ti (pendiente)

- [x] **Datos del titular** puestos en privacidad, términos y aviso legal: Jorge Baena Hernández (nombre comercial Cupido@), lavakalleta@gmail.com. Revisa ese correo a menudo: es el contacto oficial para usuarios y autoridades.
- [ ] **Si algún día ganas dinero con la app**, añade también NIF y dirección en el aviso legal (art. 10 LSSI-CE).
- [ ] **Contratos con proveedores (art. 28 RGPD)**: la web está ahora en Vercel. Comprueba en vercel.com/legal/dpa que su acuerdo de encargado del tratamiento se aplica a tu cuenta y guarda una copia; Anthropic da la IA a través de su pasarela.
- [ ] **Datos que quedaron en Netlify** (cuentas y chats en la nube): si reactivan la cuenta, expórtalos o bórralos; si no, pide a Netlify que los borren (formulario de soporte, tema "Delete my account and data (GDPR)").
- [ ] **Leer este documento entero** y guardarlo: es tu registro de actividades de tratamiento (apartado 4) y tu evaluación de impacto (apartado 5). Actualízalo si cambias lo que hace la app.
- [ ] **Delegado de protección de datos (DPD)**: si Cupid@ llega a tratar datos a gran escala (miles de usuarios activos), estarás obligado a nombrar uno y comunicarlo a la AEPD (art. 37 RGPD y art. 34 LOPDGDD), porque el núcleo del servicio son datos que pueden revelar la orientación sexual.
- [ ] **Si algún día pones anuncios, analítica o pagos**: hará falta banner de cookies, revisar consentimientos y, con pagos, derecho de desistimiento e información precontractual.

## 2. Qué normas aplican y qué se ha hecho

| Norma | Por qué aplica | Qué está hecho |
|---|---|---|
| **RGPD** (Reglamento (UE) 2016/679) y **LOPDGDD** (España) | Tratamos datos personales, incluidos datos que pueden revelar la orientación sexual (categoría especial, art. 9). | Consentimiento explícito separado al empezar, con versión y fecha guardadas (y en la cuenta, como prueba). Información básica por capas en la bienvenida y política completa (art. 13 y 14). Hoja **Tus datos**: descargar datos (portabilidad), oponerse al aprendizaje, retirar consentimiento y borrar todo. Borrado de cuenta completo. IPs guardadas solo como huella diaria. Limpieza automática diaria de contadores (48 h) y sugerencias (12 meses); mensajes de aprendizaje caducan a los 12 meses. Volver a pedir consentimiento si cambian los textos. |
| **Directiva ePrivacy / art. 22.2 LSSI-CE** (cookies) | La web guarda datos en el navegador. | Solo almacenamiento técnico exento (sesión, preferencias pedidas por el usuario, chats). Sin cookies de terceros. Fuentes alojadas en la propia web (antes se cargaban de Google Fonts, lo que enviaba la IP a Google). Política de cookies con la lista completa. |
| **LSSI-CE art. 10** (aviso legal) | Servicio de la sociedad de la información desde España. | Página `/aviso-legal` con los datos del titular (pendiente de rellenar). |
| **Reglamento de Servicios Digitales** (Reglamento (UE) 2022/2065) | Cupid@ guarda en la cuenta lo que sube cada usuario (servicio de alojamiento). | Punto único de contacto (art. 11 y 12), límites de contenido explicados en los términos (art. 14), forma de avisar de contenido ilegal (art. 16) y compromiso de explicar los motivos al limitar una cuenta (art. 17). Como microempresa, no hacen falta informes de transparencia. |
| **Reglamento de IA** (Reglamento (UE) 2024/1689), art. 50 | Cupid@ genera texto con IA. Las obligaciones de transparencia aplican desde el 2 de agosto de 2026. | La web dice claramente que funciona con IA (Claude, de Anthropic). Cada propuesta lleva la etiqueta "Generado con IA". Marca legible por máquina: atributo `data-ai-generated` en cada mensaje, campo `ai_generated` y cabecera `x-ai-generated` en las respuestas del servidor. Ver la nota del apartado 3. |
| **Derecho de consumo** (Directivas 2011/83 y 2019/770, TRLGDCU) | Usuarios consumidores, servicio digital gratuito. | Términos claros, sin cláusulas que limiten derechos del consumidor, ley aplicable con fuero del consumidor, aviso previo si cierra el servicio. Eliminado cualquier enlace a la plataforma ODR (la UE la cerró el 20 de julio de 2025). |
| **Seguridad** (art. 32 RGPD) | Hay que proteger los datos. | HTTPS obligatorio (HSTS), política de seguridad de contenidos estricta generada en cada build (solo scripts propios, por huella), sin iframes de terceros, cabeceras anti-sniffing y de permisos, contraseñas gestionadas por Netlify Identity. |
| **Accesibilidad** (Ley Europea de Accesibilidad, Directiva 2019/882) | Cupid@ no está entre los servicios obligados (comercio electrónico, banca, transporte…) y las microempresas de servicios están exentas. | Buenas prácticas igualmente: modo oscuro, respeto a "reducir movimiento", sonidos apagables, etiquetas accesibles, declaración en el aviso legal con forma de avisar de barreras. |

## 3. Nota sobre el marcado de textos de IA (art. 50.2)

El reglamento pide que el contenido sintético generado se marque "en un formato legible por máquina". Para imágenes o audio hay estándares; para un mensaje corto de texto que la persona copia y pega en Instagram, no hay una forma técnica que sobreviva al copiar sin estropear el mensaje (los caracteres invisibles los elimina Instagram o rompen el texto). Lo que hace Cupid@: marca todo como IA dentro de la app y en el servidor, y la persona usuaria decide qué envía como suyo. La Comisión está preparando un código de buenas prácticas sobre marcado; cuando salga, revisa si pide algo concreto para texto corto.

## 4. Registro de actividades de tratamiento (art. 30 RGPD)

**Responsable:** el titular indicado en el aviso legal. **DPD:** no designado por ahora (ver apartado 1).

| Actividad | Finalidad | Interesados | Datos | Base legal | Destinatarios / transferencias | Plazo |
|---|---|---|---|---|---|---|
| Generar mensajes | Crear abridores, respuestas y análisis de perfil con IA | Usuarios; personas con las que hablan | Perfil (sexo, a quién busca), texto, capturas, fichas, conversación | Art. 6.1.b + 9.2.a (usuario); 6.1.f (terceros) | Vercel (encargado), Anthropic (subencargado), EE. UU. (DPF o CCT) | No se conserva en servidor |
| Cuentas y sincronización (en pausa desde el cambio a Vercel) | Guardar chats y perfil en la nube | Usuarios con cuenta; terceros incluidos en sus chats | Email, contraseña cifrada, perfil, consentimiento, chats | Art. 6.1.b + 9.2.a; 6.1.c para la prueba del consentimiento | Netlify, EE. UU. | Hasta que el usuario borre |
| Topes anti-abuso | Evitar abusos del servicio gratuito | Usuarios | Id aleatorio del dispositivo, huella diaria de IP | Art. 6.1.f | Netlify | 48 h |
| Aprendizaje | Mejorar el estilo de la IA | Usuarios (anonimizados) | Mensajes anonimizados con puntuación | Art. 6.1.f, con oposición desde la app | Netlify | 12 meses sin actividad |
| Sugerencias | Mejorar la app | Usuarios | Texto, huella corta del dispositivo | Art. 6.1.f | Netlify | 12 meses |

**Medidas de seguridad:** HTTPS/HSTS, CSP estricta, sin terceros en el navegador, IPs como huella, mínimos datos en servidor, borrado automático, acceso al panel de admin solo con la cuenta del titular.

## 5. Evaluación de impacto (resumen, art. 35 RGPD)

**Por qué hace falta:** se tratan datos que pueden revelar la orientación sexual (categoría especial), con tecnología nueva (IA generativa) y datos de terceros que no saben que se usan. Son al menos dos criterios de la lista de la AEPD.

| Riesgo | Probabilidad / impacto | Medidas |
|---|---|---|
| Revelar la orientación sexual o la vida sentimental del usuario | Media / alto | Sin cuenta, nada se guarda en servidor; con cuenta, datos aislados por usuario y borrables al momento; consentimiento explícito; sin publicidad ni cesiones. |
| Uso de Cupid@ para vigilar, localizar o acosar a otra persona | Baja / alto | La IA no apunta ubicaciones, centros de estudio o trabajo ni rutinas; términos que lo prohíben; límites que no se desactivan. |
| Menores usando la app o como objetivo | Baja / muy alto | Declaración de mayoría de edad del usuario y de la otra persona; la IA no genera mensajes si ve indicios de minoría de edad. |
| Contenido sexual explícito o humillante generado por la IA | Baja / medio | Límites fijos en el prompt del servidor, también en "Sin filtro". |
| Brecha de datos en el proveedor | Baja / alto | Mínimos datos en servidor, proveedores con DPA, cifrado en tránsito, procedimiento de brechas (apartado 6). |
| Reidentificación en los mensajes de aprendizaje | Baja / bajo | Anonimización (nombres, @, enlaces, correos, números), sin vínculo con el usuario, opción de oponerse, caducidad de 12 meses. |

**Conclusión:** con estas medidas el riesgo residual es aceptable. Revisar si cambia el volumen de usuarios o lo que hace la app.

## 6. Procedimientos

**Derechos de los usuarios.** La mayoría se resuelven solos desde *Tus datos*. Si llega un email: comprueba que la persona es quien dice (por ejemplo, que escriba desde el email de su cuenta), responde en menos de un mes y guarda una nota de qué se pidió y qué se hizo. Para borrar una cuenta a mano: Netlify → Identity → usuario → Delete, y en Blobs, el store `users`, prefijo `u/<id del usuario>/`.

**Brechas de seguridad.** Si sospechas que alguien ha accedido a datos: 1) córtalo (cambia claves, desactiva la función afectada); 2) apunta qué ha pasado, cuándo, qué datos y cuántas personas; 3) si hay riesgo para las personas, notifícalo a la AEPD en menos de 72 horas desde que lo sepas (sede.aepd.gob.es); 4) si el riesgo es alto (por ejemplo, chats de cuentas), avisa también a los afectados.

**Avisos de contenido ilegal.** Responde al aviso confirmando que lo has recibido, revisa, decide y explica la decisión. Si es abuso sexual infantil o hay amenaza para la vida de alguien, avisa a la Policía o la Guardia Civil.
