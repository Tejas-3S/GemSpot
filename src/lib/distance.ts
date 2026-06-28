// Haversine formula — calculates distance between two GPS points in meters
export function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if two strings are similar (fuzzy match)
export function isSimilar(str1: string, str2: string): boolean {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return true;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return true;

  // First word matches (eg. "Cutting Chai" vs "Cutting Chai with ginger")
  const word1 = s1.split(" ")[0];
  const word2 = s2.split(" ")[0];
  if (word1.length > 3 && word1 === word2) return true;

  return false;
}