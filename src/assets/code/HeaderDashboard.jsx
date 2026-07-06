import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBullhorn, FaSignInAlt, FaUserPlus, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import "../style/HeaderDashboard.css";

export default function HeaderDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleNavigation = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const deconnexion = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header className="header-container bg-white shadow-sm sticky-top">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center py-3">
          <h2 className="mb-0 fw-bold text-primary" style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>
            Colisender
          </h2>

          <button className="d-md-none border-0 bg-transparent p-2 text-primary" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
          </button>

          <div className="d-none d-md-flex gap-3 align-items-center">
            <button className="btn btn-outline-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2" onClick={() => handleNavigation("/annonces")}>
              <FaBullhorn size={14} /> Voir les annonces
            </button>
            {token ? (
              <button className="btn btn-outline-danger rounded-pill px-4 fw-semibold" onClick={deconnexion}>
                <FaSignOutAlt size={14} /> Déconnexion
              </button>
            ) : (
              <>
                <button className="btn btn-light text-secondary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2" onClick={() => handleNavigation("/login")}>
                  <FaSignInAlt size={14} /> Se connecter
                </button>
                <button className="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm" onClick={() => handleNavigation("/Inscription")}>
                  <FaUserPlus size={14} /> Créer un compte
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`mobile-menu ${isOpen ? "active" : ""}`}>
        <div className="container d-flex flex-column gap-3 py-4">
          <button className="btn btn-outline-primary w-100 py-3 rounded-pill fw-bold" onClick={() => handleNavigation("/annonces")}>
            <FaBullhorn className="me-2" /> Voir les annonces
          </button>
          {token ? (
            <button className="btn btn-danger w-100 py-3 rounded-pill fw-bold" onClick={deconnexion}>Déconnexion</button>
          ) : (
            <>
              <button className="btn btn-light w-100 py-3 rounded-pill fw-bold" onClick={() => handleNavigation("/login")}>Se connecter</button>
              <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold" onClick={() => handleNavigation("/Inscription")}>Créer un compte</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}