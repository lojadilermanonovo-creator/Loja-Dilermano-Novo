import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function run() {
  console.log("Initializing Firebase Admin with explicit projectId...");
  initializeApp({
    projectId: "gen-lang-client-0387723123"
  });

  const db = getFirestore("ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700");

  console.log("--- AUDITING SETTINGS/STRIPE ---");
  const stripeSnap = await db.collection('settings').doc('stripe').get();
  if (stripeSnap.exists) {
    const data = stripeSnap.data()!;
    console.log("stripe document data:", JSON.stringify(data, null, 2));
    console.log("type of active field:", typeof data.active);
    console.log("active field value:", data.active);
  } else {
    console.log("settings/stripe does not exist!");
  }

  console.log("\n--- AUDITING CATEGORIES ---");
  const categoriesSnap = await db.collection('categories').get();
  if (categoriesSnap.empty) {
    console.log("Categories collection is empty.");
  } else {
    categoriesSnap.forEach(doc => {
      console.log(`Category ID: ${doc.id}, Name: ${doc.data().name}, Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }

  console.log("\n--- AUDITING PRODUCTS ---");
  const productsSnap = await db.collection('products').limit(5).get();
  if (productsSnap.empty) {
    console.log("Products collection is empty.");
  } else {
    productsSnap.forEach(doc => {
      console.log(`Product ID: ${doc.id}, Name: ${doc.data().name}, CategoryID: ${doc.data().categoryId}, Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }
}

run().catch(err => {
  console.error("Error in Firebase Admin:", err);
});

