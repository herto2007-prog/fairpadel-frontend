import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Testimonials } from '../components/landing/Testimonials';
import { Pricing } from '../components/landing/Pricing';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';
import { ParticleBackground } from '../components/landing/ParticleBackground';
import { SEOSection } from '../components/landing/SEOSection';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mientras carga el estado de autenticación, mostrar un loader mínimo
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#df2531]/20 border-t-[#df2531] rounded-full animate-spin" />
      </div>
    );
  }

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Usuario no autenticado - mostrar landing normal
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-x-hidden">
      <ParticleBackground />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA />
        <SEOSection />
      </main>
      <Footer />
    </div>
  );
}
