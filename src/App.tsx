import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './features/auth/context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages eager (landing + auth frecuentes)
import LandingPage from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';

// Pages lazy
const HomeDashboardPage = lazy(() => import('./pages/HomeDashboardPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TerminosPage = lazy(() => import('./pages/TerminosPage'));
const PrivacidadPage = lazy(() => import('./pages/PrivacidadPage'));
const ContactoPage = lazy(() => import('./pages/ContactoPage'));
const RegisterWizard = lazy(() => import('./features/auth/components/RegisterWizard').then(m => ({ default: m.RegisterWizard })));
const VerifyEmailPage = lazy(() => import('./features/auth/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// Torneos Público V2 - Inscripciones
const TorneosPublicListPage = lazy(() => import('./features/tournaments/pages/TorneosPublicListPage').then(m => ({ default: m.TorneosPublicListPage })));
const TorneoPublicDetailPage = lazy(() => import('./features/tournaments/pages/TorneoPublicDetailPage').then(m => ({ default: m.TorneoPublicDetailPage })));
const InscripcionWizardPage = lazy(() => import('./features/inscripciones/pages/InscripcionWizardPage').then(m => ({ default: m.InscripcionWizardPage })));
const PublicBracketPage = lazy(() => import('./pages/PublicBracketPage').then(m => ({ default: m.PublicBracketPage })));

// Inscripciones (V1)
const MisInscripcionesPage = lazy(() => import('./features/inscripciones/pages/MisInscripcionesPage'));

// Rankings (V1)
const RankingsPage = lazy(() => import('./features/rankings/pages/RankingsPage'));
const CircuitosListPage = lazy(() => import('./features/circuitos').then(m => ({ default: m.CircuitosListPage })));
const CircuitoDetailPage = lazy(() => import('./features/circuitos').then(m => ({ default: m.CircuitoDetailPage })));
const PerfilMockupPage = lazy(() => import('./features/perfil/pages/PerfilMockupPage').then(m => ({ default: m.PerfilMockupPage })));
const PerfilPage = lazy(() => import('./features/perfil/pages/PerfilPage').then(m => ({ default: m.PerfilPage })));

// Canchas/Reservas (V2)
const CanchasPage = lazy(() => import('./features/canchas/pages/CanchasPage').then(m => ({ default: m.CanchasPage })));
const SedeDetailPage = lazy(() => import('./features/sedes/pages/SedeDetailPage'));

// Alquileres (V2)
const AlquileresPage = lazy(() => import('./features/alquileres/pages/AlquileresPage'));
const MisReservasPage = lazy(() => import('./features/alquileres/pages/MisReservasPage'));
const GestionDisponibilidadPage = lazy(() => import('./features/alquileres/pages/GestionDisponibilidadPage'));
const SuscripcionPage = lazy(() => import('./features/alquileres/pages/SuscripcionPage'));
const SuscripcionConfirmacionPage = lazy(() => import('./features/alquileres/pages/SuscripcionConfirmacionPage'));
const SuscripcionCancelacionPage = lazy(() => import('./features/alquileres/pages/SuscripcionCancelacionPage'));

// Dueño
const MisSedesPage = lazy(() => import('./features/dueno/pages/MisSedesPage'));
const ReservasSedePage = lazy(() => import('./features/alquileres/pages/ReservasSedePage'));

// Instructores (V2)
const InstructoresListPage = lazy(() => import('./features/instructores/pages/InstructoresListPage'));
const InstructorDetailPage = lazy(() => import('./features/instructores/pages/InstructorDetailPage'));

// Comunidad/Jugadores
const ComunidadV2Page = lazy(() => import('./features/jugadores/pages/ComunidadV2Page').then(m => ({ default: m.ComunidadV2Page })));

// Admin
const AdminPage = lazy(() => import('./features/admin/pages/AdminPage').then(m => ({ default: m.AdminPage })));
const WhatsAppAdminPage = lazy(() => import('./features/admin/pages/WhatsAppAdminPage').then(m => ({ default: m.WhatsAppAdminPage })));

// Organizador
const MisTorneosPage = lazy(() => import('./features/organizador/pages/MisTorneosPage').then(m => ({ default: m.MisTorneosPage })));
const GestionarTorneoPage = lazy(() => import('./features/organizador/pages/GestionarTorneoPage').then(m => ({ default: m.GestionarTorneoPage })));
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
      />
    </div>
  );
}

// Layout público con navegación visible (sin requerir auth)
function PublicLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing - Pública */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terminos" element={<TerminosPage />} />
            <Route path="/privacidad" element={<PrivacidadPage />} />
            <Route path="/contacto" element={<ContactoPage />} />

            {/* Torneos Públicos - V2 (con navegación visible) */}
            <Route element={<PublicLayout />}>
              <Route path="/torneos" element={<TorneosPublicListPage />} />
              <Route path="/t/:slug" element={<TorneoPublicDetailPage />} />
              <Route path="/torneo/:id/fixture" element={<PublicBracketPage />} />
            </Route>

            {/* Mockup Perfil - Temporal */}
            <Route path="/perfil-mockup" element={<PerfilMockupPage />} />

            {/* Perfil de Jugador - Con Layout para navegación visible */}
            <Route element={<PublicLayout />}>
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/perfil/:id" element={<PerfilPage />} />
            </Route>

            {/* Comunidad/Jugadores - Público (sin layout) */}
            <Route path="/jugadores-public" element={<Navigate to="/comunidad" replace />} />

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
              <Route path="/comunidad" element={<ComunidadV2Page />} />
              <Route path="/jugadores" element={<ComunidadV2Page />} />

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
        </Suspense>
      </Router>
    </ToastProvider>
  );
}

export default App;
