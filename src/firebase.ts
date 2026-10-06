import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBqdAxaPtJ3v49fw9-QBlumQbUhlsctrIU",
  authDomain: "glalphaloan.firebaseapp.com",
  projectId: "glalphaloan",
  storageBucket: "glalphaloan.firebasestorage.app",
  messagingSenderId: "682766231049",
  appId: "1:682766231049:web:11c38178d6da13c63f6ad8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
