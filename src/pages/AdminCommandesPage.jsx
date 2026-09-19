import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function AdminCommandesPage() {
  const [commandes, setCommandes] = useState([]);

  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(null);

  // Filtres
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreServeur, setFiltreServeur] = useState('tous');
  const [filtrePeriode, setFiltrePeriode] = useState('toutes');
  const [recherche, setRecherche] = useState('');

  // Pagination
  const [pageCourante, setPageCourante] = useState(1);
  const commandesParPage = 10;

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    try {
      setChargement(true);
      setErreur('');

      const res = await api.get('/commandes');

      setCommandes(res.data.data || []);
    } catch (err) {
      setErreur('Impossible de charger les commandes.');
    } finally {
      setChargement(false);
    }
  };

  const afficherSucces = (message) => {
    setSucces(message);

    setTimeout(() => {
      setSucces('');
    }, 3000);
  };

  // --------------------------------------------------
  // DATE
  // --------------------------------------------------

  const obtenirDateCommande = (commande) => {
    /*
      Laravel utilise généralement created_at.

      Si ton API utilise un autre champ pour la date,
      il suffira de le modifier ici.
    */
    return commande.created_at;
  };

  const estAujourdHui = (date) => {
    const aujourdHui = new Date();

    return (
      date.getDate() === aujourdHui.getDate() &&
      date.getMonth() === aujourdHui.getMonth() &&
      date.getFullYear() === aujourdHui.getFullYear()
    );
  };

  const estCetteSemaine = (date) => {
    const aujourdHui = new Date();

    const debutSemaine = new Date(aujourdHui);
    const jour = aujourdHui.getDay();

    // Lundi = premier jour
    const difference = jour === 0 ? 6 : jour - 1;

    debutSemaine.setDate(
      aujourdHui.getDate() - difference
    );

    debutSemaine.setHours(0, 0, 0, 0);

    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 7);

    return (
      date >= debutSemaine &&
      date < finSemaine
    );
  };

  const estCeMois = (date) => {
    const aujourdHui = new Date();

    return (
      date.getMonth() === aujourdHui.getMonth() &&
      date.getFullYear() === aujourdHui.getFullYear()
    );
  };

  // --------------------------------------------------
  // MARQUER PAYÉE
  // --------------------------------------------------

  const marquerPayee = async (id) => {
    try {
      setActionEnCours(`payee-${id}`);
      setErreur('');

      await api.put(`/commandes/${id}`, {
        statut: 'payee',
      });

      afficherSucces(
        'Commande marquée comme payée.'
      );

      await charger();
    } catch (err) {
      setErreur(
        err.response?.data?.message ||
          'Erreur lors de la mise à jour.'
      );
    } finally {
      setActionEnCours(null);
    }
  };

  // --------------------------------------------------
  // SUPPRESSION
  // --------------------------------------------------

  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      'Voulez-vous vraiment supprimer cette commande ?\n\nCette action est irréversible.'
    );

    if (!confirmation) return;

    try {
      setActionEnCours(`delete-${id}`);
      setErreur('');

      await api.delete(`/commandes/${id}`);

      afficherSucces(
        'Commande supprimée avec succès.'
      );

      await charger();
    } catch (err) {
      setErreur(
        err.response?.data?.message ||
          'Suppression impossible.'
      );
    } finally {
      setActionEnCours(null);
    }
  };

  // --------------------------------------------------
  // SERVEURS DISPONIBLES
  // --------------------------------------------------

  const serveurs = [
    ...new Map(
      commandes
        .filter((commande) => commande.user)
        .map((commande) => [
          commande.user.id,
          commande.user,
        ])
    ).values(),
  ];

  // --------------------------------------------------
  // FILTRAGE
  // --------------------------------------------------

  const commandesFiltrees = commandes.filter(
    (commande) => {

      // -------------------------------
      // STATUT
      // -------------------------------

      if (
        filtreStatut === 'payee' &&
        commande.statut !== 'payee'
      ) {
        return false;
      }

      if (
        filtreStatut === 'non_payee' &&
        commande.statut === 'payee'
      ) {
        return false;
      }

      // -------------------------------
      // SERVEUR
      // -------------------------------

      if (
        filtreServeur !== 'tous' &&
        String(commande.user?.id) !==
          String(filtreServeur)
      ) {
        return false;
      }

      // -------------------------------
      // PÉRIODE
      // -------------------------------

      if (filtrePeriode !== 'toutes') {

        const valeurDate =
          obtenirDateCommande(commande);

        if (!valeurDate) {
          return false;
        }

        const dateCommande =
          new Date(valeurDate);

        if (isNaN(dateCommande.getTime())) {
          return false;
        }

        if (
          filtrePeriode === 'jour' &&
          !estAujourdHui(dateCommande)
        ) {
          return false;
        }

        if (
          filtrePeriode === 'semaine' &&
          !estCetteSemaine(dateCommande)
        ) {
          return false;
        }

        if (
          filtrePeriode === 'mois' &&
          !estCeMois(dateCommande)
        ) {
          return false;
        }
      }

      // -------------------------------
      // RECHERCHE
      // -------------------------------

      if (recherche.trim() !== '') {

        const texte =
          recherche.toLowerCase().trim();

        const table = String(
          commande.numero_table || ''
        ).toLowerCase();

        const serveur = String(
          commande.user?.name || ''
        ).toLowerCase();

        const articles =
          commande.detail_commandes
            ?.map(
              (detail) =>
                detail.article?.nom || ''
            )
            .join(' ')
            .toLowerCase() || '';

        return (
          table.includes(texte) ||
          serveur.includes(texte) ||
          articles.includes(texte)
        );
      }

      return true;
    }
  );

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const totalPages =
    Math.ceil(
      commandesFiltrees.length /
        commandesParPage
    ) || 1;

  const indexDernier =
    pageCourante * commandesParPage;

  const indexPremier =
    indexDernier - commandesParPage;

  const commandesAffichees =
    commandesFiltrees.slice(
      indexPremier,
      indexDernier
    );

  // --------------------------------------------------
  // CHANGEMENT FILTRES
  // --------------------------------------------------

  const changerFiltre = (setter) => (e) => {
    setter(e.target.value);
    setPageCourante(1);
  };

  // --------------------------------------------------
  // STATISTIQUES
  // --------------------------------------------------

  const totalCommandes =
    commandesFiltrees.length;

  const commandesPayees =
    commandesFiltrees.filter(
      (commande) =>
        commande.statut === 'payee'
    ).length;

  const commandesNonPayees =
    totalCommandes - commandesPayees;

  const chiffreAffaires =
    commandesFiltrees
      .filter(
        (commande) =>
          commande.statut === 'payee'
      )
      .reduce(
        (total, commande) =>
          total +
          Number(commande.total || 0),
        0
      );

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formaterDate = (date) => {

    if (!date) {
      return 'Date inconnue';
    }

    const valeur = new Date(date);

    if (isNaN(valeur.getTime())) {
      return 'Date inconnue';
    }

    return valeur.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-light min-vh-100">

      <Header />

      <div className="container py-4">

        {/* ==========================================
            EN-TÊTE
        ========================================== */}

        <div className="mb-4">

          <h2 className="fw-bold mb-1">
            Gestion des commandes
          </h2>

          <p className="text-muted mb-0">
            Consultez et gérez les commandes du restaurant.
          </p>

        </div>

        {/* ==========================================
            MESSAGES
        ========================================== */}

        {erreur && (
          <div className="alert alert-danger alert-dismissible fade show">
            <strong>Attention :</strong>{' '}
            {erreur}

            <button
              type="button"
              className="btn-close"
              onClick={() => setErreur('')}
            />
          </div>
        )}

        {succes && (
          <div className="alert alert-success alert-dismissible fade show">
            {succes}

            <button
              type="button"
              className="btn-close"
              onClick={() => setSucces('')}
            />
          </div>
        )}

        {/* ==========================================
            STATISTIQUES
        ========================================== */}

        <div className="row g-3 mb-4">

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">

                <small className="text-muted">
                  Commandes
                </small>

                <h3 className="fw-bold mb-0">
                  {totalCommandes}
                </h3>

              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">

                <small className="text-muted">
                  Payées
                </small>

                <h3 className="fw-bold text-success mb-0">
                  {commandesPayees}
                </h3>

              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">

                <small className="text-muted">
                  Non payées
                </small>

                <h3 className="fw-bold text-warning mb-0">
                  {commandesNonPayees}
                </h3>

              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">

                <small className="text-muted">
                  Montant encaissé
                </small>

                <h5 className="fw-bold mb-0">
                  {chiffreAffaires.toLocaleString(
                    'fr-FR'
                  )}{' '}
                  FCFA
                </h5>

              </div>
            </div>
          </div>

        </div>

        {/* ==========================================
            FILTRES
        ========================================== */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-body">

            <div className="row g-3">

              {/* Recherche */}
              <div className="col-lg-3">

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
                    placeholder="Table, article..."
                    value={recherche}
                    onChange={changerFiltre(
                      setRecherche
                    )}
                  />

                </div>

              </div>

              {/* Serveur */}
              <div className="col-lg-3">

                <label className="form-label fw-semibold">
                  Serveur
                </label>

                <select
                  className="form-select"
                  value={filtreServeur}
                  onChange={changerFiltre(
                    setFiltreServeur
                  )}
                >

                  <option value="tous">
                    Tous les serveurs
                  </option>

                  {serveurs.map((serveur) => (

                    <option
                      key={serveur.id}
                      value={serveur.id}
                    >
                      {serveur.name}
                    </option>

                  ))}

                </select>

              </div>

              {/* Période */}
              <div className="col-lg-3">

                <label className="form-label fw-semibold">
                  Période
                </label>

                <select
                  className="form-select"
                  value={filtrePeriode}
                  onChange={changerFiltre(
                    setFiltrePeriode
                  )}
                >

                  <option value="toutes">
                    Toutes les périodes
                  </option>

                  <option value="jour">
                    Aujourd'hui
                  </option>

                  <option value="semaine">
                    Cette semaine
                  </option>

                  <option value="mois">
                    Ce mois
                  </option>

                </select>

              </div>

              {/* Statut */}
              <div className="col-lg-3">

                <label className="form-label fw-semibold">
                  Statut
                </label>

                <select
                  className="form-select"
                  value={filtreStatut}
                  onChange={changerFiltre(
                    setFiltreStatut
                  )}
                >

                  <option value="tous">
                    Tous les statuts
                  </option>

                  <option value="non_payee">
                    Non payées
                  </option>

                  <option value="payee">
                    Payées
                  </option>

                </select>

              </div>

            </div>

            {/* Résultat filtres */}

            <div className="d-flex justify-content-between align-items-center mt-3">

              <small className="text-muted">
                {commandesFiltrees.length}{' '}
                commande
                {commandesFiltrees.length > 1
                  ? 's'
                  : ''}{' '}
                trouvée
                {commandesFiltrees.length > 1
                  ? 's'
                  : ''}
              </small>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setRecherche('');
                  setFiltreServeur('tous');
                  setFiltrePeriode('toutes');
                  setFiltreStatut('tous');
                  setPageCourante(1);
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Réinitialiser
              </button>

            </div>

          </div>
        </div>

        {/* ==========================================
            TABLEAU
        ========================================== */}

        <div className="card border-0 shadow-sm">

          <div className="card-body p-0">

            {chargement ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                />

                <p className="text-muted">
                  Chargement des commandes...
                </p>

              </div>

            ) : commandesAffichees.length === 0 ? (

              <div className="text-center py-5">

                <i className="bi bi-receipt fs-1 text-muted"></i>

                <h6 className="fw-bold mt-3">
                  Aucune commande trouvée
                </h6>

                <p className="text-muted">
                  Modifiez les filtres pour afficher d'autres commandes.
                </p>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th className="px-4">
                        Table
                      </th>

                      <th>
                        Articles commandés
                      </th>

                      <th>
                        Montant total
                      </th>

                      <th>
                        Statut
                      </th>

                      <th>
                        Date & Heure
                      </th>

                      <th className="text-end px-4">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {commandesAffichees.map(
                      (commande) => (

                        <tr key={commande.id}>

                          {/* Table */}

                          <td className="px-4">

                            <span className="fw-bold">
                              Table{' '}
                              {commande.numero_table}
                            </span>

                          </td>

                          {/* Articles */}

                          <td>

                            {commande.detail_commandes?.map(
                              (detail) => (

                                <div
                                  key={detail.id}
                                  className="mb-1"
                                >

                                  <strong>
                                    {detail.quantite}×
                                  </strong>{' '}

                                  {detail.article?.nom ||
                                    'Article inconnu'}

                                </div>

                              )
                            )}

                          </td>

                          {/* Montant */}

                          <td>

                            <strong>
                              {Number(
                                commande.total || 0
                              ).toLocaleString(
                                'fr-FR'
                              )}{' '}
                              FCFA
                            </strong>

                          </td>

                          {/* Statut */}

                          <td>

                            {commande.statut ===
                            'payee' ? (

                              <span className="badge bg-success-subtle text-success">

                                <i className="bi bi-check-circle me-1"></i>

                                Payée

                              </span>

                            ) : (

                              <span className="badge bg-warning-subtle text-warning-emphasis">

                                <i className="bi bi-clock me-1"></i>

                                Non payée

                              </span>

                            )}

                          </td>

                          {/* Date */}

                          <td>

                            <div className="fw-semibold">

                              {formaterDate(
                                obtenirDateCommande(
                                  commande
                                )
                              )}

                            </div>

                          </td>

                          {/* Actions */}

                          <td className="text-end px-4">

                            {commande.statut !==
                              'payee' ? (

                              <button
                                className="btn btn-sm btn-outline-success me-2"
                                onClick={() =>
                                  marquerPayee(
                                    commande.id
                                  )
                                }
                                disabled={
                                  actionEnCours ===
                                  `payee-${commande.id}`
                                }
                              >

                                {actionEnCours ===
                                `payee-${commande.id}` ? (

                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  />

                                ) : (

                                  <>
                                    <i className="bi bi-check-lg me-1"></i>
                                    Payée
                                  </>

                                )}

                              </button>

                            ) : (

                              <span className="text-muted small me-2">
                                Aucune action
                              </span>

                            )}

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDelete(
                                  commande.id
                                )
                              }
                              disabled={
                                actionEnCours ===
                                `delete-${commande.id}`
                              }
                            >

                              {actionEnCours ===
                              `delete-${commande.id}` ? (

                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                />

                              ) : (

                                <i className="bi bi-trash"></i>

                              )}

                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>
        </div>

        {/* ==========================================
            PAGINATION
        ========================================== */}

        {totalPages > 1 && (

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
                    Précédent
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
                    pageCourante ===
                    totalPages
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
                    Suivant
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

export default AdminCommandesPage;
