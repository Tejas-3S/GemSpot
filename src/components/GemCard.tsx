"use client";
import { ThumbsUp, MapPin, Clock, BadgeCheck } from "lucide-react";

interface GemCardProps {
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
  discovererName?: string;
  discovererLevel?: number;
  imageUrl?: string;
}

export default function GemCard({
  placeName,
  itemName,
  price,
  bestTime,
  insiderTip,
  postedBy,
  upvotes,
  vibeRating,
  isVerified,
  discovererName,
  discovererLevel,
  imageUrl,
}: GemCardProps) {

  const getDiscovererTag = () => {
    if (!discovererName) return null;
    if (discovererLevel && discovererLevel >= 95)
      return `🏆 Legendary Find by ${discovererName}`;
    if (discovererLevel && discovererLevel >= 45)
      return `📍 ${discovererName}'s Discovery`;
    if (discovererLevel && discovererLevel >= 20)
      return `Discovered by @${discovererName}`;
    return null;
  };

  const getVibeLabel = () => {
    if (vibeRating >= 5) return { label: "Legendary", icon: "💎" };
    if (vibeRating >= 4) return { label: "Solid Gem", icon: "⭐" };
    if (vibeRating >= 3) return { label: "Decent", icon: "👍" };
    if (vibeRating >= 2) return { label: "Overhyped", icon: "😐" };
    return { label: "Skip It", icon: "❌" };
  };

  const vibe = getVibeLabel();
  const discovererTag = getDiscovererTag();

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden mb-4 border border-slate-700">

      {/* Image */}
      {imageUrl && (
        <div className="w-full h-48 bg-slate-700 overflow-hidden">
          <img
            src={imageUrl}
            alt={placeName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* No image placeholder */}
      {!imageUrl && (
        <div className="w-full h-32 bg-gradient-to-r from-teal-900 to-slate-800 flex items-center justify-center">
          <span className="text-5xl">💎</span>
        </div>
      )}

      <div className="p-4">

        {/* Discoverer Tag */}
        {discovererTag && (
          <div className="mb-2">
            <span className="text-xs text-yellow-400 font-medium">
              {discovererTag}
            </span>
          </div>
        )}

        {/* Place & Item */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg leading-tight">
              {itemName}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-teal-400" />
              <span className="text-teal-400 text-sm">{placeName}</span>
              {isVerified && (
                <BadgeCheck size={14} className="text-teal-400 ml-1" />
              )}
            </div>
          </div>
          <div className="bg-slate-700 px-3 py-1 rounded-full">
            <span className="text-yellow-400 text-sm font-semibold">
              {price}
            </span>
          </div>
        </div>

        {/* Best Time */}
        <div className="flex items-center gap-1 mt-2">
          <Clock size={12} className="text-slate-400" />
          <span className="text-slate-400 text-xs">{bestTime}</span>
        </div>

        {/* Insider Tip */}
        {insiderTip && (
          <div className="mt-3 bg-slate-700 rounded-xl px-3 py-2">
            <p className="text-slate-300 text-xs leading-relaxed">
              💡 {insiderTip}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">by {postedBy}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Vibe */}
            <span className="text-xs text-slate-400">
              {vibe.icon} {vibe.label}
            </span>
            {/* Upvote */}
            <button className="flex items-center gap-1 bg-slate-700 hover:bg-teal-700 px-3 py-1 rounded-full transition-colors active:scale-95">
              <ThumbsUp size={14} className="text-teal-400" />
              <span className="text-teal-400 text-sm font-semibold">
                {upvotes}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}