"use client";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-24 h-24 bg-teal-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-5xl">💎</span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          GemSpot
        </h1>
        <p className="text-teal-400 mt-2 text-center text-sm">
          Real places. Real locals. Real tips.
        </p>
      </div>

      {/* Tagline */}
      <div className="mb-12 text-center">
        <p className="text-slate-400 text-base leading-relaxed max-w-xs">
          Discover hidden gems in your city, shared by people who actually live there.
        </p>
      </div>

      {/* Login Button */}
      <button
        onClick={handleGoogleLogin}
        className="w-full max-w-xs bg-white text-slate-800 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Footer */}
      <p className="text-slate-600 text-xs mt-8 text-center max-w-xs">
        By continuing you agree to our Terms of Service and Privacy Policy
      </p>

    </div>
  );
}