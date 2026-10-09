import handler from "../../server/checkout.js";
import { adapt } from "../../server/netlify.js";

export default adapt(handler);
export const config = { path: "/api/checkout" };
