import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function AdminSousCategoriesPage() {
  const [sousCategories, setSousCategories] = useState([]);

  const [nom, setNom] = useState('');
  const [type, setType] = useState('plat');
  const [editId, setEditId] = useState(null);

  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppressionId, setSuppressionId] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  // =========================================================
  // CHARGEMENT
  // =========================================================

  const charger = async () => {
    setChargement(true);
    setErreur('');

    try {
      const res = await api.get('/sous-categories');

      const liste = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];

      setSousCategories(liste);
    } catch (err) {
      setErreur(
        err.response?.data?.message ||
        'Impossible de charger les sous-catégories.'
      );
    } finally {
      setChargement(false);
    }
  };

  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {
    setNom('');
    setType('plat');
    setEditId(null);
    setErreur('');
  };

  // =========================================================
  // MESSAGE SUCCÈS
  // =========================================================

  const afficherSucces = (message) => {
    setSucces(message);

    setTimeout(() => {
      setSucces('');
    }, 3000);
  };

  // =========================================================
  // ENREGISTREMENT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErreur('');
    setSucces('');

    if (!nom.trim()) {
      setErreur(
        'Veuillez saisir le nom de la sous-catégorie.'
      );
      return;
    }

    setEnregistrement(true);

    try {
      if (editId) {
        await api.put(`/sous-categories/${editId}`, {
          nom: nom.trim(),
          type,
        });

        resetForm();

        afficherSucces(
          'Sous-catégorie modifiée avec succès.'
        );
      } else {
        await api.post('/sous-categories', {
          nom: nom.trim(),
          type,
        });

        resetForm();

        afficherSucces(
          'Sous-catégorie ajoutée avec succès.'
        );
      }

      await charger();
    } catch (err) {
      setErreur(
        err.response?.data?.message ||
        "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  // =========================================================
  // MODIFICATION
  // =========================================================

  const handleEdit = (sc) => {
    setEditId(sc.id);
    setNom(sc.nom || '');
    setType(sc.type || 'plat');

    setErreur('');
    setSucces('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // =========================================================
  // SUPPRESSION
  // =========================================================

  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      'Voulez-vous vraiment supprimer cette sous-catégorie ?\n\nCette action est irréversible.'
    );

    if (!confirmation) {
      return;
    }

    setErreur('');
    setSucces('');
    setSuppressionId(id);

    try {
      await api.delete(`/sous-categories/${id}`);

      afficherSucces(
        'Sous-catégorie supprimée avec succès.'
      );

      await charger();
    } catch (err) {
      setErreur(
        err.response?.data?.message ||
        'Suppression impossible. Des articles peuvent encore être rattachés à cette sous-catégorie.'
      );
    } finally {
      setSuppressionId(null);
    }
  };

  // =========================================================
  // STATISTIQUES
  // =========================================================

  const totalSousCategories = sousCategories.length;

  const totalPlats = sousCategories.filter(
    (sc) => sc.type === 'plat'
  ).length;

  const totalBoissons = sousCategories.filter(
    (sc) => sc.type === 'boisson'
  ).length;

  // =========================================================
  // RENDU
  // =========================================================

  return (
    <div className="bg-light min-vh-100">

      <Header />

      <div className="container py-4">

        {/* =====================================================
            EN-TÊTE
        ===================================================== */}

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">

          <div>
            <h2 className="fw-bold mb-1">
              <i className="bi bi-tags me-2"></i>
              Gestion des sous-catégories
            </h2>

            <p className="text-muted mb-0">
              Gérez les catégories utilisées pour organiser
              les plats et les boissons.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={charger}
            disabled={chargement}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualiser
          </button>

        </div>

        {/* =====================================================
            ALERTES
        ===================================================== */}

        {erreur && (
          <div
            className="alert alert-danger alert-dismissible fade show d-flex align-items-center"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle me-2"></i>

            <span>{erreur}</span>

            <button
              type="button"
              className="btn-close ms-auto"
              onClick={() => setErreur('')}
              aria-label="Fermer"
            ></button>
          </div>
        )}

        {succes && (
          <div
            className="alert alert-success alert-dismissible fade show d-flex align-items-center"
            role="alert"
          >
            <i className="bi bi-check-circle me-2"></i>

            <span>{succes}</span>

            <button
              type="button"
              className="btn-close ms-auto"
              onClick={() => setSucces('')}
              aria-label="Fermer"
            ></button>
          </div>
        )}

        {/* =====================================================
            STATISTIQUES
        ===================================================== */}

        <div className="row g-4 mb-4">

          {/* TOTAL */}

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <p className="text-muted mb-1">
                      Total des sous-catégories
                    </p>

                    <h3 className="fw-bold mb-0">
                      {totalSousCategories}
                    </h3>
                  </div>

                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-tags fs-4 text-primary"></i>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* PLATS */}

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <p className="text-muted mb-1">
                      Sous-catégories de plats
                    </p>

                    <h3 className="fw-bold mb-0">
                      {totalPlats}
                    </h3>
                  </div>

                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-egg-fried fs-4 text-primary"></i>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* BOISSONS */}

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <p className="text-muted mb-1">
                      Sous-catégories de boissons
                    </p>

                    <h3 className="fw-bold mb-0">
                      {totalBoissons}
                    </h3>
                  </div>

                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-cup-straw fs-4 text-success"></i>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>

        {/* =====================================================
            FORMULAIRE
        ===================================================== */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div className="d-flex justify-content-between align-items-center">

              <div>

                <h5 className="fw-bold mb-1">

                  <i
                    className={`bi ${
                      editId
                        ? 'bi-pencil-square'
                        : 'bi-plus-circle'
                    } me-2`}
                  ></i>

                  {editId
                    ? 'Modifier une sous-catégorie'
                    : 'Ajouter une sous-catégorie'}

                </h5>

                <small className="text-muted">

                  {editId
                    ? 'Modifiez les informations puis enregistrez.'
                    : 'Créez une nouvelle sous-catégorie pour organiser votre menu.'}

                </small>

              </div>

              {editId && (
                <span className="badge bg-warning text-dark">
                  Mode modification
                </span>
              )}

            </div>

          </div>

          <div className="card-body px-4 pb-4">

            <form onSubmit={handleSubmit}>

              <div className="row g-3 align-items-end">

                {/* NOM */}

                <div className="col-md-5">

                  <label className="form-label fw-semibold">
                    Nom de la sous-catégorie
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex. Grillades, Cocktails..."
                    value={nom}
                    onChange={(e) =>
                      setNom(e.target.value)
                    }
                    disabled={enregistrement}
                    required
                  />

                </div>

                {/* TYPE */}

                <div className="col-md-3">

                  <label className="form-label fw-semibold">
                    Type
                  </label>

                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value)
                    }
                    disabled={enregistrement}
                  >
                    <option value="plat">
                      Plat
                    </option>

                    <option value="boisson">
                      Boisson
                    </option>
                  </select>

                </div>

                {/* BOUTONS */}

                <div className="col-md-4">

                  <div className="d-flex gap-2">

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={enregistrement}
                    >

                      {enregistrement ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>

                          Enregistrement...
                        </>
                      ) : editId ? (
                        <>
                          <i className="bi bi-check-lg me-1"></i>
                          Enregistrer
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-lg me-1"></i>
                          Ajouter
                        </>
                      )}

                    </button>

                    {editId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetForm}
                        disabled={enregistrement}
                      >
                        <i className="bi bi-x-lg me-1"></i>
                        Annuler
                      </button>
                    )}

                  </div>

                </div>

              </div>

            </form>

          </div>

        </div>

        {/* =====================================================
            LISTE
        ===================================================== */}

        <div className="card border-0 shadow-sm">

          <div className="card-body p-0">

            {/* EN-TÊTE */}

            <div className="p-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">

              <div>

                <h5 className="fw-bold mb-1">
                  Liste des sous-catégories
                </h5>

                <small className="text-muted">
                  {totalSousCategories}{' '}
                  sous-catégorie
                  {totalSousCategories > 1 ? 's' : ''}
                </small>

              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={charger}
                disabled={chargement}
              >

                <i className="bi bi-arrow-clockwise me-1"></i>
                Actualiser

              </button>

            </div>

            {/* CHARGEMENT */}

            {chargement ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                ></div>

                <p className="text-muted mb-0">
                  Chargement des sous-catégories...
                </p>

              </div>

            ) : sousCategories.length === 0 ? (

              /* AUCUNE DONNÉE */

              <div className="text-center py-5 px-3">

                <i className="bi bi-folder2-open fs-1 text-muted"></i>

                <h6 className="fw-bold mt-3">
                  Aucune sous-catégorie
                </h6>

                <p className="text-muted mb-0">
                  Commencez par ajouter une sous-catégorie.
                </p>

              </div>

            ) : (

              /* TABLEAU */

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th className="px-4">
                        Nom
                      </th>

                      <th>
                        Type
                      </th>

                      <th className="text-end px-4">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {sousCategories.map((sc) => (

                      <tr key={sc.id}>

                        <td className="px-4">

                          <div className="d-flex align-items-center">

                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                sc.type === 'plat'
                                  ? 'bg-primary bg-opacity-10'
                                  : 'bg-success bg-opacity-10'
                              }`}
                              style={{
                                width: '42px',
                                height: '42px',
                              }}
                            >

                              <i
                                className={`bi ${
                                  sc.type === 'plat'
                                    ? 'bi-egg-fried text-primary'
                                    : 'bi-cup-straw text-success'
                                }`}
                              ></i>

                            </div>

                            <div>

                              <div className="fw-semibold">
                                {sc.nom}
                              </div>

                              <small className="text-muted">
                                ID #{sc.id}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          {sc.type === 'plat' ? (

                            <span className="badge bg-primary-subtle text-primary">

                              <i className="bi bi-egg-fried me-1"></i>

                              Plat

                            </span>

                          ) : (

                            <span className="badge bg-success-subtle text-success">

                              <i className="bi bi-cup-straw me-1"></i>

                              Boisson

                            </span>

                          )}

                        </td>

                        <td className="text-end px-4">

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(sc)}
                            title="Modifier"
                          >

                            <i className="bi bi-pencil me-1"></i>
                            Modifier

                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDelete(sc.id)
                            }
                            disabled={
                              suppressionId === sc.id
                            }
                            title="Supprimer"
                          >

                            {suppressionId === sc.id ? (

                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              ></span>

                            ) : (

                              <>
                                <i className="bi bi-trash me-1"></i>
                                Supprimer
                              </>

                            )}

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminSousCategoriesPage;
