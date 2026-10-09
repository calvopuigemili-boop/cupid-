// POST /api/portal {license} — abre el portal de Stripe para cancelar o cambiar la tarjeta.
import { CFG, send, readJson, redis, stripe } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  if (!CFG.stripeKey || !CFG.siteUrl) return send(res, 503, { error: "not_configured" });
  let body;
  try { body = await readJson(req, 10_000); } catch { return send(res, 400, { error: "bad_request" }); }
  const license = String(body.license || "").trim().toUpperCase();
  const comp = String(process.env.COMP_LICENSES || "").split(",").map(x => x.trim().toUpperCase());
  if (comp.includes(license)) return send(res, 409, { error: "comp_license", message: "Este Premium es un regalo: no hay suscripción que gestionar." });
  try {
    const raw = await redis(["GET", "lic:" + license]);
    if (!raw) return send(res, 404, { error: "unknown_license" });
    const lic = typeof raw === "string" ? JSON.parse(raw) : raw;
    const p = await stripe("billing_portal/sessions", { method: "POST", form: { customer: lic.customer, return_url: CFG.siteUrl + "/" } });
    send(res, 200, { url: p.url });
  } catch (e) {
    send(res, e.status || 502, { error: "stripe_error" });
  }
}
