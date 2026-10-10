// /api/sync — chats y perfil de cada cuenta (Netlify Identity + Netlify Blobs).
//   GET                         → {me, chats}
//   POST {op:"put", chat}       → guarda un chat
//   POST {op:"del", id}         → borra un chat
//   POST {op:"me", me}          → guarda perfil (g, t, level), el consentimiento y si quiere ayudar a mejorar
//   POST {op:"wipe"}            → borra todos los datos y la cuenta
import { getUser, admin, verifyRequestOrigin } from "@netlify/identity";
import { getStore } from "@netlify/blobs";

const json = (body, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const ID = /^[a-z0-9]{6,40}$/i;
const MAX_CHATS = 300;

export default async (req) => {
  const user = await getUser().catch(() => null);
  if (!user) return json({ error: "unauthorized" }, 401);
  const st = getStore({ name: "users", consistency: "strong" });
  const base = `u/${user.id}/`;

  if (req.method === "GET") {
    const me = await st.get(base + "me", { type: "json" }).catch(() => null);
    const { blobs } = await st.list({ prefix: base + "c/" });
    const chats = (await Promise.all(blobs.map(b => st.get(b.key, { type: "json" }).catch(() => null)))).filter(Boolean);
    return json({ me, chats, email: user.email });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try { verifyRequestOrigin(req); } catch { return json({ error: "forbidden" }, 403); }

  let b;
  try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  if (b.op === "put") {
    const c = b.chat;
    if (!c || !ID.test(String(c.id))) return json({ error: "bad_request" }, 400);
    const raw = JSON.stringify(c);
    if (raw.length > 300_000) return json({ error: "too_large" }, 413);
    const exists = await st.getMetadata(base + "c/" + c.id).catch(() => null);
    if (!exists) {
      const { blobs } = await st.list({ prefix: base + "c/" });
      if (blobs.length >= MAX_CHATS) return json({ error: "too_many_chats" }, 409);
    }
    await st.set(base + "c/" + c.id, raw);
    return json({ ok: true });
  }
  if (b.op === "del") {
    if (!ID.test(String(b.id))) return json({ error: "bad_request" }, 400);
    await st.delete(base + "c/" + b.id);
    return json({ ok: true });
  }
  if (b.op === "me") {
    const m = b.me || {};
    const me = {
      g: ["Hombre", "Mujer"].includes(m.g) ? m.g : null,
      t: ["Mujeres", "Hombres", "Ambos"].includes(m.t) ? m.t : null,
      level: ["suave", "picante", "sinfiltro"].includes(m.level) ? m.level : "picante",
      // Prueba del consentimiento (RGPD art. 7.1): versión de los textos aceptados y fecha
      consent: m.consent && typeof m.consent === "object" ? {
        v: String(m.consent.v || "").slice(0, 20), at: String(m.consent.at || "").slice(0, 40),
        legal: m.consent.legal === true, sens: m.consent.sens === true, saved: new Date().toISOString(),
      } : null,
      learn: m.learn !== false,
      updated: Date.now(),
    };
    await st.setJSON(base + "me", me);
    return json({ ok: true });
  }
  if (b.op === "wipe") {
    const { blobs } = await st.list({ prefix: base });
    await Promise.all(blobs.map(x => st.delete(x.key)));
    await admin.deleteUser(user.id).catch(() => {});
    return json({ ok: true });
  }
  return json({ error: "bad_request" }, 400);
};

export const config = { path: "/api/sync" };
