import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDNwYz6T2PfxUloeReGFDKkmG130GJccmk",
  authDomain: "gemspot-9aa00.firebaseapp.com",
  projectId: "gemspot-9aa00",
  storageBucket: "gemspot-9aa00.firebasestorage.app",
  messagingSenderId: "957771254881",
  appId: "1:957771254881:web:d4a099655c15108f306e20"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);