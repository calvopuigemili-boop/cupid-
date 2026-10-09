import handler from "../../server/portal.js";
import { adapt } from "../../server/netlify.js";

export default adapt(handler);
export const config = { path: "/api/portal" };
