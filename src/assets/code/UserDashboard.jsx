import { useState } from "react";
import UserHeader from "./UserHeader";
import UserContent from "./UserContent";
import Footer from "./FooterDashboard";

export default function UserD() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    /*
     * LAYOUT FINAL :
     *
     *  ┌──────────────────────────────┐  ← UserHeader  (flexShrink:0, reste en haut)
     *  │  div scrollable              │  ← flex:1 + overflowY:auto
     *  │    <UserContent />           │     → tout le contenu scrolle ici
     *  │    <Footer />                │     → footer en bas du contenu scrollable
     *  │    [padding 65px nav mobile] │
     *  └──────────────────────────────┘
     *  [■ ■ ■ ■ ■]  Nav mobile        ← position:fixed dans le CSS, jamais masquée
     *
     *  height:100dvh + overflow:hidden sur la racine :
     *    → le BODY ne scrolle jamais → la nav fixe ne bouge jamais
     *    → seul le div interne scrolle → tout le contenu est accessible
     */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",    /* viewport exact, barres mobiles incluses */
        overflow: "hidden",  /* le body ne scrolle JAMAIS */
      }}
    >
      {/* Header — ne scrolle pas, toujours visible en haut */}
      <UserHeader setPage={setCurrentPage} activePage={currentPage} />

      {/* Zone scrollable — le seul endroit qui scrolle */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          /* Espace sous le dernier élément pour ne pas passer sous la nav fixe */
          paddingBottom: "calc(65px + env(safe-area-inset-bottom))",
        }}
      >
        <UserContent activePage={currentPage} />
        <Footer />
      </div>
    </div>
  );
}
