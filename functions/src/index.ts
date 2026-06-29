import * as admin from "firebase-admin";

admin.initializeApp();

// Export functions from separate files
export { calculateShipping } from "./calculateShipping";
export { exchangeMelhorEnvioCode } from "./exchangeMelhorEnvioCode";
export { setAdminClaim } from "./setAdminClaim";
export { stripe_config, stripe_checkout, stripe_webhook } from "./stripe";

// Database Triggers
export { onOrderCreated } from "./onOrderCreated";
export { onUserCreated } from "./onUserCreated";
