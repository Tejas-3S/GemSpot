"use client";
import { isAdmin } from "@/config/app.config";
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
import {
  MapPin,
  LogOut,
  Settings,
  Bell,
  ChevronRight,
  Gem,
  ThumbsUp,
  BadgeCheck,
  Edit,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useUserContext } from "@/context/UserContext";

interface GemItem {
  id: string;
  placeName: string;
  itemName: string;
  price: string;
  upvotes: number;
  isVerified: boolean;
  imageUrl?: string;
  createdAt: any;
}

const LEVELS = [
  { title: "Newcomer", icon: "🌱", min: 0, max: 50 },
  { title: "Local", icon: "📍", min: 51, max: 200 },
  { title: "Trusted Local", icon: "⭐", min: 201, max: 500 },
  { title: "Gem Hunter", icon: "🔭", min: 501, max: 1000 },
  { title: "Legend", icon: "🏆", min: 1001, max: Infinity },
];

const getLevel = (points: number) =>
  LEVELS.find((l) => points >= l.min && points <= l.max) || LEVELS[0];

const getNextLevel = (points: number) => {
  const idx = LEVELS.findIndex((l) => points >= l.min && points <= l.max);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
};

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const { profile, loadingProfile } = useUserContext();
  const router = useRouter();
  const [gems, setGems] = useState<GemItem[]>([]);
  const [points, setPoints] = useState(0);
  const [loadingGems, setLoadingGems] = useState(true);
  const [activeTab, setActiveTab] = useState<"gems" | "badges">("gems");

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
      })) as GemItem[];
      setGems(data);

      let total = 0;
      data.forEach((gem) => {
        total += 10;
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

  const displayPhoto = profile?.photo || user?.photoURL;
  const displayName = profile?.name || user?.displayName;

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-white font-bold text-xl">👤 Profile</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/notifications")}
              className="text-slate-400"
            >
              <Bell size={20} />
            </button>
            <button
              onClick={() => router.push("/edit-profile")}
              className="text-slate-400"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={handleSignOut}
              className="text-slate-400"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Profile Card */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-teal-400 shrink-0">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-xl">
                {displayName}
              </h2>
              {profile?.bio && (
                <p className="text-slate-400 text-sm mt-1">
                  {profile.bio}
                </p>
              )}
              {profile?.city && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-teal-400" />
                  <span className="text-teal-400 text-sm">
                    {profile.city}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{level.icon}</span>
                <span className="text-teal-400 text-sm font-semibold">
                  {level.title}
                </span>
              </div>
              {profile?.joinedAt?.toDate && (
                <p className="text-slate-500 text-xs mt-1">
                  Joined{" "}
                  {new Date(profile.joinedAt.toDate()).toLocaleDateString(
                    "en-IN",
                    { month: "long", year: "numeric" }
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Points & Level Progress */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold text-sm">
              Gem Hunter Points
            </span>
            <span className="text-yellow-400 font-bold">{points} pts</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2">
            <div
              className="bg-teal-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{level.icon} {level.title}</span>
            {nextLevel ? (
              <span>{nextLevel.icon} {nextLevel.title} at {nextLevel.min} pts</span>
            ) : (
              <span>🏆 Max Level!</span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">{gems.length}</p>
            <p className="text-slate-400 text-xs mt-1">Gems</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">
              {gems.reduce((a, b) => a + b.upvotes, 0)}
            </p>
            <p className="text-slate-400 text-xs mt-1">Upvotes</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">
              {gems.filter((g) => g.isVerified).length}
            </p>
            <p className="text-slate-400 text-xs mt-1">Verified</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "gems", label: "💎 My Gems" },
            { key: "badges", label: "🏅 Badges" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* My Gems Tab */}
        {activeTab === "gems" && (
          <div className="space-y-3">
            {loadingGems && (
              <p className="text-slate-400 text-sm text-center py-4">
                Loading gems...
              </p>
            )}
            {!loadingGems && gems.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm mb-3">
                  No gems posted yet!
                </p>
                <button
                  onClick={() => router.push("/post")}
                  className="bg-teal-600 text-white px-6 py-2 rounded-full text-sm font-semibold"
                >
                  Post your first gem 💎
                </button>
              </div>
            )}
            {gems.map((gem) => (
              <div
                key={gem.id}
                className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => router.push(`/gem/${gem.id}`)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                    {gem.imageUrl ? (
                      <img
                        src={gem.imageUrl}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        💎
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {gem.itemName}
                    </p>
                    <p className="text-teal-400 text-xs truncate">
                      {gem.placeName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-400 text-xs">
                        👍 {gem.upvotes}
                      </span>
                      {gem.isVerified && (
                        <span className="text-teal-400 text-xs">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-slate-600 shrink-0" />
                </button>

                {/* Action Buttons */}
                <div className="flex border-t border-slate-700">
                  <button
                    onClick={() => router.push(`/edit-gem/${gem.id}`)}
                    className="flex-1 py-2 text-slate-400 text-xs font-semibold hover:text-teal-400 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <div className="w-px bg-slate-700" />
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/gem/${gem.id}`;
                      navigator.share
                        ? navigator.share({
                            title: gem.itemName,
                            text: `Check out ${gem.itemName} at ${gem.placeName} on GemSpot!`,
                            url,
                          })
                        : navigator.clipboard.writeText(url).then(() =>
                            alert("Link copied!")
                          );
                    }}
                    className="flex-1 py-2 text-slate-400 text-xs font-semibold hover:text-blue-400 transition-colors"
                  >
                    📤 Share
                  </button>
                  <div className="w-px bg-slate-700" />
                  <button
                    onClick={() => router.push(`/gem/${gem.id}`)}
                    className="flex-1 py-2 text-slate-400 text-xs font-semibold hover:text-red-400 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === "badges" && (
          <div className="grid grid-cols-2 gap-3">
            {/* Founding Member */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">🌟</span>
              <p className="text-white text-sm font-semibold">Founding Member</p>
              <p className="text-slate-400 text-xs">Early believer</p>
            </div>

            {gems.length >= 1 && (
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">💎</span>
                <p className="text-white text-sm font-semibold">First Gem</p>
                <p className="text-slate-400 text-xs">Posted first gem</p>
              </div>
            )}

            {gems.some((g) => g.isVerified) && (
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">✅</span>
                <p className="text-white text-sm font-semibold">Verified Poster</p>
                <p className="text-slate-400 text-xs">Got a verified gem</p>
              </div>
            )}

            {gems.some((g) => g.upvotes >= 5) && (
              <div className="bg-yellow-900 border border-yellow-600 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">🥇</span>
                <p className="text-yellow-400 text-sm font-semibold">First Finder</p>
                <p className="text-yellow-600 text-xs">Gem hit 5 upvotes</p>
              </div>
            )}

            {gems.some((g) => g.upvotes >= 95) && (
              <div className="bg-yellow-900 border border-yellow-500 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">🏆</span>
                <p className="text-yellow-400 text-sm font-semibold">Legendary Find</p>
                <p className="text-yellow-600 text-xs">95+ upvotes!</p>
              </div>
            )}
          </div>
        )}

        {/* Admin Button */}
        {isAdmin(user?.email) && (
          <button
            onClick={() => router.push("/admin")}
            className="w-full bg-red-900 border border-red-700 text-red-400 py-3 rounded-2xl text-sm font-semibold"
          >
            🛡️ Admin Dashboard
          </button>
        )}

        <div className="h-24" />
      </div>

      <BottomNav />
    </div>
  );
}