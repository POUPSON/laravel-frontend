import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo_restaur.png';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinkClass = (path) => {
    return `nav-link custom-nav-link ${location.pathname === path ? 'active' : ''}`;
  };

  const accueilParRole = user?.role === 'admin' ? '/admin/articles' : '/serveur/articles';

  return (
    <nav className="navbar navbar-expand-xl navbar-dark custom-navbar shadow-sm sticky-top">
      <div className="container-fluid px-2">

        <Link to={accueilParRole} className="navbar-brand d-flex align-items-center gap-3 text-decoration-none">
          <div className="logo-wrapper">
            <img src={logo} alt="Logo restaurant" />
          </div>
          <span className="fw-bold fs-5 d-none d-sm-block">RESTAU MANAGER</span>
        </Link>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">

          <ul className="navbar-nav me-auto ms-lg-4 mb-2 mb-lg-0 gap-1 gap-lg-2">
            {user?.role === 'serveur' && (
              <>
                <li className="nav-item"><Link to="/serveur/articles" className={getLinkClass('/serveur/articles')}>Articles</Link></li>
                <li className="nav-item"><Link to="/serveur/commandes" className={getLinkClass('/serveur/commandes')}>Mes commandes</Link></li>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <li className="nav-item"><Link to="/admin/articles" className={getLinkClass('/admin/articles')}>Menu</Link></li>
                <li className="nav-item"><Link to="/admin/sous-categories" className={getLinkClass('/admin/sous-categories')}>Sous-catégories</Link></li>
                <li className="nav-item"><Link to="/admin/commandes" className={getLinkClass('/admin/commandes')}>Commandes</Link></li>
                <li className="nav-item"><Link to="/admin/statistiques" className={getLinkClass('/admin/statistiques')}>Statistiques</Link></li>
                <li className="nav-item"><Link to="/admin/utilisateurs" className={getLinkClass('/admin/utilisateurs')}>Utilisateurs</Link></li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0 pb-2 pb-lg-0">
            <div className="user-profile d-flex align-items-center gap-2 px-3 py-1 rounded-pill">
              <span className="text-white fw-medium">{user?.name}</span>
              <span className="badge user-badge">{user?.role}</span>
            </div>

            <button className="btn btn-logout rounded-pill px-3 fw-medium" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Header;
