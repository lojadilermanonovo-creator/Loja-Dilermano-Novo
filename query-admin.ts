import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function run() {
  console.log("Initializing Firebase Admin...");
  initializeApp({
    projectId: "gen-lang-client-0387723123"
  });

  const db = getFirestore("ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700");

  console.log("--- AUDITING SETTINGS/PROMOCTA ---");
  const promoSnap = await db.collection('settings').doc('promocta').get();
  if (promoSnap.exists) {
    const data = promoSnap.data()!;
    console.log("promocta document data:", JSON.stringify(data, null, 2));
    console.log("type of value field:", typeof data.value);
    console.log("value field value:", data.value);
  } else {
    console.log("settings/promocta does not exist!");
  }

  console.log("\n--- AUDITING COUPONS ---");
  const couponsSnap = await db.collection('coupons').get();
  if (couponsSnap.empty) {
    console.log("Coupons collection is empty.");
  } else {
    couponsSnap.forEach(doc => {
      console.log(`Coupon Code: ${doc.id}`);
      console.log(`Coupon Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }
}

run().catch(err => {
  console.error("Error in Firebase Admin:", err);
});

