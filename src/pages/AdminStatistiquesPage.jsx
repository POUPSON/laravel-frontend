import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import api from '../services/api';
import Header from '../components/Header';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function AdminStatistiquesPage() {
  const [periode, setPeriode] = useState('jour');
  const [vueGraphique, setVueGraphique] = useState('semaine');
  const [decalage, setDecalage] = useState(0);
  const [stats, setStats] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [meta, setMeta] = useState({});
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    charger();
  }, [periode]);

  useEffect(() => {
    chargerEvolution();
  }, [vueGraphique, decalage]);

  // Réinitialise le décalage quand on change de type de vue (semaine <-> année)
  const changerVue = (nouvelleVue) => {
    setVueGraphique(nouvelleVue);
    setDecalage(0);
  };

  const charger = async () => {
    try {
      const res = await api.get(`/statistiques?periode=${periode}`);
      setStats(res.data);
    } catch (err) {
      setErreur('Impossible de charger les statistiques.');
    }
  };

  const chargerEvolution = async () => {
    try {
      const res = await api.get(`/statistiques/evolution?periode=${vueGraphique}&decalage=${decalage}`);
      setEvolution(res.data.donnees);
      setMeta(res.data);
    } catch (err) {
      setErreur('Impossible de charger l\'évolution.');
    }
  };

  const dataGraphique = {
    labels: evolution.map((e) => e.label),
    datasets: [
      {
        label: 'Revenu (FCFA)',
        data: evolution.map((e) => e.total),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const optionsGraphique = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const labelPeriodeAffichee =
    vueGraphique === 'annee'
      ? `Année ${meta.annee ?? ''}`
      : `Semaine du ${meta.debut ?? ''} au ${meta.fin ?? ''}`;

  return (
    <div>
      <Header />
      <div className="container mt-4">
        <h4>Statistiques des ventes</h4>

        <div className="btn-group mb-4">
          <button
            className={`btn ${periode === 'jour' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setPeriode('jour')}
          >
            Jour
          </button>
          <button
            className={`btn ${periode === 'semaine' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setPeriode('semaine')}
          >
            Semaine
          </button>
          <button
            className={`btn ${periode === 'mois' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setPeriode('mois')}
          >
            Mois
          </button>
        </div>

        {erreur && <div className="alert alert-danger">{erreur}</div>}

        <div className="row">
          <div className="col-md-4 mb-4">
            {stats && (
              <div className="card p-4 h-100 text-center">
                <p className="text-muted mb-1">Depuis le {new Date(stats.depuis).toLocaleDateString()}</p>
                <h2 className="mb-0" style={{ color: '#1e293b' }}>{stats.total_ventes} FCFA</h2>
                <p className="text-muted mb-0">{stats.nombre_commandes} commande(s) payée(s)</p>
              </div>
            )}
          </div>

          <div className="col-md-8 mb-4">
            <div className="card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="btn-group btn-group-sm">
                  <button
                    className={`btn ${vueGraphique === 'semaine' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => changerVue('semaine')}
                  >
                    Semaine
                  </button>
                  <button
                    className={`btn ${vueGraphique === 'annee' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => changerVue('annee')}
                  >
                    Année (12 mois)
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setDecalage(decalage - 1)}>
                    ◀
                  </button>
                  <span className="small text-muted">{labelPeriodeAffichee}</span>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setDecalage(decalage + 1)}
                    disabled={decalage >= 0}
                  >
                    ▶
                  </button>
                </div>
              </div>

              <Bar data={dataGraphique} options={optionsGraphique} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminStatistiquesPage;
