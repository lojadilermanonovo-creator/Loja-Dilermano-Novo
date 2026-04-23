import * as admin from "firebase-admin";
import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";

export const onOrderCreated = onDocumentCreated({
  document: "orders/{orderId}",
  database: "ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700"
}, async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const orderData = snapshot.data();
  console.log('New order created:', event.params.orderId, orderData);
});
