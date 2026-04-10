import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './features/auth/context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import HomeDashboardPage from './pages/HomeDashboardPage';
import AboutPage from './pages/AboutPage';

// Auth
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterWizard } from './features/auth/components/RegisterWizard';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';


// Torneos Público V2 - Inscripciones
import { TorneosPublicListPage } from './features/tournaments/pages/TorneosPublicListPage';
import { TorneoPublicDetailPage } from './features/tournaments/pages/TorneoPublicDetailPage';
import { InscripcionWizardPage } from './features/inscripciones/pages/InscripcionWizardPage';
import { PublicBracketPage } from './pages/PublicBracketPage';

// Inscripciones (V1)
import MisInscripcionesPage from './features/inscripciones/pages/MisInscripcionesPage';

// Rankings (V1)
import RankingsPage from './features/rankings/pages/RankingsPage';
import { CircuitosListPage, CircuitoDetailPage } from './features/circuitos';
import { PerfilMockupPage } from './features/perfil/pages/PerfilMockupPage';
import { PerfilPage } from './features/perfil/pages/PerfilPage';

// Canchas/Reservas (V2)
import { CanchasPage } from './features/canchas/pages/CanchasPage';
import SedeDetailPage from './features/sedes/pages/SedeDetailPage';

// Alquileres (V2)
import AlquileresPage from './features/alquileres/pages/AlquileresPage';
import MisReservasPage from './features/alquileres/pages/MisReservasPage';
import GestionDisponibilidadPage from './features/alquileres/pages/GestionDisponibilidadPage';
import SuscripcionPage from './features/alquileres/pages/SuscripcionPage';
import SuscripcionConfirmacionPage from './features/alquileres/pages/SuscripcionConfirmacionPage';
import SuscripcionCancelacionPage from './features/alquileres/pages/SuscripcionCancelacionPage';

// Dueño
import MisSedesPage from './features/dueno/pages/MisSedesPage';
import ReservasSedePage from './features/alquileres/pages/ReservasSedePage';

// Instructores (V2)
import InstructoresListPage from './features/instructores/pages/InstructoresListPage';
import InstructorDetailPage from './features/instructores/pages/InstructorDetailPage';

// Comunidad/Jugadores
import { JugadoresListPage } from './features/jugadores/pages/JugadoresListPage';

// Feed (Novedades)
// Importación removida - NovedadesPage reemplazado por HomeDashboardPage

// Admin
import { AdminPage } from './features/admin/pages/AdminPage';
import { WhatsAppAdminPage } from './features/admin/pages/WhatsAppAdminPage';

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
    <ToastProvider>
      <Router>
        <Routes>
          {/* Landing - Pública */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
        
        {/* Torneos Públicos - V2 */}
        <Route path="/torneos" element={<TorneosPublicListPage />} />
        <Route path="/t/:slug" element={<TorneoPublicDetailPage />} />
        <Route path="/torneo/:id/fixture" element={<PublicBracketPage />} />
        
        {/* Mockup Perfil - Temporal */}
        <Route path="/perfil-mockup" element={<PerfilMockupPage />} />
        
        {/* Perfil de Jugador */}
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/perfil/:id" element={<PerfilPage />} />
        
        {/* Comunidad/Jugadores - Público (sin layout) */}
        <Route path="/jugadores-public" element={<JugadoresListPage />} />
        
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterWizard />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Rutas Protegidas con Layout */}
        <Route element={<ProtectedLayout />}>
          {/* Dashboard - Experiencia Unificada */}
          <Route path="/dashboard" element={<HomeDashboardPage />} />
          
          {/* Torneos - V2 Público */}
          <Route path="/tournaments" element={<TorneosPublicListPage />} />
          <Route path="/tournaments/:id" element={<TorneoPublicDetailPage />} />
          
          {/* Inscripciones (V1) */}
          <Route path="/inscripciones/my" element={<MisInscripcionesPage />} />
          
          {/* Inscripciones Públicas - V2 */}
          <Route path="/t/:slug/inscribirse" element={<InscripcionWizardPage />} />
          
          {/* Rankings (V1) */}
          <Route path="/rankings" element={<RankingsPage />} />
          
          {/* Circuitos */}
          <Route path="/circuitos" element={<CircuitosListPage />} />
          <Route path="/circuitos/:slug" element={<CircuitoDetailPage />} />
          
          {/* Canchas/Reservas (V2) */}
          <Route path="/sedes" element={<CanchasPage />} />
          <Route path="/sedes/:id" element={<SedeDetailPage />} />
          
          {/* Comunidad/Jugadores */}
          <Route path="/comunidad" element={<JugadoresListPage />} />
          <Route path="/jugadores" element={<JugadoresListPage />} />
          
          {/* Dueño - Mis Sedes */}
          <Route path="/mis-sedes" element={<MisSedesPage />} />
          <Route path="/sede/:sedeId/reservas" element={<ReservasSedePage />} />

          {/* Alquileres (V2) */}
          <Route path="/alquileres" element={<AlquileresPage />} />
          <Route path="/mis-reservas" element={<MisReservasPage />} />
          
          {/* Instructores (V2) */}
          <Route path="/instructores" element={<InstructoresListPage />} />
          <Route path="/instructores/:id" element={<InstructorDetailPage />} />
          
          
          {/* Feed / Novedades - Ahora redirige al dashboard unificado */}
          <Route path="/novedades" element={<HomeDashboardPage />} />
          
          {/* Organizador - Gestión de Torneos */}
          <Route element={<RoleProtectedRoute allowedRoles={['organizador', 'dueño']} />}>
            <Route path="/mis-torneos" element={<MisTorneosPage />} />
            <Route path="/mis-torneos/:id/gestionar" element={<GestionarTorneoPage />} />
            <Route path="/sede/:sedeId/disponibilidad" element={<GestionDisponibilidadPage />} />
            <Route path="/sede/:sedeId/suscripcion" element={<SuscripcionPage />} />
          </Route>
          
          {/* Admin */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/whatsapp" element={<WhatsAppAdminPage />} />
          </Route>
          
          {/* Páginas de retorno de Bancard */}
          <Route path="/suscripcion/confirmacion" element={<SuscripcionConfirmacionPage />} />
          <Route path="/suscripcion/cancelacion" element={<SuscripcionCancelacionPage />} />
          
          {/* Redirecciones */}
          <Route path="/feed" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
