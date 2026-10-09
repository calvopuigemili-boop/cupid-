import handler from "../../server/license.js";
import { adapt } from "../../server/netlify.js";

export default adapt(handler);
export const config = { path: "/api/license" };
