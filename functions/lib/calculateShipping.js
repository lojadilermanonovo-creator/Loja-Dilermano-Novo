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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateShipping = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.calculateShipping = (0, https_1.onCall)({
    region: "us-east1",
    cors: true
}, async (request) => {
    const { zipCode } = request.data;
    if (!zipCode) {
        throw new https_1.HttpsError("invalid-argument", "CEP do destinatário é obrigatório.");
    }
    const cleanDestZip = zipCode.replace(/\D/g, "");
    if (cleanDestZip.length !== 8) {
        throw new https_1.HttpsError("invalid-argument", "Formato de CEP inválido. O CEP deve conter 8 dígitos.");
    }
    const db = admin.firestore();
    // 1. Load config
    const configSnap = await db.collection("settings").doc("melhorenvio").get();
    if (!configSnap.exists) {
        throw new https_1.HttpsError("failed-precondition", "Melhor Envio não está configurado. Cadastre as chaves no painel do administrador.");
    }
    const config = configSnap.data();
    if (!config || !config.clientId || !config.clientSecret || !config.originZip) {
        throw new https_1.HttpsError("failed-precondition", "Melhor Envio Client ID, Client Secret e CEP de origem são obrigatórios.");
    }
    const cleanOriginZip = config.originZip.replace(/\D/g, "");
    if (cleanOriginZip.length !== 8) {
        throw new https_1.HttpsError("failed-precondition", "CEP de origem inválido nas configurações do Melhor Envio.");
    }
    const isSandbox = config.mode === "sandbox";
    const baseUrl = isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
    // 2. Load and refresh tokens if necessary
    const tokensSnap = await db.collection("settings").doc("melhorenvio_tokens").get();
    if (!tokensSnap.exists) {
        throw new https_1.HttpsError("failed-precondition", "Conexão com o Melhor Envio não autorizada. Conecte pelo painel do administrador.");
    }
    const tokens = tokensSnap.data();
    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        throw new https_1.HttpsError("failed-precondition", "Token do Melhor Envio ausente ou inválido. Refaça a autenticação.");
    }
    let currentAccessToken = tokens.accessToken;
    // Check if token is expired or expires in the next 2 minutes
    if (Date.now() > (tokens.expiresAt - 120000)) {
        console.log("Melhor Envio Access Token expired or near expiration. Refreshing...");
        try {
            const refreshResponse = await fetch(`${baseUrl}/oauth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "DilermandoStore/1.0"
                },
                body: JSON.stringify({
                    grant_type: "refresh_token",
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    refresh_token: tokens.refreshToken
                })
            });
            if (!refreshResponse.ok) {
                const errorText = await refreshResponse.text();
                throw new Error(`Token refresh failed with status ${refreshResponse.status}: ${errorText}`);
            }
            const newTokens = await refreshResponse.json();
            currentAccessToken = newTokens.access_token;
            // Update stored tokens
            await db.collection("settings").doc("melhorenvio_tokens").set({
                accessToken: newTokens.access_token,
                refreshToken: newTokens.refresh_token,
                expiresAt: Date.now() + (newTokens.expires_in * 1000),
                connectedAt: tokens.connectedAt || Date.now(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("Melhor Envio Access Token successfully refreshed!");
        }
        catch (refreshErr) {
            console.error("Error refreshing Melhor Envio token:", refreshErr);
            throw new https_1.HttpsError("internal", `Não foi possível renovar o token do Melhor Envio: ${refreshErr.message}`);
        }
    }
    // 3. Make real shipment calculate call to Melhor Envio
    try {
        const calculateUrl = `${baseUrl}/api/v2/me/shipment/calculate`;
        console.log(`Calling Melhor Envio calculate API at: ${calculateUrl} from ${cleanOriginZip} to ${cleanDestZip}`);
        const response = await fetch(calculateUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${currentAccessToken}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "DilermandoStore/1.0"
            },
            body: JSON.stringify({
                from: {
                    postal_code: cleanOriginZip
                },
                to: {
                    postal_code: cleanDestZip
                },
                package: {
                    width: 15,
                    height: 15,
                    length: 15,
                    weight: 0.5
                }
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Melhor Envio API calculation error:", errorText);
            throw new Error(`Error responding from Melhor Envio. Code ${response.status}: ${errorText}`);
        }
        const shippingOptions = await response.json();
        if (!Array.isArray(shippingOptions)) {
            console.warn("Melhor Envio response of calculation was not an array:", shippingOptions);
            return { options: [] };
        }
        // Filter valid services and format for frontend
        const options = shippingOptions
            .filter((opt) => opt && !opt.error && opt.price)
            .map((opt) => ({
            id: opt.id,
            name: `${opt.company.name} ${opt.name}`,
            price: parseFloat(opt.custom_price || opt.price),
            days: opt.delivery_time,
            companyName: opt.company.name,
            serviceName: opt.name,
            picture: opt.company.picture || ""
        }));
        return { options };
    }
    catch (calcErr) {
        console.error("Shipping calculation failure:", calcErr);
        throw new https_1.HttpsError("internal", calcErr.message || "Falha externa de cálculo de frete com Melhor Envio.");
    }
});
//# sourceMappingURL=calculateShipping.js.map