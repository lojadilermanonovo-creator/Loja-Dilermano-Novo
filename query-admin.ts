import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function run() {
  console.log("Initializing Firebase Admin...");
  initializeApp({
    projectId: "gen-lang-client-0387723123"
  });

  const db = getFirestore("ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700");

  console.log("Searching in collection 'orders' where orderNumber == DI-20260616-8781...");
  const snap = await db.collection('orders').where('orderNumber', '==', 'DI-20260616-8781').get();

  if (snap.empty) {
    console.log("No order found with orderNumber DI-20260616-8781.");
    // Let's print out the first 5 order numbers to see if there are any
    const fallbackSnap = await db.collection('orders').limit(5).get();
    if (fallbackSnap.empty) {
      console.log("Orders collection is completely empty!");
    } else {
      console.log("Existing orders in Firestore (first 5):");
      fallbackSnap.forEach(d => {
        console.log(`ID: ${d.id}, orderNumber: ${d.data().orderNumber}, shippingCost: ${d.data().shippingCost}`);
      });
    }
    return;
  }

  snap.forEach(d => {
    const data = d.data();
    console.log(`FOUND ORDER ID: ${d.id}`);
    console.log(`orderNumber: ${data.orderNumber}`);
    console.log(`shippingCost representation:`, data.shippingCost);
    console.log(`Type of shippingCost:`, typeof data.shippingCost);
    console.log(`All data:`, JSON.stringify(data, null, 2));
  });
}

run().catch(err => {
  console.error("Error in Firebase Admin:", err);
});
