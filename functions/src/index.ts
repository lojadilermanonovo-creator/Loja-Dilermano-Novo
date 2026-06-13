import * as admin from "firebase-admin";

admin.initializeApp();

// Export functions from separate files
export { calculateShipping } from "./calculateShipping";
export { setAdminClaim } from "./setAdminClaim";

// Database Triggers
export { onOrderCreated } from "./onOrderCreated";
export { onUserCreated } from "./onUserCreated";
