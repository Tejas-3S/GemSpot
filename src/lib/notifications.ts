import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Notification {
  id: string;
  userId: string;
  type: "upvote" | "rating" | "verified" | "discoverer";
  message: string;
  gemId: string;
  gemName: string;
  read: boolean;
  createdAt: any;
}

export const createNotification = async (
  userId: string,
  type: Notification["type"],
  gemId: string,
  gemName: string,
  actorName: string
) => {
  if (!userId) return;

  const messages = {
    upvote: `${actorName} upvoted your gem "${gemName}" 👍`,
    rating: `${actorName} rated your gem "${gemName}" 💎`,
    verified: `Your gem "${gemName}" just got Verified! 🏅`,
    discoverer: `Your gem "${gemName}" unlocked a Discoverer tag! 🥇`,
  };

  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      message: messages[type],
      gemId,
      gemName,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
};

export const getUserNotifications = async (
  userId: string
): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const markAllRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async (document) => {
      await updateDoc(doc(db, "notifications", document.id), {
        read: true,
      });
    });
  } catch (e) {
    console.error(e);
  }
};