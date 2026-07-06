import { useState } from "react";
import { FaKey, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { API_BASE } from "./config.js";

export default function ValiderOtp({ colis, onSuccess, onClose }) {
  const token = localStorage.getItem("token");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [etape, setEtape] = useState("FORM"); // FORM | SUCCES | ERREUR
  const [message, setMessage] = useState("");
  const [montant, setMontant] = useState(null);

  const valider = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setMessage("Veuillez saisir un code OTP à 6 chiffres.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/paiements/colis/${colis.idColis}/valider-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp: otp.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setMontant(data.montant);
        setEtape("SUCCES");
        if (onSuccess) onSuccess();
      } else {
        setMessage(data.message || data || "OTP incorrect ou expiré.");
        setEtape("ERREUR");
      }
    } catch {
      setMessage("Erreur réseau.");
      setEtape("ERREUR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title"><FaKey className="me-2" />Valider la livraison</h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body text-center py-4">
            {etape === "FORM" && (
              <>
                <p className="text-muted">
                  Colis <strong>{colis.villeDepart} → {colis.villeArrive}</strong>
                </p>
                <p className="small text-muted mb-4">
                  Demandez au destinataire le code OTP qu'il a reçu par email, puis saisissez-le ci-dessous pour confirmer la livraison et débloquer votre paiement.
                </p>
                {message && <div className="alert alert-danger small">{message}</div>}
                <input
                  type="text" maxLength={6} inputMode="numeric"
                  className="form-control form-control-lg text-center fw-bold rounded-pill mb-3"
                  placeholder="Code OTP à 6 chiffres"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{ fontSize: "1.5rem", letterSpacing: "0.5rem" }}
                />
              </>
            )}
            {etape === "SUCCES" && (
              <>
                <FaCheckCircle className="text-success mb-3" size={60} />
                <h5 className="fw-bold text-success">Livraison confirmée !</h5>
                <p className="text-muted">
                  <strong>{montant} FCFA</strong> (80% du prix) ont été transférés sur votre numéro principal.
                </p>
              </>
            )}
            {etape === "ERREUR" && (
              <>
                <FaExclamationTriangle className="text-danger mb-3" size={50} />
                <p className="fw-semibold text-danger">{message}</p>
              </>
            )}
          </div>
          <div className="modal-footer">
            {etape === "FORM" && (
              <>
                <button className="btn btn-secondary rounded-pill" onClick={onClose}>Annuler</button>
                <button className="btn btn-success rounded-pill px-4" onClick={valider} disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm" /> : "Confirmer la livraison"}
                </button>
              </>
            )}
            {etape === "SUCCES" && (
              <button className="btn btn-success rounded-pill w-100" onClick={onClose}>Fermer</button>
            )}
            {etape === "ERREUR" && (
              <>
                <button className="btn btn-secondary rounded-pill" onClick={onClose}>Fermer</button>
                <button className="btn btn-warning rounded-pill" onClick={() => { setEtape("FORM"); setMessage(""); }}>Réessayer</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
