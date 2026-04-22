import * as admin from "firebase-admin";

admin.initializeApp();

// Export functions from separate files
export { createCheckout } from "./createCheckout";
export { calculateShipping } from "./calculateShipping";
export { stripeWebhook } from "./stripeWebhook";
export { setAdminClaim } from "./setAdminClaim";

// Database Triggers
export { onOrderCreated } from "./onOrderCreated";
export { onUserCreated } from "./onUserCreated";
