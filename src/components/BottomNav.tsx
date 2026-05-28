"use client";
import { Home, Map, PlusCircle, Trophy, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Map, label: "Map", path: "/map" },
    { icon: PlusCircle, label: "Post", path: "/post" },
    { icon: Trophy, label: "Ranks", path: "/leaderboard" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? "text-teal-400"
                  : "text-slate-500 active:text-slate-300"
              }`}
            >
              <tab.icon
                size={24}
                className={isActive ? "text-teal-400" : "text-slate-500"}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-teal-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}