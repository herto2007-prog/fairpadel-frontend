import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { Layout } from '@/components/layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import NuevaInscripcionPage from './features/inscripciones/pages/NuevaInscripcionPage';

// Pages
import HomePage from '@/features/home/HomePage';
import { LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth/pages';
import { TournamentsListPage, MyTournamentsPage, CreateTournamentPage } from '@/features/tournaments/pages';
import RankingsPage from '@/features/rankings/pages/RankingsPage';
import MisInscripcionesPage from '@/features/inscripciones/pages/MisInscripcionesPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import EditProfilePage from '@/features/profile/pages/EditProfilePage';
import TournamentDetailPage from '@/features/tournaments/pages/TournamentDetailPage';
import AdminPage from '@/features/admin/pages/AdminPage';
import AdminSedesPage from '@/features/admin/pages/AdminSedesPage';
import AdminOrganizadoresPage from '@/features/admin/pages/AdminOrganizadoresPage';
import AdminModeracionPage from '@/features/admin/pages/AdminModeracionPage';
import AdminSuscripcionesPage from '@/features/admin/pages/AdminSuscripcionesPage';
import AdminConfiguracionPage from '@/features/admin/pages/AdminConfiguracionPage';
import AdminCircuitosPage from '@/features/admin/pages/AdminCircuitosPage';
import AdminCategoriasPage from '@/features/admin/pages/AdminCategoriasPage';
import AdminPublicidadPage from '@/features/admin/pages/AdminPublicidadPage';
import ManageTournamentPage from '@/features/tournaments/pages/ManageTournamentPage';
import EditTournamentPage from '@/features/tournaments/pages/EditTournamentPage';
import CircuitosListPage from '@/features/circuitos/pages/CircuitosListPage';
import CircuitoDetailPage from '@/features/circuitos/pages/CircuitoDetailPage';
import FixturePage from '@/features/matches/pages/FixturePage';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Routes with layout */}
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments" element={<TournamentsListPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="/circuitos" element={<CircuitosListPage />} />
            <Route path="/circuitos/:id" element={<CircuitoDetailPage />} />
            <Route path="/tournaments/:tournamentId/fixture" element={<FixturePage />} />

            {/* Protected - Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sedes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSedesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organizadores"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminOrganizadoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderacion"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminModeracionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/suscripciones"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSuscripcionesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/configuracion"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminConfiguracionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/circuitos"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCircuitosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categorias"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCategoriasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/publicidad"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPublicidadPage />
                </ProtectedRoute>
              }
            />

            {/* Protected - Jugador */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={<ProfilePage />}
            />
            <Route
              path="/inscripciones"
              element={
                <ProtectedRoute>
                  <MisInscripcionesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected - Organizador */}
            <Route
              path="/my-tournaments"
              element={
                <ProtectedRoute requiredRole="organizador">
                  <MyTournamentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments/create"
              element={
                <ProtectedRoute requiredRole="organizador">
                  <CreateTournamentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments/:id/manage"
              element={
                <ProtectedRoute requiredRole="organizador">
                  <ManageTournamentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments/:id/edit"
              element={
                <ProtectedRoute requiredRole="organizador">
                  <EditTournamentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inscripciones/nueva"
              element={
                <ProtectedRoute>
                  <NuevaInscripcionPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
