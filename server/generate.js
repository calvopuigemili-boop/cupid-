// POST /api/generate — genera abridores, respuestas, análisis de perfil o lee capturas.
// Cabeceras: x-device (id aleatorio del móvil), x-license (código Premium, opcional).
import { CFG, send, readJson, clientIp, today, bump, peek, licenseStatus, claude, parseJson } from "./_lib.js";
import { cleanInput, buildTask } from "./_prompts.js";

export default async function handler(req, res) {
  if (req.method === "GET") return usage(req, res);
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  if (!CFG.anthropicKey) return send(res, 500, { error: "not_configured", message: "Falta ANTHROPIC_API_KEY en el servidor." });

  let body;
  try { body = await readJson(req); } catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? "too_large" : "bad_request" }); }
  const x = cleanInput(body);
  if (!x.task) return send(res, 400, { error: "bad_request" });

  const device = String(req.headers["x-device"] || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  if (device.length < 16) return send(res, 400, { error: "bad_request" });
  const ip = clientIp(req);
  const day = today();
  const lic = await licenseStatus(String(req.headers["x-license"] || "")).catch(() => ({ premium: false }));

  // Límites
  try {
    if (x.task === "read") {
      const n = await bump(`r:${day}:${device}`);
      if (n > (lic.premium ? CFG.readsDailyPremium : CFG.readsDaily)) return send(res, 429, { error: "reads_limit", message: "Has leído muchas capturas hoy. Vuelve mañana." });
    } else {
      const limit = lic.premium ? CFG.premiumDaily : CFG.freeDaily;
      const used = await peek(`g:${day}:${device}`);
      if (used >= limit) return send(res, 429, { error: lic.premium ? "premium_limit" : "free_limit", usage: { used, limit, premium: lic.premium } });
      if (!lic.premium) {
        const ipUsed = await bump(`ip:${day}:${ip}`);
        if (ipUsed > CFG.freeDailyPerIp) return send(res, 429, { error: "free_limit", usage: { used, limit, premium: false } });
      }
    }
  } catch { /* si Redis cae, no bloqueamos al usuario */ }

  const { system, prompt, json } = buildTask(x);
  const content = [
    ...x.images.map(i => ({ type: "image", source: { type: "base64", media_type: i.media_type, data: i.data } })),
    { type: "text", text: prompt + (json ? "\n\nTu respuesta se va a leer con un programa: devuelve solo el JSON, sin texto alrededor." : "") },
  ];
  const model = x.task === "read" ? CFG.modelRead : lic.premium ? CFG.modelPremium : CFG.modelFree;

  try {
    const text = await claude({ model, system, content, maxTokens: x.task === "read" ? 1200 : 1600 });
    if (!json) return send(res, 200, { text });
    const data = parseJson(text);
    // Si lo pegado no era una conversación, no se gasta un mensaje
    const counts = !(x.task === "reply" && data.es_conversacion === false);
    const limit = lic.premium ? CFG.premiumDaily : CFG.freeDaily;
    const used = counts ? await bump(`g:${day}:${device}`).catch(() => null) : await peek(`g:${day}:${device}`).catch(() => null);
    return send(res, 200, { data, usage: { used, limit, premium: lic.premium } });
  } catch (e) {
    return send(res, e.status || 502, { error: e.code || "upstream_error" });
  }
}

async function usage(req, res) {
  const device = String(req.headers["x-device"] || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  const lic = await licenseStatus(String(req.headers["x-license"] || "")).catch(() => ({ premium: false }));
  const used = device ? await peek(`g:${today()}:${device}`).catch(() => 0) : 0;
  send(res, 200, { usage: { used, limit: lic.premium ? CFG.premiumDaily : CFG.freeDaily, premium: lic.premium }, stripe: Boolean(CFG.stripeKey && CFG.stripePrice) });
}
