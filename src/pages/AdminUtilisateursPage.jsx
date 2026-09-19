import { useEffect, useState } from 'react';
import api from '../services/api';
import Header from '../components/Header';

function AdminUtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState([]);

  // Formulaire
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('serveur');
  const [editId, setEditId] = useState(null);

  // Messages / chargement
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(null);

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState('tous');

  useEffect(() => {
    charger();
  }, []);

  // --------------------------------------------------
  // CHARGEMENT
  // --------------------------------------------------

  const charger = async () => {
    try {
      setChargement(true);
      setErreur('');

      const res = await api.get('/users');

      setUtilisateurs(res.data || []);
    } catch (err) {
      setErreur('Impossible de charger les utilisateurs.');
    } finally {
      setChargement(false);
    }
  };

  // --------------------------------------------------
  // FORMULAIRE
  // --------------------------------------------------

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('serveur');
    setEditId(null);
    setErreur('');
  };

  const afficherSucces = (message) => {
    setSucces(message);

    setTimeout(() => {
      setSucces('');
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErreur('');
    setSucces('');

    if (!name.trim()) {
      setErreur('Le nom est requis.');
      return;
    }

    if (!email.trim()) {
      setErreur("L'adresse email est requise.");
      return;
    }

    if (!editId && !password) {
      setErreur(
        'Le mot de passe est requis pour un nouvel utilisateur.'
      );
      return;
    }

    try {
      setEnregistrement(true);

      const payload = {
        name: name.trim(),
        email: email.trim(),
        role,
      };

      // Le mot de passe n'est envoyé que s'il est renseigné
      if (password) {
        payload.password = password;
      }

      if (editId) {
        await api.put(`/users/${editId}`, payload);

        afficherSucces(
          'Utilisateur modifié avec succès.'
        );
      } else {
        await api.post('/users', payload);

        afficherSucces(
          'Utilisateur ajouté avec succès.'
        );
      }

      resetForm();

      await charger();
    } catch (err) {
      setErreur(
        err.response?.data?.message ||
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  // --------------------------------------------------
  // MODIFICATION
  // --------------------------------------------------

  const handleEdit = (u) => {
    setEditId(u.id);
    setName(u.name || '');
    setEmail(u.email || '');
    setPassword('');
    setRole(u.role || 'serveur');

    setErreur('');
    setSucces('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // --------------------------------------------------
  // SUPPRESSION
  // --------------------------------------------------

  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      'Voulez-vous vraiment supprimer cet utilisateur ?\n\nCette action est irréversible.'
    );

    if (!confirmation) return;

    try {
      setActionEnCours(`delete-${id}`);
      setErreur('');

      await api.delete(`/users/${id}`);

      afficherSucces(
        'Utilisateur supprimé avec succès.'
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
  // FILTRAGE
  // --------------------------------------------------

  const utilisateursFiltres = utilisateurs.filter(
    (utilisateur) => {

      // Filtre rôle
      if (
        filtreRole !== 'tous' &&
        utilisateur.role !== filtreRole
      ) {
        return false;
      }

      // Recherche
      if (recherche.trim() !== '') {
        const texte = recherche
          .toLowerCase()
          .trim();

        const nom = String(
          utilisateur.name || ''
        ).toLowerCase();

        const email = String(
          utilisateur.email || ''
        ).toLowerCase();

        return (
          nom.includes(texte) ||
          email.includes(texte)
        );
      }

      return true;
    }
  );

  // --------------------------------------------------
  // STATISTIQUES
  // --------------------------------------------------

  const totalUtilisateurs =
    utilisateurs.length;

  const totalAdmins =
    utilisateurs.filter(
      (u) => u.role === 'admin'
    ).length;

  const totalServeurs =
    utilisateurs.filter(
      (u) => u.role === 'serveur'
    ).length;

  return (
    <div className="bg-light min-vh-100">

      <Header />

      <div className="container py-4">

        {/* ==========================================
            EN-TÊTE
        ========================================== */}

        <div className="mb-4">

          <h2 className="fw-bold mb-1">
            Gestion des utilisateurs
          </h2>

          <p className="text-muted mb-0">
            Gérez les comptes administrateurs et serveurs du restaurant.
          </p>

        </div>

        {/* ==========================================
            MESSAGES
        ========================================== */}

        {erreur && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <strong>Attention :</strong>{' '}
            {erreur}

            <button
              type="button"
              className="btn-close"
              onClick={() => setErreur('')}
            ></button>
          </div>
        )}

        {succes && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            {succes}

            <button
              type="button"
              className="btn-close"
              onClick={() => setSucces('')}
            ></button>
          </div>
        )}

        {/* ==========================================
            STATISTIQUES
        ========================================== */}

        <div className="row g-3 mb-4">

          {/* Total */}
          <div className="col-md-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <small className="text-muted">
                      Total utilisateurs
                    </small>

                    <h3 className="fw-bold mb-0 mt-1">
                      {totalUtilisateurs}
                    </h3>
                  </div>

                  <i className="bi bi-people fs-2 text-primary"></i>

                </div>

              </div>

            </div>

          </div>

          {/* Admins */}
          <div className="col-md-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <small className="text-muted">
                      Administrateurs
                    </small>

                    <h3 className="fw-bold mb-0 mt-1">
                      {totalAdmins}
                    </h3>
                  </div>

                  <i className="bi bi-shield-check fs-2 text-danger"></i>

                </div>

              </div>

            </div>

          </div>

          {/* Serveurs */}
          <div className="col-md-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <small className="text-muted">
                      Serveurs
                    </small>

                    <h3 className="fw-bold mb-0 mt-1">
                      {totalServeurs}
                    </h3>
                  </div>

                  <i className="bi bi-person-badge fs-2 text-success"></i>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ==========================================
            FORMULAIRE
        ========================================== */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h5 className="fw-bold mb-1">

                  {editId
                    ? 'Modifier un utilisateur'
                    : 'Ajouter un utilisateur'}

                </h5>

                <small className="text-muted">

                  {editId
                    ? 'Modifiez les informations du compte.'
                    : 'Créez un nouveau compte utilisateur.'}

                </small>

              </div>

              {editId && (
                <span className="badge bg-warning text-dark">
                  Mode modification
                </span>
              )}

            </div>

            <form onSubmit={handleSubmit}>

              <div className="row g-3">

                {/* Nom */}
                <div className="col-md-3">

                  <label className="form-label fw-semibold">
                    Nom
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nom complet"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    disabled={enregistrement}
                    required
                  />

                </div>

                {/* Email */}
                <div className="col-md-3">

                  <label className="form-label fw-semibold">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    disabled={enregistrement}
                    required
                  />

                </div>

                {/* Mot de passe */}
                <div className="col-md-3">

                  <label className="form-label fw-semibold">

                    Mot de passe

                    {editId && (
                      <small className="text-muted ms-1">
                        (facultatif)
                      </small>
                    )}

                  </label>

                  <input
                    type="password"
                    className="form-control"
                    placeholder={
                      editId
                        ? 'Laisser vide pour conserver'
                        : 'Mot de passe'
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    disabled={enregistrement}
                    required={!editId}
                  />

                </div>

                {/* Rôle */}
                <div className="col-md-3">

                  <label className="form-label fw-semibold">
                    Rôle
                  </label>

                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value)
                    }
                    disabled={enregistrement}
                  >

                    <option value="serveur">
                      Serveur
                    </option>

                    <option value="admin">
                      Administrateur
                    </option>

                  </select>

                </div>

              </div>

              {/* Boutons */}

              <div className="d-flex gap-2 mt-4">

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

                  ) : editId ? (

                    <>
                      <i className="bi bi-pencil me-1"></i>
                      Modifier
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
                    Annuler
                  </button>

                )}

              </div>

            </form>

          </div>

        </div>

        {/* ==========================================
            FILTRES
        ========================================== */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-body">

            <div className="row g-3 align-items-end">

              {/* Recherche */}

              <div className="col-md-6">

                <label className="form-label fw-semibold">
                  Rechercher
                </label>

                <div className="input-group">

                  <span className="input-group-text bg-white">
                    <i className="bi bi-search"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher par nom ou email..."
                    value={recherche}
                    onChange={(e) => {
                      setRecherche(
                        e.target.value
                      );
                    }}
                  />

                </div>

              </div>

              {/* Rôle */}

              <div className="col-md-3">

                <label className="form-label fw-semibold">
                  Rôle
                </label>

                <select
                  className="form-select"
                  value={filtreRole}
                  onChange={(e) =>
                    setFiltreRole(
                      e.target.value
                    )
                  }
                >

                  <option value="tous">
                    Tous les rôles
                  </option>

                  <option value="admin">
                    Administrateurs
                  </option>

                  <option value="serveur">
                    Serveurs
                  </option>

                </select>

              </div>

              {/* Actualiser */}

              <div className="col-md-3">

                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={charger}
                  disabled={chargement}
                >

                  <i className="bi bi-arrow-clockwise me-1"></i>

                  Actualiser

                </button>

              </div>

            </div>

          </div>

        </div>

        {/* ==========================================
            LISTE
        ========================================== */}

        <div className="card border-0 shadow-sm">

          <div className="card-body p-0">

            {/* En-tête */}

            <div className="p-4 border-bottom">

              <h5 className="fw-bold mb-1">
                Liste des utilisateurs
              </h5>

              <small className="text-muted">

                {utilisateursFiltres.length}{' '}
                utilisateur
                {utilisateursFiltres.length > 1
                  ? 's'
                  : ''}

              </small>

            </div>

            {/* Chargement */}

            {chargement ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                ></div>

                <p className="text-muted mb-0">
                  Chargement des utilisateurs...
                </p>

              </div>

            ) : utilisateursFiltres.length === 0 ? (

              <div className="text-center py-5">

                <i className="bi bi-people fs-1 text-muted"></i>

                <h6 className="fw-bold mt-3">
                  Aucun utilisateur trouvé
                </h6>

                <p className="text-muted mb-0">
                  Aucun utilisateur ne correspond aux critères.
                </p>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th className="px-4">
                        Nom
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Rôle
                      </th>

                      <th className="text-end px-4">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {utilisateursFiltres.map(
                      (u) => (

                        <tr key={u.id}>

                          {/* Nom */}

                          <td className="px-4">

                            <div className="d-flex align-items-center">

                              <div
                                className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: '38px',
                                  height: '38px',
                                }}
                              >
                                <i className="bi bi-person"></i>
                              </div>

                              <span className="fw-semibold">
                                {u.name}
                              </span>

                            </div>

                          </td>

                          {/* Email */}

                          <td>

                            <span className="text-muted">
                              {u.email}
                            </span>

                          </td>

                          {/* Rôle */}

                          <td>

                            {u.role === 'admin' ? (

                              <span className="badge bg-danger-subtle text-danger">

                                <i className="bi bi-shield-check me-1"></i>

                                Administrateur

                              </span>

                            ) : (

                              <span className="badge bg-success-subtle text-success">

                                <i className="bi bi-person-badge me-1"></i>

                                Serveur

                              </span>

                            )}

                          </td>

                          {/* Actions */}

                          <td className="text-end px-4">

                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() =>
                                handleEdit(u)
                              }
                            >

                              <i className="bi bi-pencil me-1"></i>

                              Modifier

                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDelete(
                                  u.id
                                )
                              }
                              disabled={
                                actionEnCours ===
                                `delete-${u.id}`
                              }
                            >

                              {actionEnCours ===
                              `delete-${u.id}` ? (

                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
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

                      )
                    )}

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

export default AdminUtilisateursPage;
