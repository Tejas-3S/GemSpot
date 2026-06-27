"use client";
import { useState, useEffect, useRef } from "react";
import { MapPin, Search, X } from "lucide-react";

interface CitySearchProps {
  selectedCity: string;
  onCitySelect: (city: string) => void;
  placeholder?: string;
}

export default function CitySearch({
  selectedCity,
  onCitySelect,
  placeholder = "Search your city...",
}: CitySearchProps) {
  const [query, setQuery] = useState(selectedCity || "");
  const [results, setResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    setQuery(selectedCity || "");
  }, [selectedCity]);

  const searchCities = async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          text
        )}&countrycodes=in&featureType=city&format=json&limit=8`
      );
      const data = await res.json();
      const cities = data
        .map((item: any) => {
          const parts = item.display_name.split(",");
          return parts[0].trim();
        })
        .filter(
          (city: string, index: number, self: string[]) =>
            self.indexOf(city) === index
        );
      setResults(cities);
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const handleChange = (text: string) => {
    setQuery(text);
    setShowResults(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCities(text);
    }, 400);
  };

  const handleSelect = (city: string) => {
    setQuery(city);
    onCitySelect(city);
    setShowResults(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    onCitySelect("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      {/* Input */}
      <div className="flex items-center bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 gap-2 focus-within:border-teal-500">
        <MapPin size={18} className="text-teal-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-slate-500"
        />
        {searching && (
          <span className="text-slate-400 text-xs">Searching...</span>
        )}
        {query && !searching && (
          <button onClick={handleClear}>
            <X size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-2xl mt-1 overflow-hidden z-50 shadow-xl">
          {results.map((city, index) => (
            <button
              key={index}
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-3 text-left text-slate-300 text-sm hover:bg-slate-700 flex items-center gap-2 transition-colors"
            >
              <MapPin size={14} className="text-teal-400 shrink-0" />
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}