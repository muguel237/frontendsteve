import { useEffect, useState } from "react";
import { FaMapMarkedAlt, FaBoxOpen, FaTruck, FaMapMarkerAlt, FaWeightHanging } from "react-icons/fa";
import SuiviPanel from "./SuiviPanel";
import { API_BASE } from "./config.js";

const STATUT_INFO = {
    EN_COURS: { cls: "bg-primary", label: "En cours" },
    TERMINE: { cls: "bg-success", label: "Livré" },
    LIVRE: { cls: "bg-success", label: "Livré" },
};

/**
 * Page Suivi — affiche tous les colis EN_COURS de l'utilisateur
 * (qu'il soit expéditeur, voyageur ou destinataire) et permet de
 * suivre la position GPS du transporteur (ou du destinataire pour le voyageur).
 */
export default function Suivi() {
    const token = localStorage.getItem("token");

    const [colisEnCours, setColisEnCours] = useState([]);
    const [rolesParColis, setRolesParColis] = useState({});
    const [loading, setLoading] = useState(true);
    const [colisSuivi, setColisSuivi] = useState(null);

    useEffect(() => {
        chargerColisEnCours();
    }, []);

    const chargerColisEnCours = async () => {
        setLoading(true);
        try {
            // Récupère mes colis (expéditeur) et mes transports (voyageur)
            const [resMes, resTrans] = await Promise.all([
                fetch(`${API_BASE}/colis/mes-colis`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/colis/mes-transports`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            let tous = [];
            if (resMes.ok) {
                const mesData = await resMes.json();
                tous = [...tous, ...mesData];
            }
            if (resTrans.ok) {
                const transData = await resTrans.json();
                // Éviter les doublons
                const idsExistants = new Set(tous.map(c => c.idColis));
                tous = [...tous, ...transData.filter(c => !idsExistants.has(c.idColis))];
            }

            // Filtrer : seulement les colis en cours de transport ET avec un transporteur
            const enCours = tous.filter(c =>
                (c.statutColis === "EN_COURS" || c.statutColis === "TERMINE" || c.statutColis === "LIVRE")
                && c.idTransporteur
                && c.paiementEffectue !== false
            );

            setColisEnCours(enCours);

            // Charger les rôles
            const entries = await Promise.all(enCours.map(async (c) => {
                try {
                    const res = await fetch(`${API_BASE}/suivi/colis/${c.idColis}/mon-role`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) return [c.idColis, (await res.text()).replace(/"/g, "")];
                } catch {}
                return [c.idColis, "EXPEDITEUR"];
            }));
            setRolesParColis(Object.fromEntries(entries));

        } catch (e) {
            console.error("Erreur chargement colis suivi:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
            </div>
        </div>
    );

    return (
        <div className="container mt-4 mb-5">
            <h3 className="fw-bold text-primary mb-1 d-flex align-items-center gap-2">
                <FaMapMarkedAlt /> Suivi en temps réel
            </h3>
            <p className="text-muted small mb-4">
                Suivez la position GPS du transporteur ou partagez votre position pour faciliter la livraison.
            </p>

            {colisEnCours.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                    <FaMapMarkedAlt size={48} className="text-muted mb-3 mx-auto opacity-50" />
                    <p className="text-muted mb-0">Aucun colis en cours de transport pour le moment.</p>
                    <small className="text-muted">Le suivi GPS est disponible une fois le paiement confirmé.</small>
                </div>
            ) : (
                <div className="row g-3">
                    {colisEnCours.map((c) => {
                        const monRole = rolesParColis[c.idColis] || "EXPEDITEUR";
                        const statut = STATUT_INFO[c.statutColis] || { cls: "bg-secondary", label: c.statutColis };

                        return (
                            <div className="col-md-6 col-lg-4" key={c.idColis}>
                                <div className="card border-0 shadow-sm rounded-4 h-100">
                                    {/* Barre colorée selon le rôle */}
                                    <div className={`${monRole === "VOYAGEUR" ? "bg-success" : "bg-primary"} bg-gradient`} style={{ height: 5, borderRadius: "16px 16px 0 0" }} />

                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${monRole === "VOYAGEUR" ? "bg-success" : "bg-primary"} bg-opacity-10 ${monRole === "VOYAGEUR" ? "text-success" : "text-primary"}`}
                                                     style={{ width: 40, height: 40 }}>
                                                    {monRole === "VOYAGEUR" ? <FaTruck size={18} /> : <FaBoxOpen size={18} />}
                                                </div>
                                                <div>
                                                    <div className="fw-bold small d-flex align-items-center gap-1">
                                                        <FaMapMarkerAlt size={11} className={monRole === "VOYAGEUR" ? "text-success" : "text-primary"} />
                                                        {c.villeDepart} → {c.villeArrive}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                                                        {monRole === "VOYAGEUR" ? "Vous transportez ce colis" : "Colis en transit"}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`badge ${statut.cls} rounded-pill`} style={{ fontSize: "0.68rem" }}>
                                                {statut.label}
                                            </span>
                                        </div>

                                        <p className="text-muted small mb-2">
                                            {c.description || "Aucune description."}
                                        </p>

                                        <div className="d-flex gap-2 mb-3 small text-secondary">
                                            <span className="d-flex align-items-center gap-1">
                                                <FaWeightHanging size={12} /> {c.poids} kg
                                            </span>
                                            <span className="fw-semibold text-success ms-auto">
                                                {c.prixTransport} FCFA
                                            </span>
                                        </div>

                                        {/* Label d'indication selon le rôle */}
                                        <div className="small text-muted mb-2">
                                            {monRole === "EXPEDITEUR" && "📍 Voir la position du transporteur"}
                                            {monRole === "VOYAGEUR" && "🗺 Partager votre position + voir le destinataire"}
                                            {monRole === "DESTINATAIRE" && "📍 Voir la position du transporteur + partager la vôtre"}
                                        </div>

                                        <button
                                            className="btn btn-primary rounded-pill mt-auto d-flex align-items-center gap-2 justify-content-center"
                                            onClick={() => setColisSuivi(c)}
                                        >
                                            <FaMapMarkedAlt /> Ouvrir la carte
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Panel GPS */}
            {colisSuivi && (
                <SuiviPanel
                    idColis={colisSuivi.idColis}
                    monRole={rolesParColis[colisSuivi.idColis] || "EXPEDITEUR"}
                    onClose={() => setColisSuivi(null)}
                />
            )}
        </div>
    );
}
