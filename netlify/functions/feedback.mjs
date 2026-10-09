// /api/feedback
//   POST {event: like|dislike|sent|replied, task, level, tipo, msg, sig, name} → aprende de ese mensaje
//   POST {event: "suggestion", text}                                        → guarda una sugerencia
//   GET  ?key=ADMIN_KEY                                                      → lo aprendido y las sugerencias
import crypto from "node:crypto";
import { getUser } from "@netlify/identity";
import { verify, anonymize, record, suggestion, bumpLimit, dump } from "../../server/_learn.js";

// Quién puede ver el panel: la cuenta de Cupid@ con este email (guardado como huella, no en claro)
const OWNER_EMAIL_SHA256 = "3049d61a9b9992cebea152bf9eb79fefe3feacce42a4a1b27ca1212e0045b718";
async function isAdmin(req) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (process.env.ADMIN_KEY && key === process.env.ADMIN_KEY) return true;
  const user = await getUser().catch(() => null);
  if (!user?.email) return false;
  return crypto.createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex") === OWNER_EMAIL_SHA256;
}

const json = (body, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export default async (req) => {
  if (req.method === "GET") {
    if (!(await isAdmin(req))) return json({ error: "forbidden" }, 403);
    return json(await dump());
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const device = String(req.headers.get("x-device") || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  if (device.length < 16) return json({ error: "bad_request" }, 400);
  let b;
  try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  if (!(await bumpLimit(device).catch(() => true))) return json({ error: "too_many" }, 429);

  if (b.event === "suggestion") {
    const text = String(b.text || "").trim().slice(0, 1000);
    if (text.length < 3) return json({ error: "bad_request" }, 400);
    await suggestion(text, device);
    return json({ ok: true });
  }

  const task = ["open", "reply"].includes(b.task) ? b.task : null;
  const level = ["suave", "picante", "sinfiltro"].includes(b.level) ? b.level : null;
  const event = ["like", "dislike", "sent", "replied"].includes(b.event) ? b.event : null;
  const tipo = String(b.tipo || "").slice(0, 20);
  const msg = String(b.msg || "").slice(0, 600);
  if (!task || !level || !event || !msg) return json({ error: "bad_request" }, 400);
  if (!(await verify(task, level, tipo, msg, b.sig).catch(() => false))) return json({ error: "bad_signature" }, 400);

  await record({ task, level, tipo, msg: anonymize(msg, b.name), event });
  return json({ ok: true });
};

export const config = { path: "/api/feedback" };
