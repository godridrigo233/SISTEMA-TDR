import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner@2.0.3';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LocadoresPage from './components/LocadoresPage';
import TdrFormPage from './components/TdrFormPage';
import TdrDetailPage from './components/TdrDetailPage';
import ValidacionPage from './components/ValidacionPage';
import TdrTemplatePage from './components/TdrTemplatePage';
import MiPerfilPage from './components/Miperfilpage';
import NuevoContratantePage from './components/NuevoContratantePage';
import { User, Locador, TdR } from './types';
import { API_URL } from './config/api';

// ─── Guardas de ruta que leen :id de la URL y localizan el TdR/locador ─────

function TdrDetailRoute({ user, tdrs, onNavigate, onLogout }: any) {
  const { id } = useParams();
  const tdr = tdrs.find((t: TdR) => t.id === id);
  if (!tdr) return <RecursoNoEncontrado tipo="TdR" onNavigate={onNavigate} />;
  return <TdrDetailPage user={user} tdr={tdr} onNavigate={onNavigate} onLogout={onLogout} />;
}

function ValidacionRoute({ user, tdrs, onValidate, onNavigate, onLogout }: any) {
  const { id } = useParams();
  const tdr = tdrs.find((t: TdR) => t.id === id);
  if (!tdr) return <RecursoNoEncontrado tipo="TdR" onNavigate={onNavigate} />;
  return <ValidacionPage user={user} tdr={tdr} onNavigate={onNavigate} onValidate={onValidate} onLogout={onLogout} />;
}

function TdrEditRoute({ user, locadores, onNavigate, onSave, onLogout }: any) {
  const { id } = useParams();
  return (
    <TdrFormPage
      user={user}
      locadores={locadores}
      tdrIdToEdit={id ? Number(id) : undefined}
      onNavigate={onNavigate}
      onSave={onSave}
      onLogout={onLogout}
    />
  );
}

function LocadorEditRoute({ user, onNavigate, onLogout }: any) {
  const { id } = useParams();
  return (
    <LocadoresPage
      user={user}
      currentPage="locador-edit"
      editingId={id ?? null}
      onNavigate={onNavigate}
      onLogout={onLogout}
    />
  );
}

function ContratanteEditRoute({ user, onNavigate, onLogout }: any) {
  const { id } = useParams();
  return (
    <NuevoContratantePage
      user={user}
      currentPage="contratante-edit"
      editingId={id ?? null}
      onNavigate={onNavigate}
      onLogout={onLogout}
    />
  );
}

