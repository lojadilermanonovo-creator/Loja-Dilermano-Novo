import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const exchangeMelhorEnvioCode = onCall({
  region: "us-east1",
  cors: true
}, async (request: CallableRequest) => {
  const { code, redirectUri } = request.data;

  // Ensure user is signed in and is an administrator
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  // Double check admin claim or admin email
  const isAdmin = request.auth.token.admin === true || request.auth.token.email === "lojadilermanonovo@gmail.com";
  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Only administrators can configure Melhor Envio.");
  }

  if (!code || !redirectUri) {
    throw new HttpsError("invalid-argument", "Authorization code and redirect URI are required.");
  }

  const db = admin.firestore();
  
  // Read config
  const configSnap = await db.collection("settings").doc("melhorenvio").get();
  if (!configSnap.exists) {
    throw new HttpsError("failed-precondition", "Melhor Envio Client ID and Secret have not been configured yet.");
  }

  const config = configSnap.data();
  if (!config || !config.clientId || !config.clientSecret) {
    throw new HttpsError("failed-precondition", "Melhor Envio Client ID and Client Secret must be configured first.");
  }

  const isSandbox = config.mode === "sandbox";
  const baseUrl = isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";

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
      console.error("Melhor Envio Token Exchange Error Response:", errorText);
      throw new Error(`Melhor Envio responded with status ${response.status}: ${errorText}`);
    }

    const tokenData = await response.json();

    // Store tokens securely in Firestore (Accessible only to admins via rules)
    await db.collection("settings").doc("melhorenvio_tokens").set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      connectedAt: Date.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    };
  } catch (error: any) {
    console.error("Error exchanging code:", error);
    throw new HttpsError("internal", error.message || "Failed to exchange authorization code.");
  }
});
