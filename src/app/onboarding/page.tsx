"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, updateDoc } from "firebase/firestore";
import CitySearch from "@/components/CitySearch";

const SLIDES = [
  {
    emoji: "💎",
    title: "Welcome to GemSpot!",
    description:
      "Discover hidden gems in your city shared by real locals — not paid reviewers.",
  },
  {
    emoji: "📍",
    title: "Find Hidden Gems",
    description:
      "Not just the place — the exact item to order, the best time to go, and insider tips.",
  },
  {
    emoji: "🥇",
    title: "Share Your Discoveries",
    description:
      "Post a gem and earn points. Hit 5 upvotes and get your name on it forever!",
  },
  {
    emoji: "🏙️",
    title: "Set Your City",
    description:
      "Tell us where you are so we can show you the most relevant gems near you!",
    hasCity: true,
  },
];

export default function OnboardingPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCity, setSelectedCity] = useState("");

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          onboardingDone: true,
          ...(selectedCity && { city: selectedCity }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    router.push("/home");
  };

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-between px-6 py-12">

      {/* Skip button */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleFinish}
          className="text-slate-500 text-sm"
        >
          Skip
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex flex-col items-center text-center space-y-6 flex-1 justify-center w-full max-w-xs">
        <div className="w-32 h-32 bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-700">
          <span className="text-7xl">{slide.emoji}</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-white font-bold text-2xl leading-tight">
            {slide.title}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* City Search on last slide */}
        {slide.hasCity && (
          <div className="w-full mt-4">
            <CitySearch
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              placeholder="Search your city eg. Karad, Pune..."
            />
            {!selectedCity && (
              <p className="text-slate-500 text-xs mt-2 text-center">
                You can also set this later in your profile
              </p>
            )}
          </div>
        )}
      </div>

      {/* Dots */}
      <div className="flex gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`rounded-full transition-all ${
              i === currentSlide
                ? "w-6 h-2 bg-teal-400"
                : "w-2 h-2 bg-slate-600"
            }`}
          />
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="w-full max-w-xs bg-teal-600 text-white font-bold py-4 rounded-2xl text-lg"
      >
        {isLastSlide ? "Start Exploring! 🚀" : "Next →"}
      </button>

    </div>
  );
}