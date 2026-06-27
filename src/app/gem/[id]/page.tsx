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
  Share2,
  Bookmark,
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
  imageUrl?: string;
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
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (user && gem) checkIfSaved();
  }, [user, gem]);

  const checkIfSaved = async () => {
    if (!user || !gem) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const savedGems = userSnap.data().savedGems || [];
        setSaved(savedGems.includes(gem.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleSave = async () => {
    if (!user || !gem) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      if (saved) {
        await updateDoc(userRef, {
          savedGems: arrayRemove(gem.id),
        });
        setSaved(false);
      } else {
        await updateDoc(userRef, {
          savedGems: arrayUnion(gem.id),
        });
        setSaved(true);
      }
    } catch (e) {
      alert("Failed to save gem. Try again!");
    }
    setSaving(false);
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
    if (!gem) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gem.location.lat},${gem.location.lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  const handleShare = async () => {
    if (!gem) return;
    const url = `${window.location.origin}/gem/${gem.id}`;
    const shareData = {
      title: `${gem.itemName} at ${gem.placeName}`,
      text: `Check out ${gem.itemName} at ${gem.placeName} on GemSpot! ${gem.price} — ${gem.bestTime}`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard! 📋");
      }
    } catch (e) {
      console.error(e);
    }
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
          {/* Image */}
<div className="w-full h-48 bg-slate-700 relative overflow-hidden">
  {gem.imageUrl ? (
    <>
      {/* Skeleton while loading */}
      {imageLoading && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse flex items-center justify-center">
          <span className="text-4xl opacity-30">💎</span>
        </div>
      )}
      <img
        src={gem.imageUrl}
        alt={gem.itemName}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => setImageLoading(false)}
        loading="lazy"
      />
    </>
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-teal-900 to-slate-800 flex items-center justify-center">
      <span className="text-7xl">💎</span>
    </div>
  )}
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

        {/* Upvote, Directions, Share & Save */}
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
              <span>{gem.upvotes}</span>
            </button>

            <button
              onClick={handleDirections}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 border border-slate-600 text-slate-300 py-3 rounded-2xl font-semibold"
            >
              <Navigation size={18} className="text-teal-400" />
              <span>Go</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 border border-slate-600 text-slate-300 py-3 rounded-2xl font-semibold"
            >
              <Share2 size={18} className="text-blue-400" />
              <span>Share</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition-colors ${
                saved
                  ? "bg-yellow-600 text-white"
                  : "bg-slate-800 text-slate-300 border border-slate-600"
              }`}
            >
              <Bookmark size={18} className={saved ? "text-white" : "text-yellow-400"} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
          </div>

        {/* Vibe Rating */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-1">Rate the Vibe</h3>
          <p className="text-slate-400 text-xs mb-4">
            {gem.vibeCount > 0
              ? `${gem.vibeCount} people rated this gem`
              : "Be the first to rate this gem!"}
          </p>

          {/* Show options if not rated yet */}
          {!userVibe ? (
            <div className="space-y-2">
              {VIBE_OPTIONS.map((vibe) => (
                <button
                  key={vibe.score}
                  onClick={() => handleVibeRating(vibe.score)}
                  disabled={rating}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all active:scale-95"
                >
                  <span className="text-xl">{vibe.icon}</span>
                  <span className="font-semibold">{vibe.label}</span>
                </button>
              ))}
            </div>
          ) : (
            /* Show distribution bar after rating */
            <div className="space-y-3">
              {VIBE_OPTIONS.map((vibe) => {
                const count = Object.values(gem.vibeRatings || {}).filter(
                  (r) => r === vibe.score
                ).length;
                const total = gem.vibeCount || 1;
                const percent = Math.round((count / total) * 100);
                const isSelected = userVibe === vibe.score;

                return (
                  <div
                    key={vibe.score}
                    className={`rounded-xl px-4 py-3 transition-all ${
                      isSelected
                        ? "bg-teal-800 border border-teal-500"
                        : "bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{vibe.icon}</span>
                        <span
                          className={`text-sm font-semibold ${
                            isSelected ? "text-teal-300" : "text-slate-300"
                          }`}
                        >
                          {vibe.label}
                        </span>
                        {isSelected && (
                          <span className="text-teal-400 text-xs">✓ Your rating</span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? "text-teal-300" : "text-slate-400"
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isSelected ? "bg-teal-400" : "bg-slate-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      {count} {count === 1 ? "vote" : "votes"}
                    </p>
                  </div>
                );
              })}

              {/* Change Rating Button */}
              <button
                onClick={() => {
                  if (gem && user) {
                    const newVibeRatings = { ...gem.vibeRatings };
                    delete newVibeRatings[user.uid];
                    setGem((prev) =>
                      prev
                        ? {
                            ...prev,
                            vibeRatings: newVibeRatings,
                            vibeCount: Math.max(0, prev.vibeCount - 1),
                          }
                        : prev
                    );
                  }
                }}
                className="w-full py-2.5 text-slate-400 text-sm font-semibold border border-slate-600 rounded-xl hover:border-teal-500 hover:text-teal-400 transition-colors"
              >
                Change Rating
              </button>
            </div>
          )}
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