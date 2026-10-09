// POST /api/license
//   {session_id}  → tras pagar en Stripe, crea (una sola vez) el código Premium y lo devuelve.
//   {license}     → comprueba si un código sigue activo (para "Restaurar Premium").
import { CFG, send, readJson, redis, stripe, licenseStatus, newLicense } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  let body;
  try { body = await readJson(req, 10_000); } catch { return send(res, 400, { error: "bad_request" }); }

  if (body.license) {
    const license = String(body.license).trim().toUpperCase();
    const st = await licenseStatus(license).catch(() => ({ premium: false }));
    return send(res, 200, { license, premium: st.premium });
  }

  const sid = String(body.session_id || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(sid) || !CFG.stripeKey) return send(res, 400, { error: "bad_request" });
  try {
    // Si esta sesión ya generó código, devolver el mismo
    const existing = await redis(["GET", "sess:" + sid]);
    if (existing) return send(res, 200, { license: existing, premium: true });

    const s = await stripe("checkout/sessions/" + encodeURIComponent(sid));
    if (s.status !== "complete" || !s.subscription) return send(res, 402, { error: "not_paid" });

    const license = newLicense();
    await redis(["SET", "lic:" + license, JSON.stringify({ subscription: s.subscription, customer: s.customer, created: Date.now() })]);
    await redis(["SET", "sess:" + sid, license]);
    send(res, 200, { license, premium: true });
  } catch (e) {
    send(res, e.status || 502, { error: "stripe_error" });
  }
}
