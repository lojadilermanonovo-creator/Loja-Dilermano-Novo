import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export const createCheckout = onCall({ region: "us-east1" }, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
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
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});
