import handler from "../../server/generate.js";
import { adapt } from "../../server/netlify.js";

export default adapt(handler);
export const config = { path: "/api/generate" };
