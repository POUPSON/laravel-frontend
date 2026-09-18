import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function AdminCommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [erreur, setErreur] = useState('');

  // Nouveaux états : Filtres et Pagination
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [rechercheTable, setRechercheTable] = useState('');
  const [pageCourante, setPageCourante] = useState(1);
  const commandesParPage = 10;

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    try {
      const res = await api.get('/commandes');
      setCommandes(res.data.data);
    } catch (err) {
      setErreur('Impossible de charger les commandes.');
    }
  };

  const marquerPayee = async (id) => {
    try {
      await api.put(`/commandes/${id}`, { statut: 'payee' });
      charger();
    } catch (err) {
      setErreur('Erreur lors de la mise à jour.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette commande ?')) return;

    try {
      await api.delete(`/commandes/${id}`);
      charger();
    } catch (err) {
      setErreur('Suppression impossible.');
    }
  };

  // --- LOGIQUE DE FILTRAGE ET RECHERCHE ---
  const commandesFiltrees = commandes.filter((commande) => {
    // 1. Filtrer par statut
    if (filtreStatut === 'payee' && commande.statut !== 'payee') return false;
    if (filtreStatut === 'non_payee' && commande.statut === 'payee') return false;

    // 2. Recherche par numéro de table ou nom du serveur
    if (rechercheTable.trim() !== '') {
      const recherche = rechercheTable.toLowerCase();
      const numTable = String(commande.numero_table || '').toLowerCase();
      const nomServeur = String(commande.user?.name || '').toLowerCase();
      return numTable.includes(recherche) || nomServeur.includes(recherche);
    }

    return true;
  });

  // --- LOGIQUE DE PAGINATION ---
  const totalPages = Math.ceil(commandesFiltrees.length / commandesParPage) || 1;
  const indexDernier = pageCourante * commandesParPage;
  const indexPremier = indexDernier - commandesParPage;
  const commandesAffichees = commandesFiltrees.slice(indexPremier, indexDernier);

  const changerFiltreStatut = (e) => {
    setFiltreStatut(e.target.value);
    setPageCourante(1); // Retour à la première page
  };

  const changerRecherche = (e) => {
    setRechercheTable(e.target.value);
    setPageCourante(1); // Retour à la première page
  };

  return (
    <div>
      <Header />
      <div className="container mt-4">
        <h4>Toutes les commandes</h4>

        {erreur && <div className="alert alert-danger">{erreur}</div>}

        {/* --- BARRE DE FILTRES ET RECHERCHE --- */}
        <div className="d-flex flex-wrap justify-content-between align-items-center my-3 p-3 bg-light rounded gap-3">
          <h5 className="mb-0">Commandes ({commandesFiltrees.length})</h5>

          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* Recherche par Table ou Serveur */}
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher table ou serveur..."
                value={rechercheTable}
                onChange={changerRecherche}
              />
            </div>

            {/* Filtre par Statut */}
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 fw-bold">Statut :</label>
              <select
                className="form-select w-auto"
                value={filtreStatut}
                onChange={changerFiltreStatut}
              >
                <option value="tous">Toutes</option>
                <option value="non_payee">Non payées</option>
                <option value="payee">Payées</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- TABLEAU DES COMMANDES --- */}
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Table</th>
              <th>Serveur</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandesAffichees.length > 0 ? (
              commandesAffichees.map((commande) => (
                <tr key={commande.id}>
                  <td>{commande.numero_table}</td>
                  <td>{commande.user?.name}</td>
                  <td>
                    {commande.detail_commandes?.map((d) => (
                      <div key={d.id}>
                        {d.quantite} x {d.article?.nom}
                      </div>
                    ))}
                  </td>
                  <td>{commande.total} FCFA</td>
                  <td>
                    <span
                      className={`badge ${
                        commande.statut === 'payee'
                          ? 'bg-success'
                          : 'bg-warning text-dark'
                      }`}
                    >
                      {commande.statut === 'payee' ? 'Payée' : 'Non payée'}
                    </span>
                  </td>
                  <td>
                    {commande.statut !== 'payee' && (
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => marquerPayee(commande.id)}
                      >
                        Marquer payée
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(commande.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  Aucune commande trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* --- CONTROLES DE PAGINATION --- */}
        {totalPages > 1 && (
          <nav className="d-flex justify-content-center mt-4">
            <ul className="pagination">
              <li className={`page-item ${pageCourante === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setPageCourante((prev) => Math.max(prev - 1, 1))}
                >
                  Précédent
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((numero) => (
                <li
                  key={numero}
                  className={`page-item ${
                    pageCourante === numero ? 'active' : ''
                  }`}
                >
                  <button className="page-link" onClick={() => setPageCourante(numero)}>
                    {numero}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  pageCourante === totalPages ? 'disabled' : ''
                }`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    setPageCourante((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  Suivant
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

export default AdminCommandesPage;
