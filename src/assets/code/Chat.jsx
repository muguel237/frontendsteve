import { useEffect, useState } from "react";
import {
  FaCommentDots, FaBoxOpen, FaTruck, FaUser,
  FaSearch,
} from "react-icons/fa";
import ChatPanel from "./ChatPanel";
import { API_BASE, UPLOADS_BASE } from "./config.js";
import "../style/chat.css";
 
const ROLE_LABEL = {
  EXPEDITEUR:   "Expéditeur",
  VOYAGEUR:     "Transporteur",
  DESTINATAIRE: "Destinataire",
};
 
const ROLE_ICON = {
  EXPEDITEUR:   <FaBoxOpen size={11} />,
  VOYAGEUR:     <FaTruck  size={11} />,
  DESTINATAIRE: <FaUser   size={11} />,
};
 
/** Initiales de secours quand pas de photo */
function AvatarFallback({ prenom, nom }) {
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";
  return <div className="chat-avatar-fallback">{initials}</div>;
}
 
/** Formate la date/heure du dernier message façon WhatsApp */
function fmtHeure(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffJours = Math.floor((now - d) / 86400000);
  if (diffJours === 0)
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffJours === 1) return "Hier";
  if (diffJours < 7)
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
 
export default function Chat() {
  const token = localStorage.getItem("token");
  const [conversations, setConversations]       = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [erreur, setErreur]                     = useState("");
  const [conversationOuverte, setConversationOuverte] = useState(null);
  const [recherche, setRecherche]               = useState("");
 
  useEffect(() => {
    chargerConversations();
    const iv = setInterval(chargerConversations, 10000);
    return () => clearInterval(iv);
  }, []);
 
  const chargerConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/mes-conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (res.ok) setConversations(await res.json());
      else setErreur("Impossible de charger vos conversations.");
    } catch {
      setErreur("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };
 
  const photoUrl = (f) => f ? `${UPLOADS_BASE}/profils/${f}` : null;
  const typeFragment = (t) =>
    t === "EXPEDITEUR_VOYAGEUR" ? "expediteur-voyageur" : "voyageur-destinataire";
 
  // Filtre par recherche (nom ou trajet)
  const convsFiltrees = conversations.filter((c) => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    const interlo = c.participants?.[0];
    const nom = `${interlo?.prenom ?? ""} ${interlo?.nom ?? ""}`.toLowerCase();
    const trajet = `${c.villeDepart ?? ""} ${c.villeArrive ?? ""}`.toLowerCase();
    return nom.includes(q) || trajet.includes(q);
  });
 
  // ── Vue messagerie ouverte ────────────────────────────────────────────
  if (conversationOuverte) {
    return (
      <ChatPanel
        idColis={conversationOuverte.idColis}
        type={typeFragment(conversationOuverte.typeConversation)}
        onClose={() => {
          setConversationOuverte(null);
          chargerConversations();
        }}
        pleinEcranMobile
      />
    );
  }
 
  // ── Liste des conversations ────────────────────────────────────────────
  return (
    <div className="chat-layout">
 
      {/* Header */}
      <div className="chat-list-header">
        <h3 className="d-flex align-items-center gap-2">
          <FaCommentDots /> Discussions
        </h3>
        {conversations.length > 0 && (
          <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>
            {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
 
      {/* Barre de recherche */}
      {conversations.length > 2 && (
        <div className="chat-search-bar">
          <div style={{ position: "relative" }}>
            <FaSearch
              size={13}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8696A0" }}
            />
            <input
              placeholder="Rechercher une discussion…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
      )}
 
      {/* Corps */}
      <div className="chat-conv-list">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
            <div className="spinner-border text-primary" />
          </div>
        ) : erreur ? (
          <div className="p-4 text-center text-danger small">{erreur}</div>
        ) : convsFiltrees.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center text-muted"
               style={{ height: 260, gap: 12 }}>
            <FaBoxOpen size={40} style={{ opacity: 0.25 }} />
            <p className="mb-0 text-center px-4" style={{ fontSize: "0.88rem" }}>
              {recherche
                ? "Aucune conversation ne correspond à votre recherche."
                : "Aucune discussion pour le moment.\nUne discussion s'ouvre dès qu'un paiement est confirmé."}
            </p>
          </div>
        ) : (
          convsFiltrees.map((conv) => {
            const interlo = conv.participants?.[0];
            const photo   = photoUrl(interlo?.photoProfil);
            const nonLus  = conv.nonLus ?? 0;
 
            return (
              <button
                key={conv.idConversation}
                className="chat-conv-item"
                onClick={() => setConversationOuverte(conv)}
              >
                {/* Avatar */}
                <div className="chat-conv-avatar">
                  {photo
                    ? <img src={photo} alt="" />
                    : <AvatarFallback prenom={interlo?.prenom} nom={interlo?.nom} />
                  }
                </div>
 
                {/* Corps */}
                <div className="chat-conv-body">
                  <div className="chat-conv-top">
                    <span className="chat-conv-name">
                      {interlo
                        ? `${interlo.prenom} ${interlo.nom}`
                        : "Discussion"}
                    </span>
                    <span className="chat-conv-time">
                      {fmtHeure(conv.dateDernierMessage)}
                    </span>
                  </div>
 
                  <div className="chat-conv-bottom">
                    <span className="chat-conv-last">
                      {conv.dernierMessage || (
                        <em style={{ opacity: 0.6 }}>Pas encore de message</em>
                      )}
                    </span>
                    {nonLus > 0
                      ? <span className="chat-unread-badge">{nonLus}</span>
                      : interlo?.role && (
                          <span className="chat-conv-role d-flex align-items-center gap-1">
                            {ROLE_ICON[interlo.role]}
                            {ROLE_LABEL[interlo.role] ?? interlo.role}
                          </span>
                        )
                    }
                  </div>
 
                  {/* Trajet (masqué sur très petit mobile via CSS) */}
                  {(conv.villeDepart || conv.villeArrive) && (
                    <div style={{ fontSize: "0.72rem", color: "#8696A0", marginTop: 1 }}>
                      {conv.villeDepart} → {conv.villeArrive}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}