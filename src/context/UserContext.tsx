"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createOrGetUser, UserProfile } from "@/lib/userUtils";

interface UserContextType {
  profile: UserProfile | null;
  loadingProfile: boolean;
  refreshProfile: () => void;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  loadingProfile: true,
  refreshProfile: () => {},
});

export const useUserContext = () => useContext(UserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, loadingAuth] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    // Create user if first time
    createOrGetUser(user);

    // Real-time listener on user document
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
        setLoadingProfile(false);
      },
      (error) => {
        console.error("User snapshot error:", error);
        setLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const refreshProfile = () => {
    if (!user) return;
    setLoadingProfile(true);
  };

  return (
    <UserContext.Provider value={{ profile, loadingProfile, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}