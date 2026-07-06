

const RAW = import.meta.env.VITE_API_URL || "";


const BASE = RAW.replace(/\/$/, "");

export const API_URL      = BASE;
export const API_BASE     = BASE ? `${BASE}/api`     : "/api";
export const UPLOADS_BASE = BASE ? `${BASE}/uploads` : "/uploads";

// Header anti-page-interception ngrok
// (utile uniquement si les requêtes vont directement vers ngrok)
export const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "69420",
};

/**
 * authHeaders — headers standards pour les appels API authentifiés
 * Inclut Authorization + ngrok header (ignoré si proxy, inoffensif sinon)
 */
export const authHeaders = (extra = {}) => ({
  "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "69420",
  ...extra,
});

/**
 * authHeadersFormData — pour les uploads multipart
 * PAS de Content-Type (le navigateur le gère avec le boundary)
 */
export const authHeadersFormData = () => ({
  "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
  "ngrok-skip-browser-warning": "69420",
});
