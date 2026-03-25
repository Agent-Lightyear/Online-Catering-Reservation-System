import { auth, db } from "../config/firebase.js";
import { logAction } from "./loggingService.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function registerAccount({ name, phone, email, password, role }) {
  if (!role) throw new Error("Please select a role.");

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  const profile = {
    uid: user.uid,
    name,
    phone,
    email,
    role,
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", user.uid), profile);
  await logAction({
    userId: user.uid,
    role,
    action: "REGISTER",
    details: { email, role }
  });

  return profile;
}

export async function loginAccount({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const profileSnap = await getDoc(doc(db, "users", user.uid));

  let profile;
  if (profileSnap.exists()) {
    profile = profileSnap.data();
  } else {
    // Backward-compatible fallback: if profile is missing, create a default user profile.
    profile = {
      uid: user.uid,
      name: "Unknown",
      phone: "",
      email: user.email,
      role: "user",
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, "users", user.uid), profile);
  }

  if (!profile.role) {
    throw new Error("User role is not configured. Please contact admin.");
  }

  await logAction({
    userId: user.uid,
    role: profile.role,
    action: "LOGIN",
    details: { email, role: profile.role }
  });

  return profile;
}

export async function logoutAccount() {
  await signOut(auth);
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data();
}

