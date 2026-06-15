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
exports.exchangeMelhorEnvioCode = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.exchangeMelhorEnvioCode = (0, https_1.onCall)({
    region: "us-east1",
    cors: true
}, async (request) => {
    const { code, redirectUri } = request.data;
    console.log("[MELHOR_ENVIO] Function invoked. Has auth:", !!request.auth, "Has code:", !!code);
    if (request.auth) {
        console.log("[MELHOR_ENVIO] User email:", request.auth.token.email);
    }
    // Ensure user is signed in and is an administrator
    if (!request.auth) {
        console.warn("[MELHOR_ENVIO] Access rejected: unauthenticated");
        return {
            success: false,
            error: "UNAUTHENTICATED (401): Você precisa estar logado para realizar esta ação."
        };
    }
    // Double check admin claim or admin email
    const isAdmin = request.auth.token.admin === true || request.auth.token.email === "lojadilermanonovo@gmail.com";
    if (!isAdmin) {
        console.warn(`[MELHOR_ENVIO] Access rejected: user ${request.auth.token.email} is not admin`);
        return {
            success: false,
            error: "PERMISSION_DENIED (403): Apenas administradores podem configurar o Melhor Envio."
        };
    }
    if (!code || !redirectUri) {
        console.warn("[MELHOR_ENVIO] Access rejected: missing code/redirectUri");
        return {
            success: false,
            error: "INVALID_ARGUMENT (400): Código de autorização e URI de redirecionamento são obrigatórios."
        };
    }
    const db = admin.firestore();
    // Read config
    const configSnap = await db.collection("settings").doc("melhorenvio").get();
    if (!configSnap.exists) {
        console.error("[MELHOR_ENVIO] Error: Settings document 'settings/melhorenvio' not found");
        return {
            success: false,
            error: "FAILED_PRECONDITION (412): O ID do Cliente e o Secret do Melhor Envio não foram configurados ainda."
        };
    }
    const config = configSnap.data();
    if (!config || !config.clientId || !config.clientSecret) {
        console.error("[MELHOR_ENVIO] Error: clientId or clientSecret are undefined in settings/melhorenvio");
        return {
            success: false,
            error: "FAILED_PRECONDITION (412): O ID do Cliente e o Secret do Melhor Envio precisam estar preenchidos no banco de dados."
        };
    }
    const isSandbox = config.mode === "sandbox";
    const baseUrl = isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
    console.log(`[MELHOR_ENVIO] Requesting token exchange from ${baseUrl}/oauth/token with clientId: ${config.clientId} and redirectUri: ${redirectUri}`);
    try {
        const response = await fetch(`${baseUrl}/oauth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "DilermandoStore/1.0"
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: redirectUri,
                code: code
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("[MELHOR_ENVIO] Token Exchange Error Response:", errorText);
            return {
                success: false,
                error: `MELHOR_ENVIO_API_ERROR: O serviço Melhor Envio retornou status ${response.status}: ${errorText}`
            };
        }
        const tokenData = await response.json();
        console.log("[MELHOR_ENVIO] Code exchange took place successfully. Storing tokens...");
        // Store tokens securely in Firestore (Accessible only to admins via rules)
        await db.collection("settings").doc("melhorenvio_tokens").set({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            connectedAt: Date.now(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("[MELHOR_ENVIO] Token save successful.");
        return {
            success: true,
            expiresAt: Date.now() + (tokenData.expires_in * 1000)
        };
    }
    catch (error) {
        console.error("[MELHOR_ENVIO] Exception during code exchange:", error);
        return {
            success: false,
            error: `INTERNAL_ERROR (500): ${error.message || "Falha ao obter tokens com o Melhor Envio."}`
        };
    }
});
//# sourceMappingURL=exchangeMelhorEnvioCode.js.map