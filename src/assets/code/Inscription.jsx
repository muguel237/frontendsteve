import { useState, useRef, useEffect } from "react";
import "../style/Inscription.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "./config.js";
export default function Inscription() {
  // On gère maintenant 3 étapes : 1 = Profil, 2 = OTP, 3 = Identité
  const [step, setStep] = useState(1); 
const navigate = useNavigate();
  const API_BASE_URL = `${API_BASE}/auth`;

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    motDePasse: "", 
    confirmer_mot_de_passe: "",
    numero_principal: "",
    numero_secondaire: "",
    acceptTerms: false,
  });

  const [identityFiles, setIdentityFiles] = useState({
    photoRectoCNI: null,
    photoVersoCNI: null,
    photoSelfie: null,
  });
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0); 
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prevTime) => prevTime - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setIsTimerActive(false);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, otpTimer]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isPasswordStrong = (password) => {
    if (!password) return false;
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setIdentityFiles({
      ...identityFiles,
      [e.target.name]: e.target.files[0],
    });
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Erreur d'accès à la caméra frontale :", err);
      alert("Impossible d'accéder à la caméra frontale.");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        setIdentityFiles((prev) => ({
          ...prev,
          photoSelfie: file,
        }));
        setCapturedImage(canvas.toDataURL("image/jpeg"));
      }
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const sendOtpRequest = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        const data = await response.json();
        setOtpTimer(data.expiresInSeconds || 120); 
        setIsTimerActive(true);
        setStep(2); 
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Erreur lors de l'envoi de l'OTP.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      alert("Impossible de joindre le serveur pour générer l'OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      alert("Vous devez accepter les conditions d'utilisation pour continuer.");
      return;
    }
    if (!isPasswordStrong(formData.motDePasse)) {
      alert("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }
    if (formData.motDePasse !== formData.confirmer_mot_de_passe) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    sendOtpRequest();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpTimer === 0) {
      alert("Le code OTP a expiré. Veuillez en générer un nouveau.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: otp }),
      });

      if (response.ok) {
        setIsTimerActive(false);
        setStep(3); 
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Code OTP incorrect.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      alert("Erreur lors de la validation de l'OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validation de sécurité côté client
    if (!capturedImage || !identityFiles.photoSelfie) {
      alert("Veuillez prendre votre photo de selfie pour la vérification.");
      return;
    }
    if (!identityFiles.photoRectoCNI || !identityFiles.photoVersoCNI) {
      alert("Veuillez téléverser le recto et le verso de votre CNI.");
      return;
    }

    setIsSubmitting(true);
    
    // 2. Création du FormData pour envoi multipart/form-data
    const dataToSend = new FormData();
    
    // Ajout des informations utilisateur
    dataToSend.append("prenom", formData.prenom);
    dataToSend.append("nom", formData.nom);
    dataToSend.append("email", formData.email);
    dataToSend.append("motDePasse", formData.motDePasse); 
    
    // --- LES CLÉS CI-DESSOUS DOIVENT CORRESPONDRE AU BACKEND ---
    // Ces noms doivent être identiques aux variables dans InscriptionForm.java
    // Normaliser les numéros au format 237XXXXXXXXX
    const normaliserNumero = (num) => {
      if (!num) return "";
      const clean = num.replace(/\D/g, "");
      return clean.startsWith("237") ? clean : "237" + clean;
    };
    dataToSend.append("numeroPrincipal", normaliserNumero(formData.numero_principal));
    dataToSend.append("numeroSecondaire", normaliserNumero(formData.numero_secondaire));
    dataToSend.append("otp", otp);
    
    // Ajout des fichiers
    dataToSend.append("photoRectoCNI", identityFiles.photoRectoCNI);
    dataToSend.append("photoVersoCNI", identityFiles.photoVersoCNI);
    dataToSend.append("photoSelfie", identityFiles.photoSelfie);

    // 3. Appel de l'API
    try {
      for (let pair of dataToSend.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
}
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        body: dataToSend, // Pas de Header 'Content-Type' ici, le navigateur le gère seul avec FormData
      });

      const result = await response.json();

      if (response.ok) {
        alert("Inscription réussie ! Votre compte est en attente de vérification.");
        navigate("/login");
      } else {
        // Affiche le message d'erreur venant du backend (ex: "Nom ne correspond pas")
        alert(result.message || "Une erreur est survenue lors de l'inscription.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      alert("Échec de la communication avec le serveur. Vérifiez que votre API est lancée.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-vh-100 d-flex flex-column align-items-center justify-content-center p-3">
      <div className="w-100 style-register-card" style={{ maxWidth: "550px" }}>
        
        <div className="text-center mb-5">
          <h2 className="fw-extrabold text-dark tracking-tight mb-1 fs-3">
            Bienvenue sur <span className="text-primary">Colisender</span>
          </h2>
          <div className="d-flex justify-content-center gap-2 mt-3">
            <span className={`badge rounded-pill ${step === 1 ? "bg-primary" : "bg-light text-muted"}`}>1. Profil</span>
            <span className={`badge rounded-pill ${step === 2 ? "bg-primary" : "bg-light text-muted"}`}>2. Vérification</span>
            <span className={`badge rounded-pill ${step === 3 ? "bg-primary" : "bg-light text-muted"}`}>3. Identité</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleNextStep} className="text-start">
            <div className="row g-4">
              <div className="col-12 col-sm-6">
                <label className="form-label text-dark small fw-bold mb-2">Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="form-control rounded-3 cocolis-input"
                  placeholder="Ex: mao"
                  required
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label text-dark small fw-bold mb-2">Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="form-control rounded-3 cocolis-input"
                  placeholder="Ex: Kamdem"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label text-dark small fw-bold mb-2">Adresse email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control rounded-3 cocolis-input"
                  placeholder="kamdem@gmail.com"
                  required
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label text-dark small fw-bold mb-2">Numéro principal</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted rounded-start-3 small fw-bold">+237</span>
                  <input
                    type="tel"
                    name="numero_principal"
                    value={formData.numero_principal}
                    onChange={handleChange}
                    className="form-control rounded-end-3 cocolis-input"
                    placeholder="6-- --- ---"
                    required
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label text-dark small fw-bold mb-2">Numéro secondaire (facultatif)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted rounded-start-3 small fw-normal">+237</span>
                  <input
                    type="tel"
                    name="numero_secondaire"
                    value={formData.numero_secondaire}
                    onChange={handleChange}
                    className="form-control rounded-end-3 cocolis-input"
                    placeholder="6-- --- ---"
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="form-label text-dark small fw-bold mb-2">Mot de passe</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="motDePasse" // Modifié ici
                    value={formData.motDePasse} // Modifié ici
                    onChange={handleChange}
                    className="form-control rounded-start-3 cocolis-input border-end-0"
                    placeholder="Entrez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-transparent text-muted border-start-0 eye-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                <div className="mt-2 fs-7 text-muted">
                  Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).
                  {formData.motDePasse && (
                    <span className={`d-block fw-bold mt-1 ${isPasswordStrong(formData.motDePasse) ? "text-success" : "text-danger"}`}>
                      {isPasswordStrong(formData.motDePasse) ? "✓ Mot de passe fort" : "✗ Mot de passe trop faible"}
                    </span>
                  )}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label text-dark small fw-bold mb-2">Confirmer le mot de passe</label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmer_mot_de_passe"
                    value={formData.confirmer_mot_de_passe}
                    onChange={handleChange}
                    className="form-control rounded-start-3 cocolis-input border-end-0"
                    placeholder="Répétez le mot de passe"
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-transparent text-muted border-start-0 eye-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                {formData.confirmer_mot_de_passe && formData.motDePasse !== formData.confirmer_mot_de_passe && (
                  <span className="text-danger d-block small mt-1 fw-bold">
                    ✗ Les mots de passe ne correspondent pas
                  </span>
                )}
              </div>

              <div className="col-12 mt-4">
                <div className="form-check d-flex align-items-start gap-2">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="form-check-input mt-1 cocolis-checkbox"
                    required
                  />
                  <label htmlFor="acceptTerms" className="form-check-label text-muted small lh-sm">
                    J'accepte les <a href="/terms" className="text-primary fw-bold text-decoration-none">Conditions Générales d'Utilisation</a> et je certifie sur l'honneur ne pas envoyer de produits illicites au Cameroun.
                  </label>
                </div>
              </div>

              <div className="col-12 mt-4">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-100 rounded-pill py-2-5 fw-bold fs-6 shadow-sm">
                  {isSubmitting ? "Envoi du code..." : "Continuer..."}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="text-start">
            <div className="row g-4">
              <div className="col-12 text-center">
                <p className="text-muted small">
                  Un code de vérification a été envoyé à l'adresse <strong>{formData.email}</strong>.
                </p>
              </div>

              <div className="col-12">
                <label className="form-label text-dark small fw-bold mb-2">Code de validation (OTP)</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="form-control rounded-3 cocolis-input text-center tracking-widest fs-4 fw-bold"
                  placeholder="000000"
                  required
                />
              </div>

              <div className="col-12 text-center">
                {otpTimer > 0 ? (
                  <span className="text-muted small">
                    Temps restant : <strong className="text-danger">{formatTime(otpTimer)}</strong>
                  </span>
                ) : (
                  <button type="button" onClick={sendOtpRequest} disabled={isSubmitting} className="btn btn-link text-primary p-0 small fw-bold text-decoration-none">
                    Renvoyer un code OTP
                  </button>
                )}
              </div>

              <div className="col-12 d-flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline-secondary rounded-pill px-4 py-2-5 fw-bold">
                  Retour
                </button>
                <button type="submit" disabled={otpTimer === 0 || isSubmitting} className="btn btn-primary flex-grow-1 rounded-pill py-2-5 fw-bold fs-6 shadow-sm">
                  {isSubmitting ? "Vérification..." : "Vérifier le code"}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="text-start">
            <div className="d-flex flex-column gap-5">
              
              <div>
                <label className="form-label text-dark small fw-bold mb-2">Photo Recto de votre CNI</label>
                <input
                  type="file"
                  name="photoRectoCNI"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-control rounded-3 cocolis-input"
                  required
                />
              </div>

              <div>
                <label className="form-label text-dark small fw-bold mb-2">Photo Verso de votre CNI</label>
                <input
                  type="file"
                  name="photoVersoCNI"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-control rounded-3 cocolis-input"
                  required
                />
              </div>

              <div>
                <label className="form-label text-dark small fw-bold mb-2">Photo de vous (Selfie de correspondance)</label>
                
                {!isCameraActive && !capturedImage && (
                  <div 
                    onClick={startCamera}
                    className="border border-2 border-dashed rounded-3 p-4 text-center bg-light cursor-pointer hover-shadow transition-all"
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bi bi-camera fs-1 text-primary d-block mb-2"></i>
                    <span className="fw-bold text-secondary small">Cliquez ici pour activer la caméra frontale</span>
                  </div>
                )}

                {isCameraActive && (
                  <div className="position-relative bg-dark rounded-3 overflow-hidden text-center shadow-sm">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-100 h-auto"
                      style={{ transform: "scaleX(-1)", maxHeight: "300px", objectFit: "cover" }}
                    />
                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2">
                      <button type="button" onClick={capturePhoto} className="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow">
                        Prendre la photo
                      </button>
                      <button type="button" onClick={stopCamera} className="btn btn-sm btn-danger rounded-pill px-3 fw-bold shadow">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="position-relative rounded-3 overflow-hidden text-center border shadow-sm">
                    <img 
                      src={capturedImage} 
                      alt="Selfie capturé" 
                      className="w-100 h-auto" 
                      style={{ maxHeight: "300px", objectFit: "cover" }}
                    />
                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
                      <button type="button" onClick={startCamera} className="btn btn-sm btn-light text-primary rounded-pill px-3 fw-bold shadow">
                        Recommencer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="d-flex gap-3 pt-3">
                <button type="button" onClick={() => { stopCamera(); setStep(2); }} className="btn btn-outline-secondary rounded-pill px-4 py-2-5 fw-bold">
                  Retour
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-grow-1 rounded-pill py-2-5 fw-bold fs-6 shadow-sm">
                  {isSubmitting ? "Finalisation..." : "Valider"}
                </button>
              </div>

            </div>
          </form>
        )}

        <div className="text-center mt-5 pt-2 border-top border-light">
          <p className="text-muted small mb-0">
            Vous avez déjà un compte ? <a href="/login" className="text-primary fw-bold text-decoration-none">Connectez-vous</a>
          </p>
        </div>

      </div>
    </div>
  );
}