function RecursoNoEncontrado({ tipo, onNavigate }: { tipo: string; onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-300 mb-2">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{tipo} no encontrado</h1>
        <p className="text-gray-500 mb-6">El recurso que buscas no existe o ya no está disponible.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function PaginaNoEncontrada() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-300 mb-2">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-gray-500 mb-6">La URL a la que intentas acceder no existe.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function PantallaCarga() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Traduce el API antiguo onNavigate('pagina', id) a rutas reales ────────

function useLegacyNavigate() {
  const navigate = useNavigate();
  return (page: string, id?: string) => {
    switch (page) {
      case 'dashboard':        navigate('/dashboard'); break;
      case 'locadores':        navigate('/locadores'); break;
      case 'locador-new':      navigate('/locadores/nuevo'); break;
      case 'locador-edit':     navigate(`/locadores/${id}/editar`); break;
      case 'tdr-new':          navigate('/tdrs/nuevo'); break;
      case 'tdr-edit':         navigate(`/tdrs/${id}/editar`); break;
      case 'tdr-detail':       navigate(`/tdrs/${id}`); break;
      case 'validacion':       navigate(`/tdrs/${id}/validar`); break;
      case 'template-editor':  navigate('/formato'); break;
      case 'contratantes':      navigate('/contratantes'); break;
      case 'contratante-new':   navigate('/contratantes/nuevo'); break;
      case 'contratante-edit':  navigate(`/contratantes/${id}/editar`); break;
      case 'nuevo-contratante': navigate('/contratantes/nuevo'); break;
      case 'mi-perfil':        navigate('/mi-perfil'); break;
      case 'login':             navigate('/login'); break;
      default:                  navigate('/dashboard');
    }
  };
}

function AppRoutes() {
  const navigate = useNavigate();
  const onNavigate = useLegacyNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [locadores, setLocadores] = useState<Locador[]>([]);
  const [tdrs, setTdRs] = useState<TdR[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tdrFilters, setTdrFilters] = useState<{ search?: string; estado?: string }>({});

  useEffect(() => {
    if (currentUser) {
      Promise.all([fetchLocadores(), fetchTdRs(tdrFilters)]).finally(() => setDataLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Auto-refresh: mantiene la lista de TDR al día sin que el usuario recargue.
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => fetchTdRs(tdrFilters), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, tdrFilters]);

  const fetchLocadores = async () => {
    try {
      const res = await fetch(`${API_URL}/locadores`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLocadores(data);
    } catch (error) {
      console.error('Error cargando locadores:', error);
      toast.error('No se pudieron cargar los locadores');
    }
  };

  const fetchTdRs = async (filters: { search?: string; estado?: string } = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search?.trim()) params.set('search', filters.search.trim());
      if (filters.estado?.trim()) params.set('estado', filters.estado.trim());
      const qs = params.toString();
      const res = await fetch(`${API_URL}/tdrs${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTdRs(data);
    } catch (error) {
      console.error('Error cargando TDRs:', error);
      toast.error('No se pudieron cargar los TdR');
    }
  };

  const handleFilterTdRs = (filters: { search?: string; estado?: string }) => {
    setTdrFilters(filters);
    fetchTdRs(filters);
  };

  const handleLogin = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    setDataLoaded(false);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setDataLoaded(false);
    navigate('/login');
  };

  const handleSaveLocador = async (locador: Locador) => {
    try {
      const method = locador.id ? 'PUT' : 'POST';
      const url = locador.id
        ? `${API_URL}/locadores/${locador.id}`
        : `${API_URL}/locadores`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locador),
      });
      if (!res.ok) throw new Error('Error guardando locador');
      await fetchLocadores();
      navigate('/locadores');
      toast.success('Locador guardado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar locador');
    }
  };

  const handleSaveTdR = async (tdr: TdR) => {
    try {
      const isEditing = typeof tdr.id === 'number';
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}/tdrs/${tdr.id}` : `${API_URL}/tdrs`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tdr),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.errores?.join('\n') || err?.message || 'Error guardando TDR');
      }
      await fetchTdRs(tdrFilters);
      navigate('/dashboard');
      toast.success(`TdR ${isEditing ? 'actualizado' : 'creado'} correctamente`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Error al guardar TDR');
    }
  };

  const handleValidateTdR = async (
    tdrId: string,
    accion: 'Validacion' | 'Observacion',
    observaciones?: string,
    usuarioAdminId?: number
  ) => {
    try {
      const res = await fetch(`${API_URL}/tdrs/${tdrId}/validar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, observaciones, usuarioAdminId }),
      });
      if (!res.ok) throw new Error('Error validando TDR');
      await fetchTdRs(tdrFilters);
      navigate('/dashboard');
      toast.success(accion === 'Validacion' ? 'TdR aprobado correctamente' : 'TdR observado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al validar TDR');
    }
  };

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </>
    );
  }

  if (!dataLoaded) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <PantallaCarga />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <Dashboard
              user={currentUser}
              tdrs={tdrs}
              onNavigate={onNavigate}
              onLogout={handleLogout}
              onFilterChange={handleFilterTdRs}
            />
          }
        />

        <Route
          path="/locadores"
          element={
            <LocadoresPage
              user={currentUser}
              currentPage="locadores"
              editingId={null}
              onNavigate={onNavigate}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/locadores/nuevo"
          element={
            <LocadoresPage
              user={currentUser}
              currentPage="locador-new"
              editingId={null}
              onNavigate={onNavigate}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/locadores/:id/editar"
          element={<LocadorEditRoute user={currentUser} onNavigate={onNavigate} onLogout={handleLogout} />}
        />

        <Route
          path="/tdrs/nuevo"
          element={
            <TdrFormPage
              user={currentUser}
              locadores={locadores}
              onNavigate={onNavigate}
              onSave={handleSaveTdR}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/tdrs/:id/editar"
          element={
            <TdrEditRoute
              user={currentUser}
              locadores={locadores}
              onNavigate={onNavigate}
              onSave={handleSaveTdR}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/tdrs/:id"
          element={<TdrDetailRoute user={currentUser} tdrs={tdrs} onNavigate={onNavigate} onLogout={handleLogout} />}
        />
        <Route
          path="/tdrs/:id/validar"
          element={
            <ValidacionRoute
              user={currentUser}
              tdrs={tdrs}
              onValidate={handleValidateTdR}
              onNavigate={onNavigate}
              onLogout={handleLogout}
            />
          }
        />

        <Route
          path="/formato"
          element={<TdrTemplatePage user={currentUser} onNavigate={onNavigate} onLogout={handleLogout} />}
        />

        <Route
          path="/contratantes"
          element={
            <NuevoContratantePage
              user={currentUser}
              currentPage="contratantes"
              editingId={null}
              onNavigate={onNavigate}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/contratantes/nuevo"
          element={
            <NuevoContratantePage
              user={currentUser}
              currentPage="contratante-new"
              editingId={null}
              onNavigate={onNavigate}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/contratantes/:id/editar"
          element={<ContratanteEditRoute user={currentUser} onNavigate={onNavigate} onLogout={handleLogout} />}
        />
        <Route path="/nuevo-contratante" element={<Navigate to="/contratantes/nuevo" replace />} />

        <Route
          path="/mi-perfil"
          element={<MiPerfilPage user={currentUser} onNavigate={onNavigate} onLogout={handleLogout} />}
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
