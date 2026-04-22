import * as admin from "firebase-admin";
import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";

export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const orderData = snapshot.data();
  console.log('New order created:', event.params.orderId, orderData);
});
