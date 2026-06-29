"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe_webhook = exports.stripe_checkout = exports.stripe_config = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Helper to get Firestore instance
const getDb = () => admin.firestore();
// 1. stripe_config Endpoint
exports.stripe_config = (0, https_1.onRequest)({ cors: true, region: "us-east1" }, async (req, res) => {
    try {
        const db = getDb();
        let active = true;
        let publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_51Pxx77xx32exxIXL8NqfPyDGJcZ0sU31ibzFCRg";
        let mode = "sandbox";
        try {
            const docSnap = await db.collection("settings").doc("stripe").get();
            if (docSnap.exists) {
                const data = docSnap.data();
                active = data.active !== false;
                publishableKey = data.publishableKey || publishableKey;
                mode = data.mode || mode;
            }
        }
        catch (err) {
            console.warn("[Stripe Functions] Could not read settings/stripe from Firestore admin:", err);
        }
        // Fallback to settings/stripe_public if admin collection read failed or had placeholder keys
        if (publishableKey === "pk_test_51Pxx77xx32exxIXL8NqfPyDGJcZ0sU31ibzFCRg") {
            try {
                const docSnapPublic = await db.collection("settings").doc("stripe_public").get();
                if (docSnapPublic.exists) {
                    const data = docSnapPublic.data();
                    active = data.active !== false;
                    publishableKey = data.publishableKey || publishableKey;
                    mode = data.mode || mode;
                }
            }
            catch (err) {
                console.warn("[Stripe Functions] Could not read settings/stripe_public from Firestore admin:", err);
            }
        }
        // Also consider env variables
        if (process.env.STRIPE_PUBLISHABLE_KEY) {
            active = true;
            publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
        }
        res.status(200).json({
            active,
            publishableKey,
            mode,
        });
    }
    catch (error) {
        console.error("Error fetching stripe config:", error);
        res.status(500).json({ error: error.message });
    }
});
// 2. stripe_checkout Endpoint
exports.stripe_checkout = (0, https_1.onRequest)({ cors: true, region: "us-east1" }, async (req, res) => {
    try {
        // Handle options preflight
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method Not Allowed" });
            return;
        }
        const { orderId, orderData: clientOrderData } = req.body || {};
        if (!orderId && !clientOrderData) {
            res.status(400).json({ error: "Order ID or Order Data is required" });
            return;
        }
        const db = getDb();
        let orderData = clientOrderData;
        if (!orderData) {
            try {
                const orderSnap = await db.collection("orders").doc(orderId).get();
                if (orderSnap.exists) {
                    orderData = orderSnap.data();
                }
            }
            catch (err) {
                console.warn("[Stripe Functions] Could not read order from Firestore admin SDK:", err);
            }
        }
        if (!orderData) {
            res.status(404).json({ error: "Order details could not be retrieved. Please provide orderData in the request body." });
            return;
        }
        // Fetch Stripe settings
        let secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_51Pxx77xx32exxIXL8NqfPyDGJcZ0sU31ibzFCRg";
        let stripeActive = true;
        try {
            const stripeSnap = await db.collection("settings").doc("stripe").get();
            if (stripeSnap.exists) {
                const stripeConfig = stripeSnap.data();
                stripeActive = stripeConfig.active !== false;
                if (stripeConfig.secretKey) {
                    secretKey = stripeConfig.secretKey;
                }
            }
        }
        catch (err) {
            console.warn("[Stripe Functions] Could not read settings/stripe from Firestore admin:", err);
        }
        // Fallback to settings/stripe_public if admin collection read failed
        if (secretKey === "sk_test_51Pxx77xx32exxIXL8NqfPyDGJcZ0sU31ibzFCRg") {
            try {
                const stripeSnapPublic = await db.collection("settings").doc("stripe_public").get();
                if (stripeSnapPublic.exists) {
                    const stripeConfigPublic = stripeSnapPublic.data();
                    stripeActive = stripeConfigPublic.active !== false;
                }
            }
            catch (err) {
                console.warn("[Stripe Functions] Could not read settings/stripe_public from Firestore admin:", err);
            }
        }
        // Also consider env variables
        if (process.env.STRIPE_SECRET_KEY) {
            stripeActive = true;
            secretKey = process.env.STRIPE_SECRET_KEY;
        }
        if (!stripeActive) {
            res.status(400).json({ error: "Stripe integration is disabled or not configured." });
            return;
        }
        if (!secretKey) {
            res.status(500).json({ error: "Stripe configuration is missing the Secret Key." });
            return;
        }
        // Initialize Stripe
        const stripe = new stripe_1.default(secretKey, { apiVersion: "2023-10-16" });
        // Build Line Items
        const items = orderData.items || [];
        const line_items = items.map((item) => {
            let variantName = "";
            if (item.attributes) {
                const attributesList = Object.entries(item.attributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ");
                if (attributesList) {
                    variantName = ` (${attributesList})`;
                }
            }
            return {
                price_data: {
                    currency: "brl",
                    product_data: {
                        name: `${item.name}${variantName}`,
                        images: item.imageUrl ? [item.imageUrl] : [],
                    },
                    unit_amount: Math.round(Number(item.price) * 100),
                },
                quantity: Number(item.quantity) || 1,
            };
        });
        // Handle Shipping Cost as separate item
        if (orderData.shippingCost && Number(orderData.shippingCost) > 0) {
            line_items.push({
                price_data: {
                    currency: "brl",
                    product_data: {
                        name: `Frete - ${orderData.shippingOption?.name || "Entrega"}`,
                    },
                    unit_amount: Math.round(Number(orderData.shippingCost) * 100),
                },
                quantity: 1,
            });
        }
        // Handle Discount Coupon
        let stripeCouponId = undefined;
        if (orderData.discountAmount && Number(orderData.discountAmount) > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: Math.round(Number(orderData.discountAmount) * 100),
                currency: "brl",
                duration: "once",
                name: `Desconto - ${orderData.couponCode || "Cupom"}`,
            });
            stripeCouponId = coupon.id;
        }
        // Build success and cancel URLs pointing back to the client origin
        const origin = req.headers.origin || "https://dilermanoimport.netlify.app";
        const success_url = `${origin}/checkout/success?orderId=${orderId}&stripeSessionId={CHECKOUT_SESSION_ID}`;
        const cancel_url = `${origin}/checkout?canceled=true&orderId=${orderId}`;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
            mode: "payment",
            client_reference_id: orderId,
            metadata: { orderId },
            success_url,
            cancel_url,
            customer_email: orderData.shippingAddress?.email || undefined,
        });
        // Update Order with stripeSessionId and stripePaymentMethod
        await db.collection("orders").doc(orderId).update({
            stripeSessionId: session.id,
            paymentMethod: "stripe",
        });
        res.status(200).json({ url: session.url });
    }
    catch (error) {
        console.error("Error creating Stripe Checkout Session:", error);
        res.status(500).json({ error: error.message });
    }
});
// 3. stripe_webhook Endpoint
exports.stripe_webhook = (0, https_1.onRequest)({ cors: true, region: "us-east1" }, async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const db = getDb();
        const stripeSnap = await db.collection("settings").doc("stripe").get();
        if (!stripeSnap.exists) {
            console.error("Webhook Error: Stripe is not configured in Firestore settings/stripe");
            res.status(400).send("Stripe is not configured");
            return;
        }
        const stripeData = stripeSnap.data();
        const secretKey = stripeData.secretKey;
        if (!secretKey) {
            console.error("Webhook Error: Secret key is missing");
            res.status(400).send("Stripe Secret Key is missing");
            return;
        }
        const stripe = new stripe_1.default(secretKey, { apiVersion: "2023-10-16" });
        const sig = req.headers["stripe-signature"];
        let webhookSecret = stripeData.webhookSecret;
        // Use environment variable fallback
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        }
        if (!sig) {
            res.status(400).send("Webhook Error: Missing stripe-signature header");
            return;
        }
        if (!webhookSecret) {
            res.status(400).send("Webhook Error: Webhook secret is not configured");
            return;
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        }
        catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        console.log(`Webhook Event Received: ${event.type} [ID: ${event.id}]`);
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const sessionId = session.id;
            const orderId = session.client_reference_id || session.metadata?.orderId;
            if (!orderId) {
                console.error(`Webhook: Could not find orderId for session ${sessionId}`);
                res.status(400).send("Webhook Error: client_reference_id or orderId metadata is missing");
                return;
            }
            console.log(`Webhook: Processing payment completion for order ${orderId}, Stripe session ${sessionId}`);
            if (session.payment_status === "paid") {
                const orderRef = db.collection("orders").doc(orderId);
                const orderDoc = await orderRef.get();
                if (!orderDoc.exists) {
                    console.error(`Webhook: Order ${orderId} does not exist in Firestore!`);
                    res.status(400).send(`Webhook Error: Order ${orderId} not found`);
                    return;
                }
                const orderData = orderDoc.data();
                const currentTracking = orderData.trackingEvents || [];
                const trackingEvents = [
                    ...currentTracking,
                    {
                        status: "payment_approved",
                        description: "Pagamento aprovado via cartão de crédito (Stripe).",
                        timestamp: new Date().toISOString()
                    },
                    {
                        status: "preparing",
                        description: "Seu pedido está sendo preparado para o envio.",
                        timestamp: new Date().toISOString()
                    }
                ];
                await db.runTransaction(async (transaction) => {
                    transaction.update(orderRef, {
                        status: "approved",
                        paymentStatus: "paid",
                        stripePaymentIntentId: session.payment_intent,
                        stockDeducted: true,
                        trackingEvents: trackingEvents,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                });
                console.log(`Successfully completed order transaction for approved Stripe order: ${orderId}`);
            }
            else {
                console.warn(`Webhook: Session ${sessionId} exists but payment_status is not paid:`, session.payment_status);
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send(`Webhook Error: ${error.message}`);
    }
});
//# sourceMappingURL=stripe.js.map