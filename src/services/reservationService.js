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

export async function createReservation({ actor, payload }) {
  const docRef = await addDoc(collection(db, "reservations"), {
    userId: actor.uid,
    userName: actor.name || "",
    userEmail: actor.email || "",
    ...payload,
    status: "Requested",
    createdAt: serverTimestamp()
  });

  await logAction({
    userId: actor.uid,
    role: actor.role,
    action: "CREATE_RESERVATION",
    details: { reservationId: docRef.id, catererId: payload.catererId || "", date: payload.eventDate || "" }
  });

  return docRef.id;
}

export function subscribeMyReservations(uid, callback) {
  const q = query(collection(db, "reservations"), where("userId", "==", uid));
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

export function subscribeAllReservations(callback) {
  return onSnapshot(collection(db, "reservations"), (snapshot) => {
    const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    rows.sort((a, b) => {
      const aMs = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const bMs = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return bMs - aMs;
    });
    callback(rows);
  });
}

export async function updateReservation(id, updates, actor = {}) {
  const ref = doc(db, "reservations", id);
  await updateDoc(ref, updates);
  await logAction({
    userId: actor.uid || actor.userId || "unknown",
    role: actor.role || "unknown",
    action: "UPDATE_RESERVATION",
    details: { reservationId: id, updates }
  });
}

