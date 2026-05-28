"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import GemCard from "@/components/GemCard";
import { Search } from "lucide-react";

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

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [gems, setGems] = useState<Gem[]>([]);
  const [loadingGems, setLoadingGems] = useState(true);
  const [activeTab, setActiveTab] = useState<"nearby" | "trending" | "new">("new");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchGems();
  }, [user]);

  const fetchGems = async () => {
    try {
      const q = query(
        collection(db, "gems"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Gem[];
      setGems(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingGems(false);
  };

  const getFilteredGems = () => {
    if (activeTab === "trending") {
      return [...gems].sort((a, b) => b.upvotes - a.upvotes);
    }
    if (activeTab === "nearby") {
      return gems;
    }
    return gems;
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

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-white font-bold text-xl">💎 GemSpot</h1>
            <p className="text-slate-400 text-xs">Pune, Maharashtra</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/search")}
              className="text-slate-400"
            >
              <Search size={22} />
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-teal-400">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feed Tabs */}
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <div className="flex gap-2 mb-4">
          {[
            { key: "new", label: "New" },
            { key: "trending", label: "Trending" },
            { key: "nearby", label: "Near Me" },
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

        {/* Loading State */}
        {loadingGems && (
          <div className="flex justify-center py-20">
            <p className="text-teal-400">Loading gems...</p>
          </div>
        )}

        {/* Empty State */}
        {!loadingGems && gems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <span className="text-6xl">💎</span>
            <p className="text-slate-400 text-center">
              No gems yet in your area!
            </p>
            <button
              onClick={() => router.push("/post")}
              className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-semibold"
            >
              Post the first gem!
            </button>
          </div>
        )}

        {/* Gem Cards */}
        {!loadingGems && getFilteredGems().map((gem) => (
          <div
            key={gem.id}
            onClick={() => router.push(`/gem/${gem.id}`)}
            className="cursor-pointer"
          >
            <GemCard {...gem} />
          </div>
        ))}

        <div className="h-24" />
      </div>

      <BottomNav />
    </div>
  );
}