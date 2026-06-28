"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useUserContext } from "@/context/UserContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Clock, Upload, ChevronDown, X, } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import LocationPicker from "@/components/LocationPicker";
import { uploadImage } from "@/lib/uploadImage";
import { checkDuplicate, DuplicateResult } from "@/lib/duplicateCheck";

const PRICE_RANGES = [
  { label: "🟢 Pocket Friendly", value: "₹0-30" },
  { label: "🟡 Cheap Eats", value: "₹30-50" },
  { label: "🟠 Reasonable", value: "₹50-100" },
  { label: "🔵 Mid Range", value: "₹100-150" },
  { label: "🟣 Slightly Premium", value: "₹150-200" },
  { label: "🔴 Premium", value: "₹200-300" },
  { label: "⚫ Splurge", value: "₹300+" },
];

const BEST_TIMES = [
  "Morning (6am - 11am)",
  "Afternoon (11am - 4pm)",
  "Evening (4pm - 8pm)",
  "Night (8pm - late)",
  "Anytime",
];

export default function PostPage() {
  const { profile } = useUserContext();
  const [user] = useAuthState(auth);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const [placeName, setPlaceName] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [insiderTip, setInsiderTip] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateResult | null>(null);
  const [isFirstFinder, setIsFirstFinder] = useState(true);

  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Image too large! Please select an image under 5MB.");
    return;
  }

  setSelectedImage(file);

  // Use FileReader for preview — most compatible across all mobile browsers
  const reader = new FileReader();
  reader.onloadend = () => {
    if (reader.result && typeof reader.result === "string") {
      setImagePreview(reader.result);
    }
  };
  reader.onerror = () => {
    // Show gem icon as placeholder if preview fails
    setImagePreview("");
    alert("Could not preview image but it will still upload correctly.");
  };
  reader.readAsDataURL(file);
};

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!placeName || !itemName || !price || !bestTime || !selectedImage) {
      alert("Please fill in all required fields including a photo!");
      return;
    }

    setLoading(true);

    // Check for duplicates first
    if (profile?.city) {
      const duplicate = await checkDuplicate(
        profile.city,
        itemName,
        placeName,
        location
      );

      if (duplicate.isDuplicate) {
        setDuplicateResult(duplicate);
        setIsFirstFinder(false);
        setShowDuplicateWarning(true);
        setLoading(false);
        return;
      }
    }

    await postGem(true);
  };

  const postGem = async (firstFinder: boolean) => {
    if (!user) return;
    setLoading(true);
    try {
      let imageUrl = "";
      if (selectedImage) {
        setUploadingImage(true);
        imageUrl = await uploadImage(selectedImage);
        setUploadingImage(false);
      }

      await addDoc(collection(db, "gems"), {
        placeName,
        itemName,
        price,
        bestTime,
        insiderTip,
        location,
        locationName,
        imageUrl,
        city: profile?.city || "",
        isFirstFinder: firstFinder,
        postedBy: profile?.name || user.displayName,
        postedByUid: user.uid,
        postedByPhoto: profile?.photo || user.photoURL,
        upvotes: 0,
        vibeRating: 0,
        vibeCount: 0,
        isVerified: false,
        createdAt: serverTimestamp(),
      });

      localStorage.removeItem("gemspot_draft");
      alert("Gem posted successfully! 💎");
      router.push("/home");
    } catch (error: any) {
      setUploadingImage(false);
      setLoading(false);
      if (!navigator.onLine) {
        alert("No internet connection! Please check your network and try again.");
      } else {
        alert("Error: " + error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="text-slate-400 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-white font-bold text-lg">Post a Gem</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">

        {/* Photo Upload */}
<div>
  <label className="text-slate-300 text-sm font-medium mb-2 block">
    📸 Photo
    <span className="text-red-400 ml-1">*</span>
  </label>

  {/* Preview */}
  {imagePreview ? (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden">
      {imagePreview ? (
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
          <span className="text-4xl">📸</span>
          <p className="text-slate-400 text-xs mt-2">Image selected</p>
        </div>
      )}
      <button
        onClick={handleRemoveImage}
        className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1"
      >
        <X size={18} />
      </button>
    </div>
  ) : (
    <>
      {/* Main Upload Button */}
      <button
        onClick={() => setShowPhotoOptions(true)}
        className="w-full bg-slate-800 border-2 border-dashed border-slate-600 rounded-2xl px-4 py-8 flex flex-col items-center gap-3 hover:border-teal-500 transition-colors"
      >
        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
          <Upload size={24} className="text-teal-400" />
        </div>
        <div className="text-center">
          <p className="text-slate-300 text-sm font-medium">
            Tap to add photo
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Camera or Gallery
          </p>
        </div>
      </button>
      <p className="text-red-400 text-xs mt-1 text-center">
        Photo is required *
      </p>
    </>
  )}

  {/* Hidden Camera Input */}
  <input
    ref={cameraInputRef}
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleImageSelect}
    className="hidden"
  />

  {/* Hidden Gallery Input */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleImageSelect}
    className="hidden"
  />

  {/* Photo Options Modal */}
  {showPhotoOptions && (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-end">
      <div className="bg-slate-900 rounded-t-3xl w-full p-6 space-y-3">
        <h2 className="text-white font-bold text-lg mb-4">
          Add Photo
        </h2>

        {/* Camera Option */}
        <button
          onClick={() => {
            setShowPhotoOptions(false);
            cameraInputRef.current?.click();
          }}
          className="w-full bg-slate-800 text-white rounded-2xl px-4 py-4 flex items-center gap-4 hover:bg-slate-700 transition-colors"
        >
          <div className="w-12 h-12 bg-teal-900 rounded-full flex items-center justify-center">
            <span className="text-2xl">📷</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Take a Photo</p>
            <p className="text-slate-400 text-sm">Open camera</p>
          </div>
        </button>

        {/* Gallery Option */}
        <button
          onClick={() => {
            setShowPhotoOptions(false);
            fileInputRef.current?.click();
          }}
          className="w-full bg-slate-800 text-white rounded-2xl px-4 py-4 flex items-center gap-4 hover:bg-slate-700 transition-colors"
        >
          <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center">
            <span className="text-2xl">🖼️</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Choose from Gallery</p>
            <p className="text-slate-400 text-sm">Pick existing photo</p>
          </div>
        </button>

        {/* Cancel */}
        <button
          onClick={() => setShowPhotoOptions(false)}
          className="w-full bg-slate-700 text-slate-300 rounded-2xl px-4 py-4 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</div>

        {/* Location */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            📍 Location *
          </label>
          <LocationPicker
            selectedLocation={locationName}
            onLocationSelect={({ lat, lng, name }) => {
              setLocation({ lat, lng });
              setLocationName(name);
            }}
          />
        </div>

        {/* Place Name */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            🏪 Place Name *
          </label>
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="eg. Sharma Tea Stall, FC Road"
            className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Item Name */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            🍽️ What to Order *
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="eg. Cutting Chai with extra ginger"
            className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            💰 Price Range *
          </label>
          <div className="relative">
            <button
              onClick={() => setShowPriceDropdown(!showPriceDropdown)}
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 flex items-center justify-between"
            >
              <span className={price ? "text-white text-sm" : "text-slate-500 text-sm"}>
                {price || "Select price range"}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {showPriceDropdown && (
              <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-2xl mt-1 overflow-hidden z-10">
                {PRICE_RANGES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPrice(p.value);
                      setShowPriceDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                  >
                    {p.label} — {p.value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Best Time */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            ⏰ Best Time to Visit *
          </label>
          <div className="relative">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 flex items-center justify-between"
            >
              <span className={bestTime ? "text-white text-sm" : "text-slate-500 text-sm"}>
                {bestTime || "Select best time"}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {showTimeDropdown && (
              <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-2xl mt-1 overflow-hidden z-10">
                {BEST_TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setBestTime(t);
                      setShowTimeDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                  >
                    <Clock size={14} className="inline mr-2 text-teal-400" />
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Insider Tip */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            📝 Insider Tip
            <span className="text-slate-500 ml-2 font-normal">(optional)</span>
          </label>
          <textarea
            value={insiderTip}
            onChange={(e) => {
              if (e.target.value.length <= 150) setInsiderTip(e.target.value);
            }}
            placeholder="Share a little secret about this place..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
          />
          <p className="text-slate-600 text-xs mt-1 text-right">
            {insiderTip.length}/150
          </p>
        </div>

        {/* Points Preview */}
        <div className="bg-teal-900 border border-teal-700 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-teal-300 text-sm">You will earn for this post</span>
          <span className="text-yellow-400 font-bold">+10 pts 🏆</span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-colors active:scale-95 text-lg"
        >
          {uploadingImage
            ? "Uploading photo... 📸"
            : loading
            ? "Posting..."
            : "Post this Gem 💎"}
        </button>

        <div className="h-24" />
      </div>

        {/* Duplicate Warning Modal */}
        {showDuplicateWarning && duplicateResult?.existingGem && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-end">
            <div className="bg-slate-900 rounded-t-3xl w-full p-6 space-y-4">

              {/* Icon */}
              <div className="text-center">
                <span className="text-5xl">⚠️</span>
                <h2 className="text-white font-bold text-xl mt-3">
                  Similar Gem Already Exists!
                </h2>
              </div>

              {/* Existing Gem Info */}
              <div className="bg-slate-800 rounded-2xl p-4 border border-yellow-700">
                <p className="text-yellow-400 text-sm font-semibold">
                  "{duplicateResult.existingGem.itemName}"
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  at {duplicateResult.existingGem.placeName}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Posted by {duplicateResult.existingGem.postedBy}
                  {duplicateResult.existingGem.distance < Infinity &&
                    ` • ${duplicateResult.existingGem.distance}m away`}
                </p>
              </div>

              {/* Badge Warning */}
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-2">
                <p className="text-white text-sm font-semibold mb-2">
                  If you post this:
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-red-400">❌</span>
                  <p className="text-slate-400 text-sm">
                    You won't get First Finder badge
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400">❌</span>
                  <p className="text-slate-400 text-sm">
                    You won't get Discoverer tag
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <p className="text-slate-400 text-sm">
                    You can still share your experience
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setDuplicateResult(null);
                  }}
                  className="flex-1 bg-slate-700 text-white py-3 rounded-2xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    postGem(false);
                  }}
                  className="flex-1 bg-yellow-600 text-white py-3 rounded-2xl font-semibold"
                >
                  Post Anyway
                </button>
              </div>

              {/* View Existing Gem */}
              <button
                onClick={() => router.push(`/gem/${duplicateResult.existingGem!.id}`)}
                className="w-full text-teal-400 text-sm text-center py-2"
              >
                View existing gem instead →
              </button>

            </div>
          </div>
        )}

      <BottomNav />
    </div>
  );
}