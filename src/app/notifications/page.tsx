"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  getUserNotifications,
  markAllRead,
  Notification,
} from "@/lib/notifications";
import { ArrowLeft, Bell } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const NOTIFICATION_ICONS = {
  upvote: "👍",
  rating: "💎",
  verified: "🏅",
  discoverer: "🥇",
};

export default function NotificationsPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const data = await getUserNotifications(user.uid);
    setNotifications(data);
    await markAllRead(user.uid);
    setLoading(false);
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp?.toDate) return "Just now";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => router.back()} className="text-slate-400">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-bold text-lg">🔔 Activity</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center pt-20">
            <p className="text-teal-400">Loading activity...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 space-y-4">
            <Bell size={48} className="text-slate-600" />
            <p className="text-slate-400 text-center">
              No activity yet!
            </p>
            <p className="text-slate-500 text-sm text-center">
              Post gems and get upvotes to see activity here
            </p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => router.push(`/gem/${notif.gemId}`)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-colors ${
                  !notif.read
                    ? "bg-teal-900 border border-teal-700"
                    : "bg-slate-800 border border-slate-700"
                }`}
              >
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0 text-xl">
                  {NOTIFICATION_ICONS[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {getTimeAgo(notif.createdAt)}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 bg-teal-400 rounded-full shrink-0 mt-1" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="h-24" />
      </div>

      <BottomNav />
    </div>
  );
}