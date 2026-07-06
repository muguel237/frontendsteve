import { useState } from "react";
import { FaCommentDots, FaTimes, FaUserCircle, FaTruck, FaBoxOpen } from "react-icons/fa";
import ChatPanel from "./ChatPanel";

/**
 * ChoixChatModal — petite fenêtre permettant de choisir AVEC QUI discuter
 * pour un colis donné, avant d'ouvrir le ChatPanel correspondant.
 *
 * Props :
 *  - colis : { idColis, villeDepart, villeArrive, ... }
 *  - monRole : "EXPEDITEUR" | "VOYAGEUR" | "DESTINATAIRE"
 *  - onClose
 */
export default function ChoixChatModal({ colis, monRole, onClose }) {
  const [chatOuvert, setChatOuvert] = useState(null); // "expediteur-voyageur" | "voyageur-destinataire"

  if (chatOuvert) {
    return (
      <ChatPanel
        idColis={colis.idColis}
        type={chatOuvert}
        titre={chatOuvert === "expediteur-voyageur" ? "Discussion transport" : "Discussion livraison"}
        onClose={onClose}
      />
    );
  }

  // Options disponibles selon le rôle
  const options = [];
  if (monRole === "EXPEDITEUR") {
    options.push({
      type: "expediteur-voyageur",
      label: "Discuter avec le transporteur",
      icon: <FaTruck />,
    });
  }
  if (monRole === "VOYAGEUR") {
    options.push({
      type: "expediteur-voyageur",
      label: "Discuter avec l'expéditeur",
      icon: <FaBoxOpen />,
    });
    options.push({
      type: "voyageur-destinataire",
      label: "Discuter avec le destinataire",
      icon: <FaUserCircle />,
    });
  }
  if (monRole === "DESTINATAIRE") {
    options.push({
      type: "voyageur-destinataire",
      label: "Discuter avec le transporteur",
      icon: <FaTruck />,
    });
  }

  // Une seule option → on ouvre directement le chat correspondant
  if (options.length === 1) {
    return (
      <ChatPanel
        idColis={colis.idColis}
        type={options[0].type}
        titre={options[0].label}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4">
          <div className="modal-header bg-primary text-white rounded-top-4">
            <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
              <FaCommentDots /> Avec qui discuter ?
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body d-flex flex-column gap-2">
            <p className="text-muted small mb-2">
              Colis {colis.villeDepart} → {colis.villeArrive}
            </p>
            {options.map((opt) => (
              <button
                key={opt.type}
                className="btn btn-outline-primary rounded-pill d-flex align-items-center gap-2 justify-content-start px-3 py-2"
                onClick={() => setChatOuvert(opt.type)}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
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
