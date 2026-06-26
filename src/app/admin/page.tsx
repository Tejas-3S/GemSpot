"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { Trash2, Eye, Shield, Users, Gem, Flag } from "lucide-react";

// 🔒 Add your Gmail here — only you can access admin
import { isAdmin } from "@/config/app.config";

interface Gem {
  id: string;
  placeName: string;
  itemName: string;
  postedBy: string;
  upvotes: number;
  isVerified: boolean;
  createdAt: any;
  imageUrl?: string;
}

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [gems, setGems] = useState<Gem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<"gems" | "stats">("gems");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
        return;
      }
      if (!isAdmin(user.email)) {
        router.push("/home");
        return;
      }
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
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
    setLoadingData(false);
  };

  const handleDeleteGem = async (gemId: string) => {
    if (!confirm("Are you sure you want to delete this gem?")) return;
    setDeleting(gemId);
    try {
      await deleteDoc(doc(db, "gems", gemId));
      setGems((prev) => prev.filter((g) => g.id !== gemId));
    } catch (e) {
      alert("Failed to delete gem!");
    }
    setDeleting(null);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400 text-xl">Loading admin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-red-900 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-red-400" />
            <h1 className="text-white font-bold text-xl">Admin Dashboard</h1>
          </div>
          <button
            onClick={() => router.push("/home")}
            className="text-slate-400 text-sm"
          >
            ← Back to App
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">{gems.length}</p>
            <p className="text-slate-400 text-xs mt-1">Total Gems</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">
              {gems.filter((g) => g.isVerified).length}
            </p>
            <p className="text-slate-400 text-xs mt-1">Verified</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">
              {gems.reduce((a, b) => a + (b.upvotes || 0), 0)}
            </p>
            <p className="text-slate-400 text-xs mt-1">Total Upvotes</p>
          </div>
        </div>

        {/* Gems List */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Gem size={18} className="text-teal-400" />
              All Gems
            </h2>
            <span className="text-slate-400 text-sm">{gems.length} total</span>
          </div>

          {gems.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-slate-400">No gems posted yet</p>
            </div>
          )}

          <div className="divide-y divide-slate-700">
            {gems.map((gem) => (
              <div
                key={gem.id}
                className="px-4 py-3 flex items-center gap-3"
              >
                {/* Image thumbnail */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                  {gem.imageUrl ? (
                    <img
                      src={gem.imageUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs">
                      by {gem.postedBy}
                    </span>
                    {gem.isVerified && (
                      <span className="text-teal-400 text-xs">✓ Verified</span>
                    )}
                    <span className="text-slate-500 text-xs">
                      👍 {gem.upvotes}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/gem/${gem.id}`)}
                    className="p-2 bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteGem(gem.id)}
                    disabled={deleting === gem.id}
                    className="p-2 bg-red-900 rounded-xl text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}