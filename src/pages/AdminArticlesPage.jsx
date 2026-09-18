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

  // Nouveaux états : Filtre et Pagination
  const [filtreSousCategorie, setFiltreSousCategorie] = useState('');
  const [pageCourante, setPageCourante] = useState(1);
  const articlesParPage = 10;

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    try {
      const [resArticles, resSousCategories] = await Promise.all([
        api.get('/articles'),
        api.get('/sous-categories'),
      ]);
      setArticles(resArticles.data.data);
      setSousCategories(resSousCategories.data);

      if (resSousCategories.data.length > 0 && !sousCategorieId) {
        setSousCategorieId(resSousCategories.data[0].id);
      }
    } catch (err) {
      setErreur('Impossible de charger les données.');
    }
  };

  const resetForm = () => {
    setNom('');
    setDescription('');
    setPrix('');
    setSousCategorieId(sousCategories[0]?.id || '');
    setDisponible(true);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    const payload = {
      nom,
      description,
      prix: parseFloat(prix),
      sous_categorie_id: parseInt(sousCategorieId),
      disponible,
    };

    try {
      if (editId) {
        await api.put(`/articles/${editId}`, payload);
      } else {
        await api.post('/articles', payload);
      }
      resetForm();
      charger();
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement.");
    }
  };

  const handleEdit = (article) => {
    setEditId(article.id);
    setNom(article.nom);
    setDescription(article.description || '');
    setPrix(article.prix);
    setSousCategorieId(article.sous_categorie_id);
    setDisponible(article.disponible);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet article ?')) return;

    try {
      await api.delete(`/articles/${id}`);
      charger();
    } catch (err) {
      setErreur('Suppression impossible.');
    }
  };

  // --- LOGIQUE DE FILTRAGE ET PAGINATION ---
  const articlesFiltres = articles.filter((article) => {
    if (!filtreSousCategorie) return true;
    return article.sous_categorie_id === parseInt(filtreSousCategorie);
  });

  const totalPages = Math.ceil(articlesFiltres.length / articlesParPage) || 1;
  const indexDernier = pageCourante * articlesParPage;
  const indexPremier = indexDernier - articlesParPage;
  const articlesAffiches = articlesFiltres.slice(indexPremier, indexDernier);

  const changerFiltre = (e) => {
    setFiltreSousCategorie(e.target.value);
    setPageCourante(1); // Réinitialiser à la 1ère page lors du changement de filtre
  };

  return (
    <div>
      <Header />
      <div className="container mt-4">
        <h4>Gestion du menu</h4>

        <form onSubmit={handleSubmit} className="row g-2 align-items-end mb-4">
          <div className="col-md-3">
            <label className="form-label">Nom</label>
            <input
              type="text"
              className="form-control"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Prix</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              required
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Sous-catégorie</label>
            <select
              className="form-select"
              value={sousCategorieId}
              onChange={(e) => setSousCategorieId(e.target.value)}
              required
            >
              {sousCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.nom} ({sc.type})
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-1 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
              id="disponibleCheck"
            />
            <label className="form-check-label" htmlFor="disponibleCheck">
              Dispo
            </label>
          </div>

          <div className="col-md-1">
            <button type="submit" className="btn btn-primary w-100">
              {editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>

          {editId && (
            <div className="col-12">
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                Annuler la modification
              </button>
            </div>
          )}
        </form>

        {erreur && <div className="alert alert-danger">{erreur}</div>}

        {/* --- BARRE DE FILTRE --- */}
        <div className="d-flex justify-content-between align-items-center my-3 p-3 bg-light rounded">
          <h5 className="mb-0">Articles ({articlesFiltres.length})</h5>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 fw-bold">Filtrer par sous-catégorie :</label>
            <select
              className="form-select w-auto"
              value={filtreSousCategorie}
              onChange={changerFiltre}
            >
              <option value="">Toutes les sous-catégories</option>
              {sousCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.nom} ({sc.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- TABLEAU DES ARTICLES --- */}
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Sous-catégorie</th>
              <th>Prix</th>
              <th>Disponible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {articlesAffiches.length > 0 ? (
              articlesAffiches.map((article) => (
                <tr key={article.id}>
                  <td>{article.nom}</td>
                  <td>{article.sous_categorie?.nom}</td>
                  <td>{article.prix} FCFA</td>
                  <td>{article.disponible ? 'Oui' : 'Non'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEdit(article)}
                    >
                      Modifier
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(article.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  Aucun article trouvé.
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
                  className={`page-item ${pageCourante === numero ? 'active' : ''}`}
                >
                  <button className="page-link" onClick={() => setPageCourante(numero)}>
                    {numero}
                  </button>
                </li>
              ))}

              <li className={`page-item ${pageCourante === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setPageCourante((prev) => Math.min(prev + 1, totalPages))}
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

export default AdminArticlesPage;
