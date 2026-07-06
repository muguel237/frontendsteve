import { useState, useEffect, useRef } from "react";
import { FaMoneyBillWave, FaTimes, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { API_BASE } from "./config.js";

export default function PaiementModal({ colis, onClose, onSuccess }) {
  const token = localStorage.getItem("token");
  const [methode, setMethode]     = useState("MTN_MOMO");
  const [numero, setNumero]       = useState("");
  const [etape, setEtape]         = useState("FORM"); // FORM | ATTENTE | SUCCES | ECHEC
  const [erreur, setErreur]       = useState("");
  const [idPaiement, setIdPaiement] = useState(null);
  const [tentatives, setTentatives] = useState(0);
  const pollRef = useRef(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);
  const validerNumero = (n) => {
    const digits = n.replace(/\D/g, "");
    
    return digits.length === 9 && digits.startsWith("6")
        || digits.length === 12 && digits.startsWith("2376");
  };
  const initierPaiement = async () => {
    setErreur("");
    if (!validerNumero(numero)) {
      setErreur("Numéro invalide. Exemple : 690001122 (MTN) ou 699001122 (Orange).");
      return;
    }
    setEtape("ATTENTE");
    setTentatives(0);

    try {
      const res = await fetch(`${API_BASE}/paiements/colis/${colis.idColis}/initier`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ numeroTelephone: numero.replace(/\D/g, ""), methodePaiement: methode }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setErreur(msg || "Erreur lors de l'initiation du paiement.");
        setEtape("FORM");
        return;
      }

      const data = await res.json();
      if (data.statut === "SEQUESTRE") {
        setEtape("SUCCES");
        if (onSuccess) onSuccess();
        return;
      }

      setIdPaiement(data.idPaiement);
      // Démarrer le polling toutes les 5s (plus fiable que 4s sous charge réseau)
      pollRef.current = setInterval(() => verifierStatut(data.idPaiement), 5000);

    } catch {
      setErreur("Erreur réseau. Vérifiez votre connexion et réessayez.");
      setEtape("FORM");
    }
  };

  const verifierStatut = async (id) => {
    setTentatives((t) => {
      const nouveau = t + 1;
      if (nouveau > 60) {
        clearInterval(pollRef.current);
        setEtape("ECHEC");
        setErreur("Délai de confirmation dépassé. Réessayez ou vérifiez votre solde.");
      }
      return nouveau;
    });

    try {
      const res = await fetch(`${API_BASE}/paiements/${id}/statut`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; 

      const data = await res.json();
      // BUG CORRIGÉ : on
      if (data.statut === "SEQUESTRE") {
        clearInterval(pollRef.current);
        setEtape("SUCCES");
        if (onSuccess) onSuccess();
      } else if (data.statut === "ECHEC") {
        clearInterval(pollRef.current);
        setEtape("ECHEC");
        setErreur("Le paiement a été refusé ou annulé. Vérifiez votre solde et réessayez.");
      }
    } catch {

    }
  };

  // ── Réessayer (repart de FORM) ───────────────────────────────────────────────
  const reessayer = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIdPaiement(null);
    setErreur("");
    setTentatives(0);
    setEtape("FORM");
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4">

          {/* Header */}
          <div className="modal-header bg-primary text-white rounded-top-4">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <FaMoneyBillWave /> Paiement du transport
            </h5>
            {etape !== "ATTENTE" && (
              <button className="btn-close btn-close-white" onClick={onClose} />
            )}
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* ── FORMULAIRE ── */}
            {etape === "FORM" && (
              <>
                <p className="text-muted small mb-1">
                  Trajet : <strong>{colis.villeDepart} → {colis.villeArrive}</strong>
                </p>
                <p className="mb-3">
                  Montant : <span className="fw-bold text-success fs-5">{colis.prixTransport} FCFA</span>
                </p>

                {erreur && (
                  <div className="alert alert-danger small py-2">{erreur}</div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Méthode de paiement</label>
                  <div className="d-flex gap-2">
                    {["MTN_MOMO", "ORANGE_MONEY"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethode(m)}
                        className={`btn flex-grow-1 rounded-pill ${methode === m ? "btn-warning fw-bold" : "btn-outline-secondary"}`}
                      >
                        {m === "MTN_MOMO" ? "MTN MoMo" : "Orange Money"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Numéro Mobile Money</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Ex : 690001122"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                  <div className="form-text">
                    Numéro {methode === "MTN_MOMO" ? "MTN" : "Orange"} qui recevra la demande de paiement.
                  </div>
                </div>
              </>
            )}

            {/* ── ATTENTE ── */}
            {etape === "ATTENTE" && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="fw-semibold mb-1">En attente de confirmation...</p>
                <p className="text-muted small">
                  Validez la notification reçue sur le <strong>{numero}</strong>
                  {" "}({methode === "MTN_MOMO" ? "MTN Mobile Money" : "Orange Money"}).
                </p>
                <small className="text-muted">Tentative {tentatives}/60</small>
              </div>
            )}

            {/* ── SUCCÈS ── */}
            {etape === "SUCCES" && (
              <div className="text-center py-4">
                <FaCheckCircle className="text-success mb-3" size={52} />
                <p className="fw-bold fs-5 text-success">Paiement confirmé !</p>
                <p className="text-muted small">
                  Le montant est sécurisé. Vous pouvez maintenant discuter avec le transporteur.
                </p>
              </div>
            )}

            {/* ── ÉCHEC ── */}
            {etape === "ECHEC" && (
              <div className="text-center py-4">
                <FaExclamationTriangle className="text-danger mb-3" size={52} />
                <p className="fw-bold fs-5 text-danger">Paiement non confirmé</p>
                {erreur && <p className="text-muted small">{erreur}</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            {etape === "FORM" && (
              <>
                <button className="btn btn-secondary rounded-pill" onClick={onClose}>
                  <FaTimes className="me-1" /> Annuler
                </button>
                <button
                  className="btn btn-primary rounded-pill"
                  onClick={initierPaiement}
                  disabled={!validerNumero(numero)}
                >
                  Payer {colis.prixTransport} FCFA
                </button>
              </>
            )}
            {etape === "SUCCES" && (
              <button className="btn btn-success rounded-pill" onClick={onClose}>
                Fermer
              </button>
            )}
            {etape === "ECHEC" && (
              <>
                <button className="btn btn-secondary rounded-pill" onClick={onClose}>
                  Fermer
                </button>
                <button className="btn btn-primary rounded-pill" onClick={reessayer}>
                  Réessayer
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
