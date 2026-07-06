import { useState } from "react";
import "../style/login.css";
import { API_BASE } from "./config.js";

export default function Forgot() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const API_BASE_URL = `${API_BASE}/auth`;

  const isPasswordStrong = (p) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(p);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); setErreur("");
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { setStep(2); }
      else { const d = await res.json().catch(() => ({})); setErreur(d.message || "Email introuvable."); }
    } catch { setErreur("Erreur réseau."); }
    finally { setIsSubmitting(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); setErreur("");
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      if (res.ok) { setStep(3); }
      else { const d = await res.json().catch(() => ({})); setErreur(d.message || "Code OTP incorrect."); }
    } catch { setErreur("Erreur réseau."); }
    finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setErreur("Les mots de passe ne correspondent pas."); return; }
    if (!isPasswordStrong(newPassword)) { setErreur("Mot de passe trop faible : 8 car. min, majuscule, chiffre, caractère spécial."); return; }
    setIsSubmitting(true); setErreur("");
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, nouveau_mot_de_passe: newPassword }),
      });
      if (res.ok) { window.location.href = "/login"; }
      else { const d = await res.json().catch(() => ({})); setErreur(d.message || "Erreur serveur."); }
    } catch { setErreur("Erreur réseau."); }
    finally { setIsSubmitting(false); }
  };

  const steps = ["Email", "Code OTP", "Nouveau mot de passe"];

  return (
    <div className="bg-light-cocolis min-vh-100 d-flex flex-column align-items-center justify-content-center p-3">
      <div className="w-100 style-login-card" style={{ maxWidth: 480 }}>

        {/* En-tête */}
        <div className="text-center mb-4">
          <h1 className="fw-extrabold text-dark mb-3" style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)" }}>
            Mot de passe oublié
          </h1>

          {/* Indicateur d'étapes */}
          <div className="d-flex justify-content-center align-items-center gap-1 mb-2">
            {steps.map((s, i) => (
              <div key={i} className="d-flex align-items-center gap-1">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                  style={{
                    width: 28, height: 28, fontSize: 12,
                    background: i + 1 <= step ? "#2563EB" : "#E2E8F0",
                    color: i + 1 <= step ? "#fff" : "#94A3B8",
                    flexShrink: 0,
                  }}
                >
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 30, height: 2, background: i + 1 < step ? "#2563EB" : "#E2E8F0" }} />
                )}
              </div>
            ))}
          </div>
          <p className="text-muted small">{steps[step - 1]}</p>
        </div>

        {/* Erreur */}
        {erreur && <div className="alert alert-danger py-2 small">{erreur}</div>}

        {/* Étape 1 */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="text-start">
            <p className="text-muted small text-center mb-3">
              Saisissez votre email pour recevoir un code de réinitialisation.
            </p>
            <label className="form-label text-dark small fw-bold mb-1">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-control rounded-3 cocolis-input-field mb-3"
              placeholder="kamdem@gmail.com"
              required
            />
            <button type="submit" disabled={isSubmitting} className="btn btn-primary-cocolis w-100 rounded-pill py-2-5 fw-bold">
              {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" />Envoi...</> : "Recevoir le code OTP"}
            </button>
          </form>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="text-start">
            <p className="text-muted small text-center mb-3">
              Code envoyé à <strong>{email}</strong>
            </p>
            <label className="form-label text-dark small fw-bold mb-1">Code OTP (6 chiffres)</label>
            <input
              type="text"
              maxLength="6"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              className="form-control rounded-3 cocolis-input-field text-center fw-bold mb-3"
              style={{ fontSize: "1.5rem", letterSpacing: "0.4rem" }}
              placeholder="000000"
              required
            />
            <div className="d-flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline-secondary rounded-pill px-4 fw-bold">
                Retour
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary-cocolis flex-grow-1 rounded-pill py-2-5 fw-bold">
                {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" />Vérification...</> : "Vérifier"}
              </button>
            </div>
          </form>
        )}

        {/* Étape 3 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="text-start">
            <p className="text-muted small text-center mb-3">
              Choisissez un nouveau mot de passe sécurisé.
            </p>
            <label className="form-label text-dark small fw-bold mb-1">Nouveau mot de passe</label>
            <div className="input-group mb-1">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="form-control rounded-start-3 cocolis-input-field border-end-0"
                placeholder="Minimum 8 caractères"
                required
              />
              <button type="button" className="input-group-text bg-transparent text-muted border-start-0 eye-btn-login"
                onClick={() => setShowPassword(!showPassword)}>
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
            {newPassword && (
              <div className={`small fw-bold mb-2 ${isPasswordStrong(newPassword) ? "text-success" : "text-danger"}`}>
                {isPasswordStrong(newPassword) ? "✓ Mot de passe fort" : "✗ Trop faible — 8 car. min, majuscule, chiffre, spécial"}
              </div>
            )}
            <label className="form-label text-dark small fw-bold mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="form-control rounded-3 cocolis-input-field mb-3"
              placeholder="Répétez le mot de passe"
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <div className="text-danger small fw-bold mb-2">✗ Les mots de passe ne correspondent pas</div>
            )}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary-cocolis w-100 rounded-pill py-2-5 fw-bold">
              {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" />Mise à jour...</> : "Enregistrer"}
            </button>
          </form>
        )}

        <div className="text-center mt-4 pt-3 border-top border-light">
          <a href="/login" className="text-primary-cocolis small fw-bold text-decoration-none text-link-hover">
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
