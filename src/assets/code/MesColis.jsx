import { useEffect, useState } from 'react';
import {
    FaEdit, FaTrash, FaUserCheck, FaMoneyBillWave, FaCommentDots,
    FaMapMarkedAlt, FaBoxOpen, FaWeightHanging, FaMapMarkerAlt,
    FaRulerCombined, FaPhoneAlt, FaPlus, FaQrcode, FaKey
} from 'react-icons/fa';
import PaiementModal from './PaiementModal';
import ChoixChatModal from './ChoixChatModal';
import SuiviPanel from './SuiviPanel';
import ValiderLivraison from './ValiderLivraison';
import QrCodeDestinataire from './QrCodeDestinataire';
import { API_BASE } from "./config.js";

const STATUT_INFO = {
    EN_ATTENTE: { cls: 'bg-warning text-dark', label: 'En attente' },
    EN_COURS: { cls: 'bg-primary', label: 'En cours' },
    TERMINE: { cls: 'bg-success', label: 'Livré' },
    LIVRE: { cls: 'bg-success', label: 'Livré' },
    ANNULE: { cls: 'bg-danger', label: 'Annulé' },
};

export default function MesColis() {
    const token = localStorage.getItem("token");

    const [colis, setColis] = useState([]);
    const [colisRecus, setColisRecus] = useState([]);
    const [transports, setTransports] = useState([]);
    const [rolesParColis, setRolesParColis] = useState({});

    const [postulants, setPostulants] = useState([]);
    const [colisPostulantsId, setColisPostulantsId] = useState(null);
    const [showPostulantsModal, setShowPostulantsModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [colisEnEdition, setColisEnEdition] = useState(null);
    const [formEdit, setFormEdit] = useState({});

    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [choosingId, setChoosingId] = useState(null);
    const [erreur, setErreur] = useState('');
    const [succès, setSuccès] = useState('');

    const [colisAPayer, setColisAPayer] = useState(null);
    const [colisChat, setColisChat] = useState(null);
    const [colisSuivi, setColisSuivi] = useState(null);
    const [colisValider, setColisValider] = useState(null);  // ValiderLivraison pour voyageur
    const [colisQr, setColisQr] = useState(null);           // QrCodeDestinataire pour expéditeur/destinataire

    useEffect(() => {
        fetchTout();
    }, []);

    const fetchTout = async () => {
        await Promise.all([fetchMesColis(), fetchMesTransports(), fetchMesColisRecus()]);
        setLoading(false);
    };

    const fetchMesColis = async () => {
        try {
            const response = await fetch(`${API_BASE}/colis/mes-colis`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setColis(data);
                // Cette liste = colis que J'AI ENVOYÉS → je suis forcément EXPEDITEUR
                assignerRoles(data, "EXPEDITEUR");
            }
        } catch (error) {
            console.error("Erreur chargement colis:", error);
        }
    };

    const fetchMesTransports = async () => {
        try {
            const response = await fetch(`${API_BASE}/colis/mes-transports`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTransports(data);
                // Cette liste = colis que JE TRANSPORTE → je suis forcément VOYAGEUR
                assignerRoles(data, "VOYAGEUR");
            }
        } catch (error) {
            console.error("Erreur chargement transports:", error);
        }
    };

    const fetchMesColisRecus = async () => {
        try {
            const response = await fetch(`${API_BASE}/colis/mes-colis-recus`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setColisRecus(data);
                // Cette liste = colis que JE REÇOIS → je suis forcément DESTINATAIRE
                assignerRoles(data, "DESTINATAIRE");
            }
        } catch (error) {
            console.error("Erreur chargement colis reçus:", error);
        }
    };

    // ── Assigne mon rôle pour chaque colis d'une liste, directement à partir du
    //    contexte (la section dans laquelle le colis a été chargé). On évite ainsi
    //    de dépendre de l'endpoint backend /mon-role, qui peut renvoyer un rôle
    //    incorrect (ex: VOYAGEUR au lieu de DESTINATAIRE) et casser le chat.
    const assignerRoles = (liste, role) => {
        setRolesParColis(prev => ({
            ...prev,
            ...Object.fromEntries(liste.map(c => [c.idColis, role])),
        }));
    };

    // ── SUPPRESSION ──────────────────────────────────────────────
    const handleDelete = async (idColis) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce colis ?")) return;
        setDeletingId(idColis);
        try {
            const response = await fetch(`${API_BASE}/colis/${idColis}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                setColis(colis.filter(c => c.idColis !== idColis));
                afficherSuccès("Colis supprimé avec succès.");
            } else {
                const msg = await response.text();
                setErreur(msg || "Impossible de supprimer ce colis.");
            }
        } catch (error) {
            setErreur("Une erreur est survenue lors de la suppression.");
        } finally {
            setDeletingId(null);
        }
    };

    // ── MODIFICATION ─────────────────────────────────────────────
    const ouvrirEdition = (c) => {
        setColisEnEdition(c);
        setFormEdit({
            description: c.description || '',
            poids: c.poids || '',
            dimension: c.dimension || '',
            villeDepart: c.villeDepart || '',
            villeArrive: c.villeArrive || '',
            adresseRecuperation: c.adresseRecuperation || '',
            adresseLivraison: c.adresseLivraison || '',
            prixTransport: c.prixTransport || '',
            telephoneDestinataire: c.telephoneDestinataire || '',
        });
        setErreur('');
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setFormEdit({ ...formEdit, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async () => {
        if (!colisEnEdition) return;
        setSavingId(colisEnEdition.idColis);
        setErreur('');
        try {
            const response = await fetch(`${API_BASE}/colis/${colisEnEdition.idColis}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formEdit)
            });
            if (response.ok) {
                const updated = await response.json();
                setColis(colis.map(c => c.idColis === updated.idColis ? updated : c));
                setShowEditModal(false);
                afficherSuccès("Colis mis à jour avec succès.");
            } else {
                const msg = await response.text();
                setErreur(msg || "Erreur lors de la modification.");
            }
        } catch (error) {
            setErreur("Une erreur est survenue.");
        } finally {
            setSavingId(null);
        }
    };

    // ── CHOISIR TRANSPORTEUR ─────────────────────────────────────
    const choisirTransporteur = async (idColis, voyageurId) => {
        setChoosingId(voyageurId);
        try {
            const response = await fetch(`${API_BASE}/colis/${idColis}/choisir-transporteur/${voyageurId}`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const updated = await response.json();
                setColis(colis.map(c => c.idColis === updated.idColis ? updated : c));
                setShowPostulantsModal(false);
                afficherSuccès("Transporteur choisi ! En attente du paiement.");
            } else {
                const msg = await response.text();
                setErreur(msg || "Impossible de choisir ce transporteur.");
            }
        } catch {
            setErreur("Erreur réseau.");
        } finally {
            setChoosingId(null);
        }
    };

    // ── POSTULANTS ────────────────────────────────────────────────
    const chargerPostulants = async (idColis) => {
        setColisPostulantsId(idColis);
        try {
            const response = await fetch(`${API_BASE}/colis/${idColis}/postulants`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPostulants(data);
                setShowPostulantsModal(true);
            } else {
                setErreur("Impossible de charger les voyageurs.");
            }
        } catch {
            setErreur("Erreur réseau.");
        }
    };

    const afficherSuccès = (msg) => {
        setSuccès(msg);
        setTimeout(() => setSuccès(''), 3000);
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center mt-5" style={{ height: "200px" }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
            </div>
        </div>
    );

    // ── Carte d'un colis (vue Expéditeur) ───────────────────────────
    const renderColisCard = (c) => {
        const info = STATUT_INFO[c.statutColis] || { cls: 'bg-secondary', label: c.statutColis };
        const paiementFait = c.paiementEffectue;
        const role = rolesParColis[c.idColis];

        return (
            <div className="col-md-6 col-lg-4" key={c.idColis}>
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                    {/* Bandeau coloré */}
                    <div className="bg-primary bg-gradient" style={{ height: 6 }} />

                    <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
                                     style={{ width: 40, height: 40, flexShrink: 0 }}>
                                    <FaBoxOpen size={18} />
                                </div>
                                <div>
                                    <div className="fw-bold small d-flex align-items-center gap-1">
                                        <FaMapMarkerAlt className="text-primary" size={12} />
                                        {c.villeDepart} <span className="text-muted">→</span> {c.villeArrive}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        {new Date(c.dateCreation).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                            <span className={`badge ${info.cls} rounded-pill px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                                {info.label}
                            </span>
                        </div>

                        <p className="text-muted small mb-3" style={{ minHeight: '2.5em' }}>
                            {c.description || "Aucune description fournie."}
                        </p>

                        <div className="d-flex gap-3 mb-3 small text-secondary flex-wrap">
                            <span className="d-flex align-items-center gap-1">
                                <FaWeightHanging className="text-primary" /> {c.poids} kg
                            </span>
                            {c.dimension && (
                                <span className="d-flex align-items-center gap-1">
                                    <FaRulerCombined className="text-primary" /> {c.dimension} cm
                                </span>
                            )}
                            {c.telephoneDestinataire && (
                                <span className="d-flex align-items-center gap-1">
                                    <FaPhoneAlt className="text-primary" /> {c.telephoneDestinataire}
                                </span>
                            )}
                        </div>

                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <span className="fw-bold text-success fs-5">{c.prixTransport} FCFA</span>
                        </div>

                        {/* ── Actions selon le statut ── */}
                        <div className="mt-auto d-flex flex-wrap gap-2">
                            {c.statutColis === 'EN_ATTENTE' && (
                                <>
                                    <button
                                        className="btn btn-primary btn-sm rounded-pill px-3 flex-grow-1"
                                        onClick={() => chargerPostulants(c.idColis)}
                                    >
                                        <FaUserCheck className="me-1" /> Voir les offres
                                    </button>
                                    <button
                                        className="btn btn-sm border-0 text-primary"
                                        style={{ backgroundColor: '#eef2ff' }}
                                        onClick={() => ouvrirEdition(c)}
                                        title="Modifier le colis"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.idColis)}
                                        disabled={deletingId === c.idColis}
                                        className="btn btn-sm border-0 text-danger"
                                        style={{ backgroundColor: '#fff1f1' }}
                                        title="Supprimer le colis"
                                    >
                                        {deletingId === c.idColis
                                            ? <span className="spinner-border spinner-border-sm" />
                                            : <FaTrash size={16} />}
                                    </button>
                                </>
                            )}

                            {c.statutColis === 'EN_COURS' && c.idTransporteur && !paiementFait && (
                                <button
                                    className="btn btn-warning btn-sm rounded-pill px-3 flex-grow-1 fw-semibold"
                                    onClick={() => setColisAPayer(c)}
                                >
                                    <FaMoneyBillWave className="me-1" /> Payer le transport
                                </button>
                            )}

                            {(c.statutColis === 'EN_COURS' || c.statutColis === 'TERMINE' || c.statutColis === 'LIVRE') && c.idTransporteur && paiementFait && (
                                <>
                                    <button
                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 flex-grow-1"
                                        onClick={() => setColisChat(c)}
                                    >
                                        <FaCommentDots className="me-1" /> Discuter
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm rounded-pill px-3 flex-grow-1"
                                        onClick={() => setColisSuivi(c)}
                                    >
                                        <FaMapMarkedAlt className="me-1" /> Suivi
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ── Carte d'un colis (vue Voyageur / transport en charge) ───────
    const renderTransportCard = (c) => {
        const info = STATUT_INFO[c.statutColis] || { cls: 'bg-secondary', label: c.statutColis };
        const paiementFait = c.paiementEffectue;

        return (
            <div className="col-md-6 col-lg-4" key={c.idColis}>
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                    <div className="bg-success bg-gradient" style={{ height: 6 }} />
                    <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success"
                                     style={{ width: 40, height: 40, flexShrink: 0 }}>
                                    <FaBoxOpen size={18} />
                                </div>
                                <div>
                                    <div className="fw-bold small d-flex align-items-center gap-1">
                                        <FaMapMarkerAlt className="text-success" size={12} />
                                        {c.villeDepart} <span className="text-muted">→</span> {c.villeArrive}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        Colis transporté
                                    </div>
                                </div>
                            </div>
                            <span className={`badge ${info.cls} rounded-pill px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                                {info.label}
                            </span>
                        </div>

                        <p className="text-muted small mb-3" style={{ minHeight: '2.5em' }}>
                            {c.description || "Aucune description fournie."}
                        </p>

                        <div className="d-flex gap-3 mb-3 small text-secondary flex-wrap">
                            <span className="d-flex align-items-center gap-1">
                                <FaWeightHanging className="text-success" /> {c.poids} kg
                            </span>
                            <span className="fw-bold text-success">{c.prixTransport} FCFA</span>
                        </div>

                        <div className="mt-auto d-flex flex-wrap gap-2">
                            {!paiementFait && (
                                <span className="badge bg-warning text-dark w-100 py-2">
                                    En attente du paiement de l'expéditeur
                                </span>
                            )}
                            {paiementFait && (
                                <>
                                    <button
                                        className="btn btn-success btn-sm rounded-pill px-3 flex-grow-1 fw-semibold"
                                        onClick={() => setColisValider(c)}
                                    >
                                        <FaQrcode className="me-1" /> Valider livraison
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 flex-grow-1"
                                        onClick={() => setColisChat(c)}
                                    >
                                        <FaCommentDots className="me-1" /> Discuter
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                        onClick={() => setColisSuivi(c)}
                                    >
                                        <FaMapMarkedAlt className="me-1" /> Suivi
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ── Carte d'un colis (vue Destinataire) ─────────────────────────
    const renderColisRecuCard = (c) => {
        const info = STATUT_INFO[c.statutColis] || { cls: 'bg-secondary', label: c.statutColis };
        const paiementFait = c.paiementEffectue;

        return (
            <div className="col-md-6 col-lg-4" key={c.idColis}>
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                    <div className="bg-warning bg-gradient" style={{ height: 6 }} />
                    <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning bg-opacity-10 text-warning"
                                     style={{ width: 40, height: 40, flexShrink: 0 }}>
                                    <FaBoxOpen size={18} />
                                </div>
                                <div>
                                    <div className="fw-bold small d-flex align-items-center gap-1">
                                        <FaMapMarkerAlt className="text-warning" size={12} />
                                        {c.villeDepart} <span className="text-muted">→</span> {c.villeArrive}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        Colis à recevoir
                                    </div>
                                </div>
                            </div>
                            <span className={`badge ${info.cls} rounded-pill px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                                {info.label}
                            </span>
                        </div>

                        <p className="text-muted small mb-3" style={{ minHeight: '2.5em' }}>
                            {c.description || "Aucune description fournie."}
                        </p>

                        <div className="d-flex gap-3 mb-3 small text-secondary flex-wrap">
                            <span className="d-flex align-items-center gap-1">
                                <FaWeightHanging className="text-warning" /> {c.poids} kg
                            </span>
                            <span className="d-flex align-items-center gap-1">
                                <FaMapMarkerAlt className="text-warning" /> {c.adresseLivraison}
                            </span>
                        </div>

                        <div className="mt-auto d-flex flex-wrap gap-2">
                            {!paiementFait && (
                                <span className="badge bg-warning text-dark w-100 py-2">
                                    En attente du paiement de l'expéditeur
                                </span>
                            )}
                            {paiementFait && (
                                <>
                                    <button
                                        className="btn btn-success btn-sm rounded-pill px-3 flex-grow-1 fw-semibold"
                                        onClick={() => setColisQr(c)}
                                        title="Afficher le QR code de livraison à montrer au voyageur"
                                    >
                                        <FaQrcode className="me-1" /> QR Code
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 flex-grow-1"
                                        onClick={() => setColisChat(c)}
                                    >
                                        <FaCommentDots className="me-1" /> Discuter
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                        onClick={() => setColisSuivi(c)}
                                    >
                                        <FaMapMarkedAlt className="me-1" /> Suivi
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="fw-bold text-primary mb-0">Mes colis</h2>
                    <p className="text-muted mb-0 small">Gérez vos envois et suivez vos transports en cours.</p>
                </div>
            </div>

            {succès && <div className="alert alert-success alert-dismissible">{succès}</div>}
            {erreur && (
                <div className="alert alert-danger alert-dismissible">
                    {erreur} <button className="btn-close" onClick={() => setErreur('')}></button>
                </div>
            )}

            {/* ── SECTION : MES ENVOIS ── */}
            <h5 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
                <FaBoxOpen className="text-primary" /> Mes envois
            </h5>
            {colis.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center mb-4">
                    <FaPlus size={40} className="text-muted mb-3 mx-auto opacity-50" />
                    <p className="text-muted mb-0">Vous n'avez pas encore de colis enregistré.</p>
                </div>
            ) : (
                <div className="row g-3 mb-4">
                    {colis.map(renderColisCard)}
                </div>
            )}

            {/* ── SECTION : MES TRANSPORTS ── */}
            {transports.length > 0 && (
                <>
                    <h5 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2 mt-4">
                        <FaMapMarkedAlt className="text-success" /> Colis que je transporte
                    </h5>
                    <div className="row g-3 mb-4">
                        {transports.map(renderTransportCard)}
                    </div>
                </>
            )}

            {/* ── SECTION : COLIS REÇUS ── */}
            {colisRecus.length > 0 && (
                <>
                    <h5 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2 mt-4">
                        <FaBoxOpen className="text-warning" /> Colis reçus
                    </h5>
                    <div className="row g-3 mb-4">
                        {colisRecus.map(renderColisRecuCard)}
                    </div>
                </>
            )}

            {/* ── MODAL MODIFICATION ─────────────────────────────── */}
            {showEditModal && colisEnEdition && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content rounded-4">
                            <div className="modal-header bg-primary text-white rounded-top-4">
                                <h5 className="modal-title">Modifier le colis</h5>
                                <button className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {erreur && <div className="alert alert-danger">{erreur}</div>}
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            rows={2}
                                            value={formEdit.description}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Ville de départ</label>
                                        <input
                                            className="form-control"
                                            name="villeDepart"
                                            value={formEdit.villeDepart}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Ville d'arrivée</label>
                                        <input
                                            className="form-control"
                                            name="villeArrive"
                                            value={formEdit.villeArrive}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">Poids (kg)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="poids"
                                            value={formEdit.poids}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">Dimension (cm)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="dimension"
                                            value={formEdit.dimension}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">Prix transport (FCFA)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="prixTransport"
                                            value={formEdit.prixTransport}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Adresse de récupération</label>
                                        <input
                                            className="form-control"
                                            name="adresseRecuperation"
                                            value={formEdit.adresseRecuperation}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Adresse de livraison</label>
                                        <input
                                            className="form-control"
                                            name="adresseLivraison"
                                            value={formEdit.adresseLivraison}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Téléphone destinataire</label>
                                        <input
                                            className="form-control"
                                            name="telephoneDestinataire"
                                            value={formEdit.telephoneDestinataire}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary rounded-pill" onClick={() => setShowEditModal(false)}>
                                    Annuler
                                </button>
                                <button
                                    className="btn btn-primary rounded-pill"
                                    onClick={handleSaveEdit}
                                    disabled={savingId === colisEnEdition.idColis}
                                >
                                    {savingId === colisEnEdition.idColis ? (
                                        <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</>
                                    ) : "Enregistrer les modifications"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL VOYAGEURS / POSTULANTS ───────────────────── */}
            {showPostulantsModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4">
                            <div className="modal-header bg-primary text-white rounded-top-4">
                                <h5 className="modal-title">
                                    <FaUserCheck className="me-2" />
                                    Voyageurs intéressés ({postulants.length})
                                </h5>
                                <button className="btn-close btn-close-white" onClick={() => setShowPostulantsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {postulants.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <FaUserCheck size={40} className="mb-3 opacity-25" />
                                        <p>Aucun voyageur n'a encore postulé pour ce colis.</p>
                                    </div>
                                ) : (
                                    postulants.map(p => (
                                        <div key={p.idUtilisateur} className="d-flex align-items-center mb-3 p-3 border rounded-4 shadow-sm">
                                            <div
                                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 fw-bold flex-shrink-0"
                                                style={{ width: 50, height: 50, fontSize: 18 }}
                                            >
                                                {p.prenom?.[0]?.toUpperCase()}{p.nom?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold">{p.prenom} {p.nom}</div>
                                                <small className="text-muted">{p.numeroPrincipal}</small>
                                                <div>
                                                    <span className="badge bg-success bg-opacity-10 text-success">
                                                        Voyageur certifié
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-success btn-sm rounded-pill ms-2 px-3"
                                                onClick={() => choisirTransporteur(colisPostulantsId, p.idUtilisateur)}
                                                disabled={choosingId === p.idUtilisateur}
                                            >
                                                {choosingId === p.idUtilisateur ? (
                                                    <span className="spinner-border spinner-border-sm" />
                                                ) : "Choisir"}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary rounded-pill" onClick={() => setShowPostulantsModal(false)}>
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

          
            {colisAPayer && (
                <PaiementModal
                    colis={colisAPayer}
                    onClose={() => setColisAPayer(null)}
                    onSuccess={() => {
                        setColis(colis.map(c => c.idColis === colisAPayer.idColis ? { ...c, paiementEffectue: true } : c));
                        afficherSuccès("Paiement confirmé ! Le destinataire a reçu son code OTP et les discussions sont ouvertes.");
                    }}
                />
            )}

            {/* ── MODAL CHOIX CHAT (séparé selon le rôle) ─────────── */}
            {colisChat && (
                <ChoixChatModal
                    colis={colisChat}
                    monRole={rolesParColis[colisChat.idColis] || 'EXPEDITEUR'}
                    onClose={() => setColisChat(null)}
                />
            )}

            {/* ── MODAL VALIDER LIVRAISON (voyageur : QR + OTP) ───── */}
            {colisValider && (
                <ValiderLivraison
                    colis={colisValider}
                    onClose={() => setColisValider(null)}
                    onSuccess={() => {
                        setTransports(transports.map(c =>
                            c.idColis === colisValider.idColis ? { ...c, statutColis: 'TERMINE' } : c
                        ));
                        afficherSuccès("Livraison confirmée ! Votre paiement a été déclenché.");
                    }}
                />
            )}

           
            {colisQr && (
                <QrCodeDestinataire
                    colis={colisQr}
                    onClose={() => setColisQr(null)}
                />
            )}
                {colisSuivi && (
                <SuiviPanel
                    idColis={colisSuivi.idColis}
                    monRole={rolesParColis[colisSuivi.idColis] || 'EXPEDITEUR'}
                    onClose={() => setColisSuivi(null)}
                />
            )}
        </div>
    );
}
