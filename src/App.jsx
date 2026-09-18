import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import ServeurArticlesPage from './pages/ServeurArticlesPage';
import AdminSousCategoriesPage from './pages/AdminSousCategoriesPage';
import AdminArticlesPage from './pages/AdminArticlesPage';
import ServeurCommandesPage from './pages/ServeurCommandesPage';
import AdminCommandesPage from './pages/AdminCommandesPage';
import AdminStatistiquesPage from './pages/AdminStatistiquesPage';
import AdminUtilisateursPage from './pages/AdminUtilisateursPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/serveur/articles"
          element={
            <PrivateRoute roleRequise="serveur">
              <ServeurArticlesPage />
            </PrivateRoute>
          }
        />
<Route
  path="/admin/sous-categories"
  element={
    <PrivateRoute roleRequise="admin">
      <AdminSousCategoriesPage />
    </PrivateRoute>
  }
/>
<Route
  path="/admin/articles"
  element={
    <PrivateRoute roleRequise="admin">
      <AdminArticlesPage />
    </PrivateRoute>
  }
/>
<Route
  path="/serveur/commandes"
  element={
    <PrivateRoute roleRequise="serveur">
      <ServeurCommandesPage />
    </PrivateRoute>
  }
/>
<Route
  path="/admin/commandes"
  element={
    <PrivateRoute roleRequise="admin">
      <AdminCommandesPage />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/statistiques"
  element={
    <PrivateRoute roleRequise="admin">
      <AdminStatistiquesPage />
    </PrivateRoute>
  }
/>
<Route
  path="/admin/utilisateurs"
  element={
    <PrivateRoute roleRequise="admin">
      <AdminUtilisateursPage />
    </PrivateRoute>
  }
/>
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
