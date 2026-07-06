import { useEffect, useRef, useState, useCallback } from "react";
import { FaMapMarkedAlt, FaTimes, FaLocationArrow, FaTruck, FaUserCircle, FaRoute, FaClock, FaCheckCircle } from "react-icons/fa";
import { API_BASE } from "./config.js";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletLoadingPromise = null;
function chargerLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadingPromise) return leafletLoadingPromise;
  leafletLoadingPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS; script.async = true;
    script.onload  = () => resolve(window.L);
    script.onerror = () => reject(new Error("Impossible de charger la carte."));
    document.body.appendChild(script);
  });
  return leafletLoadingPromise;
}

function distanceHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function formatDistance(km) { return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`; }
function formatDuree(s) { const h = Math.floor(s/3600), m = Math.round((s%3600)/60); return h > 0 ? `${h} h ${m} min` : `${m} min`; }

const STATUTS_TERMINES = ["TERMINE", "LIVRE", "ANNULE"];

export default function SuiviPanel({ idColis, monRole, onClose }) {
  const token = localStorage.getItem("token");

  const [maPosition,    setMaPosition]    = useState(null);
  const [positionCible, setPositionCible] = useState(null);
  const [itineraire,    setItineraire]    = useState(null);
  const [erreur,        setErreur]        = useState("");
  const [partage,       setPartage]       = useState(false);
  const [carteChargee,  setCarteChargee]  = useState(false);
  const [livre,         setLivre]         = useState(false);

  const watchIdRef      = useRef(null);
  const pollCibleRef    = useRef(null);
  const pollStatutRef   = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef({ moi: null, autre: null });
  const routeLayerRef   = useRef(null);
  const aDejaCadreRef   = useRef(false);

  const jePartage = monRole === "VOYAGEUR" || monRole === "DESTINATAIRE";

  // ── Arrêter TOUT le tracking ─────────────────────────────────────────────────
  const arreterTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollCibleRef.current)  { clearInterval(pollCibleRef.current);  pollCibleRef.current  = null; }
    if (pollStatutRef.current) { clearInterval(pollStatutRef.current); pollStatutRef.current = null; }
  }, []);

  // ── 0. Poll statut via endpoint dédié — fonctionne pour tous les rôles ───────
  useEffect(() => {
    const verifierStatut = async () => {
      try {
        const res = await fetch(`${API_BASE}/colis/${idColis}/statut`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { statutColis } = await res.json();
        if (STATUTS_TERMINES.includes(statutColis)) {
          setLivre(true);
          arreterTracking();
        }
      } catch {}
    };

    verifierStatut();
    pollStatutRef.current = setInterval(verifierStatut, 10_000);
    return () => { if (pollStatutRef.current) clearInterval(pollStatutRef.current); };
  }, [idColis, token, arreterTracking]);

  // ── 1. Charger Leaflet et initialiser la carte ───────────────────────────────
  useEffect(() => {
    let actif = true;
    chargerLeaflet()
      .then((L) => {
        if (!actif || !mapContainerRef.current || mapRef.current) return;
        const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([4.05, 9.7], 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        setCarteChargee(true);
      })
      .catch(() => setErreur(e => e || "Impossible de charger la carte."));

    return () => {
      actif = false;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!carteChargee) return;
    const handleResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [carteChargee]);

  // ── 2. Partager MA position en continu (arrêté si livré) ────────────────────
  useEffect(() => {
    if (!jePartage || livre) return;
    if (!navigator.geolocation) {
      setErreur(e => e || "La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    const envoyer = (lat, lon) => {
      fetch(`${API_BASE}/suivi/colis/${idColis}/position`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      }).catch(() => {});
    };
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPartage(true);
        const { latitude, longitude } = pos.coords;
        setMaPosition({ latitude, longitude, prenom: "Vous", nom: "", role: monRole });
        envoyer(latitude, longitude);
      },
      () => setErreur(e => e || "Impossible d'accéder à votre position."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [jePartage, idColis, token, monRole, livre]);

  // ── 3. Récupérer la position de l'autre (arrêté si livré) ───────────────────
  useEffect(() => {
    if (livre) return;
    let actif = true;
    const endpoint = monRole === "VOYAGEUR" ? "destinataire" : "voyageur";
    const charger = async () => {
      try {
        const res = await fetch(`${API_BASE}/suivi/colis/${idColis}/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const data = await res.json(); if (actif) setPositionCible(data); }
        else if (res.status === 404 && actif) {
          setErreur(e => e || (endpoint === "destinataire"
            ? "Le destinataire n'a pas encore partagé sa position."
            : "Le transporteur n'a pas encore partagé sa position."));
        }
      } catch {}
    };
    charger();
    pollCibleRef.current = setInterval(charger, 8000);
    return () => { actif = false; if (pollCibleRef.current) clearInterval(pollCibleRef.current); };
  }, [idColis, monRole, token, livre]);

  // ── 4. Calcul itinéraire OSRM ────────────────────────────────────────────────
  const calculerItineraire = useCallback(async (lat1, lon1, lat2, lon2) => {
    try {
      const url  = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error();
      const data  = await res.json();
      const route = data.routes?.[0];
      if (!route) throw new Error();
      const trace = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      setItineraire({ distanceKm: route.distance / 1000, dureeSec: route.duration, trace });
    } catch {
      setItineraire({ distanceKm: distanceHaversine(lat1, lon1, lat2, lon2), dureeSec: null, trace: null });
    }
  }, []);

  useEffect(() => {
    if (maPosition && positionCible && !livre) {
      calculerItineraire(
        Number(maPosition.latitude), Number(maPosition.longitude),
        Number(positionCible.latitude), Number(positionCible.longitude)
      );
    }
  }, [maPosition, positionCible, calculerItineraire, livre]);

  // ── 5. Dessin carte ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!carteChargee || !mapRef.current || !window.L) return;
    const L = window.L, map = mapRef.current;
    const iconMoi   = L.divIcon({ className: "", html: `<div style="background:#0d6efd;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px rgba(13,110,253,.4)"></div>`, iconSize: [16,16] });
    const iconAutre = L.divIcon({ className: "", html: `<div style="background:#198754;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px rgba(25,135,84,.4)"></div>`,  iconSize: [16,16] });
    const points = [];

    if (maPosition) {
      const ll = [Number(maPosition.latitude), Number(maPosition.longitude)];
      if (markersRef.current.moi) markersRef.current.moi.setLatLng(ll);
      else markersRef.current.moi = L.marker(ll, { icon: iconMoi }).addTo(map).bindPopup("Vous");
      points.push(ll);
    }
    if (positionCible) {
      const ll    = [Number(positionCible.latitude), Number(positionCible.longitude)];
      const label = `${positionCible.prenom || ""} ${positionCible.nom || ""}`.trim() || "Autre utilisateur";
      if (markersRef.current.autre) { markersRef.current.autre.setLatLng(ll); markersRef.current.autre.getPopup()?.setContent(label); }
      else markersRef.current.autre = L.marker(ll, { icon: iconAutre }).addTo(map).bindPopup(label);
      points.push(ll);
    }

    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    if (itineraire?.trace) routeLayerRef.current = L.polyline(itineraire.trace, { color: "#0d6efd", weight: 4, opacity: 0.8 }).addTo(map);
    else if (points.length === 2) routeLayerRef.current = L.polyline(points, { color: "#6c757d", weight: 2, dashArray: "6 8" }).addTo(map);

    if (points.length === 2 && !aDejaCadreRef.current) { map.fitBounds(points, { padding: [40,40] }); aDejaCadreRef.current = true; }
    else if (points.length === 1 && !aDejaCadreRef.current) { map.setView(points[0], 13); aDejaCadreRef.current = true; }
  }, [carteChargee, maPosition, positionCible, itineraire]);

  // ── Nettoyage au démontage ───────────────────────────────────────────────────
  useEffect(() => () => arreterTracking(), [arreterTracking]);

  const titreCarte = monRole === "VOYAGEUR" ? "Position du destinataire" : "Position du transporteur";
  const iconeCarte = monRole === "VOYAGEUR" ? <FaUserCircle /> : <FaTruck />;

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4">
          <div className="modal-header bg-primary text-white rounded-top-4">
            <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
              <FaMapMarkedAlt /> {titreCarte}
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body p-0">

            {/* Bannière livraison terminée */}
            {livre && (
              <div className="alert alert-success m-3 mb-0 d-flex align-items-center gap-2 fw-semibold">
                <FaCheckCircle size={18} />
                Colis livré — le suivi GPS a été arrêté automatiquement.
              </div>
            )}

            {!livre && jePartage && (
              <div className={`alert ${partage ? "alert-success" : "alert-warning"} m-3 mb-0 d-flex align-items-center gap-2 small`}>
                <FaLocationArrow />
                {partage ? "Votre position est partagée en direct." : "Activation de la géolocalisation..."}
              </div>
            )}

            {itineraire && !livre && (
              <div className="d-flex gap-3 m-3 mb-0">
                <div className="flex-grow-1 rounded-3 bg-primary bg-opacity-10 text-primary p-2 text-center small fw-semibold d-flex align-items-center justify-content-center gap-2">
                  <FaRoute /> {formatDistance(itineraire.distanceKm)}
                  {!itineraire.trace && <span className="text-muted fw-normal">(à vol d'oiseau)</span>}
                </div>
                {itineraire.dureeSec != null && (
                  <div className="flex-grow-1 rounded-3 bg-success bg-opacity-10 text-success p-2 text-center small fw-semibold d-flex align-items-center justify-content-center gap-2">
                    <FaClock /> {formatDuree(itineraire.dureeSec)}
                  </div>
                )}
              </div>
            )}

            {!livre && (
              <div className="px-3 pt-3 d-flex align-items-center gap-2 small text-muted">
                {iconeCarte} {positionCible ? `${positionCible.prenom || ""} ${positionCible.nom || ""}`.trim() : "En attente de position..."}
              </div>
            )}

            <div ref={mapContainerRef} style={{ width: "100%", height: 400 }} />

            {!carteChargee && <div className="text-center text-muted py-3 small">Chargement de la carte...</div>}
            {erreur && !livre && <div className="text-center text-danger small px-3 pb-2">{erreur}</div>}
            {positionCible && !livre && (
              <div className="text-muted small p-2 text-center">
                Dernière position reçue : {new Date(positionCible.datePosition).toLocaleTimeString("fr-FR")}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary rounded-pill" onClick={onClose}>
              <FaTimes className="me-1" /> Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
