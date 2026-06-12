/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-east1');

// Test connection (Optional: handled by DatabaseStatusContext)
// async function testConnection() {
//   try {
//     await getDocFromServer(doc(db, 'test', 'connection'));
//     console.log("Firebase connection successful");
//   } catch (error) {
//     if (error instanceof Error && error.message.includes('permission-denied')) {
//         // This is expected if the document doesn't exist but we hit the rules
//         console.log("Firebase connected (permission-denied is fine for test)");
//     } else if (error instanceof Error && error.message.includes('the client is offline')) {
//       console.error("Please check your Firebase configuration.");
//     } else {
//       console.error("Firebase connection error:", error);
//     }
//   }
// }
// testConnection();
