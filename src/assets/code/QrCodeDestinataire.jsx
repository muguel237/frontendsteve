import { useEffect, useState, useCallback } from "react";
import { FaQrcode, FaSync, FaBoxOpen, FaMapMarkerAlt } from "react-icons/fa";
import { API_BASE } from "./config.js";

export default function QrCodeDestinataire({ colis, onClose }) {
  const token = localStorage.getItem("token");

  const [qrData, setQrData]       = useState(null);
  const [loading, setLoading]      = useState(true);
  const [erreur, setErreur]        = useState("");
  const [copie, setCopie]          = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch(`${API_BASE}/paiements/colis/${colis.idColis}/qr-code`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (res.ok) {
        setQrData(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setQrData(null); // on efface l'ancien QR affiché pour ne pas le montrer en même temps que l'erreur
        setErreur(data.message || "Impossible de charger le QR code.");
      }
    } catch {
      setQrData(null);
      setErreur("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, [colis.idColis, token]);

  useEffect(() => { charger(); }, [charger]);

  const copierOtp = () => {
    if (!qrData?.codeOtp) return;
    navigator.clipboard.writeText(qrData.codeOtp).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    });
  };

  // Générer l'URL de l'image QR via api.qrserver.com (gratuit, aucun compte requis)
  const qrImageUrl = qrData?.contenuQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData.contenuQr)}&bgcolor=ffffff&color=000000&qzone=2&ecc=H`
    : null;

  const expiration = qrData?.expiration
    ? new Date(qrData.expiration).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 overflow-hidden">

          {/* Header */}
          <div className="modal-header text-white" style={{ background: "linear-gradient(135deg,#198754,#20c997)" }}>
            <div>
              <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
                <FaQrcode /> Code de livraison
              </h5>
              <div className="small opacity-75 mt-1 d-flex align-items-center gap-1">
                <FaBoxOpen size={12} />
                {colis.villeDepart} → {colis.villeArrive}
              </div>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body p-4 text-center">

            {loading && (
              <div className="py-5">
                <div className="spinner-border text-success mb-3" style={{ width: 48, height: 48 }} />
                <p className="text-muted small">Génération du QR code...</p>
              </div>
            )}

            {erreur && !loading && (
              <div className="py-4">
                <div style={{ fontSize: "3rem" }} className="mb-3">❌</div>
                <p className="text-danger fw-semibold">{erreur}</p>
                <button className="btn btn-outline-success rounded-pill px-4" onClick={charger}>
                  <FaSync className="me-2" /> Réessayer
                </button>
              </div>
            )}

            {qrData && !loading && (
              <>
                <div className="alert alert-success small rounded-3 py-2 mb-4 border-0 bg-success bg-opacity-10">
                  <strong>📱 Montrez ce QR code au voyageur</strong> à la livraison.<br />
                  Il le scannera pour confirmer la réception et débloquer son paiement.
                </div>

                {/* QR Code image */}
                <div className="d-inline-block p-3 bg-white rounded-4 shadow-sm mb-4"
                     style={{ border: "3px solid #198754" }}>
                  {qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt="QR Code de livraison"
                      style={{ width: 220, height: 220, display: "block" }}
                    />
                  ) : (
                    <div style={{ width: 220, height: 220 }}
                         className="d-flex align-items-center justify-content-center bg-light rounded-3 text-muted">
                      Génération...
                    </div>
                  )}
                </div>

                {/* Code OTP en backup */}
                <div className="mb-4">
                  <div className="text-muted small mb-2">
                    Si le voyageur ne peut pas scanner, donnez-lui ce code :
                  </div>
                  <div
                    className="d-inline-flex align-items-center gap-3 px-4 py-2 rounded-3 bg-light border"
                    style={{ cursor: "pointer" }}
                    onClick={copierOtp}
                    title="Cliquer pour copier"
                  >
                    <span className="fw-bold fs-3 font-monospace text-primary" style={{ letterSpacing: "0.5rem" }}>
                      {qrData.codeOtp}
                    </span>
                    <span className="badge bg-primary rounded-pill small">
                      {copie ? "✓ Copié !" : "Copier"}
                    </span>
                  </div>
                </div>

                {/* Infos expiration */}
                {expiration && (
                  <div className="small text-muted d-flex align-items-center justify-content-center gap-1">
                    <span>⏱️</span>
                    <span>Code valide jusqu'au <strong>{expiration}</strong></span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer justify-content-center border-0 pt-0 pb-4">
            {qrData && (
              <button className="btn btn-outline-success rounded-pill px-4 me-2" onClick={charger}>
                <FaSync className="me-2" /> Actualiser
              </button>
            )}
            <button className="btn btn-success rounded-pill px-5 fw-bold" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
