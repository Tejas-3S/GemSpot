"use client";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 text-center">

      {/* Icon */}
      <div className="w-32 h-32 bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-700 mb-6">
        <span className="text-7xl">💎</span>
      </div>

      {/* Text */}
      <h1 className="text-white font-bold text-3xl mb-2">
        Gem Not Found
      </h1>
      <p className="text-slate-400 text-base leading-relaxed max-w-xs mb-8">
        This gem doesn't exist or has been removed by the poster.
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => router.push("/home")}
          className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl text-lg"
        >
          Back to Home
        </button>
        <button
          onClick={() => router.push("/map")}
          className="w-full bg-slate-800 text-slate-300 font-semibold py-4 rounded-2xl border border-slate-700"
        >
          Explore Map 🗺️
        </button>
      </div>

    </div>
  );
}