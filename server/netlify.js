// Adaptador: ejecuta los manejadores de /server (estilo Node req/res) como funciones de Netlify,
// y guarda contadores y licencias en Netlify Blobs si no hay Upstash configurado.
import { getStore } from "@netlify/blobs";
import { setKV } from "./_lib.js";

let kvReady = false;
function useBlobs() {
  if (kvReady) return;
  kvReady = true;
  const store = getStore({ name: "cupida", consistency: "strong" });
  const read = async key => {
    const rec = await store.get(key, { type: "json" }).catch(() => null);
    if (!rec) return null;
    if (rec.exp && rec.exp < Date.now()) { store.delete(key).catch(() => {}); return null; }
    return rec;
  };
  setKV(async ([op, key, ...rest]) => {
    if (op === "GET") { const r = await read(key); return r ? r.v : null; }
    if (op === "SET") { await store.setJSON(key, { v: rest[0] }); return "OK"; }
    if (op === "DEL") { await store.delete(key); return 1; }
    if (op === "INCR") {
      const r = await read(key);
      const v = (Number(r?.v) || 0) + 1;
      await store.setJSON(key, { v, exp: r?.exp });
      return v;
    }
    if (op === "EXPIRE") {
      const r = await read(key);
      if (r) await store.setJSON(key, { v: r.v, exp: Date.now() + Number(rest[0]) * 1000 });
      return 1;
    }
    return null;
  });
}

export function adapt(handler) {
  return async (request, context) => {
    useBlobs();
    if (!process.env.SITE_URL && context?.site?.url) process.env.SITE_URL = context.site.url;
    const url = new URL(request.url);
    const headers = {};
    request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    if (context?.ip && !headers["x-forwarded-for"]) headers["x-forwarded-for"] = context.ip;
    const raw = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
    const req = { method: request.method, url: url.pathname + url.search, headers, body: raw, socket: { remoteAddress: context?.ip } };

    let status = 200; const outHeaders = new Headers(); let body = "";
    const res = {
      set statusCode(v) { status = v; }, get statusCode() { return status; },
      setHeader(k, v) { outHeaders.set(k, String(v)); },
      end(b) { body = b ?? ""; },
    };
    await handler(req, res);
    return new Response(body, { status, headers: outHeaders });
  };
}
