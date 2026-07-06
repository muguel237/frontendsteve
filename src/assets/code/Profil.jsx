import { useState, useEffect, useRef } from "react";
import { FaLock, FaCamera, FaCheckCircle, FaTimesCircle, FaUserCircle } from "react-icons/fa";
import "../style/Profil.css";
import { API_BASE, UPLOADS_BASE } from "./config.js";

export default function Profil() {
  // ── Récupération des données d'authentification ─────────────────────────────
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // ── États du composant ──────────────────────────────────────────────────────
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numeroPrincipal, setNumeroPrincipal] = useState("");
  const [numeroSecondaire, setNumeroSecondaire] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [alerteNumeros, setAlerteNumeros] = useState(null);
  const [alertePhoto, setAlertePhoto] = useState(null);

  const fileInputRef = useRef(null);

  // ── Initialisation : Chargement du profil ──────────────────────────────────
  useEffect(() => {
    if (!userId || !token) {
      setLoading(false);
      return;
    }
    chargerProfil();
  }, [userId, token]);

  // ── Gestion des alertes temporaires ────────────────────────────────────────
  useEffect(() => {
    if (alerteNumeros) {
      const t = setTimeout(() => setAlerteNumeros(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alerteNumeros]);

  useEffect(() => {
    if (alertePhoto) {
      const t = setTimeout(() => setAlertePhoto(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertePhoto]);

  // ── Logique API : Charger le profil ────────────────────────────────────────
  const chargerProfil = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profil/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Profil introuvable");
      const data = await res.json();
      console.log("Données reçues de l'API :", data);
      // Construire l'URL complète de la photo
      if (data.photoProfil && !data.photoProfil.startsWith("http")) {
        data.photoProfil = `${UPLOADS_BASE}/profils/${data.photoProfil}`;
      }
      setProfil(data);
      setNumeroPrincipal(data.numeroPrincipal || "");
      setNumeroSecondaire(data.numeroSecondaire || "");
    } catch (err) {
      console.error("Erreur chargement profil :", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Logique API : Sauvegarder numéros ──────────────────────────────────────
  const sauvegarderNumeros = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlerteNumeros(null);

    try {
      const res = await fetch(`${API_BASE}/profil/${userId}/numeros`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ numeroPrincipal, numeroSecondaire }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfil((prev) => ({ ...prev, ...data }));
        setAlerteNumeros({ type: "success", message: "Numéros mis à jour avec succès !" });
      } else {
        setAlerteNumeros({ type: "error", message: data.message || "Erreur mise à jour." });
      }
    } catch {
      setAlerteNumeros({ type: "error", message: "Erreur de connexion serveur." });
    } finally {
      setSaving(false);
    }
  };

  // ── Logique API : Changer photo ────────────────────────────────────────────
  const changerPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoUploading(true);
    setAlertePhoto(null);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`${API_BASE}/profil/${userId}/photo`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        const nouvelleUrl = data.photoProfil
          ? `${UPLOADS_BASE}/profils/${data.photoProfil}?t=${Date.now()}`
          : null;
        setProfil((prev) => ({ ...prev, photoProfil: nouvelleUrl }));
        setAlertePhoto({ type: "success", message: "Photo de profil mise à jour !" });
      } else {
        setAlertePhoto({ type: "error", message: "Erreur lors de l'upload." });
      }
    } catch {
      setAlertePhoto({ type: "error", message: "Erreur serveur." });
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  // ── Gestion des vues ───────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="profil-page">
        <div className="profil-card text-center">
          <FaUserCircle size={60} color="#cbd5e1" />
          <h4 className="mt-3">Non connecté</h4>
          <a href="/login" className="btn btn-primary-cocolis">Se connecter</a>
        </div>
      </div>
    );
  }

  if (loading) return <div className="profil-page text-center">Chargement...</div>;

  return (
    <div className="profil-page">
      <div className="profil-card">
        <div className="profil-header">
          <div className="profil-photo-wrapper" onClick={() => !photoUploading && fileInputRef.current?.click()}>
            {photoUploading ? <div className="spinner-border text-primary" /> : (
              <img src={profil?.photoProfil || "/default-avatar.png"} alt="Profil" className="profil-photo" />
            )}
            <div className="profil-photo-overlay"><FaCamera /><span>Modifier</span></div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={changerPhoto} className="d-none" />
          <h2 className="profil-name">{profil?.prenom} {profil?.nom}</h2>
          <span className={`profil-badge ${profil?.statusCompte === "ACTIF" ? "profil-badge-actif" : ""}`}>
            {profil?.statusCompte}
          </span>
        </div>

        {alertePhoto && <div className={alertePhoto.type === "success" ? "alert alert-success" : "alert alert-danger"}>{alertePhoto.message}</div>}

        <hr />

        <div className="mb-4">
          <h5>Informations personnelles</h5>
          <div className="row g-3">
            <div className="col-sm-6">
              <label>Nom</label>
              <div className="profil-field-readonly">{profil?.nom}</div>
            </div>
            <div className="col-sm-6">
              <label>Prénom</label>
              <div className="profil-field-readonly">{profil?.prenom}</div>
            </div>
            <div className="col-12">
              <label>Email</label>
              <div className="profil-field-readonly">{profil?.email}</div>
            </div>
          </div>
        </div>

        <form onSubmit={sauvegarderNumeros}>
          <div className="row g-3">
            <div className="col-sm-6">
              <label>Numéro principal *</label>
              <input type="tel" className="profil-input" value={numeroPrincipal} onChange={(e) => setNumeroPrincipal(e.target.value)} required />
            </div>
            <div className="col-sm-6">
              <label>Numéro secondaire</label>
              <input type="tel" className="profil-input" value={numeroSecondaire} onChange={(e) => setNumeroSecondaire(e.target.value)} />
            </div>
            {alerteNumeros && <div className={`col-12 alert ${alerteNumeros.type === "success" ? "alert-success" : "alert-danger"}`}>{alerteNumeros.message}</div>}
            <div className="col-12 text-end">
              <button type="submit" className="btn-profil-save" disabled={saving}>
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}