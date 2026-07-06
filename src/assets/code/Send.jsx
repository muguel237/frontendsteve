import { useState, useEffect, useRef } from "react";
import { API_BASE } from "./config.js";
import { 
  FaMapMarkerAlt, FaBoxOpen, FaCamera, FaInfoCircle, FaTimes, FaUserCircle,
  FaCheckCircle, FaTimesCircle, FaSpinner
} from "react-icons/fa";

export default function Send() {
  const [formData, setFormData] = useState({
    villeDepart: "",
    villeArrive: "",           
    adresseRecuperation: "",
    adresseLivraison: "",
    poids: "",
    dimension: "",
    description: "",
    dateLivraison: "",
    telephoneDestinataire: "",
    prixTransport: "",
  });

  const [files, setFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // ── Vérification numéro destinataire ─────────────────────────────────────
  const [etatNumero, setEtatNumero] = useState("idle"); 
  const [infoDestinataire, setInfoDestinataire] = useState(null);
  const debounceRef = useRef(null);

  const validerNumeroCamerounais = (n) => {
    const d = n.replace(/\D/g, "");
    return (d.length === 9 && d.startsWith("6")) ||
           (d.length === 12 && d.startsWith("2376"));
  };

  useEffect(() => {
    const numero = formData.telephoneDestinataire;
    if (!numero) { setEtatNumero("idle"); setInfoDestinataire(null); return; }
    if (!validerNumeroCamerounais(numero)) { setEtatNumero("invalid"); setInfoDestinataire(null); return; }

    setEtatNumero("checking");
    setInfoDestinataire(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/utilisateurs/verifier-numero?numero=${encodeURIComponent(numero)}`);
        const data = await res.json();
        if (data.existe) { setEtatNumero("ok"); setInfoDestinataire({ prenom: data.prenom, nom: data.nom }); }
        else setEtatNumero("error");
      } catch { setEtatNumero("idle"); }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [formData.telephoneDestinataire]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    const newUrls = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviewImages((prev) => [...prev, ...newUrls]);
  };

  const removeImage = (i) => {
    setFiles(files.filter((_, idx) => idx !== i));
    setPreviewImages(previewImages.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "danger", text: "Vous devez être connecté." });
      setLoading(false);
      return;
    }

    if (etatNumero !== "ok") {
      setMessage({
        type: "danger",
        text: etatNumero === "error"
          ? "Le numéro du destinataire n'est lié à aucun compte Colisender."
          : etatNumero === "invalid"
          ? "Le numéro du destinataire n'est pas un numéro camerounais valide (ex: 677000000)."
          : "Veuillez patienter, vérification du numéro en cours...",
      });
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("villeDepart", formData.villeDepart);
    fd.append("villeArrive", formData.villeArrive);     // ← nom correct
    fd.append("adresseRecuperation", formData.adresseRecuperation);
    fd.append("adresseLivraison", formData.adresseLivraison);
    fd.append("poids", formData.poids);
    fd.append("dimension", formData.dimension || "0");
    fd.append("description", formData.description);
    fd.append("dateLivraison", formData.dateLivraison);
    fd.append("telephoneDestinataire", formData.telephoneDestinataire);
    fd.append("prixTransport", formData.prixTransport);
    fd.append("statutColis", "EN_ATTENTE");

    files.forEach(file => fd.append("photos", file));

    try {
      const res = await fetch(`${API_BASE}/colis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Votre annonce a été publiée avec succès !" });
        setFormData({
          villeDepart: "", villeArrive: "", adresseRecuperation: "",
          adresseLivraison: "", poids: "", dimension: "", description: "",
          dateLivraison: "", telephoneDestinataire: "", prixTransport: "",
        });
        setFiles([]);
        setPreviewImages([]);
      } else {
        const errText = await res.text();
        setMessage({ type: "danger", text: "Erreur " + res.status + " : " + errText });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Erreur réseau : " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5">
            <h2 className="fw-bold text-dark mb-4">Publier une annonce</h2>

            {message.text && (
              <div className={`alert alert-${message.type} alert-dismissible`}>
                {message.text}
                <button className="btn-close" onClick={() => setMessage({ type: "", text: "" })}></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <h5 className="text-primary mb-3"><FaMapMarkerAlt /> Itinéraire</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input type="text" className="form-control rounded-pill p-3"
                      placeholder="Ville de départ" required
                      value={formData.villeDepart}
                      onChange={e => setFormData({...formData, villeDepart: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <input type="text" className="form-control rounded-pill p-3"
                      placeholder="Ville d'arrivée" required
                      value={formData.villeArrive}
                      onChange={e => setFormData({...formData, villeArrive: e.target.value})} />
                  </div>
                  <div className="col-12">
                    <input type="text" className="form-control rounded-pill p-3"
                      placeholder="Adresse précise de récupération" required
                      value={formData.adresseRecuperation}
                      onChange={e => setFormData({...formData, adresseRecuperation: e.target.value})} />
                  </div>
                  <div className="col-12">
                    <input type="text" className="form-control rounded-pill p-3"
                      placeholder="Adresse précise de livraison" required
                      value={formData.adresseLivraison}
                      onChange={e => setFormData({...formData, adresseLivraison: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-primary mb-3"><FaUserCircle /> Informations du destinataire</h5>
                <div className="position-relative">
                  <input type="tel" className={`form-control rounded-pill p-3 pe-5 ${
                      etatNumero === "ok" ? "is-valid" :
                      etatNumero === "error" || etatNumero === "invalid" ? "is-invalid" : ""
                    }`}
                    placeholder="Numéro principal du destinataire (ex: 677000000)" required
                    value={formData.telephoneDestinataire}
                    onChange={e => setFormData({...formData, telephoneDestinataire: e.target.value})} />
                  <span className="position-absolute top-50 end-0 translate-middle-y me-3">
                    {etatNumero === "checking" && <FaSpinner className="text-secondary fa-spin" />}
                    {etatNumero === "ok"       && <FaCheckCircle className="text-success" />}
                    {etatNumero === "error"    && <FaTimesCircle className="text-danger" />}
                    {etatNumero === "invalid"  && <FaTimesCircle className="text-warning" />}
                  </span>
                </div>
                {etatNumero === "checking" && <div className="form-text ms-3">Vérification en cours...</div>}
                {etatNumero === "ok" && infoDestinataire && <div className="form-text text-success ms-3">✓ Compte trouvé : {infoDestinataire.prenom} {infoDestinataire.nom}</div>}
                {etatNumero === "error"   && <div className="form-text text-danger ms-3">Aucun compte Colisender associé à ce numéro.</div>}
                {etatNumero === "invalid" && formData.telephoneDestinataire && <div className="form-text text-warning ms-3">Format invalide — ex: 677000000 (9 chiffres) ou 237677000000 (12 chiffres).</div>}
                {etatNumero === "idle"    && <div className="form-text ms-3">Ce numéro doit correspondre au numéro principal d'un compte Colisender.</div>}
              </div>

              <div className="mb-4">
                <h5 className="text-primary mb-3"><FaBoxOpen /> Détails du colis</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input type="number" className="form-control rounded-pill p-3"
                      placeholder="Poids (kg)" required min="0.1" step="0.1"
                      value={formData.poids}
                      onChange={e => setFormData({...formData, poids: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <input type="number" className="form-control rounded-pill p-3"
                      placeholder="Dimension (cm, facultatif)"
                      value={formData.dimension}
                      onChange={e => setFormData({...formData, dimension: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <input type="number" className="form-control rounded-pill p-3"
                      placeholder="Prix de transport (FCFA)" required min="1"
                      value={formData.prixTransport}
                      onChange={e => setFormData({...formData, prixTransport: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted ms-2 mb-1">Date de transport</label>
                    <input type="date" className="form-control rounded-pill p-3" required
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.dateLivraison}
                      onChange={e => setFormData({...formData, dateLivraison: e.target.value})} />
                  </div>
                </div>
                <div className="mt-3">
                  <textarea className="form-control rounded-4 p-3" rows="3"
                    placeholder="Description détaillée du colis..." required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>

                <div className="mt-3">
                  <label className="text-muted small mb-2 d-block"><FaCamera /> Photos du colis</label>
                  <div className="border border-2 border-dashed rounded-4 p-4 text-center bg-light position-relative"
                    style={{ minHeight: "120px" }}>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange}
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0" required
                      style={{ cursor: "pointer" }} />
                    <p className="mb-0 text-secondary mt-3">Cliquez pour ajouter des photos</p>
                  </div>
                  {previewImages.length > 0 && (
                    <div className="d-flex gap-3 mt-3 flex-wrap">
                      {previewImages.map((src, i) => (
                        <div key={i} className="position-relative" style={{ width: "80px", height: "80px" }}>
                          <img src={src} alt="preview" className="rounded-3 shadow-sm"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-0"
                            style={{ width: "24px", height: "24px", fontSize: "12px", transform: "translate(25%,-25%)" }}
                            onClick={() => removeImage(i)}>
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="alert alert-info border-0 rounded-4 p-3 d-flex align-items-center gap-3">
                <FaInfoCircle size={22} className="text-primary flex-shrink-0" />
                <div className="small">
                  <strong>Note :</strong> Le paiement sera sécurisé (mis en séquestre) jusqu'à confirmation de la livraison via un code OTP envoyé au destinataire.
                  Le voyageur recevra <strong>80% du prix</strong> après confirmation.
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 btn-lg rounded-pill fw-bold py-3" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Publication...</> : "Valider et publier"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
