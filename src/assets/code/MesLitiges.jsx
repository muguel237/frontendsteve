import { useState, useEffect } from "react";
import {
  FaExclamationTriangle, FaTimes, FaCheckCircle, FaShieldAlt,
  FaClock, FaBoxOpen, FaPaperPlane, FaPlus, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { API_BASE } from "./config.js";

const C = {
  primary: "#2563EB",
  success: "#16A34A",
  danger:  "#DC2626",
  warning: "#D97706",
  gray:    "#64748B",
  dark:    "#0F172A",
  light:   "#F8FAFC",
  border:  "#E2E8F0",
  white:   "#FFFFFF",
};

const STATUT_INFO = {
  OUVERT:   { bg: "#FEF9C3", color: "#854D0E", label: "Ouvert",   icon: <FaClock size={11} /> },
  EN_COURS: { bg: "#DBEAFE", color: "#1E40AF", label: "En cours", icon: <FaShieldAlt size={11} /> },
  RESOLU:   { bg: "#DCFCE7", color: "#166534", label: "Résolu",   icon: <FaCheckCircle size={11} /> },
  FERME:    { bg: "#F1F5F9", color: "#475569", label: "Fermé",    icon: <FaTimes size={11} /> },
};

export default function MesLitiges() {
  const token = localStorage.getItem("token");

  const [mesLitiges,    setMesLitiges]    = useState([]);
  const [mesColis,      setMesColis]      = useState([]);
  const [chargement,    setChargement]    = useState(true);
  const [formulaire,    setFormulaire]    = useState(false); // afficher/cacher le formulaire
  const [idColis,       setIdColis]       = useState("");
  const [description,   setDescription]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [succes,        setSucces]        = useState("");
  const [erreur,        setErreur]        = useState("");

  // ── Charger mes litiges ───────────────────────────────────────────────────
  const charger = async () => {
    setChargement(true);
    try {
      const res = await fetch(`${API_BASE}/litiges/mes-litiges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMesLitiges(await res.json());
    } catch {}
    finally { setChargement(false); }
  };

  // ── Charger mes colis (pour le select) ───────────────────────────────────
  useEffect(() => {
    charger();
    const chargerColis = async () => {
      try {
        const res = await fetch(`${API_BASE}/colis/mes-colis`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setMesColis(await res.json());
      } catch {}
    };
    chargerColis();
  }, []);

  // ── Soumettre un litige ───────────────────────────────────────────────────
  const soumettre = async (e) => {
    e.preventDefault();
    if (!description.trim()) { setErreur("Veuillez décrire votre problème."); return; }
    setLoading(true); setErreur(""); setSucces("");
    try {
      const res = await fetch(`${API_BASE}/litiges`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ idColis: idColis || null, description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Erreur lors de la soumission.");
      setSucces("Votre litige a bien été soumis. Un administrateur va le traiter.");
      setDescription(""); setIdColis(""); setFormulaire(false);
      charger(); // recharger la liste
    } catch (err) {
      setErreur(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", maxWidth: 680, margin: "0 auto", padding: "0 4px" }}>

      {/* ── En-tête ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(17px, 4vw, 22px)", fontWeight: 800, color: C.dark, margin: 0 }}>
            Mes litiges
          </h1>
          <p style={{ color: C.gray, fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            Signalez un problème ou suivez vos réclamations.
          </p>
        </div>
        <button
          onClick={() => { setFormulaire(f => !f); setErreur(""); setSucces(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
            padding: "10px 16px", borderRadius: 10, border: "none", flexShrink: 0,
            background: formulaire ? C.gray : C.danger, color: C.white,
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            boxShadow: "0 2px 8px rgba(220,38,38,0.2)",
          }}
        >
          {formulaire ? <><FaChevronUp size={12} /> Annuler</> : <><FaPlus size={12} /> Nouveau litige</>}
        </button>
      </div>

      {/* ── Message succès global ── */}
      {succes && (
        <div style={{ background: "#DCFCE7", color: "#166534", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13 }}>
          <FaCheckCircle /> {succes}
        </div>
      )}

      {/* ── Formulaire nouveau litige (dépliable) ── */}
      {formulaire && (
        <div style={{ background: C.white, borderRadius: 16, padding: "20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: `1.5px solid ${C.danger}20` }}>
          <h6 style={{ fontWeight: 700, color: C.dark, marginBottom: 16, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <FaExclamationTriangle style={{ color: C.danger }} /> Décrire votre problème
          </h6>
          <form onSubmit={soumettre}>
            {erreur && (
              <div style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                {erreur}
              </div>
            )}

            {/* Sélection colis (facultatif) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 6 }}>
                Colis concerné <span style={{ color: C.gray, fontWeight: 400 }}>(facultatif)</span>
              </label>
              <div style={{ position: "relative" }}>
                <FaBoxOpen style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.gray, pointerEvents: "none", fontSize: 13 }} />
                <select
                  value={idColis}
                  onChange={e => setIdColis(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10,
                    border: `1.5px solid ${C.border}`, fontSize: 13,
                    fontFamily: "'Poppins', sans-serif", color: C.dark,
                    background: C.white, outline: "none", boxSizing: "border-box",
                  }}
                >
                  <option value="">-- Sélectionnez un colis (optionnel) --</option>
                  {mesColis.map(c => (
                    <option key={c.idColis} value={c.idColis}>
                      {c.villeDepart} → {c.villeArrive} — {c.statutColis}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 6 }}>
                Description du problème <span style={{ color: C.danger }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez votre problème en détail : que s'est-il passé, quand, avec qui..."
                required
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10, boxSizing: "border-box",
                  border: `1.5px solid ${C.border}`, fontSize: 13,
                  fontFamily: "'Poppins', sans-serif", color: C.dark,
                  resize: "vertical", outline: "none", lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>
                {description.length}/500 caractères
              </div>
            </div>

            {/* Info */}
            <div style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#1E40AF", lineHeight: 1.6 }}>
              ℹ️ Votre litige sera traité par un administrateur dans les meilleurs délais. Vous serez notifié à chaque changement de statut.
            </div>

            <button
              type="submit"
              disabled={loading || !description.trim()}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
                background: loading || !description.trim() ? "#CBD5E1" : C.primary,
                color: C.white, fontWeight: 700, fontSize: 14, cursor: loading || !description.trim() ? "not-allowed" : "pointer",
                fontFamily: "'Poppins', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm" /> Envoi...</>
                : <><FaPaperPlane size={13} /> Soumettre le litige</>}
            </button>
          </form>
        </div>
      )}

      {/* ── Liste mes litiges ── */}
      {chargement && (
        <div style={{ textAlign: "center", padding: 48, color: C.gray }}>
          <div className="spinner-border text-primary" />
          <p style={{ marginTop: 12, fontSize: 13 }}>Chargement...</p>
        </div>
      )}

      {!chargement && mesLitiges.length === 0 && (
        <div style={{ textAlign: "center", padding: 56, color: C.gray, background: C.white, borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <FaExclamationTriangle size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 14, marginBottom: 4 }}>Vous n'avez soumis aucun litige.</p>
          <p style={{ fontSize: 13 }}>Cliquez sur <strong>"Nouveau litige"</strong> si vous avez un problème à signaler.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mesLitiges.map(l => {
          const s = STATUT_INFO[l.statutLitige] || { bg: "#F1F5F9", color: "#475569", label: l.statutLitige, icon: null };
          return (
            <div key={l.idLitige} style={{
              background: C.white, borderRadius: 14, padding: "16px 18px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              borderLeft: `4px solid ${s.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  {(l.villeDepart || l.villeArrive) && (
                    <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <FaBoxOpen size={11} /> {l.villeDepart} → {l.villeArrive}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.gray, fontFamily: "monospace" }}>
                    Réf. #{l.idLitige?.toString().slice(-8)}
                  </div>
                </div>
                <span style={{
                  background: s.bg, color: s.color,
                  padding: "3px 12px", borderRadius: 99, fontSize: 11,
                  fontWeight: 700, display: "flex", alignItems: "center",
                  gap: 4, whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {s.icon} {s.label}
                </span>
              </div>
              <p style={{ fontSize: 13, color: C.dark, margin: "0 0 10px", lineHeight: 1.6 }}>
                {l.description}
              </p>
              <div style={{ fontSize: 11, color: C.gray }}>
                Soumis le {new Date(l.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
