// Vercel: publica el servidor de Cupid@ en /api/generate (el mismo código que usa Netlify).
import handler from "../server/generate.js";

export default handler;
export const config = { maxDuration: 60 };
