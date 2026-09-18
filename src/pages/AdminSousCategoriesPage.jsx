import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function AdminSousCategoriesPage() {
  const [sousCategories, setSousCategories] = useState([]);
  const [nom, setNom] = useState('');
  const [type, setType] = useState('plat');
  const [editId, setEditId] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    try {
      const res = await api.get('/sous-categories');
      setSousCategories(res.data);
    } catch (err) {
      setErreur('Impossible de charger les sous-catégories.');
    }
  };

  const resetForm = () => {
    setNom('');
    setType('plat');
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    try {
      if (editId) {
        await api.put(`/sous-categories/${editId}`, { nom, type });
      } else {
        await api.post('/sous-categories', { nom, type });
      }
      resetForm();
      charger();
    } catch (err) {
      setErreur('Erreur lors de l\'enregistrement.');
    }
  };

  const handleEdit = (sc) => {
    setEditId(sc.id);
    setNom(sc.nom);
    setType(sc.type);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette sous-catégorie ?')) return;

    try {
      await api.delete(`/sous-categories/${id}`);
      charger();
    } catch (err) {
      setErreur('Suppression impossible (probablement des articles y sont encore rattachés).');
    }
  };

  return (
    <div>
      <Header />
      <div className="container mt-4">
        <h4>Gestion des sous-catégories</h4>

        <form onSubmit={handleSubmit} className="row g-2 align-items-end mb-4">
          <div className="col-md-4">
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
            <label className="form-label">Type</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="plat">Plat</option>
              <option value="boisson">Boisson</option>
            </select>
          </div>

          <div className="col-md-3">
            <button type="submit" className="btn btn-primary">
              {editId ? 'Modifier' : 'Ajouter'}
            </button>
            {editId && (
              <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>

        {erreur && <div className="alert alert-danger">{erreur}</div>}

        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sousCategories.map((sc) => (
              <tr key={sc.id}>
                <td>{sc.nom}</td>
                <td>{sc.type}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(sc)}>
                    Modifier
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(sc.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminSousCategoriesPage;
