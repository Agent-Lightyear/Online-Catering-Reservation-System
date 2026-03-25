
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOSM1Ic9OGgYcfDTVGhommb3j7kU5OOqU",
  authDomain: "online-catering-a49cb.firebaseapp.com",
  projectId: "online-catering-a49cb",
  storageBucket: "online-catering-a49cb.appspot.com",
  messagingSenderId: "359317614075",
  appId: "1:359317614075:web:eb320ef8c98d6033cd6f5e",
  measurementId: "G-K7FFSER6M2"
};

// Initialize Firebase and export auth + db for other modules
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);