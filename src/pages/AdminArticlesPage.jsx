import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function AdminArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [sousCategorieId, setSousCategorieId] = useState('');
  const [disponible, setDisponible] = useState(true);

  const [editId, setEditId] = useState(null);

  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppressionId, setSuppressionId] = useState(null);

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [filtreSousCategorie, setFiltreSousCategorie] = useState('');
  const [filtreDisponibilite, setFiltreDisponibilite] = useState('tous');

  // Pagination
  const [pageCourante, setPageCourante] = useState(1);
  const articlesParPage = 10;

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
      const [resArticles, resSousCategories] = await Promise.all([
        api.get('/articles'),
        api.get('/sous-categories'),
      ]);

      const listeArticles = Array.isArray(resArticles.data)
        ? resArticles.data
        : resArticles.data.data || [];

      const listeSousCategories = Array.isArray(resSousCategories.data)
        ? resSousCategories.data
        : resSousCategories.data.data || [];

      setArticles(listeArticles);
      setSousCategories(listeSousCategories);

      // Sélectionner automatiquement la première sous-catégorie
      // uniquement si aucune n'est encore sélectionnée.
      if (listeSousCategories.length > 0 && !sousCategorieId) {
        setSousCategorieId(String(listeSousCategories[0].id));
      }
    } catch (err) {
      setErreur('Impossible de charger les données.');
    } finally {
      setChargement(false);
    }
  };

  // =========================================================
  // RESET FORMULAIRE
  // =========================================================

  const resetForm = () => {
    setNom('');
    setDescription('');
    setPrix('');
    setSousCategorieId(
      sousCategories.length > 0
        ? String(sousCategories[0].id)
        : ''
    );
    setDisponible(true);
    setEditId(null);
    setErreur('');
  };

  // =========================================================
  // ENREGISTREMENT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErreur('');
    setSucces('');

    if (!sousCategorieId) {
      setErreur('Veuillez sélectionner une sous-catégorie.');
      return;
    }

    if (!prix || Number(prix) < 0) {
      setErreur('Veuillez saisir un prix valide.');
      return;
    }

    const payload = {
      nom: nom.trim(),
      description: description.trim(),
      prix: parseFloat(prix),
      sous_categorie_id: parseInt(sousCategorieId),
      disponible,
    };

    setEnregistrement(true);

    try {
      if (editId) {
        await api.put(`/articles/${editId}`, payload);

        setSucces('Article modifié avec succès.');
      } else {
        await api.post('/articles', payload);

        setSucces('Article ajouté avec succès.');
      }

      resetForm();

      await charger();

      // Le message de succès est conservé après charger()
      setTimeout(() => {
        setSucces('');
      }, 3000);

    } catch (err) {
      setErreur(
        err.response?.data?.message ||
        "Erreur lors de l'enregistrement de l'article."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  // =========================================================
  // MODIFICATION
  // =========================================================

  const handleEdit = (article) => {
    setEditId(article.id);
    setNom(article.nom || '');
    setDescription(article.description || '');
    setPrix(article.prix ?? '');
    setSousCategorieId(
      article.sous_categorie_id
        ? String(article.sous_categorie_id)
        : ''
    );
    setDisponible(Boolean(article.disponible));

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
    if (!window.confirm('Supprimer cet article ?')) {
      return;
    }

    setErreur('');
    setSucces('');
    setSuppressionId(id);

    try {
      await api.delete(`/articles/${id}`);

      setSucces('Article supprimé avec succès.');

      await charger();

      setTimeout(() => {
        setSucces('');
      }, 3000);

    } catch (err) {
      setErreur(
        err.response?.data?.message ||
        'Suppression impossible.'
      );
    } finally {
      setSuppressionId(null);
    }
  };

  // =========================================================
  // RECHERCHE + FILTRES
  // =========================================================

  const articlesFiltres = articles.filter((article) => {

    // Recherche
    if (recherche.trim() !== '') {
      const terme = recherche.toLowerCase();

      const nomArticle = String(
        article.nom || ''
      ).toLowerCase();

      const descriptionArticle = String(
        article.description || ''
      ).toLowerCase();

      const nomSousCategorie = String(
        article.sous_categorie?.nom || ''
      ).toLowerCase();

      const correspondRecherche =
        nomArticle.includes(terme) ||
        descriptionArticle.includes(terme) ||
        nomSousCategorie.includes(terme);

      if (!correspondRecherche) {
        return false;
      }
    }

    // Sous-catégorie
    if (filtreSousCategorie !== '') {
      if (
        Number(article.sous_categorie_id) !==
        Number(filtreSousCategorie)
      ) {
        return false;
      }
    }

    // Disponibilité
    if (filtreDisponibilite === 'disponible') {
      if (!article.disponible) {
        return false;
      }
    }

    if (filtreDisponibilite === 'indisponible') {
      if (article.disponible) {
        return false;
      }
    }

    return true;
  });

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    Math.ceil(
      articlesFiltres.length / articlesParPage
    ) || 1;

  const indexDernier =
    pageCourante * articlesParPage;

  const indexPremier =
    indexDernier - articlesParPage;

  const articlesAffiches =
    articlesFiltres.slice(
      indexPremier,
      indexDernier
    );

  const changerRecherche = (e) => {
    setRecherche(e.target.value);
    setPageCourante(1);
  };

  const changerFiltreSousCategorie = (e) => {
    setFiltreSousCategorie(e.target.value);
    setPageCourante(1);
  };

  const changerFiltreDisponibilite = (e) => {
    setFiltreDisponibilite(e.target.value);
    setPageCourante(1);
  };

  // =========================================================
  // STATISTIQUES
  // =========================================================

  const totalArticles = articles.length;

  const articlesDisponibles = articles.filter(
    (article) => article.disponible
  ).length;

  const articlesIndisponibles =
    totalArticles - articlesDisponibles;

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

              <i className="bi bi-menu-button-wide me-2"></i>

              Gestion du menu

            </h2>

            <p className="text-muted mb-0">

              Gérez les plats, boissons, prix et disponibilités.

            </p>

          </div>


          <button
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

          <div className="alert alert-danger d-flex align-items-center">

            <i className="bi bi-exclamation-triangle me-2"></i>

            <span>{erreur}</span>

          </div>

        )}


        {succes && (

          <div className="alert alert-success d-flex align-items-center">

            <i className="bi bi-check-circle me-2"></i>

            <span>{succes}</span>

          </div>

        )}


        {/* =====================================================
            CARTES STATISTIQUES
        ===================================================== */}

        <div className="row g-4 mb-4">

          {/* TOTAL */}

          <div className="col-md-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>

                    <p className="text-muted mb-1">
                      Total des articles
                    </p>

                    <h3 className="fw-bold mb-0">
                      {totalArticles}
                    </h3>

                  </div>

                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">

                    <i className="bi bi-grid-3x3-gap fs-4 text-primary"></i>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* DISPONIBLES */}

          <div className="col-md-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>

                    <p className="text-muted mb-1">
                      Articles disponibles
                    </p>

                    <h3 className="fw-bold mb-0">
                      {articlesDisponibles}
                    </h3>

                  </div>

                  <div className="bg-success bg-opacity-10 rounded-circle p-3">

                    <i className="bi bi-check-circle fs-4 text-success"></i>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* INDISPONIBLES */}

          <div className="col-md-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>

                    <p className="text-muted mb-1">
                      Articles indisponibles
                    </p>

                    <h3 className="fw-bold mb-0">
                      {articlesIndisponibles}
                    </h3>

                  </div>

                  <div className="bg-danger bg-opacity-10 rounded-circle p-3">

                    <i className="bi bi-x-circle fs-4 text-danger"></i>

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
                    ? 'Modifier un article'
                    : 'Ajouter un article'}

                </h5>

                <small className="text-muted">

                  {editId
                    ? 'Modifiez les informations de cet article.'
                    : 'Ajoutez un nouvel article au menu.'}

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

              <div className="row g-3">

                {/* NOM */}

                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Nom de l'article
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={nom}
                    onChange={(e) =>
                      setNom(e.target.value)
                    }
                    placeholder="Ex. Pizza Margherita"
                    required
                  />

                </div>


                {/* PRIX */}

                <div className="col-md-3">

                  <label className="form-label fw-semibold">
                    Prix
                  </label>

                  <div className="input-group">

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={prix}
                      onChange={(e) =>
                        setPrix(e.target.value)
                      }
                      placeholder="0"
                      required
                    />

                    <span className="input-group-text">
                      FCFA
                    </span>

                  </div>

                </div>


                {/* SOUS-CATÉGORIE */}

                <div className="col-md-3">

                  <label className="form-label fw-semibold">
                    Sous-catégorie
                  </label>

                  <select
                    className="form-select"
                    value={sousCategorieId}
                    onChange={(e) =>
                      setSousCategorieId(
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Sélectionner...
                    </option>

                    {sousCategories.map((sc) => (

                      <option
                        key={sc.id}
                        value={sc.id}
                      >
                        {sc.nom} ({sc.type})
                      </option>

                    ))}

                  </select>

                </div>


                {/* DESCRIPTION */}

                <div className="col-md-9">

                  <label className="form-label fw-semibold">
                    Description
                  </label>

                  <textarea
                    className="form-control"
                    rows="2"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    placeholder="Description de l'article..."
                  ></textarea>

                </div>


                {/* DISPONIBILITÉ */}

                <div className="col-md-3">

                  <label className="form-label fw-semibold">
                    Disponibilité
                  </label>

                  <div className="border rounded p-3 h-100 d-flex align-items-center">

                    <div className="form-check form-switch">

                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="disponibleCheck"
                        checked={disponible}
                        onChange={(e) =>
                          setDisponible(
                            e.target.checked
                          )
                        }
                      />

                      <label
                        className="form-check-label"
                        htmlFor="disponibleCheck"
                      >

                        {disponible
                          ? 'Disponible'
                          : 'Indisponible'}

                      </label>

                    </div>

                  </div>

                </div>


                {/* BOUTONS */}

                <div className="col-12">

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
                          ></span>

                          Enregistrement...

                        </>

                      ) : (

                        <>
                          <i
                            className={`bi ${
                              editId
                                ? 'bi-check-lg'
                                : 'bi-plus-lg'
                            } me-2`}
                          ></i>

                          {editId
  ? 'Enregistrer les modifications'
  : "Ajouter l'article"}

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

                        <i className="bi bi-x-lg me-2"></i>

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
            FILTRES
        ===================================================== */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-body">

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">

              <div>

                <h5 className="fw-bold mb-1">
                  Articles ({articlesFiltres.length})
                </h5>

                <small className="text-muted">
                  Recherchez et filtrez les articles du menu.
                </small>

              </div>

            </div>


            <div className="row g-3">

              {/* RECHERCHE */}

              <div className="col-md-5">

                <label className="form-label fw-semibold">
                  Rechercher
                </label>

                <div className="input-group">

                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nom, description ou sous-catégorie..."
                    value={recherche}
                    onChange={changerRecherche}
                  />

                </div>

              </div>


              {/* SOUS-CATÉGORIE */}

              <div className="col-md-4">

                <label className="form-label fw-semibold">
                  Sous-catégorie
                </label>

                <select
                  className="form-select"
                  value={filtreSousCategorie}
                  onChange={
                    changerFiltreSousCategorie
                  }
                >

                  <option value="">
                    Toutes les sous-catégories
                  </option>

                  {sousCategories.map((sc) => (

                    <option
                      key={sc.id}
                      value={sc.id}
                    >
                      {sc.nom} ({sc.type})
                    </option>

                  ))}

                </select>

              </div>


              {/* DISPONIBILITÉ */}

              <div className="col-md-3">

                <label className="form-label fw-semibold">
                  Disponibilité
                </label>

                <select
                  className="form-select"
                  value={filtreDisponibilite}
                  onChange={
                    changerFiltreDisponibilite
                  }
                >

                  <option value="tous">
                    Tous
                  </option>

                  <option value="disponible">
                    Disponibles
                  </option>

                  <option value="indisponible">
                    Indisponibles
                  </option>

                </select>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            TABLEAU
        ===================================================== */}

        <div className="card border-0 shadow-sm">

          <div className="card-body p-0">

            {chargement ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                ></div>

                <p className="text-muted mb-0">
                  Chargement des articles...
                </p>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th className="px-4">
                        Article
                      </th>

                      <th>
                        Sous-catégorie
                      </th>

                      <th>
                        Prix
                      </th>

                      <th>
                        Disponibilité
                      </th>

                      <th className="text-end px-4">
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {articlesAffiches.length > 0 ? (

                      articlesAffiches.map(
                        (article) => (

                          <tr key={article.id}>

                            {/* ARTICLE */}

                            <td className="px-4">

                              <div className="d-flex align-items-center">

                                <div
                                  className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                  }}
                                >

                                  <i className="bi bi-egg-fried text-primary"></i>

                                </div>


                                <div>

                                  <div className="fw-semibold">

                                    {article.nom}

                                  </div>


                                  {article.description && (

                                    <small className="text-muted">

                                      {article.description.length >
                                      70
                                        ? `${article.description.substring(
                                            0,
                                            70
                                          )}...`
                                        : article.description}

                                    </small>

                                  )}

                                </div>

                              </div>

                            </td>


                            {/* SOUS-CATÉGORIE */}

                            <td>

                              <span className="badge bg-light text-dark border">

                                {article.sous_categorie?.nom ||
                                  'Non définie'}

                              </span>

                              {article.sous_categorie?.type && (

                                <small className="d-block text-muted mt-1">

                                  {article.sous_categorie.type ===
                                  'plat'
                                    ? 'Plat'
                                    : 'Boisson'}

                                </small>

                              )}

                            </td>


                            {/* PRIX */}

                            <td>

                              <span className="fw-semibold">

                                {Number(
                                  article.prix || 0
                                ).toLocaleString(
                                  'fr-FR'
                                )}{' '}

                                FCFA

                              </span>

                            </td>


                            {/* DISPONIBILITÉ */}

                            <td>

                              {article.disponible ? (

                                <span className="badge bg-success">

                                  <i className="bi bi-check-circle me-1"></i>

                                  Disponible

                                </span>

                              ) : (

                                <span className="badge bg-secondary">

                                  <i className="bi bi-x-circle me-1"></i>

                                  Indisponible

                                </span>

                              )}

                            </td>


                            {/* ACTIONS */}

                            <td className="text-end px-4">

                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() =>
                                  handleEdit(
                                    article
                                  )
                                }
                                title="Modifier"
                              >

                                <i className="bi bi-pencil"></i>

                              </button>


                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  handleDelete(
                                    article.id
                                  )
                                }
                                disabled={
                                  suppressionId ===
                                  article.id
                                }
                                title="Supprimer"
                              >

                                {suppressionId ===
                                article.id ? (

                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>

                                ) : (

                                  <i className="bi bi-trash"></i>

                                )}

                              </button>

                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan="5"
                          className="text-center py-5"
                        >

                          <i className="bi bi-inbox fs-1 text-muted"></i>

                          <h6 className="mt-3">
                            Aucun article trouvé
                          </h6>

                          <p className="text-muted mb-0">

                            Essayez de modifier vos
                            critères de recherche.

                          </p>

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>


        {/* =====================================================
            PAGINATION
        ===================================================== */}

        {!chargement && totalPages > 1 && (

          <div className="d-flex justify-content-between align-items-center mt-4">

            <small className="text-muted">

              Page {pageCourante} sur {totalPages}

            </small>


            <nav>

              <ul className="pagination mb-0">

                <li
                  className={`page-item ${
                    pageCourante === 1
                      ? 'disabled'
                      : ''
                  }`}
                >

                  <button
                    className="page-link"
                    onClick={() =>
                      setPageCourante(
                        (prev) =>
                          Math.max(
                            prev - 1,
                            1
                          )
                      )
                    }
                  >

                    <i className="bi bi-chevron-left"></i>

                  </button>

                </li>


                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                ).map((numero) => (

                  <li
                    key={numero}
                    className={`page-item ${
                      pageCourante === numero
                        ? 'active'
                        : ''
                    }`}
                  >

                    <button
                      className="page-link"
                      onClick={() =>
                        setPageCourante(
                          numero
                        )
                      }
                    >

                      {numero}

                    </button>

                  </li>

                ))}


                <li
                  className={`page-item ${
                    pageCourante === totalPages
                      ? 'disabled'
                      : ''
                  }`}
                >

                  <button
                    className="page-link"
                    onClick={() =>
                      setPageCourante(
                        (prev) =>
                          Math.min(
                            prev + 1,
                            totalPages
                          )
                      )
                    }
                  >

                    <i className="bi bi-chevron-right"></i>

                  </button>

                </li>

              </ul>

            </nav>

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminArticlesPage;
