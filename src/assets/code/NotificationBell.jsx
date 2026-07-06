import { useEffect, useRef, useState } from "react";
import {
  FaBell, FaCheckDouble, FaBoxOpen, FaUserCheck,
  FaTimesCircle, FaTimes, FaMoneyBillWave, FaTruck,
} from "react-icons/fa";
import { API_BASE } from "./config.js";

/* ── Icône selon le type de notification ─────────────────────────────── */
const icone = (type) => {
  switch (type) {
    case "POSTULATION":          return <FaUserCheck    className="text-primary" />;
    case "POSTULATION_ENVOYEE":  return <FaTruck        className="text-secondary" />;
    case "POSTULATION_REFUSEE":  return <FaTimesCircle  className="text-danger" />;
    case "TRANSPORTEUR_CHOISI":  return <FaCheckDouble  className="text-success" />;
    case "PAIEMENT_CONFIRME":
    case "PAIEMENT_EFFECTUE":
    case "LIVRAISON_CONFIRMEE":  return <FaMoneyBillWave className="text-success" />;
    default:                     return <FaBoxOpen       className="text-secondary" />;
  }
};

const fmtDate = (s) =>
  new Date(s).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

export default function NotificationBell({ onNavigateColis }) {
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [count, setCount]                 = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const wrapperRef = useRef(null);

  /* ── Polling compteur toutes les 20 s ──────────────────────────────── */
  useEffect(() => {
    if (!token) return;
    chargerCompteur();
    const iv = setInterval(chargerCompteur, 20000);
    return () => clearInterval(iv);
  }, [token]);

  /* ── Fermer en cliquant ailleurs ────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  /* ── Bloquer le scroll body quand ouvert sur mobile ─────────────────── */
  useEffect(() => {
    if (window.innerWidth < 640) {
      document.body.style.overflow = open ? "hidden" : "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const chargerCompteur = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/non-lues/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (res.ok) setCount((await res.json()).count ?? 0);
    } catch { /* silencieux */ }
  };

  const chargerNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (res.ok) setNotifications(await res.json());
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) chargerNotifications();
  };

  const marquerToutesLues = async () => {
    try {
      await fetch(`${API_BASE}/notifications/lues`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, statut: "LU" })));
      setCount(0);
    } catch { /* silencieux */ }
  };

  const marquerLu = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/lu`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
      });
      setNotifications((prev) =>
        prev.map((n) => n.idNotification === id ? { ...n, statut: "LU" } : n)
      );
      setCount((c) => Math.max(0, c - 1));
    } catch { /* silencieux */ }
  };

  const supprimerNotif = async (e, id) => {
    e.stopPropagation(); // ne pas déclencher handleClickNotif
    try {
      await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
      });
      setNotifications((prev) => prev.filter((n) => n.idNotification !== id));
      setCount((c) => Math.max(0, c - 1));
    } catch { /* silencieux */ }
  };

  const supprimerToutes = async () => {
    try {
      await fetch(`${API_BASE}/notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
      });
      setNotifications([]);
      setCount(0);
    } catch { /* silencieux */ }
  };

  const handleClickNotif = (n) => {
    if (n.statut === "ENVOYE") marquerLu(n.idNotification);
    setOpen(false);
    if (onNavigateColis) onNavigateColis(n);
  };

  /* ─────────────────────────────────────────────────────────────────────
     Contenu du panneau (partagé desktop + mobile)
  ───────────────────────────────────────────────────────────────────── */
  const panneau = (
    <>
      {/* Header du panneau */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px 10px",
        borderBottom: "1px solid #E9EDEF",
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111B21" }}>
          Notifications {count > 0 && (
            <span style={{
              background: "#EF4444", color: "#fff",
              borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
              padding: "1px 7px", marginLeft: 6,
            }}>{count}</span>
          )}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {count > 0 && (
            <button onClick={marquerToutesLues} style={{ border: "none", background: "none", color: "#2563EB", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: 0 }}>
              Tout lire
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={supprimerToutes} style={{ border: "none", background: "none", color: "#EF4444", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: 0 }}>
              Tout supprimer
            </button>
          )}
          <button onClick={() => setOpen(false)} className="d-md-none" style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B", padding: "2px 4px", lineHeight: 1 }} aria-label="Fermer">
            <FaTimes size={17} />
          </button>
        </div>
      </div>

      {/* Corps */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "#94A3B8" }}>
            <div className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 16px",
            color: "#94A3B8", fontSize: "0.85rem",
          }}>
            <FaBell size={28} style={{ opacity: 0.25, display: "block", margin: "0 auto 10px" }} />
            Aucune notification
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.idNotification}
              onClick={() => handleClickNotif(n)}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 16px",
                borderBottom: "1px solid #F1F5F9",
                cursor: "pointer",
                background: n.statut === "ENVOYE" ? "#F8FAFF" : "#fff",
                transition: "background 0.12s",
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F1F5F9"}
              onMouseLeave={(e) => e.currentTarget.style.background = n.statut === "ENVOYE" ? "#F8FAFF" : "#fff"}
            >
              {/* Icône */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#F1F5F9",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 15,
              }}>
                {icone(n.typeNotif)}
              </div>

              {/* Texte */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "0.84rem", color: "#111B21",
                  lineHeight: 1.4,
                  fontWeight: n.statut === "ENVOYE" ? 600 : 400,
                }}>
                  {n.contenu}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: 3 }}>
                  {fmtDate(n.dateNotification)}
                </div>
              </div>

              {/* Point bleu non lu */}
              {n.statut === "ENVOYE" && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0, marginTop: 6 }} />
              )}
              {/* Bouton supprimer */}
              <button
                onClick={(e) => supprimerNotif(e, n.idNotification)}
                title="Supprimer"
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  color: "#CBD5E1", padding: "2px", lineHeight: 1, flexShrink: 0,
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                onMouseLeave={e => e.currentTarget.style.color = "#CBD5E1"}
              >
                <FaTimes size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────── */
  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>

      {/* ── Bouton cloche ─────────────────────────────────────────────── */}
      <button
        onClick={toggleOpen}
        title="Notifications"
        style={{
          width: 40, height: 40,
          borderRadius: "50%",
          border: "1.5px solid #E2E8F0",
          background: open ? "#EEF2FF" : "#fff",
          color: open ? "#2563EB" : "#64748B",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative",
          transition: "background 0.15s, color 0.15s",
          flexShrink: 0,
        }}
      >
        <FaBell size={17} />
        {count > 0 && (
          <span style={{
            position: "absolute",
            top: -3, right: -3,
            background: "#EF4444", color: "#fff",
            borderRadius: 999, fontSize: "0.6rem", fontWeight: 700,
            minWidth: 17, height: 17,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #fff",
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP — dropdown classique (≥ 640px)
      ════════════════════════════════════════════════════════════════ */}
      {open && (
        <div
          className="d-none d-sm-flex"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            maxHeight: 440,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
            border: "1px solid #E9EDEF",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {panneau}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MOBILE — bottom sheet plein écran (< 640px)
      ════════════════════════════════════════════════════════════════ */}
      {open && (
        <>
          {/* Overlay sombre */}
          <div
            className="d-sm-none"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 1998,
            }}
          />

          {/* Sheet du bas */}
          <div
            className="d-sm-none"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
              zIndex: 1999,
              display: "flex",
              flexDirection: "column",
              maxHeight: "80vh",
              /* Petite poignée en haut */
            }}
          >
            {/* Poignée */}
            <div style={{
              display: "flex", justifyContent: "center",
              paddingTop: 10, paddingBottom: 4, flexShrink: 0,
            }}>
              <div style={{
                width: 40, height: 4,
                borderRadius: 2, background: "#CBD5E1",
              }} />
            </div>
            {panneau}
          </div>
        </>
      )}
    </div>
  );
}
