import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  bio: string;
  city: string;
  joinedAt: any;
  savedGems: string[];
  collections: Collection[];
}

export interface Collection {
  id: string;
  name: string;
  gemIds: string[];
  createdAt: any;
}

export const createOrGetUser = async (firebaseUser: any): Promise<UserProfile> => {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // User already exists — return existing data
    return userSnap.data() as UserProfile;
  }

  // First time login — create new user document
  const newUser: UserProfile = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || "GemSpot User",
    email: firebaseUser.email || "",
    photo: firebaseUser.photoURL || "",
    bio: "",
    city: "",
    joinedAt: serverTimestamp(),
    savedGems: [],
    collections: [],
  };

  await setDoc(userRef, newUser);
  return newUser;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};