/**
 * Synergy Matching Utility
 *
 * Calculates a 0-100% compatibility score between the current user's
 * profile and a listing or room request based on:
 *   1. Current city            – 35 pts
 *   2. Area / location         – 15 pts
 *   3. Gender preference       – 20 pts
 *   4. Education level & year  – 20 pts
 *   5. Home city / district    – 10 pts
 */

import { UserDocument, ListingDocument } from "./firebase/types";

// ─── helpers ────────────────────────────────────────────────────────────────

const norm = (s?: string | null) => (s || "").toLowerCase().trim();

/** Simple fuzzy city match — handles "Kota" vs "Kota, Rajasthan" etc. */
const cityMatch = (a: string, b: string): "exact" | "partial" | "none" => {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return "none";
  if (na === nb) return "exact";
  if (na.includes(nb) || nb.includes(na)) return "partial";
  return "none";
};

// ─── Match breakdown line ────────────────────────────────────────────────────

export interface MatchBreakdown {
  score: number;        // 0-100
  label: "Excellent" | "Good" | "Fair" | "Low";
  color: "green" | "yellow" | "orange" | "muted";
  details: string[];    // human-readable reasons
}

// ─── Listing match ──────────────────────────────────────────────────────────

/**
 * How well does THIS user's profile match a listing they are considering?
 * (Seeker ↔ Listing)
 */
export function matchListingScore(
  userProfile: UserDocument | null | undefined,
  listing: ListingDocument
): MatchBreakdown {
  if (!userProfile) return { score: 0, label: "Low", color: "muted", details: [] };

  let score = 0;
  const details: string[] = [];

  // 1. City (35 pts) ──────────────────────────────────────────────────────
  const cm = cityMatch(userProfile.city, listing.city);
  if (cm === "exact") {
    score += 35;
    details.push(`📍 Same city (${listing.city})`);
  } else if (cm === "partial") {
    score += 20;
    details.push(`📍 Nearby city match`);
  }

  // 2. Area / location (15 pts) ───────────────────────────────────────────
  const locText = norm(listing.location + " " + listing.city);
  const userCity = norm(userProfile.city);
  if (userCity && locText.includes(userCity)) {
    score += 15;
    details.push(`🏘️ Area matches your current city`);
  } else if (userCity && locText.includes(userCity.split(" ")[0])) {
    score += 8;
  }

  // 3. Gender preference (20 pts) ─────────────────────────────────────────
  const gp = listing.preferences?.gender_preference;
  if (!gp || gp === "any" || gp === userProfile.gender) {
    score += 20;
    details.push(`✅ Gender preference matches`);
  } else {
    details.push(`⚠️ Gender preference mismatch`);
  }

  // 4. Education level & year (20 pts) ────────────────────────────────────
  const profPrefs = (listing.preferences?.profession_preference || []).map(norm);
  const isStudent = !!userProfile.college;
  const isProfessional = !!userProfile.company;

  if (profPrefs.length === 0) {
    // No restriction — give base points scaled to profile completeness
    score += isStudent || isProfessional ? 14 : 7;
    if (isStudent) details.push(`🎓 Student profile (no restriction on listing)`);
    else if (isProfessional) details.push(`💼 Professional profile (no restriction on listing)`);
  } else {
    const wantsStudent = profPrefs.some((p) => p.includes("student"));
    const wantsProfessional = profPrefs.some((p) => p.includes("professional") || p.includes("working"));
    if (isStudent && wantsStudent) {
      score += 20;
      details.push(`🎓 Student preference match`);
    } else if (isProfessional && wantsProfessional) {
      score += 20;
      details.push(`💼 Professional preference match`);
    }
  }

  // 5. Home city / district (10 pts) ──────────────────────────────────────
  const homeDistrict = norm(userProfile.home_district);
  if (homeDistrict) {
    const listingLocation = norm(listing.location + " " + listing.city);
    if (
      listingLocation.includes(homeDistrict) ||
      norm(listing.city).includes(homeDistrict) ||
      homeDistrict.includes(norm(listing.city))
    ) {
      score += 10;
      details.push(`🏠 Near your home district (${userProfile.home_district})`);
    }
  }

  const finalScore = Math.min(100, Math.round(score));
  return { score: finalScore, ...scoreLabel(finalScore), details };
}

