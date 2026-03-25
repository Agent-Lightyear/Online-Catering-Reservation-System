import { db } from "../config/firebase.js";
import { collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { logAction } from "./loggingService.js";

const fallbackCaterers = [
  {
    id: "sample-caterer-1",
    name: "Spice Garden Caterers",
    city: "Mumbai",
    phone: "+91 98765 43210",
    rating: 4.6,
    minOrder: 2500,
    tags: ["Indian", "Mughlai", "Biryani"],
    image: "assets/img/caterers/spice-garden-caterers.jpg",
    createdAt: null
  },
  {
    id: "sample-caterer-2",
    name: "Royal Feast Catering",
    city: "Delhi",
    phone: "+91 98111 22334",
    rating: 4.4,
    minOrder: 4000,
    tags: ["North Indian", "Tandoor", "Live Counters"],
    image: "assets/img/products/tandoori-chicken-platter.jpeg",
    createdAt: null
  },
  {
    id: "sample-caterer-3",
    name: "Green Leaf Veg Caterers",
    city: "Bengaluru",
    phone: "+91 99000 11223",
    rating: 4.7,
    minOrder: 3000,
    tags: ["Vegetarian", "South Indian", "Jain"],
    image: "assets/img/products/veg-pulao.jpg",
    createdAt: null
  }
];

export function subscribeCaterers(callback) {
  return onSnapshot(collection(db, "caterers"), (snapshot) => {
    const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    if (!rows.length) {
      callback(fallbackCaterers);
      return;
    }

    rows.sort((a, b) => {
      const aMs = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const bMs = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return bMs - aMs;
    });
    callback(rows);
  });
}

export async function createCaterer({ name, city, phone, rating, minOrder, tags = [], image = "", actor }) {
  await addDoc(collection(db, "caterers"), {
    name,
    city: city || "",
    phone: phone || "",
    rating: Number(rating || 0),
    minOrder: Number(minOrder || 0),
    tags: Array.isArray(tags) ? tags : [],
    image: image || "",
    createdBy: actor.uid,
    createdAt: serverTimestamp()
  });

  await logAction({
    userId: actor.uid,
    role: actor.role,
    action: "CREATE_CATERER",
    details: { name, city: city || "", rating: Number(rating || 0), minOrder: Number(minOrder || 0) }
  });
}
