"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { MapPin, X, Navigation, RefreshCw } from "lucide-react";
import { useUserContext } from "@/context/UserContext";

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
  const markersRef = useRef<any[]>([]);
  const [gems, setGems] = useState<Gem[]>([]);
  const [selectedGem, setSelectedGem] = useState<Gem | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newGemsAvailable, setNewGemsAvailable] = useState(false);
  const initialLoadRef = useRef(true);
  const { profile } = useUserContext();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  // Real-time listener for new gems
  useEffect(() => {
    let q;
    if (profile?.city) {
      q = query(
        collection(db, "gems"),
        where("city", "==", profile.city)
      );
    } else {
      q = collection(db, "gems");
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (initialLoadRef.current) {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((g: any) => g.location) as Gem[];
        setGems(data);
        initialLoadRef.current = false;
      } else {
        setNewGemsAvailable(true);
      }
    });
    return () => unsubscribe();
  }, [profile?.city]);

  // Init map once
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

  const centerMapOnCity = async (cityName: string) => {
    if (!mapInstanceRef.current) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          cityName
        )}&format=json&limit=1&countrycodes=in`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        mapInstanceRef.current.setView(
          [parseFloat(lat), parseFloat(lon)],
          13
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (profile?.city && mapReady) {
      centerMapOnCity(profile.city);
    }
  }, [profile?.city, mapReady]);

  // Add markers when map ready or gems change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    addMarkers();
  }, [mapReady, gems]);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const addMarkers = async () => {
    const L = (await import("leaflet")).default;
    const map = mapInstanceRef.current;
    if (!map) return;

    clearMarkers();

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

      markersRef.current.push(marker);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      let q;
      if (profile?.city) {
        q = query(
          collection(db, "gems"),
          where("city", "==", profile.city)
        );
      } else {
        q = query(collection(db, "gems"));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((g: any) => g.location) as Gem[];
      setGems(data);
      setNewGemsAvailable(false);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  const handleDirections = (gem: Gem) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gem.location.lat},${gem.location.lng}&travelmode=walking`;
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
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-white font-bold text-xl">💎 Gem Map</h1>
            <p className="text-slate-400 text-xs">
              {gems.length} gems in {profile?.city || "your area"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-full"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-400" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* New Gems Banner */}
      {newGemsAvailable && (
        <button
          onClick={handleRefresh}
          className="bg-teal-700 text-white text-sm py-2 text-center w-full z-30"
        >
          🆕 New gems available — tap to refresh!
        </button>
      )}

      {/* Empty State */}
      {gems.length === 0 && mapReady && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-slate-800 rounded-2xl p-6 text-center border border-slate-700">
          <span className="text-5xl">🗺️</span>
          <p className="text-white font-semibold mt-3">No gems on map yet!</p>
          <p className="text-slate-400 text-sm mt-1">Be the first to post one</p>
          <button
            onClick={() => router.push("/post")}
            className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-full text-sm font-semibold"
          >
            Post a Gem 💎
          </button>
        </div>
      )}

      {/* Map */}
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

          {selectedGem.insiderTip && (
            <div className="bg-slate-700 rounded-xl px-3 py-2 mb-3">
              <p className="text-slate-300 text-xs leading-relaxed">
                💡 {selectedGem.insiderTip}
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleDirections(selectedGem)}
              className="flex-1 bg-teal-600 text-white text-xs px-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1"
            >
              <Navigation size={14} />
              Directions
            </button>
            <button
              onClick={() => router.push(`/gem/${selectedGem.id}`)}
              className="flex-1 bg-slate-700 text-white text-xs px-3 py-2.5 rounded-xl font-semibold"
            >
              View Gem →
            </button>
          </div>

          <p className="text-slate-500 text-xs mt-2 text-center">
            posted by {selectedGem.postedBy}
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}