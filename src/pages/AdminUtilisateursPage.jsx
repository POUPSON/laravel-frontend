import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function AdminUtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('serveur');
  const [editId, setEditId] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    try {
      const res = await api.get('/users');
      setUtilisateurs(res.data);
    } catch (err) {
      setErreur('Impossible de charger les utilisateurs.');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('serveur');
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    const payload = { name, email, role };
    if (password) payload.password = password;

    try {
      if (editId) {
        await api.put(`/users/${editId}`, payload);
      } else {
        if (!password) {
          setErreur('Le mot de passe est requis pour un nouvel utilisateur.');
          return;
        }
        await api.post('/users', payload);
      }
      resetForm();
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    }
  };

  const handleEdit = (u) => {
    setEditId(u.id);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;

    try {
      await api.delete(`/users/${id}`);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Suppression impossible.');
    }
  };

  return (
    <div>
      <Header />
      <div className="container mt-4">
        <h4>Gestion des utilisateurs</h4>

        <form onSubmit={handleSubmit} className="row g-2 align-items-end mb-4">
          <div className="col-md-3">
            <label className="form-label">Nom</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">
              Mot de passe {editId && <small className="text-muted">(laisser vide pour ne pas changer)</small>}
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Rôle</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="serveur">Serveur</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="col-md-2">
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
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(u)}>
                    Modifier
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}>
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

export default AdminUtilisateursPage;
