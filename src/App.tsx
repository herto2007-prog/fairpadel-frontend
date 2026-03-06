import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types';
import { TournamentsListPage } from './features/tournaments/pages/TournamentsListPage';
import { TournamentDetailPage } from './features/tournaments/pages/TournamentDetailPage';
import { CreateTournamentPage } from './features/tournaments/pages/CreateTournamentPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#151921',
            color: '#E5E7EB',
            border: '1px solid #232838',
          },
        }}
      />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Tournament Routes - Public */}
        <Route path="/tournaments" element={<TournamentsListPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        
        {/* Tournament Routes - Protected (Organizador) */}
        <Route
          path="/tournaments/create"
          element={
            <ProtectedRoute requiredRoles={[UserRole.ORGANIZADOR, UserRole.ADMIN]}>
              <CreateTournamentPage />
            </ProtectedRoute>
          }
        />
        
        {/* Home - Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
