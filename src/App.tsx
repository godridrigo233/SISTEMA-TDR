import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner@2.0.3';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LocadoresPage from './components/LocadoresPage';
import TdrFormPage from './components/TdrFormPage';
import TdrDetailPage from './components/TdrDetailPage';
import ValidacionPage from './components/ValidacionPage';
import TdrTemplatePage from './components/TdrTemplatePage';
import MiPerfilPage from './components/Miperfilpage'; // ← NUEVO
import NuevoContratantePage from './components/NuevoContratantePage';
import { User, Locador, TdR } from './types';
import { API_URL } from './config/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [selectedTdR, setSelectedTdR] = useState<string | null>(null);
  const [selectedLocador, setSelectedLocador] = useState<string | null>(null);

  const [locadores, setLocadores] = useState<Locador[]>([]);
  const [tdrs, setTdRs] = useState<TdR[]>([]);
  const [tdrFilters, setTdrFilters] = useState<{ search?: string; estado?: string }>({});

  useEffect(() => {
    if (currentUser) {
      fetchLocadores();
      fetchTdRs(tdrFilters);
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
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
    setSelectedTdR(null);
    setSelectedLocador(null);
  };

  const handleNavigate = (page: string, id?: string) => {
    setCurrentPage(page);
    if (id) {
      if (page === 'tdr-detail' || page === 'validacion' || page === 'tdr-edit') {
        setSelectedTdR(id);
      } else if (page === 'locador-edit') {
        setSelectedLocador(id);
      }
    } else {
      setSelectedTdR(null);
      setSelectedLocador(null);
    }
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
      setCurrentPage('locadores');
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
      setCurrentPage('dashboard');
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
      setCurrentPage('dashboard');
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
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      {currentPage === 'dashboard' && (
        <Dashboard
          user={currentUser}
          tdrs={tdrs}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onFilterChange={handleFilterTdRs}
        />
      )}

      {(currentPage === 'locadores' || currentPage === 'locador-new' || currentPage === 'locador-edit') && (
        <LocadoresPage
          user={currentUser}
          currentPage={currentPage}
          editingId={selectedLocador}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {(currentPage === 'tdr-new' || currentPage === 'tdr-edit') && (
        <TdrFormPage
          user={currentUser}
          locadores={locadores}
          tdrIdToEdit={currentPage === 'tdr-edit' && selectedTdR ? Number(selectedTdR) : undefined}
          onNavigate={handleNavigate}
          onSave={handleSaveTdR}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'tdr-detail' && selectedTdR && (
        <TdrDetailPage
          user={currentUser}
          tdr={tdrs.find(t => t.id === selectedTdR)!}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'validacion' && selectedTdR && (
        <ValidacionPage
          user={currentUser}
          tdr={tdrs.find(t => t.id === selectedTdR)!}
          onNavigate={handleNavigate}
          onValidate={handleValidateTdR}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'template-editor' && (
        <TdrTemplatePage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'nuevo-contratante' && (
     <NuevoContratantePage
       user={currentUser}
       onNavigate={handleNavigate}
       onLogout={handleLogout}    
     />
   )}
      {/* ← NUEVO: Página Mi Perfil */}
      {currentPage === 'mi-perfil' && (
        <MiPerfilPage
          user={currentUser}
          onNavigate={handleNavigate}
        />
      )}

    </div>
  );
}