import { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaCommentDots, FaUserCircle } from "react-icons/fa";
import { API_BASE, UPLOADS_BASE } from "./config.js";
import "../style/chat.css";

const ROLE_LABEL = {
  EXPEDITEUR: "Expéditeur",
  VOYAGEUR: "Transporteur",
  DESTINATAIRE: "Destinataire",
};

export default function ChatPanel({ idColis, type, titre, onClose }) {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let actif = true;

    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/colis/${idColis}/${type}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setErreur(
            type === "voyageur-destinataire"
              ? "Cette discussion sera disponible si le destinataire possède un compte Colisender."
              : "La discussion sera disponible après confirmation du paiement."
          );
          setLoading(false);
          return;
        }
        const conv = await res.json();
        if (!actif) return;
        setConversation(conv);
        await chargerMessages(conv.idConversation);
        setLoading(false);
        pollRef.current = setInterval(() => chargerMessages(conv.idConversation), 4000);
      } catch {
        setErreur("Erreur réseau.");
        setLoading(false);
      }
    };

    const chargerMessages = async (convId) => {
      try {
        const res = await fetch(`${API_BASE}/chat/${convId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (actif) setMessages(data);
        }
      } catch {}
    };

    init();
    return () => { actif = false; if (pollRef.current) clearInterval(pollRef.current); };
  }, [idColis, type]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (!texte.trim() || !conversation) return;
    setEnvoi(true);
    try {
      const res = await fetch(`${API_BASE}/chat/${conversation.idConversation}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: texte.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setTexte("");
      }
    } catch {} finally {
      setEnvoi(false);
    }
  };

  const photoUrl = (filename) => filename ? `${UPLOADS_BASE}/profils/${filename}` : null;
  const interlocuteur = conversation?.participants?.[0];
  const titreAffiche = interlocuteur ? `${interlocuteur.prenom} ${interlocuteur.nom}` : (titre || "Messagerie");

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1065 }}>
      {/* Ajout de la classe chat-modal-dialog pour le responsive */}
      <div className="modal-dialog modal-dialog-centered chat-modal-dialog">
        <div className="modal-content chat-modal-content rounded-4 d-flex flex-column h-100">
          
          <div className="modal-header bg-primary text-white rounded-top-4">
            <div className="d-flex align-items-center gap-2">
              {interlocuteur && photoUrl(interlocuteur.photoProfil) ? (
                <img src={photoUrl(interlocuteur.photoProfil)} alt="" className="rounded-circle" style={{ width: 36, height: 36, objectFit: "cover" }} />
              ) : (
                <FaUserCircle size={36} />
              )}
              <div>
                <h6 className="modal-title mb-0">{titreAffiche}</h6>
                {interlocuteur && <small className="opacity-75">{ROLE_LABEL[interlocuteur.role] || interlocuteur.role}</small>}
                {conversation?.villeDepart && (
                  <div className="opacity-75" style={{ fontSize: "0.7rem" }}>Colis {conversation.villeDepart} → {conversation.villeArrive}</div>
                )}
              </div>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="flex-grow-1 p-3 overflow-auto bg-light d-flex flex-column gap-2">
            {loading ? (
              <div className="text-center text-muted my-auto"><div className="spinner-border spinner-border-sm me-2" />Chargement...</div>
            ) : erreur ? (
              <div className="text-center text-muted my-auto px-3">{erreur}</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted my-auto">Aucun message. Lancez la conversation !</div>
            ) : (
              messages.map((m) => (
                <div key={m.idMessage} className={`p-2 px-3 rounded-3 small ${m.idExpediteur === currentUserId ? "align-self-end bg-primary text-white" : "align-self-start bg-white border"}`} style={{ maxWidth: "85%" }}>
                  {m.contenu}
                  <div className={`mt-1 ${m.idExpediteur === currentUserId ? "text-white-50" : "text-muted"}`} style={{ fontSize: "0.65rem" }}>
                    {new Date(m.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={envoyer} className="p-3 border-top bg-white d-flex gap-2">
            <input type="text" className="form-control" placeholder="Écrire un message..." value={texte} onChange={(e) => setTexte(e.target.value)} disabled={loading || !!erreur} />
            <button className="btn btn-primary" disabled={loading || !!erreur || envoi || !texte.trim()}>
              {envoi ? <span className="spinner-border spinner-border-sm" /> : <FaPaperPlane />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}