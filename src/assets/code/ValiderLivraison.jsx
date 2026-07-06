import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaKey, FaQrcode, FaCheckCircle, FaExclamationTriangle,
  FaCamera, FaKeyboard
} from "react-icons/fa";
import { MdFlashOn, MdFlashOff } from "react-icons/md";
import jsQR from "jsqr";
import { API_BASE } from "./config.js";

export default function ValiderLivraison({ colis, onSuccess, onClose }) {
  const token = localStorage.getItem("token");

  const [methode, setMethode] = useState("QR");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [etape, setEtape]     = useState("FORM");
  const [message, setMessage] = useState("");
  const [montant, setMontant] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef   = useRef(null);
  const scanningRef = useRef(false);

  // ── Démarrer la caméra ─────────────────────────────────────────────────────
  const demarrerCamera = useCallback(async () => {
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        }
      });
      streamRef.current = stream;
      scanningRef.current = true;
      setCameraActive(true);

      // Attendre que videoRef soit monté avant d'assigner
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            lancerDetection();
          });
        }
      }, 100);
    } catch {
      setMessage("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.");
      setMethode("OTP");
    }
  }, []);

  // ── Arrêter la caméra ──────────────────────────────────────────────────────
  const arreterCamera = useCallback(() => {
    scanningRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  // ── Torche ─────────────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(t => !t);
    } catch {}
  };

  // ── Boucle de détection QR ─────────────────────────────────────────────────
  const lancerDetection = useCallback(() => {
    const detectorNatif = ("BarcodeDetector" in window)
      ? new window.BarcodeDetector({ formats: ["qr_code"] })
      : null;
    let lastCheck = 0;

    const loop = async () => {
      if (!scanningRef.current) return;
      const now = Date.now();

      if (now - lastCheck > 300 && videoRef.current && videoRef.current.readyState >= 2) {
        lastCheck = now;
        try {
          if (detectorNatif) {
            // API native (rapide) — disponible seulement sur certains Chrome/Android
            const codes = await detectorNatif.detect(videoRef.current);
            if (codes.length > 0 && scanningRef.current) {
              scanningRef.current = false;
              arreterCamera();
              await soumettreQr(codes[0].rawValue);
              return;
            }
          } else if (canvasRef.current) {
            // Solution de repli universelle (iPhone/Safari, Firefox, Android sans BarcodeDetector)
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data && scanningRef.current) {
              scanningRef.current = false;
              arreterCamera();
              await soumettreQr(code.data);
              return;
            }
          }
        } catch {}
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  }, [arreterCamera]);

  useEffect(() => {
    return () => arreterCamera();
  }, []);

  // ── Soumettre QR ──────────────────────────────────────────────────────────
  const soumettreQr = async (contenuQr) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/paiements/colis/${colis.idColis}/valider-qr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ contenuQr }),
      });
      const data = await res.json();
      if (res.ok) {
        setMontant(data.montant);
        setEtape("SUCCES");
        if (onSuccess) onSuccess();
      } else {
        setMessage(data.message || "QR code invalide ou expiré.");
        setEtape("ERREUR");
      }
    } catch {
      setMessage("Erreur réseau.");
      setEtape("ERREUR");
    } finally {
      setLoading(false);
    }
  };

  // ── Soumettre OTP ─────────────────────────────────────────────────────────
  const soumettreOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setMessage("Veuillez saisir un code OTP à 6 chiffres.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/paiements/colis/${colis.idColis}/valider-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMontant(data.montant);
        setEtape("SUCCES");
        if (onSuccess) onSuccess();
      } else {
        setMessage(data.message || "OTP incorrect ou expiré.");
        setEtape("ERREUR");
      }
    } catch {
      setMessage("Erreur réseau.");
      setEtape("ERREUR");
    } finally {
      setLoading(false);
    }
  };

  const fermer = () => { arreterCamera(); onClose(); };
  const reinitialiser = () => { setEtape("FORM"); setMessage(""); setOtp(""); setMethode("QR"); };

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 overflow-hidden">

          {/* Header */}
          <div className="modal-header text-white" style={{ background: "linear-gradient(135deg,#0d6efd,#6610f2)" }}>
            <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
              <FaQrcode /> Valider la livraison
            </h5>
            <button className="btn-close btn-close-white" onClick={fermer} />
          </div>

          <div className="modal-body p-4">

            {etape === "FORM" && (
              <>
                <p className="text-muted small text-center mb-4">
                  Colis <strong>{colis.villeDepart} → {colis.villeArrive}</strong><br />
                  Choisissez comment confirmer la livraison pour recevoir votre paiement.
                </p>

                {/* Sélecteur méthode */}
                <div className="d-flex gap-2 mb-4">
                  <button
                    className={`btn flex-grow-1 rounded-3 d-flex align-items-center justify-content-center gap-2 py-3 ${
                      methode === "QR" ? "btn-primary shadow" : "btn-outline-secondary"
                    }`}
                    onClick={() => { setMethode("QR"); arreterCamera(); setMessage(""); }}
                  >
                    <FaQrcode size={20} />
                    <div className="text-start">
                      <div className="fw-bold small">Scanner QR</div>
                      <div style={{ fontSize: "0.7rem" }} className="opacity-75">Caméra du téléphone</div>
                    </div>
                  </button>
                  <button
                    className={`btn flex-grow-1 rounded-3 d-flex align-items-center justify-content-center gap-2 py-3 ${
                      methode === "OTP" ? "btn-primary shadow" : "btn-outline-secondary"
                    }`}
                    onClick={() => { setMethode("OTP"); arreterCamera(); setMessage(""); }}
                  >
                    <FaKeyboard size={20} />
                    <div className="text-start">
                      <div className="fw-bold small">Code OTP</div>
                      <div style={{ fontSize: "0.7rem" }} className="opacity-75">Saisie manuelle</div>
                    </div>
                  </button>
                </div>

                {message && <div className="alert alert-danger small rounded-3 py-2">{message}</div>}

                {/* ── Méthode QR ── */}
                {methode === "QR" && (
                  <div>
                    <p className="small text-muted text-center mb-3">
                      Demandez au destinataire d'afficher son QR code, puis scannez-le.
                    </p>

                    {!cameraActive ? (
                      <button
                        className="btn btn-primary w-100 rounded-3 py-3 d-flex align-items-center justify-content-center gap-2"
                        onClick={demarrerCamera}
                        disabled={loading}
                      >
                        <FaCamera size={20} />
                        <span className="fw-bold">Activer la caméra</span>
                      </button>
                    ) : (
                      <div className="position-relative rounded-4 overflow-hidden"
                           style={{ aspectRatio: "1/1", background: "#000" }}>

                        {/* ✅ Vidéo sans aucun filtre ni overlay qui la couvre */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            filter: "none",
                            WebkitFilter: "none",
                          }}
                        />

                        {/* Cadre de visée par-dessus — sans fond sombre */}
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          pointerEvents: "none", zIndex: 2,
                        }}>
                          <div style={{ position: "relative", width: "65%", aspectRatio: "1/1" }}>

                            {/* Assombrissement uniquement autour du cadre */}
                            <div style={{
                              position: "absolute",
                              inset: "-500px",
                              boxShadow: "inset 0 0 0 500px rgba(0,0,0,0.38)",
                              pointerEvents: "none",
                            }} />

                            {/* Ligne de scan */}
                            <div style={{
                              position: "absolute",
                              left: 4, right: 4, height: 2,
                              background: "linear-gradient(90deg,transparent,#00e676,transparent)",
                              animation: "scanLine 1.8s ease-in-out infinite",
                              boxShadow: "0 0 8px #00e676",
                            }} />

                            {/* 4 coins verts */}
                            {[
                              { top: 0, left: 0, borderTop: "3px solid #00e676", borderLeft: "3px solid #00e676", borderRadius: "8px 0 0 0" },
                              { top: 0, right: 0, borderTop: "3px solid #00e676", borderRight: "3px solid #00e676", borderRadius: "0 8px 0 0" },
                              { bottom: 0, left: 0, borderBottom: "3px solid #00e676", borderLeft: "3px solid #00e676", borderRadius: "0 0 0 8px" },
                              { bottom: 0, right: 0, borderBottom: "3px solid #00e676", borderRight: "3px solid #00e676", borderRadius: "0 0 8px 0" },
                            ].map((s, i) => (
                              <div key={i} style={{ position: "absolute", width: 26, height: 26, ...s }} />
                            ))}
                          </div>
                        </div>

                        {/* Badge instruction */}
                        <div style={{ position: "absolute", top: 12, left: 0, right: 0, textAlign: "center", zIndex: 3 }}>
                          <span className="badge bg-dark bg-opacity-60 text-white rounded-pill px-3 py-1 small">
                            📷 Pointez vers le QR code du destinataire
                          </span>
                        </div>

                        {/* Bouton torche */}
                        <button
                          onClick={toggleTorch}
                          style={{
                            position: "absolute", bottom: 52, right: 12, zIndex: 3,
                            background: torchOn ? "#00e676" : "rgba(0,0,0,0.5)",
                            border: "none", borderRadius: "50%",
                            width: 40, height: 40,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: torchOn ? "#000" : "#fff", fontSize: 18, cursor: "pointer",
                          }}
                        >
                          {torchOn ? <MdFlashOff /> : <MdFlashOn />}
                        </button>

                        {/* Bouton annuler */}
                        <button
                          className="btn btn-sm btn-danger rounded-pill px-3"
                          style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 3 }}
                          onClick={arreterCamera}
                        >
                          Annuler le scan
                        </button>

                        <canvas ref={canvasRef} style={{ display: "none" }} />
                      </div>
                    )}

                    {loading && (
                      <div className="text-center mt-3">
                        <div className="spinner-border text-primary spinner-border-sm me-2" />
                        <span className="small text-muted">Validation en cours...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Méthode OTP ── */}
                {methode === "OTP" && (
                  <div>
                    <p className="small text-muted text-center mb-3">
                      Demandez le code OTP reçu par email au destinataire.
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      className="form-control form-control-lg text-center fw-bold rounded-3 mb-3"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      style={{ fontSize: "2rem", letterSpacing: "0.8rem" }}
                    />
                    <button
                      className="btn btn-primary w-100 rounded-3 py-3 fw-bold"
                      onClick={soumettreOtp}
                      disabled={loading || otp.length !== 6}
                    >
                      {loading
                        ? <><span className="spinner-border spinner-border-sm me-2" />Validation...</>
                        : <><FaKey className="me-2" />Confirmer la livraison</>
                      }
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── SUCCÈS ── */}
            {etape === "SUCCES" && (
              <div className="text-center py-3">
                <div className="mb-3" style={{ fontSize: "4rem" }}>🎉</div>
                <FaCheckCircle className="text-success mb-3" size={52} />
                <h5 className="fw-bold text-success">Livraison confirmée !</h5>
                <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success-subtle mt-3">
                  <div className="fw-bold text-success fs-4">{montant} FCFA</div>
                  <div className="small text-muted">ont été transférés sur votre numéro principal</div>
                </div>
              </div>
            )}

            {/* ── ERREUR ── */}
            {etape === "ERREUR" && (
              <div className="text-center py-3">
                <FaExclamationTriangle className="text-danger mb-3" size={50} />
                <p className="fw-semibold text-danger">{message}</p>
                <p className="small text-muted">
                  Vérifiez que le destinataire vous montre le bon QR code / OTP correspondant à ce colis.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            {etape === "FORM" && (
              <button className="btn btn-outline-secondary rounded-pill" onClick={fermer}>Annuler</button>
            )}
            {etape === "SUCCES" && (
              <button className="btn btn-success rounded-pill w-100 fw-bold" onClick={fermer}>Fermer</button>
            )}
            {etape === "ERREUR" && (
              <>
                <button className="btn btn-outline-secondary rounded-pill" onClick={fermer}>Fermer</button>
                <button className="btn btn-primary rounded-pill px-4" onClick={reinitialiser}>Réessayer</button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 4px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 6px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
