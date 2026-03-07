import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Landing
import LandingPage from './pages/LandingPage';

// Auth
import LoginPage from './features/auth/pages/LoginPage';

// Sedes
import SedesListPage from './features/sedes/pages/SedesListPage';
import SedeDetailPage from './features/sedes/pages/SedeDetailPage';

// Alquileres
import AlquileresPage from './features/alquileres/pages/AlquileresPage';
import MisReservasPage from './features/alquileres/pages/MisReservasPage';

// Instructores
import InstructoresListPage from './features/instructores/pages/InstructoresListPage';
import InstructorDetailPage from './features/instructores/pages/InstructorDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Sedes */}
        <Route path="/sedes" element={<SedesListPage />} />
        <Route path="/sedes/:id" element={<SedeDetailPage />} />
        
        {/* Alquileres */}
        <Route path="/alquileres" element={<AlquileresPage />} />
        <Route path="/mis-reservas" element={<MisReservasPage />} />
        
        {/* Instructores */}
        <Route path="/instructores" element={<InstructoresListPage />} />
        <Route path="/instructores/:id" element={<InstructorDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
