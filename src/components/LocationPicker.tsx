"use client";
import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Search, X } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  selectedLocation?: string;
}

export default function LocationPicker({
  onLocationSelect,
  selectedLocation,
}: LocationPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"choose" | "map" | "search">("choose");
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (mode === "map" && showModal) {
      setTimeout(() => initMap(), 300);
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mode, showModal]);

  const initMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (await import("leaflet")).default;
    await import("leaflet/dist/leaflet.css");

    const defaultLocation: [number, number] = [18.5204, 73.8567];

    const map = L.map(mapRef.current).setView(defaultLocation, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="
        width: 32px; height: 32px;
        background: #0d9488;
        border: 3px solid #FFD700;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      className: "",
    });

    const marker = L.marker(defaultLocation, {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    map.on("click", (e: any) => {
      marker.setLatLng(e.latlng);
    });
  };

  const handleCurrentLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
  async (position) => {
    const { latitude, longitude } = position.coords;
    const name = await reverseGeocode(latitude, longitude);
    onLocationSelect({ lat: latitude, lng: longitude, name });
    setLocating(false);
    setShowModal(false);
  },
  () => {
    alert("Could not get location. Please try manual selection.");
    setLocating(false);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
);
  };

  const handleConfirmMapLocation = async () => {
    if (!markerRef.current) return;
    const pos = markerRef.current.getLatLng();
    const name = await reverseGeocode(pos.lat, pos.lng);
    onLocationSelect({ lat: pos.lat, lng: pos.lng, name });
    setShowModal(false);
    setMode("choose");
    mapInstanceRef.current = null;
  };

  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      if (data.display_name) return data.display_name;
    } catch (e) {}
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=5&countrycodes=in`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      alert("Search failed. Try again.");
    }
    setSearching(false);
  };

  const handleSelectSearchResult = (result: any) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name,
    });
    setShowModal(false);
    setMode("choose");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClose = () => {
    setShowModal(false);
    setMode("choose");
    setSearchQuery("");
    setSearchResults([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-95 transition-transform"
      >
        <MapPin size={20} className="text-teal-400" />
        <span
          className={
            selectedLocation
              ? "text-white text-sm text-left truncate"
              : "text-slate-500 text-sm"
          }
        >
          {selectedLocation || "Select location"}
        </span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex flex-col justify-end">
          <div className="bg-slate-900 rounded-t-3xl flex flex-col max-h-[85vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
              <button
                onClick={() => mode !== "choose" ? setMode("choose") : null}
                className={mode !== "choose" ? "text-teal-400 text-sm" : "w-6"}
              >
                {mode !== "choose" ? "← Back" : ""}
              </button>
              <h2 className="text-white font-bold text-lg">
                {mode === "choose"
                  ? "Select Location"
                  : mode === "map"
                  ? "Pin on Map"
                  : "Search Location"}
              </h2>
              <button onClick={handleClose} className="text-slate-400">
                <X size={24} />
              </button>
            </div>

            {/* Choose Mode */}
            {mode === "choose" && (
              <div className="p-6 space-y-4">
                {/* Current Location */}
                <button
                  onClick={handleCurrentLocation}
                  disabled={locating}
                  className="w-full bg-teal-700 hover:bg-teal-600 text-white rounded-2xl px-4 py-5 flex items-center gap-4 transition-colors active:scale-95"
                >
                  <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                    <Navigation size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-base">
                      {locating
                        ? "Getting location..."
                        : "Use Current Location"}
                    </p>
                    <p className="text-teal-300 text-sm">
                      Auto detect where you are right now
                    </p>
                  </div>
                </button>

                {/* Pin on Map */}
                <button
                  onClick={() => setMode("map")}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-2xl px-4 py-5 flex items-center gap-4 transition-colors active:scale-95 border border-slate-600"
                >
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    <MapPin size={24} className="text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-base">Pin on Map</p>
                    <p className="text-slate-400 text-sm">
                      Tap anywhere on the map to drop a pin
                    </p>
                  </div>
                </button>

                {/* Search */}
                <button
                  onClick={() => setMode("search")}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-2xl px-4 py-5 flex items-center gap-4 transition-colors active:scale-95 border border-slate-600"
                >
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    <Search size={24} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-base">Search Location</p>
                    <p className="text-slate-400 text-sm">
                      Type an address or place name
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Map Mode — Full Screen */}
            {mode === "map" && (
              <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
                  <button
                    onClick={() => setMode("choose")}
                    className="text-teal-400 text-sm font-semibold"
                  >
                    ← Back
                  </button>
                  <h2 className="text-white font-bold text-lg">Pin on Map</h2>
                  <div className="w-12" />
                </div>

                {/* Instruction */}
                <div className="px-4 py-2 bg-slate-800 shrink-0">
                  <p className="text-slate-400 text-xs text-center">
                    Tap anywhere on map or drag the pin to set location
                  </p>
                </div>

                {/* Map — takes all available space */}
                <div ref={mapRef} className="flex-1" />

                {/* Confirm Button — always fixed at bottom */}
                <div className="px-4 py-4 bg-slate-900 border-t border-slate-700 shrink-0">
                  <button
                    onClick={handleConfirmMapLocation}
                    className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg"
                  >
                    ✓ Confirm Location
                  </button>
                </div>

              </div>
            )}

            {/* Search Mode */}
            {mode === "search" && (
              <div className="p-4 space-y-3 overflow-y-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="eg. FC Road Pune, Sharma Tea Stall"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-teal-600 text-white px-4 rounded-2xl"
                  >
                    {searching ? "..." : <Search size={20} />}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-left hover:border-teal-500 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin
                            size={16}
                            className="text-teal-400 mt-0.5 shrink-0"
                          />
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {result.display_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No results found. Try a different search.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}