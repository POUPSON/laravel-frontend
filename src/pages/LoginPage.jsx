import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo_restaur.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    try {
      const user = await login(email, password);

      if (user.role === 'admin') {
        navigate('/admin/articles');
      } else {
        navigate('/serveur/articles');
      }
    } catch (err) {
      setErreur('Email ou mot de passe incorrect.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ minWidth: '350px' }}>
        <div className="text-center mb-3">
          <img src={logo} alt="Logo restaurant" style={{ maxWidth: '120px' }} />
          <h4 className="mt-2">Gerez votre restaurant</h4>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Mot de passe</label>
            <div className="input-group">
              <input
                type={afficherMotDePasse ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                tabIndex={-1}
              >
                {afficherMotDePasse ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          {erreur && <div className="alert alert-danger py-2">{erreur}</div>}

          <button type="submit" className="btn btn-primary w-100">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
