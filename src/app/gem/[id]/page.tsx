"use client";
import { createNotification } from "@/lib/notifications";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  MapPin,
  Clock,
  ThumbsUp,
  Navigation,
  Flag,
  BadgeCheck,
  ArrowLeft,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Gem {
  id: string;
  placeName: string;
  itemName: string;
  price: string;
  bestTime: string;
  insiderTip: string;
  postedBy: string;
  postedByUid: string;
  upvotes: number;
  upvotedBy: string[];
  vibeRating: number;
  vibeCount: number;
  vibeRatings: { [uid: string]: number };
  isVerified: boolean;
  location: { lat: number; lng: number };
  locationName: string;
  createdAt: any;
}

const VIBE_OPTIONS = [
  { score: 5, label: "Legendary", icon: "💎", color: "bg-yellow-500" },
  { score: 4, label: "Solid Gem", icon: "⭐", color: "bg-teal-500" },
  { score: 3, label: "Decent", icon: "👍", color: "bg-blue-500" },
  { score: 2, label: "Overhyped", icon: "😐", color: "bg-orange-500" },
  { score: 1, label: "Skip It", icon: "❌", color: "bg-red-500" },
];

export default function GemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [gem, setGem] = useState<Gem | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [rating, setRating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    fetchGem();
  }, [id]);

  const fetchGem = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, "gems", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setGem({ id: docSnap.id, ...docSnap.data() } as Gem);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpvote = async () => {
  if (!user || !gem || upvoting) return;
  setUpvoting(true);
  try {
    const gemRef = doc(db, "gems", gem.id);
    const alreadyUpvoted = gem.upvotedBy?.includes(user.uid);
    if (alreadyUpvoted) {
      await updateDoc(gemRef, {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(user.uid),
      });
      setGem((prev) =>
        prev
          ? {
              ...prev,
              upvotes: prev.upvotes - 1,
              upvotedBy: prev.upvotedBy.filter((u) => u !== user.uid),
            }
          : prev
      );
    } else {
      await updateDoc(gemRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(user.uid),
      });
      setGem((prev) =>
        prev
          ? {
              ...prev,
              upvotes: prev.upvotes + 1,
              upvotedBy: [...(prev.upvotedBy || []), user.uid],
            }
          : prev
      );

      // Send notification to gem owner (not to yourself)
      if (gem.postedByUid !== user.uid) {
        await createNotification(
          gem.postedByUid,
          "upvote",
          gem.id,
          gem.itemName,
          user.displayName || "Someone"
        );
      }

      // Check discoverer milestones
      const newUpvotes = gem.upvotes + 1;
      if ([5, 20, 45, 95].includes(newUpvotes) && gem.postedByUid !== user.uid) {
        await createNotification(
          gem.postedByUid,
          "discoverer",
          gem.id,
          gem.itemName,
          user.displayName || "Someone"
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
  setUpvoting(false);
};

  const handleVibeRating = async (score: number) => {
  if (!user || !gem || rating) return;
  setRating(true);
  try {
    const gemRef = doc(db, "gems", gem.id);
    const newVibeRatings = { ...gem.vibeRatings, [user.uid]: score };
    const ratings = Object.values(newVibeRatings) as number[];
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const isVerified = ratings.filter((r) => r >= 3).length >= 5;

    await updateDoc(gemRef, {
      [`vibeRatings.${user.uid}`]: score,
      vibeRating: avgRating,
      vibeCount: ratings.length,
      isVerified,
    });

    setGem((prev) =>
      prev
        ? {
            ...prev,
            vibeRatings: newVibeRatings,
            vibeRating: avgRating,
            vibeCount: ratings.length,
            isVerified,
          }
        : prev
    );

    // Send rating notification to gem owner
    if (gem.postedByUid !== user.uid) {
      await createNotification(
        gem.postedByUid,
        "rating",
        gem.id,
        gem.itemName,
        user.displayName || "Someone"
      );
    }

    // Send verified notification
    if (isVerified && !gem.isVerified && gem.postedByUid !== user.uid) {
      await createNotification(
        gem.postedByUid,
        "verified",
        gem.id,
        gem.itemName,
        user.displayName || "Someone"
      );
    }
  } catch (e) {
    console.error(e);
  }
  setRating(false);
};

  const handleDirections = () => {
    if (!gem?.location) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gem.location.lat},${gem.location.lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  const handleReport = async () => {
    if (!reportReason) {
      alert("Please select a reason!");
      return;
    }
    alert(`Report submitted! Our team will review this gem. Thank you!`);
    setShowReportModal(false);
    setReportReason("");
  };

  const getDiscovererTag = () => {
    if (!gem) return null;
    const upvotes = gem.upvotes;
    if (upvotes >= 95)
      return `🏆 Legendary Find by ${gem.postedBy}`;
    if (upvotes >= 45)
      return `📍 ${gem.postedBy}'s Discovery`;
    if (upvotes >= 20)
      return `Discovered by @${gem.postedBy}`;
    if (upvotes >= 5)
      return `🥇 First Finder`;
    return null;
  };

  const getUserVibe = () => {
    if (!user || !gem?.vibeRatings) return null;
    return gem.vibeRatings[user.uid] || null;
  };

  const hasUpvoted = gem?.upvotedBy?.includes(user?.uid || "");
  const discovererTag = getDiscovererTag();
  const userVibe = getUserVibe();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400 text-xl">Loading gem...</div>
      </div>
    );
  }

  if (!gem) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-xl">Gem not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="text-slate-400 flex items-center gap-1"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-lg">Gem Detail</h1>
          <button
            onClick={() => setShowReportModal(true)}
            className="text-slate-500"
          >
            <Flag size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Hero Card */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
          {/* Image placeholder */}
          <div className="w-full h-48 bg-gradient-to-br from-teal-900 to-slate-800 flex items-center justify-center">
            <span className="text-7xl">💎</span>
          </div>

          <div className="p-4">
            {/* Discoverer Tag */}
            {discovererTag && (
              <div className="mb-2">
                <span className="text-yellow-400 text-xs font-semibold">
                  {discovererTag}
                </span>
              </div>
            )}

            {/* Item & Place */}
            <h2 className="text-white font-bold text-2xl leading-tight">
              {gem.itemName}
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-teal-400" />
              <span className="text-teal-400 text-sm">{gem.placeName}</span>
              {gem.isVerified && (
                <BadgeCheck size={16} className="text-teal-400 ml-1" />
              )}
            </div>

            {/* Details Row */}
            <div className="flex gap-3 mt-3 flex-wrap">
              <span className="bg-slate-700 text-yellow-400 text-sm px-3 py-1 rounded-full font-semibold">
                {gem.price}
              </span>
              <span className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={12} />
                {gem.bestTime}
              </span>
            </div>

            {/* Insider Tip */}
            {gem.insiderTip && (
              <div className="mt-4 bg-slate-700 rounded-xl px-4 py-3">
                <p className="text-slate-300 text-sm leading-relaxed">
                  💡 {gem.insiderTip}
                </p>
              </div>
            )}

            {/* Posted by */}
            <p className="text-slate-500 text-xs mt-3">
              Posted by {gem.postedBy}
            </p>
          </div>
        </div>

        {/* Upvote & Directions */}
        <div className="flex gap-3">
          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition-colors ${
              hasUpvoted
                ? "bg-teal-600 text-white"
                : "bg-slate-800 text-slate-300 border border-slate-600"
            }`}
          >
            <ThumbsUp size={18} />
            <span>{gem.upvotes} Upvotes</span>
          </button>
          <button
            onClick={handleDirections}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 border border-slate-600 text-slate-300 py-3 rounded-2xl font-semibold"
          >
            <Navigation size={18} className="text-teal-400" />
            <span>Directions</span>
          </button>
        </div>

        {/* Vibe Rating */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-1">
            Rate the Vibe
          </h3>
          <p className="text-slate-400 text-xs mb-4">
            {gem.vibeCount > 0
              ? `${gem.vibeCount} people rated this gem`
              : "Be the first to rate this gem!"}
          </p>
          <div className="space-y-2">
            {VIBE_OPTIONS.map((vibe) => (
              <button
                key={vibe.score}
                onClick={() => handleVibeRating(vibe.score)}
                disabled={rating}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  userVibe === vibe.score
                    ? `${vibe.color} text-white`
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                <span className="text-xl">{vibe.icon}</span>
                <span className="font-semibold">{vibe.label}</span>
                {userVibe === vibe.score && (
                  <span className="ml-auto text-xs">Your rating ✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        {gem.locationName && (
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-2">📍 Location</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {gem.locationName}
            </p>
          </div>
        )}

        <div className="h-24" />
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-end">
          <div className="bg-slate-900 rounded-t-3xl w-full p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">Report this Gem</h2>
            <p className="text-slate-400 text-sm">
              Why are you reporting this gem?
            </p>
            {[
              "🔴 Place doesn't exist",
              "🟡 Wrong information",
              "🟠 Outdated / Closed down",
              "⚫ Spam or fake",
            ].map((reason) => (
              <button
                key={reason}
                onClick={() => setReportReason(reason)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                  reportReason === reason
                    ? "bg-teal-700 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {reason}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-slate-700 text-white py-3 rounded-2xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-semibold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}