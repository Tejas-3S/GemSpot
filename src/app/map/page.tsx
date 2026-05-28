"use client";
import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { MapPin, X, Navigation } from "lucide-react";

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
  location: { lat: number; lng: number };
}

export default function MapPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [gems, setGems] = useState<Gem[]>([]);
  const [selectedGem, setSelectedGem] = useState<Gem | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    fetchGems();
  }, []);

  // Init map only once when component mounts
  useEffect(() => {
    let ignore = false;
    const init = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (ignore || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [18.5204, 73.8567],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };
    init();
    return () => {
      ignore = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add markers only after map is ready and gems are loaded
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    addMarkers();
  }, [mapReady, gems]);

  const fetchGems = async () => {
    try {
      const snapshot = await getDocs(collection(db, "gems"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Gem[];
      setGems(data.filter((g) => g.location));
    } catch (e) {
      console.error(e);
    }
  };

  const addMarkers = async () => {
    const L = (await import("leaflet")).default;
    const map = mapInstanceRef.current;
    if (!map) return;

    gems.forEach((gem) => {
      if (!gem.location?.lat || !gem.location?.lng) return;

      const customIcon = L.divIcon({
        html: `<div style="
          background: #0d9488;
          border: 3px solid #FFD700;
          border-radius: 50% 50% 50% 0;
          width: 32px;
          height: 32px;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          cursor: pointer;
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: "",
      });

      const marker = L.marker(
        [gem.location.lat, gem.location.lng],
        { icon: customIcon }
      ).addTo(map);

      marker.on("click", () => {
        setSelectedGem(gem);
        map.setView([gem.location.lat, gem.location.lng], 16);
      });
    });
  };

  const handleDirections = (gem: Gem) => {
    // Opens Google Maps directions — completely free for users
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gem.location.lat},${gem.location.lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  const handleOpenInMaps = (gem: Gem) => {
    // Opens OpenStreetMap as fallback
    const url = `https://www.openstreetmap.org/?mlat=${gem.location.lat}&mlon=${gem.location.lng}&zoom=18`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-white font-bold text-xl">💎 Gem Map</h1>
          <p className="text-slate-400 text-xs">
            {gems.length} gems spotted
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          height: "calc(100vh - 130px)",
          width: "100%",
          zIndex: 0,
        }}
      />

      {/* Gem Preview Card */}
      {selectedGem && (
        <div className="fixed bottom-20 left-4 right-4 bg-slate-800 rounded-2xl p-4 border border-teal-700 z-50 shadow-2xl">

          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-2">
              <h3 className="text-white font-bold text-base leading-tight">
                {selectedGem.itemName}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} className="text-teal-400" />
                <span className="text-teal-400 text-sm truncate">
                  {selectedGem.placeName}
                </span>
                {selectedGem.isVerified && (
                  <span className="text-teal-400 text-xs ml-1">✓</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-slate-700 text-yellow-400 text-xs px-2 py-1 rounded-full font-semibold">
                {selectedGem.price}
              </span>
              <button
                onClick={() => setSelectedGem(null)}
                className="text-slate-400 ml-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Insider Tip */}
          {selectedGem.insiderTip && (
            <div className="bg-slate-700 rounded-xl px-3 py-2 mb-3">
              <p className="text-slate-300 text-xs leading-relaxed">
                💡 {selectedGem.insiderTip}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            {/* Directions — opens Google Maps for user, free */}
            <button
              onClick={() => handleDirections(selectedGem)}
              className="flex-1 bg-teal-600 text-white text-xs px-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1"
            >
              <Navigation size={14} />
              Directions
            </button>

            {/* View Full Gem */}
            <button
              onClick={() => router.push(`/gem/${selectedGem.id}`)}
              className="flex-1 bg-slate-700 text-white text-xs px-3 py-2.5 rounded-xl font-semibold"
            >
              View Gem →
            </button>
          </div>

          {/* Posted by */}
          <p className="text-slate-500 text-xs mt-2 text-center">
            posted by {selectedGem.postedBy}
          </p>

        </div>
      )}

      <BottomNav />
    </div>
  );
}