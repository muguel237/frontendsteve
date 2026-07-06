import { useState, useCallback, useRef, useEffect } from 'react';
import { FaQrcode, FaCheckCircle, FaTimesCircle, FaRedo } from 'react-icons/fa';
import { MdFlashOn, MdFlashOff } from 'react-icons/md';
import { API_BASE } from "./config.js";

const ETAT = {
  SCAN: 'SCAN',
  VALIDATION: 'VALIDATION',
  SUCCES: 'SUCCES',
  ERREUR: 'ERREUR',
};

export default function Scanner() {
  const token = localStorage.getItem("token");

  const [etat, setEtat] = useState(ETAT.SCAN);
  const [message, setMessage] = useState('');
  const [montant, setMontant] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraErr, setCameraErr] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastScanRef = useRef(0);
  const scanningRef = useRef(true);

  // ── Démarre la caméra arrière en haute qualité ──────────────────────────────
  const demarrerCamera = useCallback(async () => {
    setCameraErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scannerLoop();
      }
    } catch (err) {
      setCameraErr("Impossible d'accéder à la caméra. Autorisez l'accès dans votre navigateur.");
    }
  }, []);

  // ── Arrête la caméra ────────────────────────────────────────────────────────
  const arreterCamera = useCallback(() => {
    scanningRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    scanningRef.current = true;
    demarrerCamera();
    return () => arreterCamera();
  }, []);

  // ── Torche ──────────────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(t => !t);
    } catch {
      // torche non supportée sur cet appareil
    }
  };

  // ── Boucle de scan (BarcodeDetector natif) ─────────────────────────────────
  const scannerLoop = useCallback(() => {
    if (!scanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scannerLoop);
      return;
    }

    const now = Date.now();
    // Ne scanner que toutes les 300ms pour économiser les ressources
    if (now - lastScanRef.current > 300) {
      lastScanRef.current = now;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        detector.detect(canvas).then(codes => {
          if (codes.length > 0 && scanningRef.current) {
            scanningRef.current = false;
            validerLivraison(codes[0].rawValue);
          }
        }).catch(() => {});
      }
    }

    animFrameRef.current = requestAnimationFrame(scannerLoop);
  }, []);

  // ── Parse le contenu QR ─────────────────────────────────────────────────────
  const parserContenuQr = (texte) => {
    try {
      const data = JSON.parse(texte);
      if (data && data.idColis) return { idColis: data.idColis, contenuQr: texte };
    } catch {}
    return null;
  };

  // ── Valide la livraison via l'API ───────────────────────────────────────────
  const validerLivraison = useCallback(async (texteScanne) => {
    arreterCamera();
    setEtat(ETAT.VALIDATION);

    const parsed = parserContenuQr(texteScanne);
    if (!parsed) {
      setEtat(ETAT.ERREUR);
      setMessage("Ce QR code ne correspond pas à une livraison Colisender.");
      return;
    }
    if (!token) {
      setEtat(ETAT.ERREUR);
      setMessage("Vous devez être connecté pour valider une livraison.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/paiements/colis/${parsed.idColis}/valider-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ contenuQr: parsed.contenuQr }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Impossible de valider cette livraison.");

      setMontant(data.montant ?? null);
      setMessage(data.message || "Livraison validée avec succès !");
      setEtat(ETAT.SUCCES);
    } catch (error) {
      setEtat(ETAT.ERREUR);
      setMessage(error.message || "Erreur lors de la validation.");
    }
  }, [token, arreterCamera]);

  const recommencer = () => {
    setEtat(ETAT.SCAN);
    setMessage('');
    setMontant(null);
    setTorchOn(false);
    scanningRef.current = true;
    demarrerCamera();
  };

  return (
    <div className="container py-4 text-center" style={{ maxWidth: 480 }}>
      <h3 className="mb-1 d-flex align-items-center justify-content-center gap-2 fw-bold">
        <FaQrcode className="text-success" /> Scanner le QR code
      </h3>
      <p className="text-muted mb-4 small">
        Demandez au destinataire d'afficher son QR code, puis cadrez-le dans la zone ci-dessous.
      </p>

      {/* ── Zone caméra ── */}
      {etat === ETAT.SCAN && (
        <div className="position-relative mx-auto" style={{ width: '100%', maxWidth: 400 }}>

          {/* Erreur caméra */}
          {cameraErr && (
            <div className="alert alert-danger rounded-3">{cameraErr}</div>
          )}

          {/* Vidéo — fond noir, pleine qualité, pas de filtre */}
          <div className="position-relative rounded-4 overflow-hidden shadow"
               style={{ background: '#000', aspectRatio: '1/1' }}>
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                // Aucun filtre CSS — flux brut comme une vraie app scanner
                filter: 'none',
                WebkitFilter: 'none',
              }}
            />

            {/* Cadre de visée : 4 coins verts comme les apps natives */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ position: 'relative', width: '65%', aspectRatio: '1/1' }}>
                {/* Assombrissement autour du cadre */}
                <div style={{
                  position: 'absolute',
                  inset: '-200px',
                  boxShadow: 'inset 0 0 0 200px rgba(0,0,0,0.45)',
                  pointerEvents: 'none',
                }} />

                {/* Ligne de scan animée */}
                <div style={{
                  position: 'absolute',
                  left: 4, right: 4,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #00e676, transparent)',
                  animation: 'scanLine 1.8s ease-in-out infinite',
                  boxShadow: '0 0 8px #00e676',
                }} />

                {/* 4 coins */}
                {[
                  { top: 0, left: 0, borderTop: '4px solid #00e676', borderLeft: '4px solid #00e676', borderRadius: '8px 0 0 0' },
                  { top: 0, right: 0, borderTop: '4px solid #00e676', borderRight: '4px solid #00e676', borderRadius: '0 8px 0 0' },
                  { bottom: 0, left: 0, borderBottom: '4px solid #00e676', borderLeft: '4px solid #00e676', borderRadius: '0 0 0 8px' },
                  { bottom: 0, right: 0, borderBottom: '4px solid #00e676', borderRight: '4px solid #00e676', borderRadius: '0 0 8px 0' },
                ].map((style, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    width: 28, height: 28,
                    ...style,
                  }} />
                ))}
              </div>
            </div>

            {/* Bouton torche */}
            <button
              onClick={toggleTorch}
              style={{
                position: 'absolute', bottom: 16, right: 16,
                background: torchOn ? '#00e676' : 'rgba(0,0,0,0.55)',
                border: 'none', borderRadius: '50%',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: torchOn ? '#000' : '#fff',
                fontSize: 20, cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
              }}
              title={torchOn ? "Éteindre la torche" : "Allumer la torche"}
            >
              {torchOn ? <MdFlashOff /> : <MdFlashOn />}
            </button>
          </div>

          {/* Canvas caché pour la détection */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <p className="text-muted small mt-3">
            Pointez la caméra vers le QR code — la détection est automatique
          </p>
        </div>
      )}

      {/* ── Validation en cours ── */}
      {etat === ETAT.VALIDATION && (
        <div className="py-5">
          <div className="spinner-border text-success mb-3" style={{ width: 56, height: 56 }} role="status" />
          <p className="text-muted">Validation de la livraison en cours...</p>
        </div>
      )}

      {/* ── Succès ── */}
      {etat === ETAT.SUCCES && (
        <div className="py-4">
          <FaCheckCircle className="text-success mb-3" size={72} />
          <h5 className="fw-bold text-success mb-2">Livraison confirmée !</h5>
          <p className="text-muted">{message}</p>
          {montant != null && (
            <div className="alert alert-success fw-semibold fs-5 rounded-3">
              💰 {montant} FCFA transférés sur votre compte
            </div>
          )}
          <button className="btn btn-outline-success rounded-pill px-4 mt-2" onClick={recommencer}>
            <FaRedo className="me-2" /> Scanner un autre colis
          </button>
        </div>
      )}

      {/* ── Erreur ── */}
      {etat === ETAT.ERREUR && (
        <div className="py-4">
          <FaTimesCircle className="text-danger mb-3" size={72} />
          <h5 className="fw-bold text-danger mb-2">Échec de la validation</h5>
          <p className="text-muted">{message}</p>
          <button className="btn btn-outline-success rounded-pill px-4 mt-2" onClick={recommencer}>
            <FaRedo className="me-2" /> Réessayer
          </button>
        </div>
      )}

      {/* Animation ligne de scan */}
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
