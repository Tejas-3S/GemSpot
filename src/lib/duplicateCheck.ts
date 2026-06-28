import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDistanceInMeters, isSimilar } from "@/lib/distance";

export interface DuplicateResult {
  isDuplicate: boolean;
  isStrong: boolean; // true = all 3 match, false = 2 match
  existingGem?: {
    id: string;
    itemName: string;
    placeName: string;
    postedBy: string;
    distance: number;
  };
}

export async function checkDuplicate(
  city: string,
  itemName: string,
  placeName: string,
  location: { lat: number; lng: number } | null
): Promise<DuplicateResult> {
  try {
    // Fetch gems from same city
    const q = query(
      collection(db, "gems"),
      where("city", "==", city)
    );
    const snapshot = await getDocs(q);
    const cityGems = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    for (const gem of cityGems) {
      const similarItem = isSimilar(itemName, gem.itemName || "");
      const similarPlace = isSimilar(placeName, gem.placeName || "");

      let nearbyLocation = false;
      let distance = Infinity;

      if (location && gem.location?.lat && gem.location?.lng) {
        distance = getDistanceInMeters(
          location.lat,
          location.lng,
          gem.location.lat,
          gem.location.lng
        );
        nearbyLocation = distance <= 100; // within 100 meters
      }

      // Strong duplicate — all 3 match
      if (similarItem && similarPlace && nearbyLocation) {
        return {
          isDuplicate: true,
          isStrong: true,
          existingGem: {
            id: gem.id,
            itemName: gem.itemName,
            placeName: gem.placeName,
            postedBy: gem.postedBy,
            distance: Math.round(distance),
          },
        };
      }

      // Soft duplicate — 2 match
      if (
        (similarItem && similarPlace) ||
        (similarItem && nearbyLocation) ||
        (similarPlace && nearbyLocation)
      ) {
        return {
          isDuplicate: true,
          isStrong: false,
          existingGem: {
            id: gem.id,
            itemName: gem.itemName,
            placeName: gem.placeName,
            postedBy: gem.postedBy,
            distance: Math.round(distance),
          },
        };
      }
    }

    return { isDuplicate: false, isStrong: false };
  } catch (e) {
    console.error(e);
    return { isDuplicate: false, isStrong: false };
  }
}