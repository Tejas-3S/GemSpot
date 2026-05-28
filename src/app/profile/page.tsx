"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { MapPin, Clock, LogOut, Star, Award, Gem } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Gem {
  id: string;
  placeName: string;
  itemName: string;
  price: string;
  bestTime: string;
  upvotes: number;
  isVerified: boolean;
  createdAt: any;
}

const LEVELS = [
  { title: "Newcomer", icon: "🌱", min: 0, max: 50 },
  { title: "Local", icon: "📍", min: 51, max: 200 },
  { title: "Trusted Local", icon: "⭐", min: 201, max: 500 },
  { title: "Gem Hunter", icon: "🔭", min: 501, max: 1000 },
  { title: "Legend", icon: "🏆", min: 1001, max: Infinity },
];

const getLevel = (points: number) => {
  return (
    LEVELS.find((l) => points >= l.min && points <= l.max) || LEVELS[0]
  );
};

const getNextLevel = (points: number) => {
  const idx = LEVELS.findIndex((l) => points >= l.min && points <= l.max);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
};

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [gems, setGems] = useState<Gem[]>([]);
  const [points, setPoints] = useState(0);
  const [loadingGems, setLoadingGems] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchUserGems();
  }, [user]);

  const fetchUserGems = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "gems"),
        where("postedByUid", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Gem[];
      setGems(data);

      // Calculate points
      let total = 0;
      data.forEach((gem) => {
        total += 10; // posting
        total += gem.upvotes * 5;
        if (gem.isVerified) total += 25;
        if (gem.upvotes >= 20) total += 20;
        if (gem.upvotes >= 95) total += 50;
      });
      setPoints(total);
    } catch (e) {
      console.error(e);
    }
    setLoadingGems(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  const level = getLevel(points);
  const nextLevel = getNextLevel(points);
  const progressPercent = nextLevel
    ? ((points - level.min) / (nextLevel.min - level.min)) * 100
    : 100;

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
          <h1 className="text-white font-bold text-xl">👤 Profile</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-slate-400 text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Profile Card */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-400 shrink-0">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">
                {user?.displayName}
              </h2>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{level.icon}</span>
                <span className="text-teal-400 text-sm font-semibold">
                  {level.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Points & Level */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Gem Hunter Points</h3>
            <span className="text-yellow-400 font-bold text-lg">
              {points} pts
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
            <div
              className="bg-teal-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{level.icon} {level.title}</span>
            {nextLevel && (
              <span>{nextLevel.icon} {nextLevel.title} at {nextLevel.min} pts</span>
            )}
            {!nextLevel && (
              <span>🏆 Maximum Level Reached!</span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">{gems.length}</p>
            <p className="text-slate-400 text-xs mt-1">Gems Posted</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">
              {gems.reduce((a, b) => a + b.upvotes, 0)}
            </p>
            <p className="text-slate-400 text-xs mt-1">Total Upvotes</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">
              {gems.filter((g) => g.isVerified).length}
            </p>
            <p className="text-slate-400 text-xs mt-1">Verified Gems</p>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h3 className="text-white font-bold mb-4">🏅 Badges</h3>
          <div className="flex flex-wrap gap-3">
            {/* Founding Member — always show */}
            <div className="bg-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <div>
                <p className="text-white text-xs font-semibold">
                  Founding Member
                </p>
                <p className="text-slate-400 text-xs">Early believer</p>
              </div>
            </div>

            {/* First Gem Badge */}
            {gems.length >= 1 && (
              <div className="bg-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-xl">💎</span>
                <div>
                  <p className="text-white text-xs font-semibold">
                    First Gem
                  </p>
                  <p className="text-slate-400 text-xs">Posted first gem</p>
                </div>
              </div>
            )}

            {/* Verified Badge */}
            {gems.some((g) => g.isVerified) && (
              <div className="bg-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-white text-xs font-semibold">
                    Verified Poster
                  </p>
                  <p className="text-slate-400 text-xs">Got a verified gem</p>
                </div>
              </div>
            )}

            {/* First Finder Badge */}
            {gems.some((g) => g.upvotes >= 5) && (
              <div className="bg-yellow-900 border border-yellow-600 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-xl">🥇</span>
                <div>
                  <p className="text-yellow-400 text-xs font-semibold">
                    First Finder
                  </p>
                  <p className="text-yellow-600 text-xs">Gem hit 5 upvotes</p>
                </div>
              </div>
            )}

            {/* Legend Badge */}
            {gems.some((g) => g.upvotes >= 95) && (
              <div className="bg-yellow-900 border border-yellow-500 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-yellow-400 text-xs font-semibold">
                    Legendary Find
                  </p>
                  <p className="text-yellow-600 text-xs">95+ upvotes!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Gems */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h3 className="text-white font-bold mb-4">
            💎 My Gems ({gems.length})
          </h3>
          {loadingGems && (
            <p className="text-slate-400 text-sm">Loading your gems...</p>
          )}
          {!loadingGems && gems.length === 0 && (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-3">
                You haven't posted any gems yet!
              </p>
              <button
                onClick={() => router.push("/post")}
                className="bg-teal-600 text-white px-6 py-2 rounded-full text-sm font-semibold"
              >
                Post your first gem 💎
              </button>
            </div>
          )}
          <div className="space-y-3">
            {gems.map((gem) => (
              <button
                key={gem.id}
                onClick={() => router.push(`/gem/${gem.id}`)}
                className="w-full bg-slate-700 rounded-xl p-3 text-left hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">
                      {gem.itemName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-teal-400" />
                      <p className="text-teal-400 text-xs">{gem.placeName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className="text-yellow-400 text-xs font-semibold">
                      {gem.price}
                    </span>
                    <span className="text-slate-400 text-xs">
                      👍 {gem.upvotes}
                    </span>
                    {gem.isVerified && (
                      <span className="text-teal-400 text-xs">✓ Verified</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-24" />
      </div>

      <BottomNav />
    </div>
  );
}