import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {UPLOADS_BASE } from "./config.js";
import { API_BASE,authHeaders } from "./config.js";
import { 
  FaUsers, FaBoxOpen, FaMoneyBillWave, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaClock, FaSignOutAlt, FaBell,
  FaSearch, FaEye, FaBan, FaUnlock, FaTrash, FaFilter,
  FaIdCard, FaChartBar, FaShieldAlt, FaTruck, FaPaperPlane,
  FaAngleDown, FaUserCheck, FaBoxes
} from "react-icons/fa";

const C = {
  primary:   "#2563EB",
  secondary: "#F59E0B",
  success:   "#16A34A",
  danger:    "#DC2626",
  warning:   "#D97706",
  dark:      "#0F172A",
  gray:      "#64748B",
  light:     "#F8FAFC",
  white:     "#FFFFFF",
  border:    "#E2E8F0",
};

const Badge = ({ statut }) => {
  const map = {
    ACTIF:        { bg: "#DCFCE7", color: "#166534", label: "Actif"        },
    EN_ATTENTE:   { bg: "#FEF9C3", color: "#854D0E", label: "En attente"   },
    SUSPENDU:     { bg: "#FEE2E2", color: "#991B1B", label: "Suspendu"     },
    EN_COURS:     { bg: "#DBEAFE", color: "#1E40AF", label: "En cours"     },
    OUVERT:       { bg: "#FEF9C3", color: "#854D0E", label: "Ouvert"       },
    RESOLU:       { bg: "#DCFCE7", color: "#166534", label: "Résolu"       },
    FERME:        { bg: "#F1F5F9", color: "#475569", label: "Fermé"        },
    SEQUESTRE:    { bg: "#EDE9FE", color: "#5B21B6", label: "Séquestre"    },
    LIBERE:       { bg: "#DCFCE7", color: "#166534", label: "Libéré"       },
    REMBOURSE:    { bg: "#FEF9C3", color: "#854D0E", label: "Remboursé"    },
    VALIDE:       { bg: "#DCFCE7", color: "#166534", label: "Validé"       },
    REFUSE:       { bg: "#FEE2E2", color: "#991B1B", label: "Refusé"       },
    LIVRE:        { bg: "#DCFCE7", color: "#166534", label: "Livré"        },
    ANNULE:       { bg: "#FEE2E2", color: "#991B1B", label: "Annulé"       },
  };
  const s = map[statut] || { bg: "#F1F5F9", color: "#475569", label: statut };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600
    }}>{s.label}</span>
  );
};

