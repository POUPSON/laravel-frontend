import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api';
import Header from '../components/Header';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

function AdminStatistiquesPage() {
  // =========================================================
  // ÉTATS
  // =========================================================

  const [periode, setPeriode] = useState('jour');

  const [vueGraphique, setVueGraphique] = useState('semaine');

  const [decalage, setDecalage] = useState(0);

  const [stats, setStats] = useState(null);

  const [evolution, setEvolution] = useState([]);

  const [meta, setMeta] = useState({});

  const [serveurs, setServeurs] = useState([]);

  const [serveursSelectionnes, setServeursSelectionnes] = useState([]);

  const [erreur, setErreur] = useState('');

  const [chargementServeurs, setChargementServeurs] = useState(false);

  const [chargementStats, setChargementStats] = useState(false);

  const [chargementEvolution, setChargementEvolution] = useState(false);


  // =========================================================
  // CHARGEMENT INITIAL DES SERVEURS
  // =========================================================

  useEffect(() => {
    chargerServeurs();
  }, []);


  // =========================================================
  // CHARGEMENT DES STATISTIQUES
  // =========================================================

  useEffect(() => {
    charger();
  }, [periode, serveursSelectionnes]);


  // =========================================================
  // CHARGEMENT DE L'ÉVOLUTION
  // =========================================================

  useEffect(() => {
    chargerEvolution();
  }, [vueGraphique, decalage, serveursSelectionnes]);


  // =========================================================
  // CHARGER LES SERVEURS
  // =========================================================

  const chargerServeurs = async () => {
    setChargementServeurs(true);

    try {
      const res = await api.get('/users');

      const utilisateurs = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];

      const listeServeurs = utilisateurs.filter(
        (utilisateur) => utilisateur.role === 'serveur'
      );

      setServeurs(listeServeurs);
    } catch (err) {
      setErreur('Impossible de charger la liste des serveurs.');
    } finally {
      setChargementServeurs(false);
    }
  };


  // =========================================================
  // CONSTRUIRE LES PARAMÈTRES SERVEURS
  // =========================================================

  const construireParametresServeurs = () => {
    if (serveursSelectionnes.length === 0) {
      return '';
    }

    return serveursSelectionnes
      .map((id) => `serveurs[]=${encodeURIComponent(id)}`)
      .join('&');
  };


  // =========================================================
  // CHARGER LES STATISTIQUES
  // =========================================================

  const charger = async () => {
    setChargementStats(true);
    setErreur('');

    try {
      const parametresServeurs = construireParametresServeurs();

      const url = parametresServeurs
        ? `/statistiques?periode=${periode}&${parametresServeurs}`
        : `/statistiques?periode=${periode}`;

      const res = await api.get(url);

      setStats(res.data);
    } catch (err) {
      setErreur('Impossible de charger les statistiques.');
    } finally {
      setChargementStats(false);
    }
  };


  // =========================================================
  // CHARGER L'ÉVOLUTION
  // =========================================================

  const chargerEvolution = async () => {
    setChargementEvolution(true);
    setErreur('');

    try {
      const parametresServeurs = construireParametresServeurs();

      const url = parametresServeurs
        ? `/statistiques/evolution?periode=${vueGraphique}&decalage=${decalage}&${parametresServeurs}`
        : `/statistiques/evolution?periode=${vueGraphique}&decalage=${decalage}`;

      const res = await api.get(url);

      setEvolution(res.data.donnees || []);

      setMeta(res.data);
    } catch (err) {
      setErreur("Impossible de charger l'évolution.");
    } finally {
      setChargementEvolution(false);
    }
  };


  // =========================================================
  // ACTUALISER
  // =========================================================

  const actualiser = () => {
    chargerServeurs();
    charger();
    chargerEvolution();
  };


  // =========================================================
  // CHANGER LA VUE DU GRAPHIQUE
  // =========================================================

  const changerVue = (nouvelleVue) => {
    setVueGraphique(nouvelleVue);
    setDecalage(0);
  };


  // =========================================================
  // SÉLECTIONNER / DÉSÉLECTIONNER UN SERVEUR
  // =========================================================

  const toggleServeur = (id) => {
    setServeursSelectionnes((anciens) => {

      // Si le serveur est déjà sélectionné
      if (anciens.includes(id)) {
        return anciens.filter((serveurId) => serveurId !== id);
      }

      // Maximum 2 serveurs
      if (anciens.length >= 2) {
        setErreur(
          'Vous pouvez sélectionner au maximum deux serveurs pour la comparaison.'
        );

        return anciens;
      }

      setErreur('');

      return [...anciens, id];
    });
  };


  // =========================================================
  // SÉLECTIONNER TOUS LES SERVEURS
  // =========================================================

  const selectionnerTous = () => {
    setServeursSelectionnes([]);
    setErreur('');
  };


  // =========================================================
  // NOM DES SERVEURS SÉLECTIONNÉS
  // =========================================================

  const nomsServeursSelectionnes = useMemo(() => {
    return serveurs
      .filter((serveur) =>
        serveursSelectionnes.includes(serveur.id)
      )
      .map((serveur) => serveur.name);
  }, [serveurs, serveursSelectionnes]);


  // =========================================================
  // FORMATAGE DES MONTANTS
  // =========================================================

  const formaterMontant = (montant) => {
    return Number(montant || 0).toLocaleString('fr-FR');
  };


  // =========================================================
  // FORMATAGE DES DATES
  // =========================================================

  const formaterDate = (date) => {
    if (!date) return '-';

    const valeur = new Date(date);

    if (isNaN(valeur.getTime())) {
      return '-';
    }

    return valeur.toLocaleDateString('fr-FR');
  };


  // =========================================================
  // LABEL DE LA PÉRIODE
  // =========================================================

  const labelPeriodeAffichee =
    vueGraphique === 'annee'
      ? `Année ${meta.annee ?? ''}`
      : `Semaine du ${meta.debut ?? ''} au ${meta.fin ?? ''}`;


  // =========================================================
  // COULEURS DES SERVEURS
  // =========================================================

  const couleursServeurs = [
    '#0d6efd',
    '#198754',
  ];


  // =========================================================
  // DONNÉES DU GRAPHIQUE
  // =========================================================

  const dataGraphique = useMemo(() => {

    /*
     * CAS 1 :
     * Aucun serveur sélectionné
     *
     * On affiche le total général.
     */

    if (serveursSelectionnes.length === 0) {
      return {
        labels: evolution.map((e) => e.label),

        datasets: [
          {
            label: 'Revenu total',

            data: evolution.map((e) =>
              Number(e.total || 0)
            ),

            backgroundColor: '#0d6efd',

            borderRadius: 8,

            maxBarThickness: 45,
          },
        ],
      };
    }


    /*
     * CAS 2 :
     * Un ou deux serveurs sélectionnés
     */

    const datasets = serveursSelectionnes.map(
      (serveurId, index) => {

        const serveur = serveurs.find(
          (s) => s.id === serveurId
        );

        return {
          label: serveur?.name || `Serveur ${serveurId}`,

          data: evolution.map((e) => {

            const serveurData = e.serveurs?.find(
              (s) => Number(s.id) === Number(serveurId)
            );

            return Number(
              serveurData?.total || 0
            );
          }),

          backgroundColor:
            couleursServeurs[index],

          borderRadius: 8,

          maxBarThickness: 45,
        };
      }
    );

    return {
      labels: evolution.map((e) => e.label),

      datasets,
    };

  }, [
    evolution,
    serveursSelectionnes,
    serveurs,
  ]);


  // =========================================================
  // OPTIONS DU GRAPHIQUE
  // =========================================================

  const optionsGraphique = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: serveursSelectionnes.length > 0,

        position: 'top',
      },

      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label} : ${Number(
              context.raw || 0
            ).toLocaleString('fr-FR')} FCFA`;
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          callback: function (value) {
            return `${Number(value).toLocaleString(
              'fr-FR'
            )} FCFA`;
          },
        },
      },
    },
  };


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

              <i className="bi bi-bar-chart-line me-2"></i>

              Statistiques des ventes

            </h2>

            <p className="text-muted mb-0">

              Consultez les ventes et comparez les performances
              des serveurs.

            </p>

          </div>


          <button
            className="btn btn-outline-primary"
            onClick={actualiser}
            disabled={
              chargementStats ||
              chargementEvolution ||
              chargementServeurs
            }
          >

            <i className="bi bi-arrow-clockwise me-2"></i>

            Actualiser

          </button>

        </div>


        {/* =====================================================
            MESSAGE D'ERREUR
        ===================================================== */}

        {erreur && (

          <div className="alert alert-danger d-flex align-items-center mb-4">

            <i className="bi bi-exclamation-triangle me-2"></i>

            {erreur}

          </div>

        )}


        {/* =====================================================
            FILTRE PÉRIODE
        ===================================================== */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-body">

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

              <div>

                <h5 className="fw-bold mb-1">
                  Période des statistiques
                </h5>

                <small className="text-muted">
                  Sélectionnez la période à analyser.
                </small>

              </div>


              <div className="btn-group">

                <button
                  className={`btn ${
                    periode === 'jour'
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
                  onClick={() => setPeriode('jour')}
                >

                  <i className="bi bi-calendar-day me-2"></i>

                  Jour

                </button>


                <button
                  className={`btn ${
                    periode === 'semaine'
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
                  onClick={() => setPeriode('semaine')}
                >

                  <i className="bi bi-calendar-week me-2"></i>

                  Semaine

                </button>


                <button
                  className={`btn ${
                    periode === 'mois'
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
                  onClick={() => setPeriode('mois')}
                >

                  <i className="bi bi-calendar-month me-2"></i>

                  Mois

                </button>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            FILTRE SERVEURS
        ===================================================== */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-body">

            <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-3">

              <div>

                <h5 className="fw-bold mb-1">

                  <i className="bi bi-people me-2"></i>

                  Serveurs

                </h5>

                <small className="text-muted">

                  Sélectionnez jusqu'à deux serveurs pour
                  comparer leurs ventes.

                </small>

              </div>


              <span className="badge bg-light text-dark border">

                {serveursSelectionnes.length === 0
                  ? 'Tous les serveurs'
                  : `${serveursSelectionnes.length} serveur${
                      serveursSelectionnes.length > 1
                        ? 's'
                        : ''
                    } sélectionné${
                      serveursSelectionnes.length > 1
                        ? 's'
                        : ''
                    }`}

              </span>

            </div>


            {/* TOUS LES SERVEURS */}

            <div className="form-check mb-3">

              <input
                className="form-check-input"
                type="checkbox"
                id="tousLesServeurs"
                checked={serveursSelectionnes.length === 0}
                onChange={selectionnerTous}
              />

              <label
                className="form-check-label fw-semibold"
                htmlFor="tousLesServeurs"
              >

                Tous les serveurs

              </label>

            </div>


            {chargementServeurs ? (

              <div className="text-muted">

                <div
                  className="spinner-border spinner-border-sm text-primary me-2"
                  role="status"
                ></div>

                Chargement des serveurs...

              </div>

            ) : serveurs.length === 0 ? (

              <div className="alert alert-light border mb-0">

                <i className="bi bi-info-circle me-2"></i>

                Aucun serveur disponible.

              </div>

            ) : (

              <div className="row g-2">

                {serveurs.map((serveur) => {

                  const selectionne =
                    serveursSelectionnes.includes(
                      serveur.id
                    );

                  const index =
                    serveursSelectionnes.indexOf(
                      serveur.id
                    );

                  return (

                    <div
                      className="col-md-6 col-lg-4"
                      key={serveur.id}
                    >

                      <div
                        className={`border rounded p-3 ${
                          selectionne
                            ? 'border-primary bg-primary bg-opacity-10'
                            : ''
                        }`}
                      >

                        <div className="form-check">

                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`serveur-${serveur.id}`}
                            checked={selectionne}
                            onChange={() =>
                              toggleServeur(
                                serveur.id
                              )
                            }
                          />

                          <label
                            className="form-check-label w-100"
                            htmlFor={`serveur-${serveur.id}`}
                          >

                            <div className="d-flex align-items-center">

                              <span
                                className="rounded-circle d-inline-block me-2"
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  backgroundColor:
                                    selectionne
                                      ? couleursServeurs[
                                          index
                                        ]
                                      : '#adb5bd',
                                }}
                              ></span>

                              <span className="fw-semibold">
                                {serveur.name}
                              </span>

                            </div>

                          </label>

                        </div>

                      </div>

                    </div>

                  );
                })}

              </div>

            )}


            {serveursSelectionnes.length > 0 && (

              <div className="mt-3">

                <small className="text-muted">

                  Comparaison :

                  <strong className="ms-1">

                    {nomsServeursSelectionnes.join(' et ')}

                  </strong>

                </small>

              </div>

            )}

          </div>

        </div>


        {/* =====================================================
            CARTES STATISTIQUES
        ===================================================== */}

        <div className="row g-4 mb-4">


          {/* CHIFFRE D'AFFAIRES */}

          <div className="col-md-6 col-xl-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-start">

                  <div>

                    <p className="text-muted mb-2">
                      Chiffre d'affaires
                    </p>


                    {chargementStats ? (

                      <div
                        className="spinner-border spinner-border-sm text-primary"
                        role="status"
                      ></div>

                    ) : (

                      <h3 className="fw-bold mb-1">

                        {formaterMontant(
                          stats?.total_ventes
                        )}{' '}

                        FCFA

                      </h3>

                    )}


                    <small className="text-muted">

                      {stats?.depuis
                        ? `Depuis le ${formaterDate(
                            stats.depuis
                          )}`
                        : 'Période sélectionnée'}

                    </small>

                  </div>


                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">

                    <i className="bi bi-cash-stack fs-4 text-primary"></i>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* COMMANDES */}

          <div className="col-md-6 col-xl-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-start">

                  <div>

                    <p className="text-muted mb-2">
                      Commandes payées
                    </p>


                    {chargementStats ? (

                      <div
                        className="spinner-border spinner-border-sm text-success"
                        role="status"
                      ></div>

                    ) : (

                      <h3 className="fw-bold mb-1">

                        {stats?.nombre_commandes ?? 0}

                      </h3>

                    )}


                    <small className="text-muted">
                      Commande(s) enregistrée(s)
                    </small>

                  </div>


                  <div className="bg-success bg-opacity-10 rounded-circle p-3">

                    <i className="bi bi-cart-check fs-4 text-success"></i>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* SERVEURS */}

          <div className="col-md-12 col-xl-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-start">

                  <div>

                    <p className="text-muted mb-2">
                      Analyse serveur
                    </p>


                    <h5 className="fw-bold mb-2">

                      {serveursSelectionnes.length === 0
                        ? 'Tous les serveurs'
                        : nomsServeursSelectionnes.join(
                            ' vs '
                          )}

                    </h5>


                    <span className="badge bg-light text-dark border">

                      {periode === 'jour'
                        ? "Aujourd'hui"
                        : periode === 'semaine'
                        ? 'Cette semaine'
                        : 'Ce mois'}

                    </span>

                  </div>


                  <div className="bg-warning bg-opacity-10 rounded-circle p-3">

                    <i className="bi bi-person-lines-fill fs-4 text-warning"></i>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            GRAPHIQUE
        ===================================================== */}

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

              <div>

                <h5 className="fw-bold mb-1">

                  Évolution du chiffre d'affaires

                </h5>


                <p className="text-muted small mb-0">

                  {labelPeriodeAffichee}

                </p>

              </div>


              {/* SEMAINE / ANNÉE */}

              <div className="btn-group btn-group-sm">

                <button
                  className={`btn ${
                    vueGraphique === 'semaine'
                      ? 'btn-secondary'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() =>
                    changerVue('semaine')
                  }
                >

                  <i className="bi bi-calendar-week me-1"></i>

                  Semaine

                </button>


                <button
                  className={`btn ${
                    vueGraphique === 'annee'
                      ? 'btn-secondary'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() =>
                    changerVue('annee')
                  }
                >

                  <i className="bi bi-calendar3 me-1"></i>

                  Année

                </button>

              </div>

            </div>

          </div>


          <div className="card-body px-4 pb-4">


            {/* NAVIGATION */}

            <div className="d-flex justify-content-center align-items-center gap-3 mb-4">

              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() =>
                  setDecalage(
                    (prev) => prev - 1
                  )
                }
                title="Période précédente"
              >

                <i className="bi bi-chevron-left"></i>

              </button>


              <span className="fw-semibold">

                {labelPeriodeAffichee}

              </span>


              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() =>
                  setDecalage(
                    (prev) => prev + 1
                  )
                }
                disabled={decalage >= 0}
                title="Période suivante"
              >

                <i className="bi bi-chevron-right"></i>

              </button>

            </div>


            {/* LÉGENDE DES SERVEURS */}

            {serveursSelectionnes.length > 0 && (

              <div className="d-flex justify-content-center gap-4 mb-4">

                {serveursSelectionnes.map(
                  (serveurId, index) => {

                    const serveur =
                      serveurs.find(
                        (s) =>
                          s.id === serveurId
                      );

                    return (

                      <div
                        key={serveurId}
                        className="d-flex align-items-center"
                      >

                        <span
                          className="rounded-circle me-2"
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor:
                              couleursServeurs[
                                index
                              ],
                            display: 'inline-block',
                          }}
                        ></span>

                        <small className="fw-semibold">

                          {serveur?.name ||
                            `Serveur ${serveurId}`}

                        </small>

                      </div>

                    );
                  }
                )}

              </div>

            )}


            {/* GRAPHIQUE */}

            {chargementEvolution ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                ></div>

                <p className="text-muted mb-0">

                  Chargement de l'évolution...

                </p>

              </div>

            ) : evolution.length === 0 ? (

              <div className="text-center py-5">

                <i className="bi bi-bar-chart fs-1 text-muted"></i>

                <h6 className="mt-3">
                  Aucune donnée disponible
                </h6>

                <p className="text-muted mb-0">

                  Il n'y a aucune vente pour cette période.

                </p>

              </div>

            ) : (

              <div
                style={{
                  height: '380px',
                  position: 'relative',
                }}
              >

                <Bar
                  data={dataGraphique}
                  options={optionsGraphique}
                />

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminStatistiquesPage;
