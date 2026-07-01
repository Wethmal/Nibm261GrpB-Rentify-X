/**
 * Location helpers for geo-based search (US10).
 * Manual lookups try OpenStreetMap Nominatim (Sri Lanka only) and fall back to a built-in
 * table of district capitals so the fallback flow still works offline.
 */
export const DISTRICT_COORDINATES = {
  colombo: { lat: 6.9271, lng: 79.8612 },
  gampaha: { lat: 7.084, lng: 80.0098 },
  kalutara: { lat: 6.5854, lng: 79.9607 },
  kandy: { lat: 7.2906, lng: 80.6337 },
  matale: { lat: 7.4675, lng: 80.6234 },
  'nuwara eliya': { lat: 6.9497, lng: 80.7891 },
  galle: { lat: 6.0535, lng: 80.221 },
  matara: { lat: 5.9549, lng: 80.555 },
  hambantota: { lat: 6.1429, lng: 81.1212 },
  jaffna: { lat: 9.6615, lng: 80.0255 },
  kilinochchi: { lat: 9.3803, lng: 80.377 },
  mannar: { lat: 8.981, lng: 79.9044 },
  vavuniya: { lat: 8.7542, lng: 80.4982 },
  mullaitivu: { lat: 9.2671, lng: 80.8142 },
  batticaloa: { lat: 7.731, lng: 81.6747 },
  ampara: { lat: 7.2912, lng: 81.6724 },
  trincomalee: { lat: 8.5874, lng: 81.2152 },
  kurunegala: { lat: 7.4863, lng: 80.3647 },
  puttalam: { lat: 8.0362, lng: 79.8283 },
  anuradhapura: { lat: 8.3114, lng: 80.4037 },
  polonnaruwa: { lat: 7.9403, lng: 81.0188 },
  badulla: { lat: 6.9934, lng: 81.055 },
  monaragala: { lat: 6.8728, lng: 81.3507 },
  ratnapura: { lat: 6.6828, lng: 80.3992 },
  kegalle: { lat: 7.2513, lng: 80.3464 },
};

/** Resolve a city name or Sri Lankan postal code to coordinates. Returns { lat, lng, label } or null. */
