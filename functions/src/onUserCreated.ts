import * as functions from "firebase-functions/v1";

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log('New user created:', user.uid);
  // Optional: create profile in Firestore here
});