const StatCard = ({ icon, label, value, sub, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.white, borderRadius: 16, padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)", cursor: onClick ? "pointer" : "default",
      borderLeft: `4px solid ${color}`, transition: "box-shadow 0.2s",
      display: "flex", alignItems: "center", gap: 16, minWidth: 0,
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)")}
    onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)")}
  >
    <div style={{
      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
      background: color + "18", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <span style={{ color, fontSize: 22 }}>{icon}</span>
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.dark, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.gray, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate  = useNavigate();
  const token     = localStorage.getItem("token");

  const [onglet,   setOnglet]   = useState("dashboard"); 
  const [stats,    setStats]    = useState(null);
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [erreur,   setErreur]   = useState("");
  const [succes,   setSucces]   = useState("");
  const [search,   setSearch]   = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [litigeGere, setLitigeGere] = useState(null); // litige ouvert dans le panneau admin

  // Notification broadcast
  const [msgBroadcast, setMsgBroadcast] = useState("");
  const [envoiBcast,   setEnvoiBcast]   = useState(false);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    chargerStats();
  }, []);

  useEffect(() => {
    if (onglet !== "dashboard") chargerDonnees(onglet);
  }, [onglet]);

 const api = async (path, opts = {}) => {
  
  const headers = authHeaders(opts.headers || {});

  const res = await fetch(`${API_BASE}/admin${path}`, {
    ...opts,
    headers: headers,
  });

  if (res.status === 401 || res.status === 403) {
    console.error("Session invalide, déconnexion...");
    localStorage.removeItem("token");
    navigate("/login");
    return null;
  }

  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
};

  const chargerStats = async () => {
    try { setStats(await api("/stats")); } catch {}
  };

  const chargerDonnees = async (section) => {
    const sectionsAvecAPI = ["utilisateurs", "colis", "litiges", "paiements", "verifications"];
    if (!sectionsAvecAPI.includes(section)) return;
    setLoading(true); setErreur("");
    try {
      const map = {
        utilisateurs:  "/utilisateurs",
        colis:         "/colis",
        litiges:       "/litiges",
        paiements:     "/paiements",
        verifications: "/verifications",
      };
      const d = await api(map[section]);
      if (d) setData(d);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  };

  const afficherSucces = (msg) => { setSucces(msg); setTimeout(() => setSucces(""), 3000); };

  // ── Actions utilisateur ──────────────────────────────────────────────────
  const changerStatutUser = async (id, statut) => {
    try {
      await api(`/utilisateurs/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut }) });
      afficherSucces(`Compte ${statut === "ACTIF" ? "activé" : statut === "SUSPENDU" ? "suspendu" : "mis à jour"} avec succès.`);
      chargerDonnees("utilisateurs");
      chargerStats();
    } catch (e) { setErreur(e.message); }
  };

  const supprimerUser = async (id, nom) => {
    if (!window.confirm(`Supprimer définitivement ${nom} ?`)) return;
    try {
      await api(`/utilisateurs/${id}`, { method: "DELETE" });
      afficherSucces("Utilisateur supprimé.");
      chargerDonnees("utilisateurs");
      chargerStats();
    } catch (e) { setErreur(e.message); }
  };

  // ── Actions vérifications ─────────────────────────────────────────────
  const validerVerif = async (id) => {
    try {
      await api(`/verifications/${id}`, { method: "PATCH", body: JSON.stringify({ decision: "VALIDE" }) });
      afficherSucces("Identité validée. Compte activé automatiquement.");
      chargerDonnees("verifications");
      chargerStats();
    } catch (e) { setErreur(e.message); }
  };

  const refuserVerif = async (id) => {
    try {
      await api(`/verifications/${id}`, { method: "PATCH", body: JSON.stringify({ decision: "REFUSE" }) });
      afficherSucces("Vérification refusée.");
      chargerDonnees("verifications");
    } catch (e) { setErreur(e.message); }
  };

  // ── Actions litiges ───────────────────────────────────────────────────
  const changerStatutLitige = async (id, statut) => {
    try {
      await api(`/litiges/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut }) });
      afficherSucces("Statut du litige mis à jour.");
      chargerDonnees("litiges");
    } catch (e) { setErreur(e.message); }
  };

  // ── Broadcast ─────────────────────────────────────────────────────────
  const envoyerBroadcast = async () => {
    if (!msgBroadcast.trim()) return;
    setEnvoiBcast(true);
    try {
      const r = await api("/notifications/broadcast", { method: "POST", body: JSON.stringify({ contenu: msgBroadcast }) });
      afficherSucces(r?.message || "Notification envoyée !");
      setMsgBroadcast("");
    } catch (e) { setErreur(e.message); } finally { setEnvoiBcast(false); }
  };

  const allerVers = (id) => {
    setOnglet(id);
    setFiltreStatut("");
    setSearch("");
    setMenuOuvert(false);
  };

  // ── Filtrage côté frontend ────────────────────────────────────────────
  const donneesFiltrees = () => {
    let liste = [...data];

    // Filtre texte (utilisateurs)
    if (search.trim()) {
      const q = search.toLowerCase();
      liste = liste.filter(item =>
        (item.nom        || "").toLowerCase().includes(q) ||
        (item.prenom     || "").toLowerCase().includes(q) ||
        (item.email      || "").toLowerCase().includes(q) ||
        (item.numeroPrincipal || "").toLowerCase().includes(q) ||
        (item.description     || "").toLowerCase().includes(q) ||
        (item.villeDepart     || "").toLowerCase().includes(q) ||
        (item.villeArrive     || "").toLowerCase().includes(q)
      );
    }

    // Filtre statut (autres sections)
    if (filtreStatut) {
      liste = liste.filter(item =>
        item.statusCompte      === filtreStatut ||
        item.statutColis       === filtreStatut ||
        item.statutPaiement    === filtreStatut ||
        item.statutLitige      === filtreStatut ||
        item.statutVerification === filtreStatut
      );
    }

    return liste;
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const profilUrl = (f) => f ? `${UPLOADS_BASE}/profils/${f}` : null;

  // ── Sidebar nav items ─────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard",     icon: <FaChartBar />,            label: "Tableau de bord"     },
    { id: "utilisateurs",  icon: <FaUsers />,               label: "Utilisateurs"         },
    { id: "verifications", icon: <FaIdCard />,              label: "Vérifications"        },
    { id: "colis",         icon: <FaBoxes />,               label: "Colis"                },
    { id: "paiements",     icon: <FaMoneyBillWave />,       label: "Paiements"            },
    { id: "litiges",       icon: <FaExclamationTriangle />, label: "Litiges"              },
    { id: "notifications", icon: <FaBell />,                label: "Notifications"        },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Poppins', sans-serif", background: C.light }}>

      {/* ── STYLES RESPONSIVE MOBILE (ne touche pas le desktop) ── */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important;
            top: 56px !important;
            left: 0 !important;
            height: calc(100vh - 56px) !important;
            width: 240px !important;
            z-index: 1050 !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease !important;
          }
          .admin-sidebar.ouvert {
            transform: translateX(0) !important;
          }
          .admin-main {
            padding: 16px 12px !important;
            margin-top: 56px !important;
          }
          .admin-topbar {
            display: flex !important;
          }
          .stat-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .stat-card-value {
            font-size: 20px !important;
          }
          .actions-rapides {
            flex-direction: column !important;
          }
          .actions-rapides button {
            width: 100% !important;
            justify-content: center !important;
          }
          .verif-grid {
            grid-template-columns: 1fr !important;
          }
          .litige-row {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .litige-actions {
            flex-direction: row !important;
            flex-wrap: wrap !important;
          }
          .notif-card {
            max-width: 100% !important;
          }
          .section-header h1 {
            font-size: 18px !important;
          }
        }
        .admin-overlay { display: none; }
        .admin-topbar  { display: none; }
      `}</style>

      {/* ── TOPBAR MOBILE (hamburger) — invisible sur desktop ── */}
      <div className="admin-topbar" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 56,
        background: C.dark, zIndex: 1060,
        alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.white }}>
          <span style={{ color: C.secondary }}>Colis</span>ender
        </div>
        <button
          onClick={() => setMenuOuvert(v => !v)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: C.white, fontSize: 22, display: "flex", alignItems: "center",
          }}
        >
          {menuOuvert ? "✕" : "☰"}
        </button>
      </div>

      {/* ── OVERLAY mobile (fond sombre quand menu ouvert) ── */}
      <div
        className="admin-overlay"
        onClick={() => setMenuOuvert(false)}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1040, top: 56,
          display: menuOuvert ? "block" : "none",
          pointerEvents: menuOuvert ? "auto" : "none",
        }}
      />

      {/* ── SIDEBAR ── */}
      <aside
        className={`admin-sidebar${menuOuvert ? " ouvert" : ""}`}
        style={{
          width: 240, background: C.dark, color: "#CBD5E1", display: "flex",
          flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>
            <span style={{ color: C.secondary }}>Colis</span>ender
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
            Administration
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(n => (
            <button
              key={n.id}
              onClick={() => allerVers(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                background: onglet === n.id ? C.primary : "transparent",
                color:      onglet === n.id ? C.white  : "#94A3B8",
                fontWeight: onglet === n.id ? 700 : 500,
                fontSize: 14, textAlign: "left", transition: "all 0.15s",
                width: "100%",
              }}
              onMouseEnter={e => { if (onglet !== n.id) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { if (onglet !== n.id) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: "#F87171", fontWeight: 600,
              fontSize: 14, width: "100%", transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="admin-main" style={{ flex: 1, padding: "32px 28px", minWidth: 0, overflowX: "hidden" }}>

        {/* Alertes */}
        {succes && (
          <div style={{ background: "#DCFCE7", color: "#166534", borderRadius: 10, padding: "12px 18px",
                        marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <FaCheckCircle /> {succes}
          </div>
        )}
        {erreur && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 10, padding: "12px 18px",
                        marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><FaExclamationTriangle className="me-2" />{erreur}</span>
            <button onClick={() => setErreur("")} style={{ border: "none", background: "none", color: "#991B1B", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        )}
        {onglet === "dashboard" && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: 0 }}>Tableau de bord</h1>
              <p style={{ color: C.gray, marginTop: 4, fontSize: 14 }}>Vue d'ensemble de la plateforme Colisender</p>
            </div>

            {stats ? (
              <>
                <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
                  <StatCard
  icon={<FaUsers />}
  color={C.primary}
  label="Utilisateurs"
  value={stats.totalUtilisateurs}
  sub={`${stats.utilisateursActifs} actifs`}
  onClick={() => setOnglet("utilisateurs")}
/>

<StatCard
  icon={<FaClock />}
  color={C.warning}
  label="En attente"
  value={stats.utilisateursEnAttente}
  sub="à vérifier"
  onClick={() => {
    setOnglet("utilisateurs");
  }}
/>

<StatCard
  icon={<FaBoxOpen />}
  color={C.secondary}
  label="Total colis"
  value={stats.totalColis}
  sub={`${stats.colisEnCours} en cours`}
  onClick={() => setOnglet("colis")}
/>

<StatCard
  icon={<FaTruck />}
  color={C.success}
  label="Colis livrés"
  value={stats.colisLivres}
  sub="livraisons réussies"
  onClick={() => setOnglet("colis")}
/>

<StatCard
  icon={<FaMoneyBillWave />}
  color={C.success}
  label="Chiffre d'aff."
  value={`${Math.round(stats.montantTotal || 0).toLocaleString()} FCFA`}
  sub="montants libérés"
  onClick={() => setOnglet("paiements")}
/>

<StatCard
  icon={<FaExclamationTriangle />}
  color={C.danger}
  label="Litiges ouverts"
  value={stats.litigesOuverts}
  sub={`${stats.litigesEnCours} en cours`}
  onClick={() => setOnglet("litiges")}
/></div>

                {/* Actions rapides */}
                <div style={{ background: C.white, borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 16 }}>Actions rapides</h2>
                  <div className="actions-rapides" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "Vérifier identités",    icon: <FaIdCard />,    action: () => setOnglet("verifications"), color: C.primary   },
                      { label: "Gérer litiges",          icon: <FaShieldAlt />, action: () => setOnglet("litiges"),       color: C.danger    },
                      { label: "Voir les paiements",     icon: <FaMoneyBillWave />, action: () => setOnglet("paiements"), color: C.success   },
                      { label: "Envoyer notification",   icon: <FaBell />,      action: () => setOnglet("notifications"), color: C.secondary },
                    ].map(a => (
                      <button key={a.label} onClick={a.action} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${a.color}`,
                        background: a.color + "10", color: a.color, fontWeight: 600,
                        fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = a.color; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = a.color + "10"; e.currentTarget.style.color = a.color; }}
                      >
                        {a.icon} {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: C.gray }}>
                <div className="spinner-border text-primary" />
                <p style={{ marginTop: 12 }}>Chargement des statistiques...</p>
              </div>
            )}
          </>
        )}

      
        {onglet === "utilisateurs" && (
          <>
            <SectionHeader title="Gestion des utilisateurs" sub={`${donneesFiltrees().length} utilisateur${donneesFiltrees().length !== 1 ? "s" : ""}`} />
            <BarreRecherche
              search={search} onSearch={setSearch}
              onRechercher={() => chargerDonnees("utilisateurs")}
            />
            <TableCard loading={loading}>
              <thead>
                <tr style={{ background: C.light }}>
                  {["Utilisateur", "Email", "Téléphone", "Colis", "Statut", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: 0.5, border: "none", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donneesFiltrees().map(u => (
                  <tr key={u.idUtilisateur} style={{ borderTop: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                          background: C.primary + "22", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700, color: C.primary
                        }}>
                          {profilUrl(u.photoProfil)
                            ? <img src={profilUrl(u.photoProfil)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <>{u.prenom?.[0]}{u.nom?.[0]}</>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: C.dark }}>{u.prenom} {u.nom}</div>
                          <div style={{ fontSize: 11, color: C.gray }}>{new Date(u.dateCreation).toLocaleDateString("fr-FR")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray }}>{u.email}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray }}>{u.numeroPrincipal}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ background: C.primary + "18", color: C.primary, borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{u.nbColis}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}><Badge statut={u.statusCompte} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {u.statusCompte !== "ACTIF" && (
                          <BtnAction label="Activer" icon={<FaUnlock />} color={C.success} onClick={() => changerStatutUser(u.idUtilisateur, "ACTIF")} />
                        )}
                        {u.statusCompte !== "SUSPENDU" && (
                          <BtnAction label="Suspendre" icon={<FaBan />} color={C.danger} onClick={() => changerStatutUser(u.idUtilisateur, "SUSPENDU")} />
                        )}
                        <BtnAction label="Supprimer" icon={<FaTrash />} color="#DC2626" onClick={() => supprimerUser(u.idUtilisateur, `${u.prenom} ${u.nom}`)} danger />
                      </div>
                    </td>
                  </tr>
                ))}
                {donneesFiltrees().length === 0 && !loading && <EmptyRow cols={6} />}
              </tbody>
            </TableCard>
          </>
        )}

        {/* ════════════ VÉRIFICATIONS D'IDENTITÉ ════════════ */}
        {onglet === "verifications" && (
          <>
            <SectionHeader title="Vérifications d'identité" sub="Validez ou refusez les demandes KYC" />
            <BarreRechercheFiltre
              filtreStatut={filtreStatut} onFiltreStatut={setFiltreStatut}
              optionsStatut={["EN_ATTENTE", "VALIDE", "REFUSE"]}
              onRechercher={() => chargerDonnees("verifications")}
            />
            <div className="verif-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {donneesFiltrees().map(v => (
                <div key={v.idVerification} style={{ background: C.white, borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                      {v.nomUtilisateur || `Vérification #${v.idVerification?.toString().slice(-6)}`}
                    </div>
                    <Badge statut={v.statutVerification} />
                  </div>

                  {/* Infos utilisateur */}
                  <div style={{ marginBottom: 12 }}>
                    {v.email && (
                      <div style={{ fontSize: 12, color: C.gray, marginBottom: 2 }}>
                        📧 {v.email}
                      </div>
                    )}
                    {v.numeroPrincipal && (
                      <div style={{ fontSize: 12, color: C.gray, marginBottom: 2 }}>
                        📞 {v.numeroPrincipal}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: C.gray }}>
                      Soumis le {new Date(v.dateSoumission).toLocaleDateString("fr-FR")}
                      {v.scoreCorrespondance && (
                        <span style={{ marginLeft: 8, background: "#DBEAFE", color: "#1E40AF", padding: "1px 8px", borderRadius: 99 }}>
                          Score: {v.scoreCorrespondance}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Photos CNI + Selfie — clés exactes du backend : photoRectoCNI, photoVersoCNI, photoSelfie */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    {[
                      { label: "Recto CNI", url: v.photoRectoCNI },
                      { label: "Verso CNI", url: v.photoVersoCNI },
                      { label: "Selfie",    url: v.photoSelfie   },
                    ].map(p => p.url && (
                      <a key={p.label} href={`${UPLOADS_BASE}/cni/${p.url}`} target="_blank" rel="noreferrer"
                         style={{ display: "block", flex: "1 1 80px" }}>
                        <img src={`${UPLOADS_BASE}/cni/${p.url}`} alt={p.label}
                             style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
                        <div style={{ fontSize: 10, color: C.gray, textAlign: "center", marginTop: 2 }}>{p.label}</div>
                      </a>
                    ))}
                    {!v.photoRectoCNI && !v.photoVersoCNI && !v.photoSelfie && (
                      <div style={{ fontSize: 12, color: C.gray, fontStyle: "italic" }}>Aucune photo soumise.</div>
                    )}
                  </div>

                  {v.statutVerification === "EN_ATTENTE" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => validerVerif(v.idVerification)} style={{
                        flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                        background: C.success, color: C.white, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Poppins', sans-serif"
                      }}>
                        <FaCheckCircle style={{ marginRight: 6 }} />Valider
                      </button>
                      <button onClick={() => refuserVerif(v.idVerification)} style={{
                        flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                        background: C.danger, color: C.white, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Poppins', sans-serif"
                      }}>
                        <FaTimesCircle style={{ marginRight: 6 }} />Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {donneesFiltrees().length === 0 && !loading && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: C.gray }}>
                  <FaIdCard size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p>Aucune vérification en attente.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════ COLIS ════════════ */}
        {onglet === "colis" && (
          <>
            <SectionHeader title="Gestion des colis" sub={`${data.length} colis`} />
            <BarreRechercheFiltre
              filtreStatut={filtreStatut} onFiltreStatut={setFiltreStatut}
              optionsStatut={["EN_ATTENTE", "EN_COURS", "LIVRE", "ANNULE"]}
              onRechercher={() => chargerDonnees("colis")}
            />
            <TableCard loading={loading}>
              <thead>
                <tr style={{ background: C.light }}>
                  {["Trajet", "Description", "Poids", "Prix", "Date", "Statut"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: 0.5, border: "none", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donneesFiltrees().map(c => (
                  <tr key={c.idColis} style={{ borderTop: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>{c.villeDepart} → {c.villeArrive}</div>
                      <div style={{ fontSize: 11, color: C.gray }}>{c.adresseRecuperation}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.description || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray }}>{c.poids} kg</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.success }}>{c.prixTransport?.toLocaleString()} FCFA</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.gray }}>{c.dateCreation ? new Date(c.dateCreation).toLocaleDateString("fr-FR") : "—"}</td>
                    <td style={{ padding: "12px 16px" }}><Badge statut={c.statutColis} /></td>
                  </tr>
                ))}
                {donneesFiltrees().length === 0 && !loading && <EmptyRow cols={6} />}
              </tbody>
            </TableCard>
          </>
        )}

        {/* ════════════ PAIEMENTS ════════════ */}
        {onglet === "paiements" && (
          <>
            <SectionHeader title="Gestion des paiements" sub={`${donneesFiltrees().length} transaction${donneesFiltrees().length !== 1 ? "s" : ""}`} />
            <BarreRechercheFiltre
              filtreStatut={filtreStatut} onFiltreStatut={setFiltreStatut}
              optionsStatut={["EN_ATTENTE", "SEQUESTRE", "LIBERE", "REMBOURSE"]}
              onRechercher={() => chargerDonnees("paiements")}
            />
            <TableCard loading={loading}>
              <thead>
                <tr style={{ background: C.light }}>
                  {["Référence", "Montant", "Méthode", "Numéro", "Date", "Statut"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: 0.5, border: "none", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donneesFiltrees().map(p => (
                  <tr key={p.idPaiement} style={{ borderTop: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.gray, fontFamily: "monospace" }}>
                      {p.referenceCampay ? p.referenceCampay.slice(0, 12) + "…" : p.idPaiement?.toString().slice(-8)}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: C.success, fontSize: 14 }}>{p.montant?.toLocaleString()} FCFA</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray }}>{p.methodePaiement?.replace("_", " ")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray }}>{p.numeroTelephone || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.gray }}>{p.date ? new Date(p.date).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td style={{ padding: "12px 16px" }}><Badge statut={p.statutPaiement} /></td>
                  </tr>
                ))}
                {donneesFiltrees().length === 0 && !loading && <EmptyRow cols={6} />}
              </tbody>
            </TableCard>
          </>
        )}

        {/* ════════════ LITIGES ════════════ */}
        {onglet === "litiges" && (
          <>
            <SectionHeader title="Gestion des litiges" sub={`${donneesFiltrees().length} litige${donneesFiltrees().length !== 1 ? "s" : ""}`} />
            <BarreRechercheFiltre
              filtreStatut={filtreStatut} onFiltreStatut={setFiltreStatut}
              optionsStatut={["OUVERT", "EN_COURS", "RESOLU", "FERME"]}
              onRechercher={() => chargerDonnees("litiges")}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {donneesFiltrees().map(l => (
                <div key={l.idLitige} className="litige-row" style={{ background: C.white, borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "start", gap: 16, borderLeft: `4px solid ${l.statutLitige === "OUVERT" ? C.danger : l.statutLitige === "EN_COURS" ? C.primary : l.statutLitige === "RESOLU" ? C.success : C.gray}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: C.danger + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FaExclamationTriangle style={{ color: C.danger, fontSize: 20 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                        {l.villeDepart && l.villeArrive
                          ? `${l.villeDepart} → ${l.villeArrive}`
                          : `Litige #${l.idLitige?.toString().slice(-6)}`}
                      </div>
                      <Badge statut={l.statutLitige} />
                    </div>
                    {l.nomExpediteur && (
                      <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginBottom: 4 }}>
                        👤 {l.nomExpediteur}
                        {l.nomTransporteur && <span style={{ color: C.gray, fontWeight: 400 }}> · Transporteur : {l.nomTransporteur}</span>}
                      </div>
                    )}
                    <p style={{ fontSize: 13, color: C.gray, margin: "0 0 10px", lineHeight: 1.6 }}>{l.description}</p>
                    <div style={{ fontSize: 12, color: C.gray }}>{new Date(l.dateCreation).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <div className="litige-actions" style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, minWidth: 90 }}>
                    {l.statutLitige !== "RESOLU" && l.statutLitige !== "FERME" && (
                      <button
                        onClick={() => setLitigeGere(l)}
                        style={{
                          padding: "7px 14px", borderRadius: 8, border: "none",
                          background: C.primary, color: C.white,
                          fontWeight: 700, fontSize: 12, cursor: "pointer",
                          fontFamily: "'Poppins', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <FaShieldAlt size={12} /> Gérer
                      </button>
                    )}
                    {l.statutLitige === "RESOLU" && (
                      <span style={{ fontSize: 12, color: C.success, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                        <FaCheckCircle /> Résolu
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {donneesFiltrees().length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: 56, color: C.gray, background: C.white, borderRadius: 16 }}>
                  <FaShieldAlt size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p>Aucun litige trouvé.</p>
                </div>
              )}
            </div>

            {/* ── Panneau Gérer le litige (modal admin) ── */}
            {litigeGere && (
              <div style={{ position: "fixed", inset: 0, zIndex: 1080, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", fontFamily: "'Poppins', sans-serif", overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ background: C.dark, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: C.white, fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <FaShieldAlt /> Gérer le litige
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>
                        #{litigeGere.idLitige?.toString().slice(-8)}
                      </div>
                    </div>
                    <button onClick={() => setLitigeGere(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.white }}>
                      <FaTimesCircle />
                    </button>
                  </div>
                  {/* Corps */}
                  <div style={{ padding: "20px 24px" }}>
                    {litigeGere.villeDepart && (
                      <div style={{ fontSize: 13, color: C.primary, fontWeight: 600, marginBottom: 8 }}>
                        📦 {litigeGere.villeDepart} → {litigeGere.villeArrive}
                      </div>
                    )}
                    {litigeGere.nomExpediteur && (
                      <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>
                        👤 Expéditeur : <strong>{litigeGere.nomExpediteur}</strong>
                        {litigeGere.nomTransporteur && <> · Transporteur : <strong>{litigeGere.nomTransporteur}</strong></>}
                      </div>
                    )}
                    <div style={{ background: C.light, borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: C.dark, lineHeight: 1.7 }}>
                      {litigeGere.description}
                    </div>
                    <div style={{ fontSize: 12, color: C.gray, marginBottom: 20 }}>
                      Soumis le {new Date(litigeGere.dateCreation).toLocaleDateString("fr-FR")} · Statut : <Badge statut={litigeGere.statutLitige} />
                    </div>
                    {/* Actions */}
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Changer le statut :</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {litigeGere.statutLitige === "OUVERT" && (
                        <button onClick={async () => {
                          await changerStatutLitige(litigeGere.idLitige, "EN_COURS");
                          setLitigeGere({ ...litigeGere, statutLitige: "EN_COURS" });
                        }} style={{ flex: "1 1 140px", padding: "10px 0", borderRadius: 10, border: "none", background: C.primary, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Poppins', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <FaEye /> Prendre en charge
                        </button>
                      )}
                      {(litigeGere.statutLitige === "OUVERT" || litigeGere.statutLitige === "EN_COURS") && (
                        <button onClick={async () => {
                          await changerStatutLitige(litigeGere.idLitige, "RESOLU");
                          setLitigeGere(null);
                          chargerDonnees("litiges");
                        }} style={{ flex: "1 1 140px", padding: "10px 0", borderRadius: 10, border: "none", background: C.success, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Poppins', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <FaCheckCircle /> Marquer résolu
                        </button>
                      )}
                      <button onClick={async () => {
                        await changerStatutLitige(litigeGere.idLitige, "FERME");
                        setLitigeGere(null);
                        chargerDonnees("litiges");
                      }} style={{ flex: "1 1 100px", padding: "10px 0", borderRadius: 10, border: `1.5px solid ${C.gray}`, background: "transparent", color: C.gray, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Poppins', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <FaTimesCircle /> Fermer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════ NOTIFICATIONS ════════════ */}
        {onglet === "notifications" && (
          <>
            <SectionHeader title="Notifications" sub="Envoyez une notification à tous les utilisateurs" />
            <div className="notif-card" style={{ background: C.white, borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", maxWidth: 600 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
                <FaBell style={{ marginRight: 8, color: C.secondary }} />Broadcast global
              </h3>
              <p style={{ fontSize: 13, color: C.gray, marginBottom: 18 }}>
                Ce message sera envoyé en notification à <strong>tous</strong> les utilisateurs de la plateforme.
              </p>
              <textarea
                value={msgBroadcast}
                onChange={e => setMsgBroadcast(e.target.value)}
                placeholder="Saisissez votre message..."
                rows={4}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10, boxSizing: "border-box",
                  border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'Poppins', sans-serif",
                  color: C.dark, resize: "vertical", outline: "none", marginBottom: 14
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button
                onClick={envoyerBroadcast}
                disabled={envoiBcast || !msgBroadcast.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 24px", borderRadius: 10, border: "none",
                  background: msgBroadcast.trim() ? C.primary : "#CBD5E1",
                  color: C.white, fontWeight: 700, fontSize: 14, cursor: msgBroadcast.trim() ? "pointer" : "not-allowed",
                  fontFamily: "'Poppins', sans-serif", transition: "background 0.15s",
                }}
              >
                {envoiBcast ? <span className="spinner-border spinner-border-sm" /> : <FaPaperPlane />}
                Envoyer à tous
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Sous-composants réutilisables ────────────────────────────────────────────
const C2 = { primary: "#2563EB", gray: "#64748B", light: "#F8FAFC", border: "#E2E8F0", dark: "#0F172A" };

function SectionHeader({ title, sub }) {
  return (
    <div className="section-header" style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C2.dark, margin: 0 }}>{title}</h1>
      {sub && <p style={{ color: C2.gray, marginTop: 3, fontSize: 13 }}>{sub}</p>}
    </div>
  );
}

function BarreRecherche({ search, onSearch, onRechercher }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <FaSearch style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C2.gray, fontSize: 12, pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onRechercher()}
          placeholder="Rechercher..."
          style={{
            width: "100%", padding: "9px 12px 9px 30px", borderRadius: 10, boxSizing: "border-box",
            border: `1.5px solid ${C2.border}`, fontSize: 13, fontFamily: "'Poppins', sans-serif",
            outline: "none", color: C2.dark,
          }}
        />
      </div>
      <button onClick={onRechercher} style={{
        padding: "9px 20px", borderRadius: 10, border: "none", flexShrink: 0,
        background: C2.primary, color: "white", fontWeight: 700, cursor: "pointer",
        fontSize: 13, fontFamily: "'Poppins', sans-serif",
      }}>
        Filtrer
      </button>
    </div>
  );
}

function BarreRechercheFiltre({ filtreStatut, onFiltreStatut, optionsStatut, onRechercher }) {
  return (
    <div className="barre-recherche" style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      <div style={{ position: "relative" }}>
        <FaFilter style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C2.gray, pointerEvents: "none" }} />
        <select
          value={filtreStatut}
          onChange={e => { onFiltreStatut(e.target.value); setTimeout(onRechercher, 0); }}
          style={{
            padding: "9px 32px 9px 36px", borderRadius: 10, appearance: "none",
            border: `1.5px solid ${C2.border}`, fontSize: 13, fontFamily: "'Poppins', sans-serif",
            outline: "none", cursor: "pointer", color: C2.dark, background: "white",
          }}
        >
          <option value="">Tous les statuts</option>
          {optionsStatut.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <FaAngleDown style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C2.gray, pointerEvents: "none" }} />
      </div>
      <button onClick={onRechercher} style={{
        padding: "9px 20px", borderRadius: 10, border: "none",
        background: C2.primary, color: "white", fontWeight: 700, cursor: "pointer",
        fontSize: 13, fontFamily: "'Poppins', sans-serif",
      }}>
        Filtrer
      </button>
    </div>
  );
}

function TableCard({ children, loading }) {
  return (
    <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#64748B" }}>
          <div className="spinner-border text-primary" />
          <p style={{ marginTop: 10 }}>Chargement...</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
        </div>
      )}
    </div>
  );
}

function EmptyRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: "center", padding: 48, color: "#64748B" }}>
        <FaBoxOpen size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p style={{ margin: 0 }}>Aucun résultat trouvé.</p>
      </td>
    </tr>
  );
}

function BtnAction({ label, icon, color, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: 8, border: "none",
        background: color + (danger ? "" : "15"), color: danger ? "white" : color,
        fontWeight: 600, fontSize: 12, cursor: "pointer",
        fontFamily: "'Poppins', sans-serif", transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "white"; }}
      onMouseLeave={e => { e.currentTarget.style.background = danger ? color : color + "15"; e.currentTarget.style.color = danger ? "white" : color; }}
    >
      {icon} <span style={{ display: "none" }}>{label}</span>
    </button>
  );
}
