import Send from "./Send";
import Scanner from "./Scanner";
import Profil from "./Profil";
import MesColis from "./MesColis";
import Annonces from "./Annonces";
import Chat from "./Chat";
import Suivi from "./Suivi";
import MesLitiges from "./MesLitiges";

export default function UserContent({ activePage }) {
  const renderContent = () => {
    switch (activePage) {

      case "home":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 16px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 6vw, 2.6rem)",
                color: "#0f172a",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              Bienvenue sur{" "}
              <span style={{ color: "#2563EB" }}>Colisender</span>
            </h1>
            <p
              style={{
                fontSize: "clamp(0.95rem, 3vw, 1.15rem)",
                color: "#64748b",
                maxWidth: 420,
                margin: 0,
              }}
            >
              Votre plateforme de logistique collaborative au Cameroun.
            </p>
          </div>
        );

      case "publier":   return <Send />;
      case "colis":     return <MesColis />;
      case "annonces":  return <Annonces />;
      case "profil":    return <Profil />;
      case "chat":      return <Chat />;
      case "suivi":     return <Suivi />;
      case "litiges":   return <MesLitiges />;

      default:
        return (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <h3 style={{ color: "#94a3b8" }}>
              Section <strong style={{ color: "#334155" }}>{activePage}</strong>{" "}
              en cours de développement...
            </h3>
          </div>
        );
    }
  };

  return (
    /*
     * Plus de py-5 global — chaque page gère son propre espacement.
     * Le container Bootstrap est conservé pour les pages qui en ont besoin.
     */
    <main className="container" style={{ paddingTop: 24, paddingBottom: 16 }}>
      {renderContent()}
    </main>
  );
}
