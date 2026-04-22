"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2023-10-16",
});
exports.stripeWebhook = (0, https_1.onRequest)({ region: "us-east1", cors: true }, async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        if (endpointSecret && sig) {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
        }
        else {
            event = req.body;
        }
    }
    catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Handle the event
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            console.log("Payment successful for session:", session.id);
            // Update order status in Firestore
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
});
//# sourceMappingURL=stripeWebhook.js.map