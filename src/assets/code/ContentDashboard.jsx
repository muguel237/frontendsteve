import { useState } from "react";
import "../style/ContentDashboard.css";
import image4 from "../image/image 2.jpg";
import image1 from "../image/image1.jpg";
import image6 from "../image/image6.jpg";
export default function ContentDashboard() {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="bg-light w-100 overflow-x-hidden">
      
      <section className="hero pt-5 pb-4">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-9">
              <h1 className="hero-title display-4 fw-bold text-dark mb-4 lh-sm">
                Envoyez et transportez vos colis partout au Cameroun
              </h1>
              <p className="hero-text fs-5 text-muted mb-0 mx-auto lh-base" style={{ maxWidth: "800px" }}>
                Colisender réinvente la logistique locale en connectant directement les personnes qui ont besoin d'envoyer un colis avec des voyageurs de confiance effectuant le même trajet. Profitez d'une solution alternative, plus rapide, plus économique et totalement sécurisée pour vos expéditions quotidiennes entre Douala, Yaoundé, Bafoussam, Garoua et bien d'autres villes au cameroun.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-3">
        <div className="row g-3 justify-content-center">
          {/* <div className="col-12 col-md-6">
            <img
              src={image1}
              alt="Colisender 1"
              className="w-80 rounded-4 shadow-sm"
              style={{ objectFit: "cover", height: "390px" }}
            />
          </div> */}
          {/* <div className="col-12 col-md-6">
            <img
              src={image6}
              alt="Colisender 2"
              className="w-80 rounded-4 shadow-sm"
              style={{ objectFit: "cover", height: "390px" }}
            />
          </div> */}
           {/* <div className="col-12 col-md-6">
            <img
              src={image4}
              alt="Colisender 2"
              className="w-80 rounded-4 shadow-sm"
              style={{ objectFit: "cover", height: "390px" }}
            />
          </div> */}
        </div>
      </section>

      <section className="bg-white border-top py-5 text-center">
        <div className="container">
          
          <div className="mx-auto mb-4" style={{ maxWidth: "800px" }}>
            <h2 className="fw-bold text-dark mb-3 fs-3">
              Expédier ou recevoir un colis avec Colisender, comment ça marche ?
            </h2>
            <p className="text-muted fs-6">
              La livraison des uns fait le bonheur des autres. Les uns remboursent leurs frais de route, les autres paient leur livraison au prix juste. Un service gagnant-gagnant qui augmente votre pouvoir d’achat !
            </p>
          </div>

          <button 
            onClick={() => setShowSteps(!showSteps)}
            className="btn btn-primary btn-lg rounded-pill px-4 py-2 mb-5 shadow-sm fw-bold d-inline-flex align-items-center gap-2 fs-6"
          >
            Comment ça fonctionne ? 
            <i className={`bi bi-chevron-down transition-arrow ${showSteps ? "rotate-180" : ""}`}></i>
          </button>

          <div className={`steps-wrapper ${showSteps ? "show-steps" : "hide-steps"}`}>
            
            <div className="d-flex flex-column flex-md-row justify-content-center gap-4 custom-step-row">
              
              <div className="step-card card-bottom text-start flex-grow-1">
                <div className="p-4 bg-light rounded-4 border-0 shadow-sm h-100">
                  
                  <h4 className="fw-bold mb-2 fs-5">Créez une demande de transport</h4>
                  <p className="text-muted small mb-0">
                    Renseignez les caractéristiques du colis à envoyer (description, dimensions et poids). Ajoutez une photo et validez le prix.
                  </p>
                </div>
              </div>

              <div className="step-card card-middle delay-1 text-start flex-grow-1">
                <div className="p-4 bg-light rounded-4 border-0 shadow-sm h-100">
                 
                  <h4 className="fw-bold mb-2 fs-5">Recevez des propositions</h4>
                  <p className="text-muted small mb-0">
                    Nous transmettons votre demande d'envoi à notre communauté : des voyageurs et des transporteurs dont le trajet coïncide avec votre livraison.
                  </p>
                </div>
              </div>

              <div className="step-card card-top delay-2 text-start flex-grow-1">
                <div className="p-4 bg-light rounded-4 border-0 shadow-sm h-100">
                  
                  <h4 className="fw-bold mb-2 fs-5">Validez votre réservation</h4>
                  <p className="text-muted small mb-0">
                    Payez en ligne en toute sécurité. Colisender est tiers de confiance : le paiement est versé au transporteur une fois le colis livré.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      <section className="bg-light border-top py-5">
        <div className="container">
          
          <div className="text-center mb-5 mx-auto" style={{ maxWidth: "750px" }}>
            <h2 className="fw-bold text-dark fs-3 mb-3">Expédier ou recevoir un colis</h2>
            <p className="text-muted fs-5 lh-base">
              La livraison des uns fait le bonheur des autres. Les uns remboursent leurs frais de route, les autres paient leur livraison au prix juste. Un service gagnant-gaganant qui augmente votre pouvoir d’achat !
            </p>
          </div>
          
          <div className="row g-4 justify-content-center">
            
            <div className="col-12 col-md-6">
              <div className="p-4 bg-white rounded-4 shadow-sm border-0 h-100">
                <div className="d-flex align-items-center gap-3 mb-3">
                  
                  <h3 className="fw-bold m-0 fs-4 text-dark">Expéditeurs</h3>
                </div>
                <p className="text-muted fs-6 lh-base mb-0">
                  Avec Colisender, vous expédiez tous types de colis, même les plus volumineux, jusqu'à 60% moins cher ! C’est simple, économique et ça contribue à protéger notre planète.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-4 bg-white rounded-4 shadow-sm border-0 h-100">
                <div className="d-flex align-items-center gap-3 mb-3">
                  
                  <h3 className="fw-bold m-0 fs-4 text-dark">Transporteurs</h3>
                </div>
                <p className="text-muted fs-6 lh-base mb-0">
                  Avec Colisender, vous économisez sur vos trajets ! Que ce soit pour aller au bureau ou partir en vacances, toutes les occasions sont bonnes pour rentabiliser vos déplacements.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-white border-top py-5">
        <div className="container">
          
          <div className="text-center mb-5 mx-auto" style={{ maxWidth: "700px" }}>
            <h2 className="fw-bold text-dark fs-3 mb-2">La livraison qui vous donne le sourire !</h2>
          </div>

          <div className="row g-4 justify-content-center">
            
           
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-4 rounded-4 h-100 border-0 text-center text-sm-start">
                <h4 className="fw-bold fs-5 text-dark mb-2">Des clients heureux</h4>
                <p className="text-muted small mb-0 lh-base">
                  Testé et approuvé par des milliers d’utilisateurs qui font des économies grâce à Colisender. Elle est pas belle la vie ?
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-4 rounded-4 h-100 border-0 text-center text-sm-start">
  
                <h4 className="fw-bold fs-5 text-dark mb-2">Des colis chouchoutés</h4>
                <p className="text-muted small mb-0 lh-base">
                  99,99% : c’est la probabilité que votre colis soit livré sans pépin. Parce que vos colis aussi méritent qu’on les chouchoute.
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-4 rounded-4 h-100 border-0 text-center text-sm-start">
                <h4 className="fw-bold fs-5 text-dark mb-2">Une approche humaine</h4>
                <p className="text-muted small mb-0 lh-base">
                  Nous recréons du lien social en développant l'entraide entre des individus qui ne se connaissent pas. C'est vertueux !
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-4 rounded-4 h-100 border-0 text-center text-sm-start">
                <div className="text-info mb-3">
                </div>
                <h4 className="fw-bold fs-5 text-dark mb-2">Un service client présent</h4>
                <p className="text-muted small mb-0 lh-base">
                  Parce que chaque utilisateur compte pour nous. Vous obtenez une réponse en moins d’1h30. Et pas d’un robot !
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="  py-5 text-center shadow-inner">
        <div className="container py-3">
          <h2 className="display-6 fw-bold m-0 fs-3 lh-sm">
            Colisender, la livraison qui tient dans la poche.
          </h2>
        </div>
      </section>

    </div>
  );
}