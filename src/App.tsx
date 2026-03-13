import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './features/auth/context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';

// Auth
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterWizard } from './features/auth/components/RegisterWizard';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';


// Torneos (V1)
import TournamentsListPage from './features/tournaments/pages/TournamentsListPage';
import TournamentDetailPage from './features/tournaments/pages/TournamentDetailPage';

// Torneos Público V2 - Inscripciones
import { TorneosPublicListPage } from './features/tournaments/pages/TorneosPublicListPage';
import { TorneoPublicDetailPage } from './features/tournaments/pages/TorneoPublicDetailPage';
import { InscripcionWizardPage } from './features/inscripciones/pages/InscripcionWizardPage';

// Inscripciones (V1)
import MisInscripcionesPage from './features/inscripciones/pages/MisInscripcionesPage';

// Rankings (V1)
import RankingsPage from './features/rankings/pages/RankingsPage';
import { CircuitosListPage, CircuitoDetailPage } from './features/circuitos';
import { PerfilMockupPage } from './features/perfil/pages/PerfilMockupPage';
import { PerfilPage } from './features/perfil/pages/PerfilPage';

// Sedes (V2)
import SedesListPage from './features/sedes/pages/SedesListPage';
import SedeDetailPage from './features/sedes/pages/SedeDetailPage';

// Alquileres (V2)
import AlquileresPage from './features/alquileres/pages/AlquileresPage';
import MisReservasPage from './features/alquileres/pages/MisReservasPage';

// Instructores (V2)
import InstructoresListPage from './features/instructores/pages/InstructoresListPage';
import InstructorDetailPage from './features/instructores/pages/InstructorDetailPage';

// Feed (Novedades)
import { NovedadesPage } from './features/feed/pages/NovedadesPage';

// Admin
import { AdminPage } from './features/admin/pages/AdminPage';

// Organizador
import { MisTorneosPage } from './features/organizador/pages/MisTorneosPage';
import { GestionarTorneoPage } from './features/organizador/pages/GestionarTorneoPage';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';

// Layout wrapper para rutas protegidas con autenticación
function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing - Pública */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Torneos Públicos - V2 */}
        <Route path="/torneos" element={<TorneosPublicListPage />} />
        <Route path="/t/:slug" element={<TorneoPublicDetailPage />} />
        
        {/* Mockup Perfil - Temporal */}
        <Route path="/perfil-mockup" element={<PerfilMockupPage />} />
        
        {/* Perfil de Jugador */}
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/perfil/:id" element={<PerfilPage />} />
        
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterWizard />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Rutas Protegidas con Layout */}
        <Route element={<ProtectedLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Torneos - V2 Público */}
          <Route path="/tournaments" element={<TorneosPublicListPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          
          {/* Inscripciones (V1) */}
          <Route path="/inscripciones/my" element={<MisInscripcionesPage />} />
          
          {/* Inscripciones Públicas - V2 */}
          <Route path="/t/:slug/inscribirse" element={<InscripcionWizardPage />} />
          
          {/* Rankings (V1) */}
          <Route path="/rankings" element={<RankingsPage />} />
          
          {/* Circuitos */}
          <Route path="/circuitos" element={<CircuitosListPage />} />
          <Route path="/circuitos/:slug" element={<CircuitoDetailPage />} />
          
          {/* Sedes (V2) */}
          <Route path="/sedes" element={<SedesListPage />} />
          <Route path="/sedes/:id" element={<SedeDetailPage />} />
          
          {/* Alquileres (V2) */}
          <Route path="/alquileres" element={<AlquileresPage />} />
          <Route path="/mis-reservas" element={<MisReservasPage />} />
          
          {/* Instructores (V2) */}
          <Route path="/instructores" element={<InstructoresListPage />} />
          <Route path="/instructores/:id" element={<InstructorDetailPage />} />
          
          {/* Feed / Novedades */}
          <Route path="/novedades" element={<NovedadesPage />} />
          
          {/* Organizador - Gestión de Torneos */}
          <Route element={<RoleProtectedRoute allowedRoles={['organizador']} />}>
            <Route path="/mis-torneos" element={<MisTorneosPage />} />
            <Route path="/mis-torneos/:id/gestionar" element={<GestionarTorneoPage />} />
          </Route>
          
          {/* Admin */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          
          {/* Alias de rutas para navegación */}
          <Route path="/torneos" element={<TournamentsListPage />} />
          <Route path="/jugadores" element={<NovedadesPage />} /> {/* Temporal hasta tener página de jugadores */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
