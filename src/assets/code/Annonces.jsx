import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen, FaMapMarkerAlt, FaWeightHanging, FaRulerCombined,
  FaMoneyBillWave, FaPhoneAlt, FaUserCircle, FaTimes, FaPaperPlane,
  FaCheckCircle, FaKey, FaCommentDots, FaTruck, FaDownload,
  FaChevronLeft, FaChevronRight, FaSearchPlus, FaImages, FaSignInAlt
} from "react-icons/fa";
import ValiderOtp from "./ValiderOtp";

import { API_BASE, UPLOADS_BASE } from "./config.js";

// ─── Visualiseur plein écran style WhatsApp ────────────────────────────────
function PhotoViewer({ photos, indexInitial, onClose }) {
  const [index, setIndex] = useState(indexInitial);
  const [zoom, setZoom] = useState(false);

  const photo = photos[index];
  const url   = `${UPLOADS_BASE}/colis/${photo}`;

  const precedent  = useCallback(() => setIndex(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const suivant    = useCallback(() => setIndex(i => (i + 1) % photos.length),                  [photos.length]);

  // Navigation clavier (← →  Escape)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  precedent();
      if (e.key === "ArrowRight") suivant();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [precedent, suivant, onClose]);

  // Téléchargement de la photo affichée
  const telecharger = async () => {
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href  = URL.createObjectURL(blob);
      link.download = photo;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.96)",
        display: "flex", flexDirection: "column",
        userSelect: "none",
      }}
    >
      {/* ── Barre supérieure ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                 padding: "12px 16px", color: "#fff" }}
      >
        <span style={{ fontSize: 14, opacity: 0.8 }}>
          {index + 1} / {photos.length}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={telecharger}
            title="Télécharger"
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                     color: "#fff", padding: "7px 12px", cursor: "pointer", fontSize: 16 }}
          >
            <FaDownload />
          </button>
          <button
            onClick={() => setZoom(z => !z)}
            title={zoom ? "Réduire" : "Agrandir"}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                     color: "#fff", padding: "7px 12px", cursor: "pointer", fontSize: 16 }}
          >
            <FaSearchPlus />
          </button>
          <button
            onClick={onClose}
            title="Fermer"
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                     color: "#fff", padding: "7px 12px", cursor: "pointer", fontSize: 18 }}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* ── Zone image ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                 position: "relative", overflow: "hidden" }}
      >
        {/* Flèche gauche */}
        {photos.length > 1 && (
          <button
            onClick={precedent}
            style={{ position: "absolute", left: 12, zIndex: 10,
                     background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                     color: "#fff", width: 44, height: 44, fontSize: 20, cursor: "pointer",
                     display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FaChevronLeft />
          </button>
        )}

        <img
          src={url}
          alt={`Photo ${index + 1}`}
          draggable={false}
          onClick={() => setZoom(z => !z)}
          style={{
            maxWidth:  zoom ? "none" : "90vw",
            maxHeight: zoom ? "none" : "80vh",
            width:     zoom ? "auto" : undefined,
            height:    zoom ? "auto" : undefined,
            objectFit: "contain",
            borderRadius: zoom ? 0 : 8,
            cursor: zoom ? "zoom-out" : "zoom-in",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            transition: "all 0.25s ease",
          }}
        />

        {/* Flèche droite */}
        {photos.length > 1 && (
          <button
            onClick={suivant}
            style={{ position: "absolute", right: 12, zIndex: 10,
                     background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                     color: "#fff", width: 44, height: 44, fontSize: 20, cursor: "pointer",
                     display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      {/* ── Bande de miniatures ── */}
      {photos.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", gap: 8, padding: "12px 16px",
                   overflowX: "auto", justifyContent: "center" }}
        >
          {photos.map((p, i) => (
            <img
              key={i}
              src={`${UPLOADS_BASE}/colis/${p}`}
              alt=""
              onClick={() => setIndex(i)}
              style={{
                width: 56, height: 56, objectFit: "cover",
                borderRadius: 8, cursor: "pointer",
                border: i === index ? "2px solid #4f8ef7" : "2px solid transparent",
                opacity: i === index ? 1 : 0.55,
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Miniature cliquable dans la modal détails ─────────────────────────────
function GaleriePhotos({ photos, onOuvrirViewer }) {
  if (!photos?.length) return null;

  const telechargerToutes = async () => {
    for (const p of photos) {
      try {
        const url  = `${UPLOADS_BASE}/colis/${p}`;
        const res  = await fetch(url);
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href  = URL.createObjectURL(blob);
        link.download = p;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        // Petit délai pour éviter que le navigateur bloque les téléchargements
        await new Promise(r => setTimeout(r, 400));
      } catch {
        window.open(`${UPLOADS_BASE}/colis/${p}`, "_blank");
      }
    }
  };

  return (
    <div className="mt-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <label className="text-muted small d-flex align-items-center gap-1 mb-0">
          <FaImages /> Photos du colis ({photos.length})
        </label>
        <button
          className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1"
          onClick={telechargerToutes}
          title="Télécharger toutes les photos"
        >
          <FaDownload size={12} />
          Télécharger tout
        </button>
      </div>

      <div className="d-flex gap-2 flex-wrap">
        {photos.map((p, i) => (
          <div
            key={i}
            className="position-relative"
            style={{ width: 100, height: 100, cursor: "pointer" }}
          >
            <img
              src={`${UPLOADS_BASE}/colis/${p}`}
              alt={`Photo ${i + 1}`}
              className="rounded-3 shadow-sm w-100 h-100"
              style={{ objectFit: "cover", transition: "transform 0.15s" }}
              onClick={() => onOuvrirViewer(i)}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            />
            {/* Badge téléchargement individuel */}
            <a
              href={`${UPLOADS_BASE}/colis/${p}`}
              download={p}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res  = await fetch(`${UPLOADS_BASE}/colis/${p}`);
                  const blob = await res.blob();
                  const link = document.createElement("a");
                  link.href  = URL.createObjectURL(blob);
                  link.download = p;
                  link.click();
                  URL.revokeObjectURL(link.href);
                } catch {
                  window.open(`${UPLOADS_BASE}/colis/${p}`, "_blank");
                }
              }}
              title="Télécharger cette photo"
              className="position-absolute bottom-0 end-0 m-1 d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: 24, height: 24, background: "rgba(0,0,0,0.55)",
                       color: "#fff", textDecoration: "none", fontSize: 11 }}
            >
              <FaDownload />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function Annonces({ setPage }) {
  const token = localStorage.getItem("token");
  const estConnecte = !!token;
  const navigate = useNavigate();

  const [annonces,     setAnnonces]     = useState([]);
  const [mesTransports,setMesTransports]= useState([]);
  const [loading,      setLoading]      = useState(true);
  const [erreur,       setErreur]       = useState("");
  const [succes,       setSucces]       = useState("");
  const [colisDetail,  setColisDetail]  = useState(null);
  const [postulingId,  setPostulingId]  = useState(null);
  const [colisOtp,     setColisOtp]     = useState(null);

  // Viewer photos
  const [viewer, setViewer] = useState(null); // { photos, index }

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [filtreDepart,  setFiltreDepart]  = useState("");
  const [filtreArrivee, setFiltreArrivee] = useState("");
  const [filtrePoidsMax,setFiltrePoidsMax]= useState("");
  const [villesDepart,  setVillesDepart]  = useState([]); // liste dédupliquée
  const [villesArrivee, setVillesArrivee] = useState([]);

  useEffect(() => {
    chargerAnnonces();
    if (estConnecte) chargerMesTransports();
    else setLoading(false);
  }, []);

  // Fonction de recherche déclenchée manuellement ou à la frappe
  const rechercherAvecFiltres = () => {
    chargerAnnonces(filtreDepart, filtreArrivee, filtrePoidsMax);
  };

  const reinitialiserFiltres = () => {
    setFiltreDepart("");
    setFiltreArrivee("");
    setFiltrePoidsMax("");
    chargerAnnonces("", "", "");
  };

  const chargerAnnonces = async (depart = "", arrivee = "", poidsMax = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (depart)   params.append("villeDepart",  depart);
      if (arrivee)  params.append("villeArrivee", arrivee);
      if (poidsMax) params.append("poidsMax",     poidsMax);
      const url = `${API_BASE}/colis/annonces${params.toString() ? "?" + params : ""}`;
      // Pas de token requis : endpoint public pour les visiteurs non connectés
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Impossible de charger les annonces.");
      const data = await res.json();
      setAnnonces(data);
      setVillesDepart([...new Set(data.map(a => a.villeDepart).filter(Boolean))].sort());
      setVillesArrivee([...new Set(data.map(a => a.villeArrive).filter(Boolean))].sort());
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chargerMesTransports = async () => {
    try {
      const res = await fetch(`${API_BASE}/colis/mes-transports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMesTransports(await res.json());
    } catch {}
  };

  const postuler = async (idColis) => {
    // Visiteur non connecté → redirection vers la page de connexion
    if (!estConnecte) {
      navigate("/login");
      return;
    }
    setPostulingId(idColis);
    setErreur("");
    try {
      const res = await fetch(`${API_BASE}/colis/${idColis}/postuler`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnnonces(prev => prev.map(a => a.idColis === idColis ? { ...a, dejaPostule: true } : a));
        if (colisDetail?.idColis === idColis) setColisDetail(p => ({ ...p, dejaPostule: true }));
        setSucces("Candidature envoyée à l'expéditeur !");
        setTimeout(() => setSucces(""), 3500);
      } else if (res.status === 409) {
        setErreur("Vous avez déjà postulé pour ce colis.");
      } else {
        setErreur("Erreur lors de la candidature.");
      }
    } catch {
      setErreur("Erreur réseau.");
    } finally {
      setPostulingId(null);
    }
  };

  const ouvrirViewer = (photos, index) => setViewer({ photos, index });

  if (loading) return (
    <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border text-primary" />
    </div>
  );

  return (
    <div className="container mt-4 pb-5">
      {succes && <div className="alert alert-success">{succes}</div>}
      {erreur && (
        <div className="alert alert-danger alert-dismissible">
          {erreur}
          <button className="btn-close" onClick={() => setErreur("")}></button>
        </div>
      )}

      {/* ── MES TRANSPORTS EN COURS ─────────────────────────── */}
      {estConnecte && mesTransports.length > 0 && (
        <div className="mb-5">
          <h3 className="fw-bold text-success mb-3">
            <FaTruck className="me-2" />Mes transports en cours
          </h3>
          <div className="row g-3">
            {mesTransports.map(t => (
              <div className="col-md-6 col-lg-4" key={t.idColis}>
                <div className="card border-0 rounded-4 shadow-sm h-100" style={{ borderTop: "4px solid #198754" }}>
                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-bold">
                      <FaMapMarkerAlt className="text-success me-1" />
                      {t.villeDepart} → {t.villeArrive}
                    </h6>
                    <p className="text-muted small mb-1">
                      Expéditeur : {t.prenomExpediteur} {t.nomExpediteur}
                    </p>
                    <p className="small text-muted mb-1">Récupération : {t.adresseRecuperation}</p>
                    <p className="small text-muted mb-2">Livraison : {t.adresseLivraison}</p>
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      <span className={`badge ${t.paiementEffectue ? "bg-success" : "bg-warning text-dark"}`}>
                        {t.paiementEffectue ? "Paiement reçu" : "En attente de paiement"}
                      </span>
                      <span className="badge bg-secondary">{t.statutColis}</span>
                    </div>
                    {/* <div className="mt-auto d-flex gap-2 flex-wrap">
                      {t.paiementEffectue && t.statutColis !== "TERMINE" && (
                        <>
                          <button className="btn btn-outline-primary btn-sm rounded-pill"
                            onClick={() => setPage && setPage("chat")}>
                            <FaCommentDots className="me-1" />Chat
                          </button>
                          <button className="btn btn-success btn-sm rounded-pill"
                            onClick={() => setColisOtp(t)}>
                            <FaKey className="me-1" />Valider OTP
                          </button>
                        </>
                      )}
                      {t.statutColis === "TERMINE" && (
                        <span className="badge bg-success fs-6 py-2">✓ Livraison confirmée</span>
                      )}
                    </div> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <hr className="my-4" />
        </div>
      )}

      {/* ── ANNONCES DISPONIBLES ─────────────────────────────── */}
      <h2 className="mb-3 fw-bold text-primary">
        <FaBoxOpen className="me-2" />Annonces disponibles
      </h2>

      {/* ── BARRE DE FILTRES ─────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
        <div className="row g-2 align-items-end">
          {/* Ville de départ */}
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small mb-1">
              <FaMapMarkerAlt className="text-primary me-1" />Ville de départ
            </label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control rounded-pill"
                placeholder="Ex : Douala"
                value={filtreDepart}
                onChange={e => setFiltreDepart(e.target.value)}
                onKeyDown={e => e.key === "Enter" && rechercherAvecFiltres()}
                list="villes-depart-list"
              />
              <datalist id="villes-depart-list">
                {villesDepart.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>

          {/* Ville d'arrivée */}
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small mb-1">
              <FaMapMarkerAlt className="text-success me-1" />Ville d'arrivée
            </label>
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Ex : Yaoundé"
              value={filtreArrivee}
              onChange={e => setFiltreArrivee(e.target.value)}
              onKeyDown={e => e.key === "Enter" && rechercherAvecFiltres()}
              list="villes-arrivee-list"
            />
            <datalist id="villes-arrivee-list">
              {villesArrivee.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          {/* Poids max */}
          <div className="col-12 col-md-2">
            <label className="form-label fw-semibold small mb-1">
              <FaWeightHanging className="text-secondary me-1" />Poids max (kg)
            </label>
            <input
              type="number"
              min="0"
              className="form-control rounded-pill"
              placeholder="Ex : 10"
              value={filtrePoidsMax}
              onChange={e => setFiltrePoidsMax(e.target.value)}
              onKeyDown={e => e.key === "Enter" && rechercherAvecFiltres()}
            />
          </div>

          {/* Boutons */}
          <div className="col-12 col-md-2 d-flex gap-2">
            <button
              className="btn btn-primary rounded-pill flex-grow-1"
              onClick={rechercherAvecFiltres}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : "Filtrer"}
            </button>
            {(filtreDepart || filtreArrivee || filtrePoidsMax) && (
              <button
                className="btn btn-outline-secondary rounded-pill"
                onClick={reinitialiserFiltres}
                title="Réinitialiser"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Résumé filtre actif */}
        {(filtreDepart || filtreArrivee || filtrePoidsMax) && (
          <div className="mt-2 small text-muted d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-semibold">Filtres actifs :</span>
            {filtreDepart  && <span className="badge bg-primary bg-opacity-10 text-primary">{filtreDepart} (départ)</span>}
            {filtreArrivee && <span className="badge bg-success bg-opacity-10 text-success">{filtreArrivee} (arrivée)</span>}
            {filtrePoidsMax && <span className="badge bg-secondary bg-opacity-10 text-secondary">≤ {filtrePoidsMax} kg</span>}
            <span className="text-muted">— {annonces.length} résultat{annonces.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {annonces.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FaBoxOpen size={40} className="mb-3 opacity-25" />
          <p className="fs-5">Aucune annonce disponible pour le moment.</p>
        </div>
      ) : (
        <div className="row g-4">
          {annonces.map(a => (
            <div className="col-md-6 col-lg-4" key={a.idColis}>
              <div className="card shadow-sm border-0 rounded-4 h-100">

                {/* Miniature de la 1re photo si disponible */}
                {a.photos?.length > 0 ? (
                  <div
                    className="position-relative"
                    style={{ height: 140, cursor: "pointer" }}
                    onClick={() => ouvrirViewer(a.photos, 0)}
                  >
                    <img
                      src={`${UPLOADS_BASE}/colis/${a.photos[0]}`}
                      alt="colis"
                      className="w-100 h-100 rounded-top-4"
                      style={{ objectFit: "cover" }}
                    />
                    {a.photos.length > 1 && (
                      <span
                        className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75"
                        style={{ fontSize: "0.7rem" }}
                      >
                        <FaImages className="me-1" />+{a.photos.length - 1}
                      </span>
                    )}
                    {/* Bouton télécharger tout (visible au survol) */}
                    <a
                      href={`${UPLOADS_BASE}/colis/${a.photos[0]}`}
                      download={a.photos[0]}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        for (const p of a.photos) {
                          try {
                            const res  = await fetch(`${UPLOADS_BASE}/colis/${p}`);
                            const blob = await res.blob();
                            const link = document.createElement("a");
                            link.href  = URL.createObjectURL(blob);
                            link.download = p;
                            link.click();
                            URL.revokeObjectURL(link.href);
                            await new Promise(r => setTimeout(r, 400));
                          } catch {
                            window.open(`${UPLOADS_BASE}/colis/${p}`, "_blank");
                          }
                        }
                      }}
                      title="Télécharger les photos"
                      className="position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1 rounded-pill px-2 py-1"
                      style={{ background: "rgba(0,0,0,0.55)", color: "#fff",
                               textDecoration: "none", fontSize: 12 }}
                    >
                      <FaDownload size={11} />
                    </a>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center rounded-top-4 bg-light"
                       style={{ height: 80 }}>
                    <FaBoxOpen size={32} className="text-muted opacity-25" />
                  </div>
                )}

                <div className="card-body d-flex flex-column">
                  {/* Expéditeur */}
                  <div className="d-flex align-items-center mb-2">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2 flex-shrink-0 fw-bold"
                      style={{ width: 36, height: 36, overflow: "hidden" }}
                    >
                      {a.photoExpediteur
                        ? <img src={`${UPLOADS_BASE}/profils/${a.photoExpediteur}`} alt="profil"
                               style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <>{a.prenomExpediteur?.[0]?.toUpperCase()}{a.nomExpediteur?.[0]?.toUpperCase()}</>}
                    </div>
                    <div>
                      <div className="fw-semibold small">{a.prenomExpediteur} {a.nomExpediteur}</div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>Expéditeur</div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-1">
                    <FaMapMarkerAlt className="text-primary me-1" />
                    {a.villeDepart} → {a.villeArrive}
                  </h6>
                  <p className="text-muted small mb-2" style={{ minHeight: "2.5em" }}>
                    {a.description || "Pas de description."}
                  </p>
                  <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
                    <span><FaWeightHanging className="me-1" />{a.poids} kg</span>
                    {a.dimension && <span><FaRulerCombined className="me-1" />{a.dimension} cm</span>}
                    <span className="text-success fw-semibold">
                      <FaMoneyBillWave className="me-1" />{a.prixTransport} FCFA
                    </span>
                  </div>

                  <div className="mt-auto d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm rounded-pill flex-grow-1"
                      onClick={() => setColisDetail(a)}
                    >
                      Voir les détails
                    </button>
                    {!estConnecte ? (
                      <button
                        className="btn btn-primary btn-sm rounded-pill"
                        onClick={() => navigate("/login")}
                      >
                        <FaSignInAlt className="me-1" />Postuler
                      </button>
                    ) : a.dejaPostule ? (
                      <button className="btn btn-success btn-sm rounded-pill" disabled>
                        <FaCheckCircle className="me-1" />Postulé
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm rounded-pill"
                        onClick={() => postuler(a.idColis)}
                        disabled={postulingId === a.idColis}
                      >
                        {postulingId === a.idColis
                          ? <span className="spinner-border spinner-border-sm" />
                          : <><FaPaperPlane className="me-1" />Postuler</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL DÉTAILS ──────────────────────────────────── */}
      {colisDetail && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-4">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <FaBoxOpen />Détails du colis
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setColisDetail(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Départ</label>
                    <div className="fw-semibold">{colisDetail.villeDepart}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Arrivée</label>
                    <div className="fw-semibold">{colisDetail.villeArrive}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Récupération</label>
                    <div className="fw-semibold">{colisDetail.adresseRecuperation}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Livraison</label>
                    <div className="fw-semibold">{colisDetail.adresseLivraison}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Poids</label>
                    <div className="fw-semibold">{colisDetail.poids} kg</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Dimension</label>
                    <div className="fw-semibold">
                      {colisDetail.dimension ? `${colisDetail.dimension} cm` : "—"}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Prix</label>
                    <div className="fw-semibold text-success">{colisDetail.prixTransport} FCFA</div>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small">Description</label>
                    <div className="fw-semibold">{colisDetail.description || "—"}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">
                      <FaPhoneAlt className="me-1" />Tél. destinataire
                    </label>
                    <div className="fw-semibold">{colisDetail.telephoneDestinataire || "—"}</div>
                  </div>
                </div>

                {/* ── Galerie avec zoom et téléchargement ── */}
                <GaleriePhotos
                  photos={colisDetail.photos}
                  onOuvrirViewer={(i) => ouvrirViewer(colisDetail.photos, i)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary rounded-pill" onClick={() => setColisDetail(null)}>
                  <FaTimes className="me-1" />Fermer
                </button>
                {!estConnecte ? (
                  <button
                    className="btn btn-primary rounded-pill"
                    onClick={() => navigate("/login")}
                  >
                    <FaSignInAlt className="me-1" />Se connecter pour postuler
                  </button>
                ) : colisDetail.dejaPostule ? (
                  <button className="btn btn-success rounded-pill" disabled>
                    <FaCheckCircle className="me-1" />Déjà postulé
                  </button>
                ) : (
                  <button
                    className="btn btn-primary rounded-pill"
                    onClick={() => postuler(colisDetail.idColis)}
                    disabled={postulingId === colisDetail.idColis}
                  >
                    {postulingId === colisDetail.idColis
                      ? <span className="spinner-border spinner-border-sm" />
                      : <><FaPaperPlane className="me-1" />Postuler</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VALIDATION OTP ─────────────────────────── */}
      {colisOtp && (
        <ValiderOtp
          colis={colisOtp}
          onClose={() => setColisOtp(null)}
          onSuccess={() => { chargerMesTransports(); setColisOtp(null); }}
        />
      )}

      {/* ── VISUALISEUR PLEIN ÉCRAN ──────────────────────── */}
      {viewer && (
        <PhotoViewer
          photos={viewer.photos}
          indexInitial={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
