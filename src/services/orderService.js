import { db } from "../config/firebase.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { logAction } from "./loggingService.js";

export async function placeOrder({ user, items, total }) {
  const docRef = await addDoc(collection(db, "orders"), {
    userId: user.uid,
    userName: user.name,
    userEmail: user.email,
    items,
    total,
    status: "Placed",
    createdAt: serverTimestamp()
  });

  await logAction({
    userId: user.uid,
    role: user.role,
    action: "PLACE_ORDER",
    details: { itemCount: items.length, total }
  });

  return docRef.id;
}

export function subscribeMyOrders(uid, callback) {
  const q = query(collection(db, "orders"), where("userId", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    rows.sort((a, b) => {
      const aMs = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const bMs = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return bMs - aMs;
    });
    callback(rows);
  });
}

export function subscribeAllOrders(callback) {
  return onSnapshot(collection(db, "orders"), (snapshot) => {
    const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    rows.sort((a, b) => {
      const aMs = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const bMs = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return bMs - aMs;
    });
    callback(rows);
  });
}

export async function logViewOrder({ userId, role, scope }) {
  await logAction({
    userId,
    role,
    action: "VIEW_ORDER",
    details: { scope }
  });
}
export async function updateOrder(id, updates, actor = {}) {
  const orderRef = doc(db, "orders", id);
  await updateDoc(orderRef, updates);

  // log action with whatever actor info is provided
  await logAction({
    userId: actor.uid || actor.userId || "unknown",
    role: actor.role || "unknown",
    action: "UPDATE_ORDER",
    details: { orderId: id, updates }
  });
}
