"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadImage } from "@/lib/uploadImage";
import { ArrowLeft, X, Upload } from "lucide-react";
import BottomNav from "@/components/BottomNav";

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

export default function EditGemPage() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [insiderTip, setInsiderTip] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  useEffect(() => {
    fetchGem();
  }, [id]);

  const fetchGem = async () => {
    if (!id) return;
    try {
      const docSnap = await getDoc(doc(db, "gems", id as string));
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Only allow owner to edit
        if (data.postedByUid !== user?.uid) {
          router.push("/profile");
          return;
        }
        setPlaceName(data.placeName || "");
        setItemName(data.itemName || "");
        setPrice(data.price || "");
        setBestTime(data.bestTime || "");
        setInsiderTip(data.insiderTip || "");
        setImageUrl(data.imageUrl || "");
        setImagePreview(data.imageUrl || "");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large! Max 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (e) {
      alert("Image upload failed. Try again!");
    }
    setUploadingImage(false);
  };

  const handleSave = async () => {
    if (!user || !id) return;
    if (!placeName || !itemName || !price || !bestTime) {
      alert("Please fill all required fields!");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "gems", id as string), {
        placeName,
        itemName,
        price,
        bestTime,
        insiderTip,
        imageUrl,
      });
      alert("Gem updated successfully! 💎");
      router.push("/profile");
    } catch (e) {
      alert("Failed to save. Try again!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400">Loading gem...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => router.back()} className="text-slate-400">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-bold text-lg">Edit Gem</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-teal-400 font-semibold text-sm disabled:text-slate-600"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Photo */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            📸 Photo
          </label>
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden">
              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <p className="text-white text-sm">Uploading...</p>
                </div>
              )}
              <img
                src={imagePreview}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  setImagePreview("");
                  setImageUrl("");
                }}
                className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1"
              >
                <X size={18} />
              </button>
              <button
                onClick={() => setShowPhotoOptions(true)}
                className="absolute bottom-2 right-2 bg-teal-600 text-white text-xs px-3 py-1.5 rounded-full"
              >
                Change Photo
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPhotoOptions(true)}
              className="w-full bg-slate-800 border-2 border-dashed border-slate-600 rounded-2xl px-4 py-8 flex flex-col items-center gap-3"
            >
              <Upload size={24} className="text-teal-400" />
              <p className="text-slate-300 text-sm">Tap to add photo</p>
            </button>
          )}
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
              <span className="text-white text-sm">{price}</span>
              <span className="text-slate-400">▼</span>
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
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      price === p.value
                        ? "bg-teal-700 text-white"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
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
            ⏰ Best Time *
          </label>
          <div className="relative">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 flex items-center justify-between"
            >
              <span className="text-white text-sm">{bestTime}</span>
              <span className="text-slate-400">▼</span>
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
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      bestTime === t
                        ? "bg-teal-700 text-white"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
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
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
          />
          <p className="text-slate-600 text-xs mt-1 text-right">
            {insiderTip.length}/150
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl text-lg disabled:bg-slate-700"
        >
          {saving ? "Saving..." : "Save Changes ✓"}
        </button>

        <div className="h-24" />
      </div>

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-end">
          <div className="bg-slate-900 rounded-t-3xl w-full p-6 space-y-3">
            <h2 className="text-white font-bold text-lg mb-2">Change Photo</h2>
            <button
              onClick={() => {
                setShowPhotoOptions(false);
                cameraInputRef.current?.click();
              }}
              className="w-full bg-slate-800 text-white rounded-2xl px-4 py-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-teal-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
              <div className="text-left">
                <p className="font-semibold">Take a Photo</p>
                <p className="text-slate-400 text-sm">Open camera</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowPhotoOptions(false);
                fileInputRef.current?.click();
              }}
              className="w-full bg-slate-800 text-white rounded-2xl px-4 py-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              <div className="text-left">
                <p className="font-semibold">Choose from Gallery</p>
                <p className="text-slate-400 text-sm">Pick existing photo</p>
              </div>
            </button>
            <button
              onClick={() => setShowPhotoOptions(false)}
              className="w-full bg-slate-700 text-slate-300 rounded-2xl px-4 py-4 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        onChange={handleImageSelect}
        className="hidden"
      />

      <BottomNav />
    </div>
  );
}