import { useState } from "react";
import UserHeader from "./UserHeader"; 
import Send from "./Send"; 

export default function Navigation() {
  // État pour savoir quelle page afficher
  const [currentPage, setCurrentPage] = useState("home");

  // Fonction qui décide quoi afficher
  const renderContent = () => {
    switch (currentPage) {
      case "envoyer":
        return <Send />;
      case "recevoir":
        return <div>Page Recevoir un colis</div>;
      case "trajets":
        return <div>Page Mes trajets</div>;
      case "suivi":
        return <div>Page Suivi trajet</div>;
      default:
        return <div className="text-center py-5">Bienvenue sur Colisender !</div>;
    }
  };

  return (
    <div>
      
      <UserHeader setPage={setCurrentPage} />
      
      {/* Zone de contenu dynamique */}
      <main>
        {renderContent()}
      </main>
    </div>
  );
}