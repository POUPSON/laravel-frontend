import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function ServeurCommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  // Filtres
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreDate, setFiltreDate] = useState('');
  const [rechercheTable, setRechercheTable] = useState('');

  // Pagination
  const [pageCourante, setPageCourante] = useState(1);
  const commandesParPage = 8;

  useEffect(() => {
    chargerCommandes();
  }, []);

  const chargerCommandes = async () => {
    setLoading(true);
    setErreur('');
    try {
      const res = await api.get('/commandes');
      const data = res.data.data || res.data || [];
      setCommandes(data);
    } catch (err) {
      setErreur('Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  };

  const marquerPayee = async (id) => {
    setActionLoading(id);
    setErreur('');
    setSucces('');
    try {
      await api.put(`/commandes/${id}`, { statut: 'payee' });
      setSucces(`Commande #${id} marquée comme payée avec succès.`);
      await chargerCommandes();
    } catch (err) {
      setErreur('Erreur lors de la mise à jour du statut.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrage combiné (Statut, Date, Recherche)
  const commandesFiltrees = useMemo(() => {
    return commandes.filter((c) => {
      // Filtre Statut
      if (filtreStatut === 'payee' && c.statut !== 'payee') return false;
      if (filtreStatut === 'non_payee' && c.statut === 'payee') return false;

      // Filtre Date (Compare YYYY-MM-DD)
      if (filtreDate) {
        const dateCommande = new Date(c.created_at).toISOString().split('T')[0];
        if (dateCommande !== filtreDate) return false;
      }

      // Filtre Recherche (Numéro de table)
      if (rechercheTable.trim()) {
        const query = rechercheTable.toLowerCase().trim();
        const numTable = String(c.numero_table || '').toLowerCase();
        if (!numTable.includes(query)) return false;
      }

      return true;
    });
  }, [commandes, filtreStatut, filtreDate, rechercheTable]);

  // Pagination locale
  const totalPages = Math.ceil(commandesFiltrees.length / commandesParPage) || 1;
  const indexDernier = pageCourante * commandesParPage;
  const indexPremier = indexDernier - commandesParPage;
  const commandesPaginees = commandesFiltrees.slice(indexPremier, indexDernier);

  // Remise à zéro de la page si les filtres changent
  const reinitialiserFiltres = () => {
    setFiltreStatut('tous');
    setFiltreDate('');
    setRechercheTable('');
    setPageCourante(1);
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = commandesFiltrees.length;
    const payees = commandesFiltrees.filter((c) => c.statut === 'payee');
    const nonPayees = commandesFiltrees.filter((c) => c.statut !== 'payee');
    const montantTotal = payees.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
    const montantEnAttente = nonPayees.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

    return { total, payeesCount: payees.length, nonPayeesCount: nonPayees.length, montantTotal, montantEnAttente };
  }, [commandesFiltrees]);

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Header />

      <div className="container mt-4">
        {/* EN-TÊTE */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1"> Suivi de mes Commandes</h3>
            <p className="text-muted mb-0">Consultez et gérez le statut de paiement des tables</p>
          </div>
          <button className="btn btn-outline-primary" onClick={chargerCommandes} disabled={loading}>
             {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>

        {/* ALERTES */}
        {erreur && <div className="alert alert-danger alert-dismissible fade show">{erreur}</div>}
        {succes && <div className="alert alert-success alert-dismissible fade show">{succes}</div>}

        {/* CARTES DE STATISTIQUES */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-primary">
              <span className="text-muted small fw-bold">TOTAL COMMANDES</span>
              <h4 className="fw-bold mb-0 mt-1">{stats.total}</h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-warning">
              <span className="text-muted small fw-bold">EN ATTENTE</span>
              <h4 className="fw-bold text-warning mb-0 mt-1">
                {stats.nonPayeesCount} <small className="fs-6">({stats.montantEnAttente.toLocaleString()} FCFA)</small>
              </h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-success">
              <span className="text-muted small fw-bold">RÉGLÉES</span>
              <h4 className="fw-bold text-success mb-0 mt-1">
                {stats.payeesCount} <small className="fs-6">({stats.montantTotal.toLocaleString()} FCFA)</small>
              </h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-info">
              <span className="text-muted small fw-bold">RECETTE ENCAISSÉE</span>
              <h4 className="fw-bold text-info mb-0 mt-1">{stats.montantTotal.toLocaleString()} FCFA</h4>
            </div>
          </div>
        </div>

        {/* BARRE DE FILTRES */}
        <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted">Rechercher une Table</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Table 04..."
                value={rechercheTable}
                onChange={(e) => {
                  setRechercheTable(e.target.value);
                  setPageCourante(1);
                }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted">Filtrer par Date</label>
              <input
                type="date"
                className="form-control"
                value={filtreDate}
                onChange={(e) => {
                  setFiltreDate(e.target.value);
                  setPageCourante(1);
                }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted">Statut de paiement</label>
              <select
                className="form-select"
                value={filtreStatut}
                onChange={(e) => {
                  setFiltreStatut(e.target.value);
                  setPageCourante(1);
                }}
              >
                <option value="tous">Tous les statuts</option>
                <option value="non_payee"> Non payées</option>
                <option value="payee"> Payées</option>
              </select>
            </div>

            <div className="col-md-3 d-flex gap-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFiltreDate(new Date().toISOString().split('T')[0])}
              >
                Aujourd'hui
              </button>
              {(filtreStatut !== 'tous' || filtreDate || rechercheTable) && (
                <button className="btn btn-light text-danger border w-100" onClick={reinitialiserFiltres}>
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLEAU DES COMMANDES */}
        <div className="card border-0 shadow-sm bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light border-bottom">
                <tr>
                  <th className="py-3 px-3">Table</th>
                  <th className="py-3">Articles commandés</th>
                  <th className="py-3">Montant Total</th>
                  <th className="py-3">Statut</th>
                  <th className="py-3">Date & Heure</th>
                  <th className="py-3 text-end px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      Chargement des commandes en cours...
                    </td>
                  </tr>
                ) : commandesPaginees.length > 0 ? (
                  commandesPaginees.map((commande) => (
                    <tr key={commande.id}>
                      <td className="px-3">
                        <span className="badge bg-dark fs-6">
                          Table {commande.numero_table}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1 my-1">
                          {commande.detail_commandes?.map((d) => (
                            <span key={d.id} className="small text-secondary">
                              <strong className="text-dark">{d.quantite}x</strong> {d.article?.nom || 'Article indisponible'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <strong className="text-primary fs-6">
                          {Number(commande.total).toLocaleString()} FCFA
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill px-3 py-2 ${
                            commande.statut === 'payee'
                              ? 'bg-success-subtle text-success border border-success'
                              : 'bg-warning-subtle text-warning-emphasis border border-warning'
                          }`}
                        >
                          {commande.statut === 'payee' ? ' Payée' : ' En attente'}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {new Date(commande.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="text-end px-3">
                        {commande.statut !== 'payee' ? (
                          <button
                            className="btn btn-sm btn-success fw-bold px-3 shadow-sm"
                            onClick={() => marquerPayee(commande.id)}
                            disabled={actionLoading === commande.id}
                          >
                            {actionLoading === commande.id ? 'Mise à jour...' : ' Encasser'}
                          </button>
                        ) : (
                          <span className="text-muted small italic">Aucune action</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      Aucune commande ne correspond à vos critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CONTRÔLES DE PAGINATION */}
          {totalPages > 1 && (
            <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center py-3 px-3">
              <span className="small text-muted">
                Page <strong>{pageCourante}</strong> sur <strong>{totalPages}</strong> ({commandesFiltrees.length} résultats)
              </span>
              <ul className="pagination mb-0">
                <li className={`page-item ${pageCourante === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPageCourante((prev) => Math.max(prev - 1, 1))}
                  >
                    « Précédent
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((numPage) => (
                  <li
                    key={numPage}
                    className={`page-item ${pageCourante === numPage ? 'active' : ''}`}
                  >
                    <button className="page-link" onClick={() => setPageCourante(numPage)}>
                      {numPage}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${pageCourante === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPageCourante((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Suivant »
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServeurCommandesPage;
