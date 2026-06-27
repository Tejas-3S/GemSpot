"use client";
import CitySearch from "@/components/CitySearch";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, updateDoc } from "firebase/firestore";
import { getUserProfile, UserProfile } from "@/lib/userUtils";
import { uploadImage } from "@/lib/uploadImage";
import { ArrowLeft, Camera, Loader } from "lucide-react";

const CITIES = [
  "Mumbai", "Pune", "Delhi", "Bangalore", "Chennai",
  "Hyderabad", "Kolkata", "Ahmedabad", "Jaipur", "Surat",
  "Nagpur", "Nashik", "Aurangabad", "Solapur", "Other"
];

export default function EditProfilePage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const data = await getUserProfile(user.uid);
    if (data) {
      setProfile(data);
      setName(data.name || "");
      setBio(data.bio || "");
      setCity(data.city || "");
      setPhoto(data.photo || user.photoURL || "");
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file);
      setPhoto(url);
    } catch (e) {
      alert("Failed to upload photo. Try again!");
    }
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      alert("Name cannot be empty!");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        bio,
        city,
        photo,
      });
      alert("Profile updated successfully!");
      router.push("/profile");
    } catch (e) {
      alert("Failed to save profile. Try again!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400">Loading...</div>
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
          <h1 className="text-white font-bold text-lg">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-teal-400 font-semibold text-sm disabled:text-slate-600"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-teal-400">
              {uploadingPhoto ? (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <Loader size={24} className="text-teal-400 animate-spin" />
                </div>
              ) : photo ? (
                <img src={photo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowPhotoOptions(true)}
              className="absolute bottom-0 right-0 bg-teal-600 rounded-full p-2"
            >
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <p className="text-slate-400 text-sm">Tap camera to change photo</p>
        </div>

        {/* Name */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            👤 Display Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={30}
            className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <p className="text-slate-600 text-xs mt-1 text-right">
            {name.length}/30
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            ✍️ Bio
            <span className="text-slate-500 ml-2 font-normal">(optional)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => {
              if (e.target.value.length <= 100) setBio(e.target.value);
            }}
            placeholder="Food Explorer | Student | Local Guide..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
          />
          <p className="text-slate-600 text-xs mt-1 text-right">
            {bio.length}/100
          </p>
        </div>

        {/* City */}
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">
            📍 Your City
          </label>
          <CitySearch
            selectedCity={city}
            onCitySelect={(c) => setCity(c)}
            placeholder="Search your city eg. Karad, Pune..."
          />
        </div>

        {/* Join Date */}
        <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700">
          <p className="text-slate-400 text-sm">
            🗓️ Joined{" "}
            <span className="text-white font-semibold">
              {profile?.joinedAt?.toDate
                ? new Date(profile.joinedAt.toDate()).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })
                : "Recently"}
            </span>
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl text-lg disabled:bg-slate-700"
        >
          {saving ? "Saving..." : "Save Profile ✓"}
        </button>

        <div className="h-8" />
      </div>

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-end">
          <div className="bg-slate-900 rounded-t-3xl w-full p-6 space-y-3">
            <h2 className="text-white font-bold text-lg mb-4">
              Change Photo
            </h2>
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
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </div>
  );
}