import { useState } from "react";
import "../style/login.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "./config.js";

export default function Login() {
  const [loginData, setLoginData] = useState({
    email: "",
    mot_de_passe: "",
    rememberMe: false,
  });

  const navigate = useNavigate();
  const API_BASE_URL = `${API_BASE}/auth`;
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData({ ...loginData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErreur("");

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          mot_de_passe: loginData.mot_de_passe,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token)          localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.idUtilisateur || data.userId || "");
        navigate("/UserDashboard");
      } else {
        const err = await response.json().catch(() => ({}));
        setErreur(err.message || "Identifiants incorrects.");
      }
    } catch {
      setErreur("Impossible de joindre le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-light-cocolis min-vh-100 d-flex flex-column align-items-center justify-content-center p-3">
      <div className="w-100 style-login-card" style={{ maxWidth: 480 }}>

        {/* En-tête */}
        <div className="text-center mb-4">
          <h1 className="fw-extrabold text-dark mb-2" style={{ fontSize: "clamp(1.3rem, 4vw, 1.6rem)" }}>
            Ravi de vous revoir sur{" "}
            <span className="text-primary-cocolis">Colisender</span>
          </h1>
          <p className="text-muted small mb-0">Connectez-vous pour gérer vos colis.</p>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="alert alert-danger py-2 small">{erreur}</div>
        )}

        <form onSubmit={handleSubmit} className="text-start">
          <div className="d-flex flex-column gap-3">

            <div>
              <label className="form-label text-dark small fw-bold mb-1">Adresse email</label>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleChange}
                className="form-control rounded-3 cocolis-input-field"
                placeholder="kamdem@gmail.com"
                required
              />
            </div>

            <div>
              <label className="form-label text-dark small fw-bold mb-1">Mot de passe</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="mot_de_passe"
                  value={loginData.mot_de_passe}
                  onChange={handleChange}
                  className="form-control rounded-start-3 cocolis-input-field border-end-0"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-transparent text-muted border-start-0 eye-btn-login"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="form-check d-flex align-items-center gap-2 mb-0">
                <input
                  type="checkbox"
                  name="rememberMe"
                  id="rememberMe"
                  checked={loginData.rememberMe}
                  onChange={handleChange}
                  className="form-check-input"
                />
                <label htmlFor="rememberMe" className="form-check-label text-muted small mb-0">
                  Se souvenir de moi
                </label>
              </div>
              <a href="/Forgot" className="text-primary-cocolis small fw-bold text-decoration-none">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary-cocolis w-100 rounded-pill py-2-5 fw-bold mt-1"
            >
              {isSubmitting ? (
                <><span className="spinner-border spinner-border-sm me-2" />Connexion...</>
              ) : "Se connecter"}
            </button>

          </div>
        </form>

        <div className="text-center mt-4 pt-3 border-top">
          <p className="text-muted small mb-0">
            Nouveau sur Colisender ?{" "}
            <a href="/Inscription" className="text-primary-cocolis fw-bold text-decoration-none">
              Créez un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
