import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const setAdminClaim = onCall({ 
  region: "us-east1",
  cors: true 
}, async (request: CallableRequest) => {
  const bootstrapEmail = "lojadilermanonovo@gmail.com"; 

  // Security check: only admins or the bootstrap email can promote users
  if (request.auth?.token.admin !== true && request.auth?.token.email !== bootstrapEmail) {
    throw new HttpsError("permission-denied", "Only admins can set admin claims.");
  }

  const { uid, isAdmin } = request.data;
  
  if (!uid) {
    throw new HttpsError("invalid-argument", "UID is required.");
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: !!isAdmin });
    return { message: `Success! User ${uid} admin status set to ${!!isAdmin}` };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});
