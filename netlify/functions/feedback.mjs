// /api/feedback
//   POST {event: like|dislike|sent|replied, task, level, tipo, msg, sig, name} → aprende de ese mensaje
//   POST {event: "suggestion", text}                                        → guarda una sugerencia
//   GET  ?key=ADMIN_KEY                                                      → lo aprendido y las sugerencias
import { verify, anonymize, record, suggestion, bumpLimit, dump } from "../../server/_learn.js";

const json = (body, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export default async (req) => {
  if (req.method === "GET") {
    const key = new URL(req.url).searchParams.get("key") || "";
    const admin = process.env.ADMIN_KEY;
    if (!admin || key !== admin) return json({ error: "forbidden" }, 403);
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
  if (!verify(task, level, tipo, msg, b.sig)) return json({ error: "bad_signature" }, 400);

  await record({ task, level, tipo, msg: anonymize(msg, b.name), event });
  return json({ ok: true });
};

export const config = { path: "/api/feedback" };
