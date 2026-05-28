"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs } from "firebase/firestore";
import { Search, MapPin, Clock, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Gem {
  id: string;
  placeName: string;
  itemName: string;
  price: string;
  bestTime: string;
  insiderTip: string;
  postedBy: string;
  upvotes: number;
  isVerified: boolean;
}

export default function SearchPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Gem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const snapshot = await getDocs(collection(db, "gems"));
      const all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Gem[];

      const filtered = all.filter(
        (gem) =>
          gem.itemName?.toLowerCase().includes(query.toLowerCase()) ||
          gem.placeName?.toLowerCase().includes(query.toLowerCase()) ||
          gem.insiderTip?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-white font-bold text-xl mb-3">🔍 Search Gems</h1>
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search item or place..."
                className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-slate-500"
                autoFocus
              />
              {query && (
                <button onClick={clearSearch}>
                  <X size={16} className="text-slate-400" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="bg-teal-600 text-white px-4 rounded-2xl font-semibold text-sm"
            >
              {loading ? "..." : "Go"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Initial State */}
        {!searched && (
          <div className="flex flex-col items-center justify-center pt-20 space-y-4">
            <span className="text-6xl">🔍</span>
            <p className="text-slate-400 text-center text-sm leading-relaxed">
              Search for your favourite item or place.{"\n"}
              Try "chai", "vada pav", or "FC Road"
            </p>
            {/* Popular Searches */}
            <div className="w-full mt-4">
              <p className="text-slate-500 text-xs mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {["Chai", "Vada Pav", "Misal", "Biryani", "Ice Cream", "Burger"].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setQuery(tag);
                        setTimeout(() => handleSearch(), 100);
                      }}
                      className="bg-slate-800 border border-slate-600 text-slate-300 text-sm px-4 py-2 rounded-full"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center pt-20">
            <p className="text-teal-400">Searching gems...</p>
          </div>
        )}

        {/* No Results */}
        {searched && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 space-y-3">
            <span className="text-5xl">😕</span>
            <p className="text-slate-400 text-center">
              No gems found for "{query}"
            </p>
            <p className="text-slate-500 text-sm text-center">
              Be the first to post this gem!
            </p>
            <button
              onClick={() => router.push("/post")}
              className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-semibold mt-2"
            >
              Post a Gem 💎
            </button>
          </div>
        )}

        {/* Results */}
        {searched && !loading && results.length > 0 && (
          <div>
            <p className="text-slate-400 text-sm mb-4">
              {results.length} gem{results.length > 1 ? "s" : ""} found for "{query}"
            </p>
            <div className="space-y-3">
              {results.map((gem) => (
                <button
                  key={gem.id}
                  onClick={() => router.push(`/gem/${gem.id}`)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-left hover:border-teal-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-base">
                        {gem.itemName}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-teal-400" />
                        <span className="text-teal-400 text-sm">
                          {gem.placeName}
                        </span>
                        {gem.isVerified && (
                          <span className="text-teal-400 text-xs ml-1">✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={12} className="text-slate-500" />
                        <span className="text-slate-500 text-xs">
                          {gem.bestTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                      <span className="bg-slate-700 text-yellow-400 text-xs px-2 py-1 rounded-full font-semibold">
                        {gem.price}
                      </span>
                      <span className="text-slate-500 text-xs">
                        👍 {gem.upvotes}
                      </span>
                    </div>
                  </div>
                  {gem.insiderTip && (
                    <div className="mt-3 bg-slate-700 rounded-xl px-3 py-2">
                      <p className="text-slate-400 text-xs">
                        💡 {gem.insiderTip}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>

      <BottomNav />
    </div>
  );
}