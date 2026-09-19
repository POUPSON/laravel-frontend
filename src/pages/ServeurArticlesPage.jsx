import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function ServeurArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [typeActif, setTypeActif] = useState('plat');
  const [sousCategorieActive, setSousCategorieActive] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [quantites, setQuantites] = useState({});
  const [numeroTable, setNumeroTable] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

 const chargerDonnees = async () => {
    try {
      const [resArticles, resSousCategories] = await Promise.all([
        api.get('/articles'),
        api.get('/sous-categories'),
      ]);
      setArticles(Array.isArray(resArticles.data) ? resArticles.data : resArticles.data.data || []);
      setSousCategories(resSousCategories.data || []);
    } catch (err) {
      setErreur('Impossible de charger les données du menu.');
    }
  };

  // Filtrage des sous-catégories selon le type actif (plat / boisson)
  const sousCategoriesFiltrees = sousCategories.filter((sc) => sc.type === typeActif);

  // Filtrage des articles
  const articlesFiltres = articles.filter((a) => {
    if (!a.disponible) return false;
    if (recherche && !a.nom.toLowerCase().includes(recherche.toLowerCase())) return false;
    if (sousCategorieActive) return a.sous_categorie_id === sousCategorieActive;
    return a.sous_categorie?.type === typeActif;
  });

  // Gestion rapide des quantités (+ / -)
  const modifierQuantite = (articleId, delta) => {
    setQuantites((prev) => {
      const courante = prev[articleId] || 0;
      const nouvelle = Math.max(0, courante + delta);
      if (nouvelle === 0) {
        const copy = { ...prev };
        delete copy[articleId];
        return copy;
      }
      return { ...prev, [articleId]: nouvelle };
    });
  };

  // Calcul des articles sélectionnés pour le ticket de caisse
  const articlesSelectionnes = Object.entries(quantites)
    .filter(([, qte]) => qte > 0)
    .map(([id, qte]) => {
      const article = articles.find((a) => a.id === parseInt(id));
      return { ...article, quantite: qte };
    });

  const totalGeneral = articlesSelectionnes.reduce(
    (acc, item) => acc + (item?.prix || 0) * item.quantite,
    0
  );

  const handleValiderCommande = async () => {
    setMessage('');
    setErreur('');

    if (!numeroTable) {
      setErreur('Veuillez indiquer le numéro de la table.');
      return;
    }

    if (articlesSelectionnes.length === 0) {
      setErreur('Veuillez sélectionner au moins un article.');
      return;
    }

    const lignes = articlesSelectionnes.map((item) => ({
      article_id: item.id,
      quantite: item.quantite,
    }));

    setLoading(true);
    try {
      await api.post('/commandes', { numero_table: numeroTable, lignes });
      setMessage(`Commande créée avec succès pour la table ${numeroTable} !`);
      setQuantites({});
      setNumeroTable('');
    } catch (err) {
      setErreur('Erreur lors de la création de la commande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Header />

      <div className="container-fluid py-4 px-md-4">
        <div className="row g-4">
          {/* --- COLONNE GAUCHE : MENU & SÉLECTION --- */}
          <div className="col-lg-8">
            {/* Barre supérieure : Recherche + Type (Plats / Boissons) */}
            <div className="card border-0 shadow-sm p-3 mb-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      Rechercher
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Rechercher un plat, boisson..."
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-7 d-flex justify-content-md-end">
                  <div className="btn-group w-100 w-md-auto" role="group">
                    <button
                      type="button"
                      className={`btn btn-lg fw-bold px-4 ${
                        typeActif === 'plat'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      }`}
                      onClick={() => {
                        setTypeActif('plat');
                        setSousCategorieActive(null);
                      }}
                    >
                      Plats
                    </button>
                    <button
                      type="button"
                      className={`btn btn-lg fw-bold px-4 ${
                        typeActif === 'boisson'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      }`}
                      onClick={() => {
                        setTypeActif('boisson');
                        setSousCategorieActive(null);
                      }}
                    >
                      Boissons
                    </button>
                  </div>
                </div>
              </div>

              {/* Barre de Sous-catégories sous forme d'onglets horizontaux */}
              <div className="d-flex gap-2 overflow-auto mt-3 pt-3 border-top pb-1">
                <button
                  className={`btn btn-sm rounded-pill px-3 flex-shrink-0 ${
                    !sousCategorieActive
                      ? 'btn-dark'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => setSousCategorieActive(null)}
                >
                  Tous les {typeActif === 'plat' ? 'plats' : 'boissons'}
                </button>
                {sousCategoriesFiltrees.map((sc) => (
                  <button
                    key={sc.id}
                    className={`btn btn-sm rounded-pill px-3 flex-shrink-0 ${
                      sousCategorieActive === sc.id
                        ? 'btn-dark'
                        : 'btn-outline-secondary'
                    }`}
                    onClick={() => setSousCategorieActive(sc.id)}
                  >
                    {sc.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille des articles */}
            <div className="row g-3">
              {articlesFiltres.map((article) => {
                const qteActuelle = quantites[article.id] || 0;
                return (
                  <div key={article.id} className="col-sm-6 col-md-4">
                    <div
                      className={`card h-100 border-0 shadow-sm transition-all ${
                        qteActuelle > 0 ? 'border border-2 border-primary' : ''
                      }`}
                    >
                      <div className="card-body d-flex flex-column justify-content-between p-3">
                        <div>
                          <span className="badge bg-light text-dark mb-2">
                            {article.sous_categorie?.nom}
                          </span>
                          <h6 className="card-title fw-bold mb-1">
                            {article.nom}
                          </h6>
                          {article.description && (
                            <p className="card-text text-muted small mb-2 text-truncate">
                              {article.description}
                            </p>
                          )}
                          <p className="fw-bold text-primary mb-3">
                            {article.prix.toLocaleString()} FCFA
                          </p>
                        </div>

                        {/* Boutons d'action rapide + / - */}
                        <div className="d-flex align-items-center justify-content-between bg-light rounded p-1">
                          <button
                            className="btn btn-sm btn-white border shadow-sm fw-bold px-3"
                            onClick={() => modifierQuantite(article.id, -1)}
                            disabled={qteActuelle === 0}
                          >
                            -
                          </button>
                          <span className="fw-bold px-2">
                            {qteActuelle}
                          </span>
                          <button
                            className="btn btn-sm btn-primary fw-bold px-3"
                            onClick={() => modifierQuantite(article.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {articlesFiltres.length === 0 && (
                <div className="col-12 text-center py-5">
                  <div className="p-4 bg-white rounded shadow-sm">
                    <p className="text-muted mb-0">
                      Aucun article disponible pour ce filtre.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- COLONNE DROITE : TICKET / RÉCAPITULATIF DE COMMANDE --- */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Commande en cours</h5>
              </div>

              <div className="card-body">
                {message && <div className="alert alert-success">{message}</div>}
                {erreur && <div className="alert alert-danger">{erreur}</div>}

                {/* Saisie de la table */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Numéro de table *</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Ex: Table 04"
                    value={numeroTable}
                    onChange={(e) => setNumeroTable(e.target.value)}
                  />
                </div>

                {/* Liste des éléments du panier */}
                <div
                  className="mb-3 border-top border-bottom py-2 overflow-auto"
                  style={{ maxHeight: '300px' }}
                >
                  {articlesSelectionnes.length > 0 ? (
                    articlesSelectionnes.map((item) => (
                      <div
                        key={item.id}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <div>
                          <div className="fw-bold small">{item.nom}</div>
                          <div className="text-muted extra-small">
                            {item.quantite} x {item.prix.toLocaleString()} FCFA
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small">
                            {(item.prix * item.quantite).toLocaleString()} FCFA
                          </span>
                          <button
                            className="btn btn-sm btn-outline-danger border-0 py-0 px-2"
                            onClick={() => modifierQuantite(item.id, -item.quantite)}
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <small>Aucun article sélectionné</small>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="h6 mb-0 text-muted">Total :</span>
                  <span className="h4 mb-0 fw-bold text-success">
                    {totalGeneral.toLocaleString()} FCFA
                  </span>
                </div>

                {/* Action de validation */}
                <button
                  className="btn btn-success btn-lg w-100 fw-bold"
                  onClick={handleValiderCommande}
                  disabled={loading || articlesSelectionnes.length === 0}
                >
                  {loading ? 'Validation...' : 'Valider la commande'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServeurArticlesPage;
