"use client";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useUserContext } from "@/context/UserContext";
import { Search, Bell } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  orderBy,
  query,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  where,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import GemCard from "@/components/GemCard";
import SkeletonCard from "@/components/SkeletonCard";
import ErrorMessage from "@/components/ErrorMessage";


interface Gem {
  id: string;
  placeName: string;
  itemName: string;
  price: string;
  bestTime: string;
  insiderTip: string;
  postedBy: string;
  upvotes: number;
  vibeRating: number;
  isVerified: boolean;
  imageUrl?: string;
  createdAt: any;
}

const PAGE_SIZE = 10;

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [gems, setGems] = useState<Gem[]>([]);
  const [loadingGems, setLoadingGems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "trending">("new");
  const [error, setError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { profile } = useUserContext();
  const { isPulling, pullDistance } = usePullToRefresh(() => fetchGems(true));

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && profile !== undefined) {
      setGems([]);
      setLastDoc(null);
      setHasMore(true);
      fetchGems(true);
    }
  }, [user, activeTab, profile?.city]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchGems(true);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchGems = async (fresh = false) => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setLoadingGems(false);
      return;
    }

    fresh ? setLoadingGems(true) : setLoadingMore(true);
    setError(false);

    try {
      const orderField = activeTab === "trending" ? "upvotes" : "createdAt";

      // Build query — filter by city if user has one
      let baseQuery;
      if (profile?.city) {
        baseQuery = query(
          collection(db, "gems"),
          where("city", "==", profile.city),
          orderBy(orderField, "desc"),
          limit(PAGE_SIZE)
        );
      } else {
        baseQuery = query(
          collection(db, "gems"),
          orderBy(orderField, "desc"),
          limit(PAGE_SIZE)
        );
      }

      if (!fresh && lastDoc) {
        if (profile?.city) {
          baseQuery = query(
            collection(db, "gems"),
            where("city", "==", profile.city),
            orderBy(orderField, "desc"),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
          );
        } else {
          baseQuery = query(
            collection(db, "gems"),
            orderBy(orderField, "desc"),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
          );
        }
      }

      const snapshot = await getDocs(baseQuery);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Gem[];

      if (fresh) {
        setGems(data);
      } else {
        setGems((prev) => [...prev, ...data]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setError(true);
    }

    fresh ? setLoadingGems(false) : setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">

    {/* Pull to Refresh Indicator */}
    {pullDistance > 0 && (
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: `${pullDistance}px` }}
      >
        <div className={`text-teal-400 text-sm flex items-center gap-2 ${isPulling ? "opacity-100" : "opacity-50"}`}>
          {isPulling ? "↓ Release to refresh" : "↓ Pull to refresh"}
        </div>
      </div>
    )}

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-white font-bold text-xl">💎 GemSpot</h1>
            <p className="text-slate-400 text-xs">
  {profile?.city ? `📍 ${profile.city}` : "📍 Set your city in profile"}
</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/search")}
              className="text-slate-400"
            >
              <Search size={22} />
            </button>
            <button
              onClick={() => router.push("/notifications")}
              className="text-slate-400"
            >
              <Bell size={22} />
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-teal-400">
              {(profile?.photo || user?.photoURL) && (
                <img
                  src={profile?.photo || user?.photoURL || ""}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-lg mx-auto">

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "new", label: "New" },
            { key: "trending", label: "Trending" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skeleton Loading */}
        {loadingGems && (
          <div>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Offline */}
        {!loadingGems && !isOnline && (
          <ErrorMessage type="network" onRetry={() => fetchGems(true)} />
        )}

        {/* Error */}
        {!loadingGems && error && isOnline && (
          <ErrorMessage
            type="general"
            message="Failed to load gems"
            onRetry={() => fetchGems(true)}
          />
        )}

        {/* Empty */}
        {!loadingGems && !error && isOnline && gems.length === 0 && (
          <ErrorMessage
            type="empty"
            message="Be the first to post a gem!"
            onRetry={() => router.push("/post")}
          />
        )}

        {/* Gem Cards */}
        {!loadingGems && gems.map((gem) => (
          <div
            key={gem.id}
            onClick={() => router.push(`/gem/${gem.id}`)}
            className="cursor-pointer"
          >
            <GemCard {...gem} />
          </div>
        ))}

        {/* Load More Button */}
        {!loadingGems && hasMore && gems.length > 0 && (
          <button
            onClick={() => fetchGems(false)}
            disabled={loadingMore}
            className="w-full py-3 text-teal-400 text-sm font-semibold disabled:text-slate-600"
          >
            {loadingMore ? "Loading more..." : "Load more gems ↓"}
          </button>
        )}

        {/* End of Feed */}
        {!loadingGems && !hasMore && gems.length > 0 && (
          <p className="text-center text-slate-600 text-sm py-4">
            You've seen all gems! 💎
          </p>
        )}

        <div className="h-24" />
      </div>

      <BottomNav />
    </div>
  );
}