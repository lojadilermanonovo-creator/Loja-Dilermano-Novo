import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";

export const calculateShipping = onCall({ 
  region: "us-east1",
  cors: true
}, async (request: CallableRequest) => {
  const { zipCode } = request.data;
  
  if (!zipCode) {
    throw new HttpsError("invalid-argument", "Zip code is required.");
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
