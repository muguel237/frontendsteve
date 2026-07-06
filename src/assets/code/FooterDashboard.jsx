import "../style/FooterDashboard.css";

export default function Footer() {
  return (
    <footer className="footer mt-5">
      <div className="container py-5">
        <div className="row gy-4">

          {/* Branding */}
          <div className="col-12 col-md-4">
            <h3 className="mb-0 fw-bold" style={{ color: "var(--primary)", fontSize: "clamp(1.2rem, 4vw, 1.6rem)" }}>Colisender</h3>
            <p className="footer-text">
              Plateforme moderne de transport de colis au Cameroun.
            </p>
          </div>
          <div className="col-6 col-md-4">
            <h5>Contact</h5>
            <p className="footer-text ">colisender2@gmail.com</p>
            <p className="footer-text">+237 674626888</p>
          </div>

          <div className="col-6 col-md-4">
            <h5>Navigation</h5>
            <ul className="list-unstyled">
              <li className="mb-2">Accueil</li>
              <li className="mb-2">Trajets</li>
              <li className="mb-2">Colis</li>
            </ul>
          </div>

          {/* Contact */}
          

        </div>

        <hr style={{ borderColor: "#1e293b", marginTop: "2rem" }} />
        <p className="text-center footer-text small mb-0">
          © {new Date().getFullYear()} Colisender — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
