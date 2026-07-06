import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaPlusCircle, FaBullhorn, FaBox, FaCommentDots, FaMapMarkedAlt, FaExclamationTriangle } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import "../style/UserHeader.css";

export default function UserHeader({ setPage, activePage }) {
  const navigate = useNavigate();

  const getBtnClass = (page) =>
    `btn btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-2 ${
      activePage === page ? "btn-primary" : "btn-outline-primary"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* ── HEADER HAUT ─────────────────────────────────────────────────────
          Sur mobile : Logo | Notification + Déconnexion
          Sur desktop : Logo | Nav complète | Profil + Notif + Déconnexion
      ──────────────────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm px-3 py-2 d-flex justify-content-between align-items-center"
              style={{ flexShrink: 0, zIndex: 100, borderBottom: "1px solid #e2e8f0" }}>

        {/* Logo */}
        <h2
          className="text-primary fw-bold fs-4 m-0"
          style={{ cursor: "pointer", flexShrink: 0 }}
          onClick={() => setPage("home")}
        >
          Colisender
        </h2>

        {/* MENU DESKTOP */}
        <nav className="d-none d-md-flex align-items-center nav-desktop-container">
          <button className={getBtnClass("publier")}  onClick={() => setPage("publier")}><FaPlusCircle size={14} /> Publier</button>
          <button className={getBtnClass("annonces")} onClick={() => setPage("annonces")}><FaBullhorn size={14} /> Annonces</button>
          <button className={getBtnClass("suivi")}    onClick={() => setPage("suivi")}><FaMapMarkedAlt size={14} /> Suivi</button>
          <button className={getBtnClass("colis")}    onClick={() => setPage("colis")}><FaBox size={14} /> Mes Colis</button>
          <button className={getBtnClass("chat")}     onClick={() => setPage("chat")}><FaCommentDots size={14} /> Chat</button>
          <button className={getBtnClass("litiges")}  onClick={() => setPage("litiges")}
            style={{ borderColor: "#DC2626", color: activePage === "litiges" ? "#fff" : "#DC2626", background: activePage === "litiges" ? "#DC2626" : "transparent" }}>
            <FaExclamationTriangle size={13} /> Litiges
          </button>
        </nav>

        {/* DROITE : Notif + Profil + Déconnexion — visibles partout */}
        <div className="d-flex align-items-center gap-2">
          <NotificationBell onNavigateColis={() => setPage("colis")} />

          {/* Litiges — mobile seulement, icône compacte */}
          <button
            className="d-md-none btn btn-sm rounded-pill px-2"
            onClick={() => setPage("litiges")}
            style={{
              borderColor: "#DC2626",
              color: activePage === "litiges" ? "#fff" : "#DC2626",
              background: activePage === "litiges" ? "#DC2626" : "transparent",
              border: "1.5px solid #DC2626",
            }}
          >
            <FaExclamationTriangle size={14} />
          </button>

          {/* Profil */}
          <button className={getBtnClass("profil")} onClick={() => setPage("profil")}>
            <FaUserCircle size={16} />
            {/* Texte masqué sur très petit écran pour gagner de la place */}
            <span className="d-none d-sm-inline">Profil</span>
          </button>

          {/* Déconnexion */}
          <button
            className="btn btn-sm btn-outline-danger rounded-pill px-2 px-sm-3 fw-semibold"
            onClick={handleLogout}
            title="Se déconnecter"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* ── NAV MOBILE BAS ───────────────────────────────────────────────── */}
      <nav className="mobile-bottom-nav d-md-none">
        <button className={`nav-btn ${activePage === "publier"  ? "active" : ""}`} onClick={() => setPage("publier")}><FaPlusCircle size={20} /><span>Publier</span></button>
        <button className={`nav-btn ${activePage === "annonces" ? "active" : ""}`} onClick={() => setPage("annonces")}><FaBullhorn size={20} /><span>Annonces</span></button>
        <button className={`nav-btn ${activePage === "suivi"    ? "active" : ""}`} onClick={() => setPage("suivi")}><FaMapMarkedAlt size={20} /><span>Suivi</span></button>
        <button className={`nav-btn ${activePage === "colis"    ? "active" : ""}`} onClick={() => setPage("colis")}><FaBox size={20} /><span>Colis</span></button>
        <button className={`nav-btn ${activePage === "chat"     ? "active" : ""}`} onClick={() => setPage("chat")}><FaCommentDots size={20} /><span>Chat</span></button>
      </nav>
    </>
  );
}
