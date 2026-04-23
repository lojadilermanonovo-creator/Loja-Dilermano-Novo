"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOrderCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
exports.onOrderCreated = (0, firestore_1.onDocumentCreated)({
    document: "orders/{orderId}",
    database: "ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700"
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const orderData = snapshot.data();
    console.log('New order created:', event.params.orderId, orderData);
});
//# sourceMappingURL=onOrderCreated.js.map