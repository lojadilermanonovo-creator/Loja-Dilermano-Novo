"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckout = void 0;
const https_1 = require("firebase-functions/v2/https");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2023-10-16",
});
exports.createCheckout = (0, https_1.onCall)({
    region: "us-east1",
    cors: true
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in.");
    }
    const { items, successUrl, cancelUrl } = request.data;
    const customerEmail = request.auth.token.email;
    try {
        console.log("Creating checkout session for", customerEmail);
        // In a production app, we would use Stripe SDK here
        // const session = await stripe.checkout.sessions.create({ ... });
        return {
            url: successUrl, // Simulating redirect for now
            sessionId: "mock_session_" + Date.now()
        };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=createCheckout.js.map