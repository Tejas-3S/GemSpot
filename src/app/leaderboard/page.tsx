"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";

interface UserStat {
  uid: string;
  name: string;
  photo: string;
  points: number;
  gemsCount: number;
  totalUpvotes: number;
  verifiedCount: number;
  level: string;
  levelIcon: string;
}

const LEVELS = [
  { title: "Newcomer", icon: "🌱", min: 0, max: 50 },
  { title: "Local", icon: "📍", min: 51, max: 200 },
  { title: "Trusted Local", icon: "⭐", min: 201, max: 500 },
  { title: "Gem Hunter", icon: "🔭", min: 501, max: 1000 },
  { title: "Legend", icon: "🏆", min: 1001, max: Infinity },
];

const getLevel = (points: number) => {
  return LEVELS.find((l) => points >= l.min && points <= l.max) || LEVELS[0];
};

export default function LeaderboardPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [leaders, setLeaders] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"points" | "gems" | "upvotes">("points");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const snapshot = await getDocs(collection(db, "gems"));
      const gems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Group by user
      const userMap: { [uid: string]: UserStat } = {};

      gems.forEach((gem) => {
        if (!gem.postedByUid) return;
        if (!userMap[gem.postedByUid]) {
          userMap[gem.postedByUid] = {
            uid: gem.postedByUid,
            name: gem.postedBy || "Anonymous",
            photo: gem.postedByPhoto || "",
            points: 0,
            gemsCount: 0,
            totalUpvotes: 0,
            verifiedCount: 0,
            level: "",
            levelIcon: "",
          };
        }
        const u = userMap[gem.postedByUid];
        u.gemsCount += 1;
        u.totalUpvotes += gem.upvotes || 0;
        u.points += 10;
        u.points += (gem.upvotes || 0) * 5;
        if (gem.isVerified) {
          u.verifiedCount += 1;
          u.points += 25;
        }
        if ((gem.upvotes || 0) >= 20) u.points += 20;
        if ((gem.upvotes || 0) >= 95) u.points += 50;
      });

      const sorted = Object.values(userMap).map((u) => {
        const level = getLevel(u.points);
        return { ...u, level: level.title, levelIcon: level.icon };
      });

      setLeaders(sorted);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getSorted = () => {
    if (activeTab === "points")
      return [...leaders].sort((a, b) => b.points - a.points);
    if (activeTab === "gems")
      return [...leaders].sort((a, b) => b.gemsCount - a.gemsCount);
    return [...leaders].sort((a, b) => b.totalUpvotes - a.totalUpvotes);
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const sorted = getSorted();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400 text-xl">Loading ranks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-white font-bold text-xl">🏆 Leaderboard</h1>
          <p className="text-slate-400 text-xs">Top Gem Hunters in your city</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "points", label: "⭐ Points" },
            { key: "gems", label: "💎 Gems" },
            { key: "upvotes", label: "👍 Upvotes" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {sorted.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-8 px-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-400 mb-2">
                {sorted[1].photo ? (
                  <img src={sorted[1].photo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-600 flex items-center justify-center text-white font-bold">
                    {sorted[1].name[0]}
                  </div>
                )}
              </div>
              <p className="text-slate-300 text-xs font-semibold text-center truncate w-full">
                {sorted[1].name.split(" ")[0]}
              </p>
              <p className="text-slate-400 text-xs">{sorted[1].levelIcon}</p>
              <div className="w-full bg-slate-600 rounded-t-xl mt-2 flex items-center justify-center py-3">
                <span className="text-2xl">🥈</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400 mb-2">
                {sorted[0].photo ? (
                  <img src={sorted[0].photo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-600 flex items-center justify-center text-white font-bold">
                    {sorted[0].name[0]}
                  </div>
                )}
              </div>
              <p className="text-yellow-400 text-xs font-bold text-center truncate w-full">
                {sorted[0].name.split(" ")[0]}
              </p>
              <p className="text-slate-400 text-xs">{sorted[0].levelIcon}</p>
              <div className="w-full bg-yellow-600 rounded-t-xl mt-2 flex items-center justify-center py-5">
                <span className="text-2xl">🥇</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-700 mb-2">
                {sorted[2].photo ? (
                  <img src={sorted[2].photo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-600 flex items-center justify-center text-white font-bold">
                    {sorted[2].name[0]}
                  </div>
                )}
              </div>
              <p className="text-slate-300 text-xs font-semibold text-center truncate w-full">
                {sorted[2].name.split(" ")[0]}
              </p>
              <p className="text-slate-400 text-xs">{sorted[2].levelIcon}</p>
              <div className="w-full bg-orange-800 rounded-t-xl mt-2 flex items-center justify-center py-2">
                <span className="text-2xl">🥉</span>
              </div>
            </div>
          </div>
        )}

        {/* Full List */}
        <div className="space-y-3">
          {sorted.map((leader, index) => {
            const isCurrentUser = leader.uid === user?.uid;
            return (
              <div
                key={leader.uid}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                  isCurrentUser
                    ? "bg-teal-900 border-teal-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  <span className={`font-bold ${index < 3 ? "text-xl" : "text-slate-400 text-sm"}`}>
                    {getRankEmoji(index)}
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 shrink-0">
                  {leader.photo ? (
                    <img src={leader.photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm">
                      {leader.name[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className={`font-semibold text-sm truncate ${isCurrentUser ? "text-teal-300" : "text-white"}`}>
                      {leader.name}
                      {isCurrentUser && " (You)"}
                    </p>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {leader.levelIcon} {leader.level}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="text-yellow-400 font-bold text-sm">
                    {activeTab === "points" && `${leader.points} pts`}
                    {activeTab === "gems" && `${leader.gemsCount} 💎`}
                    {activeTab === "upvotes" && `${leader.totalUpvotes} 👍`}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {activeTab === "points" && `${leader.gemsCount} gems`}
                    {activeTab === "gems" && `${leader.points} pts`}
                    {activeTab === "upvotes" && `${leader.gemsCount} gems`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 space-y-3">
            <span className="text-5xl">🏆</span>
            <p className="text-slate-400 text-center">
              No gems posted yet!
            </p>
            <button
              onClick={() => router.push("/post")}
              className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-semibold"
            >
              Be the first! Post a Gem 💎
            </button>
          </div>
        )}

        <div className="h-24" />
      </div>

      <BottomNav />
    </div>
  );
}