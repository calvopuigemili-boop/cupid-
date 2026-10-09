// POST /api/checkout — crea una sesión de pago de Stripe para la suscripción Premium y devuelve su URL.
import { CFG, send, stripe } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  if (!CFG.stripeKey || !CFG.stripePrice || !CFG.siteUrl) return send(res, 503, { error: "not_configured", message: "Los pagos aún no están activados." });
  try {
    const s = await stripe("checkout/sessions", {
      method: "POST",
      form: {
        mode: "subscription",
        "line_items[0][price]": CFG.stripePrice,
        "line_items[0][quantity]": "1",
        success_url: `${CFG.siteUrl}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CFG.siteUrl}/?pago=cancelado`,
        allow_promotion_codes: "true",
        locale: "es",
      },
    });
    send(res, 200, { url: s.url });
  } catch (e) {
    send(res, e.status || 502, { error: "stripe_error" });
  }
}
