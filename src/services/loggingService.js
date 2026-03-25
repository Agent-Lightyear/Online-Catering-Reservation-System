import { db } from "../config/firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export async function logAction({ userId = null, role = "guest", action, details = {} }) {
  await addDoc(collection(db, "logs"), {
    userId,
    role,
    action,
    details,
    createdAt: serverTimestamp()
  });
}
