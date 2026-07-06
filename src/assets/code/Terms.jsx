import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container" style={{ maxWidth: "800px" }}>
        
        <div className="text-center mb-5">
          <h1 className="fw-extrabold text-dark tracking-tight mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-muted small">
            Dernière mise à jour : Mai 2026
          </p>
        </div>

        <div className="bg-white p-4 p-md-5 rounded-3 shadow-sm text-start text-dark">
          
          <section className="mb-4">
            <h3 className="fs-5 fw-bold text-primary mb-3">Préambule</h3>
            <p className="lh-lg text-muted">
              Les présentes Conditions Générales d’Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions dans lesquelles la plateforme met en relation des expéditeurs de colis et des voyageurs effectuant un trajet et disposant d'un espace résiduel pour transporter ces colis. En accédant à la plateforme ou en créant un compte, l'utilisateur accepte sans réserve l'intégralité des présentes CGU.
            </p>
          </section>

          <hr className="my-4 text-muted opacity-25" />

          <section className="mb-4">
            <h3 className="fs-5 fw-bold text-primary mb-3">1. Inscription et Vérification des Comptes</h3>
            <ul className="list-unstyled d-flex flex-column gap-3 text-muted lh-lg">
              <li>
                <strong className="text-dark d-block">Éligibilité :</strong> L'accès à la plateforme est réservé aux personnes physiques majeures et capables juridiquement.
              </li>
              <li>
                <strong className="text-dark d-block">Exactitude des informations :</strong> L'utilisateur s'engage à fournir des informations exactes, à jour et complètes lors de son inscription (Nom, prénom, email, numéro de téléphone).
              </li>
              <li>
                <strong className="text-dark d-block">Vérification d'identité :</strong> Pour garantir la sécurité des échanges et des transports, chaque utilisateur doit valider son identité en fournissant une pièce d'identité valide (CNI ou Passeport) ainsi qu'un selfie de correspondance. La plateforme se réserve le droit de suspendre tout compte non vérifié.
              </li>
            </ul>
          </section>

          <hr className="my-4 text-muted opacity-25" />

          <section className="mb-4">
            <h3 className="fs-5 fw-bold text-primary mb-3">2. Nature du Service</h3>
            <p className="lh-lg text-muted">
              La plateforme agit exclusivement en tant qu’intermédiaire de mise en relation. Elle n'est en aucun cas partie au contrat de transport conclu entre l'expéditeur et le voyageur, et n'exerce aucun contrôle sur le comportement des utilisateurs, la ponctualité ou l'état des biens transportés.
            </p>
          </section>

          <hr className="my-4 text-muted opacity-25" />

          <section className="mb-4">
            <h3 className="fs-5 fw-bold text-primary mb-3">3. Engagements de l'Expéditeur</h3>
            <ul className="list-unstyled d-flex flex-column gap-3 text-muted lh-lg">
              <li>
                <strong className="text-dark d-block">Contenu du colis :</strong> L'expéditeur s'engage à ne confier que des marchandises licites.
              </li>
              <li>
                <strong className="text-dark d-block">Objets interdits :</strong> Sont strictement interdits au transport : les matières dangereuses, explosives, inflammables ou corrosives ; les drogues, stupéfiants et substances illicites ; les armes à feu, munitions et objets contrefaits ; les devises en espèces, bijoux ou valeurs de grande importance ; ainsi que toutes les marchandises interdites par la réglementation douanière locale.
              </li>
              <li>
                <strong className="text-dark d-block">Conditionnement :</strong> L'expéditeur doit emballer le colis de manière appropriée pour le transport.
              </li>
            </ul>
          </section>

          <hr className="my-4 text-muted opacity-25" />

          <section className="mb-4">
            <h3 className="fs-5 fw-bold text-primary mb-3">4. Engagements du Voyageur</h3>
            <ul className="list-unstyled d-flex flex-column gap-3 text-muted lh-lg">
              <li>
                <strong className="text-dark d-block">Vérification du colis :</strong> Le voyageur a le droit et l'obligation légale de vérifier le contenu du colis avant de l'accepter, en présence de l'expéditeur, afin de s'assurer qu'il ne contient aucun produit illicite.
              </li>
              <li>
                <strong className="text-dark d-block">Sécurité :</strong> L'un des engagements majeurs du voyageur est de prendre soin du colis confié et de le transporter personnellement jusqu'au point de livraison convenu.
              </li>
              <li>
                <strong className="text-dark d-block">Déclaration :</strong> Le voyageur demeure responsable des déclarations nécessaires en cas de contrôle routier ou de sécurité.
              </li>
            </ul>
          </section>

          <hr className="my-4 text-muted opacity-25" />

          <section className="mb-5">
            <h3 className="fs-5 fw-bold text-primary mb-3">5. Annulation et Litiges</h3>
            <p className="lh-lg text-muted">
              Toute annulation de trajet ou d'expédition doit être signalée sur la plateforme le plus tôt possible. En cas de perte, vol ou détérioration du colis durant le transport, la responsabilité incombe directement au voyageur. La plateforme décline toute responsabilité liée aux incidents survenant pendant le trajet.
            </p>
          </section>

          <div className="d-flex justify-content-center pt-3 border-top border-light">
            <button 
              onClick={() => navigate(-1)} 
              className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm"
            >
              Retour à l'inscription
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}