// ─── Room Request match ─────────────────────────────────────────────────────

interface RoomRequestLike {
  city: string;
  location?: string;
  preferences?: {
    gender_preference?: string;
  };
  duration?: string;
  userData?: UserDocument;
}

/**
 * How well does THIS user's profile match a room request?
 * (Poster ↔ Seeker's request)
 */
export function matchRequestScore(
  userProfile: UserDocument | null | undefined,
  request: RoomRequestLike
): MatchBreakdown {
  if (!userProfile) return { score: 0, label: "Low", color: "muted", details: [] };

  let score = 0;
  const details: string[] = [];

  const requester = request.userData;

  // 1. City (35 pts) ──────────────────────────────────────────────────────
  const cm = cityMatch(userProfile.city, request.city);
  if (cm === "exact") {
    score += 35;
    details.push(`📍 Same city (${request.city})`);
  } else if (cm === "partial") {
    score += 20;
    details.push(`📍 Nearby city`);
  }

  // 2. Area / location (15 pts) ───────────────────────────────────────────
  const reqLoc = norm((request.location || "") + " " + request.city);
  const userCity = norm(userProfile.city);
  if (userCity && reqLoc.includes(userCity)) {
    score += 15;
    details.push(`🏘️ Requested area matches your city`);
  } else if (userCity && reqLoc.includes(userCity.split(" ")[0])) {
    score += 8;
  }

  // 3. Gender preference (20 pts) ─────────────────────────────────────────
  const gp = request.preferences?.gender_preference;
  if (!gp || gp === "any" || gp === userProfile.gender) {
    score += 20;
    details.push(`✅ Gender preference compatible`);
  } else {
    details.push(`⚠️ Gender preference mismatch`);
  }

  // 4. Education level & year (20 pts) ────────────────────────────────────
  const amStudent = !!userProfile.college;
  const amProfessional = !!userProfile.company;
  const theyStudent = !!requester?.college;
  const theyProfessional = !!requester?.company;

  if (amStudent && theyStudent) {
    score += 12;
    details.push(`🎓 Both students`);
    // Year proximity bonus (up to 8 extra)
    const myYear = userProfile.year;
    const theirYear = requester?.year;
    if (myYear && theirYear) {
      const diff = Math.abs(myYear - theirYear);
      if (diff === 0) {
        score += 8;
        details.push(`📅 Same study year (Year ${myYear})`);
      } else if (diff === 1) {
        score += 5;
        details.push(`📅 Adjacent study year`);
      } else {
        score += 2;
      }
    } else {
      score += 4;
    }
  } else if (amProfessional && theyProfessional) {
    score += 16;
    details.push(`💼 Both professionals`);
  } else if ((amStudent && !theyStudent) || (amProfessional && !theyStudent)) {
    score += 8;
  } else {
    score += 5;
  }

  // 5. Home district (10 pts) ─────────────────────────────────────────────
  const myHome = norm(userProfile.home_district);
  const theirHome = norm(requester?.home_district || "");
  if (myHome && theirHome && (myHome === theirHome || myHome.includes(theirHome) || theirHome.includes(myHome))) {
    score += 10;
    details.push(`🏠 Same home district (${userProfile.home_district})`);
  }

  const finalScore = Math.min(100, Math.round(score));
  return { score: finalScore, ...scoreLabel(finalScore), details };
}

// ─── Label helper ────────────────────────────────────────────────────────────

function scoreLabel(score: number): {
  label: MatchBreakdown["label"];
  color: MatchBreakdown["color"];
} {
  if (score >= 80) return { label: "Excellent", color: "green" };
  if (score >= 60) return { label: "Good", color: "yellow" };
  if (score >= 40) return { label: "Fair", color: "orange" };
  return { label: "Low", color: "muted" };
}
