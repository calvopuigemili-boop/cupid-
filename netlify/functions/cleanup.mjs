// Limpieza diaria (RGPD: conservar solo lo necesario).
// - Contadores anti-abuso (huellas de dispositivo e IP): se borran a partir de las 48 h.
// - Topes de votos por dispositivo: igual.
// - Sugerencias: 12 meses.
// Se ejecuta sola cada día a las 03:17 UTC (05:17 en Madrid en verano, 04:17 en invierno).
import { getStore } from "@netlify/blobs";

const DAY = /(\d{4}-\d{2}-\d{2})/;
const old = (key, days) => {
  const m = key.match(DAY);
  return m ? Date.parse(m[1] + "T00:00:00Z") < Date.now() - days * 864e5 : false;
};

async function sweep(store, prefix, test) {
  let n = 0;
  for await (const page of store.list({ prefix, paginate: true })) {
    const doomed = page.blobs.filter(b => test(b.key));
    await Promise.all(doomed.map(b => store.delete(b.key).catch(() => {})));
    n += doomed.length;
  }
  return n;
}

export default async () => {
  const counters = getStore({ name: "cupida", consistency: "strong" });
  const learn = getStore({ name: "learn", consistency: "strong" });
  const out = {
    counters: await sweep(counters, "", k => /^(g|r|ip):/.test(k) && old(k, 2)),
    rateLimits: await sweep(learn, "rl/", k => old(k, 2)),
    suggestions: await sweep(learn, "sugg/", k => { const t = Number(k.split("/")[1]?.split("-")[0]); return t > 0 && t < Date.now() - 365 * 864e5; }),
  };
  console.log("cleanup", JSON.stringify(out));
};

export const config = { schedule: "17 3 * * *" };
