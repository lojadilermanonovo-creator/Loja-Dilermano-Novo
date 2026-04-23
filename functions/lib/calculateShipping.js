"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateShipping = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.calculateShipping = (0, https_1.onCall)({
    region: "us-east1",
    cors: true
}, async (request) => {
    const { zipCode } = request.data;
    if (!zipCode) {
        throw new https_1.HttpsError("invalid-argument", "Zip code is required.");
    }
    console.log("Calculating shipping for", zipCode);
    // Real logic with Correios API would go here
    return {
        options: [
            { name: "PAC", price: 25.50, days: 8 },
            { name: "SEDEX", price: 42.90, days: 3 }
        ]
    };
});
//# sourceMappingURL=calculateShipping.js.map