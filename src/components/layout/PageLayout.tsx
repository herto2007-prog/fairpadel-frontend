import { ReactNode } from 'react';
import { BackgroundEffects } from '../ui/BackgroundEffects';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageLayoutProps {
  children: ReactNode;
  variant?: 'default' | 'centered' | 'full';
  bgVariant?: 'default' | 'subtle' | 'intense';
  showGrid?: boolean;
  showEffects?: boolean;
  
  // Header options
  showHeader?: boolean;
  backUrl?: string;
  backLabel?: string;
  headerContent?: ReactNode;
  
  // Container options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-none',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-4',
  md: 'px-4 py-6',
  lg: 'px-4 py-8',
};

export const PageLayout = ({
  children,
  variant = 'default',
  bgVariant = 'subtle',
  showGrid = true,
  showEffects = true,
  showHeader = false,
  backUrl,
  backLabel = 'Volver',
  headerContent,
  maxWidth = '2xl',
  padding = 'md',
  className = '',
}: PageLayoutProps) => {
  const containerClass = `${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses[padding]}`;
  
  // Centered variant (login, register, etc)
  if (variant === 'centered') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative overflow-hidden">
        {showEffects && <BackgroundEffects variant={bgVariant} showGrid={showGrid} />}
        <div className="w-full relative z-10">
          {children}
        </div>
      </div>
    );
  }

  // Full variant (no container constraints)
  if (variant === 'full') {
    return (
      <div className="min-h-screen bg-dark text-white font-light relative overflow-hidden">
        {showEffects && <BackgroundEffects variant={bgVariant} showGrid={showGrid} />}
        
        {showHeader && (
          <header className="border-b border-white/5 bg-dark/80 backdrop-blur-md sticky top-0 z-50 relative">
            <div className={containerClass}>
              {headerContent || (backUrl && (
                <Link to={backUrl} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                  <ArrowLeft className="w-4 h-4" />
                  {backLabel}
                </Link>
              ))}
            </div>
          </header>
        )}
        
        <main className={`relative z-10 ${className}`}>
          {children}
        </main>
      </div>
    );
  }

  // Default variant with container
  return (
    <div className="min-h-screen bg-dark text-white font-light relative overflow-hidden">
      {showEffects && <BackgroundEffects variant={bgVariant} showGrid={showGrid} />}
      
      {showHeader && (
        <header className="border-b border-white/5 bg-dark/80 backdrop-blur-md sticky top-0 z-50 relative">
          <div className={containerClass}>
            {headerContent || (backUrl && (
              <Link to={backUrl} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Link>
            ))}
          </div>
        </header>
      )}
      
      <main className={`relative z-10 ${containerClass} ${className}`}>
        {children}
      </main>
    </div>
  );
};

// Loading state component
export const PageLoading = () => (
  <div className="min-h-screen bg-dark flex items-center justify-center relative overflow-hidden">
    <BackgroundEffects variant="subtle" showGrid={false} />
    <div className="w-8 h-8 border-2 border-white/10 border-t-primary rounded-full animate-spin relative z-10" />
  </div>
);

// Error state component
interface PageErrorProps {
  message?: string;
  backUrl?: string;
}

export const PageError = ({ message = 'Algo salió mal', backUrl = '/' }: PageErrorProps) => (
  <PageLayout variant="centered" showEffects>
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-medium text-white mb-2">{message}</h2>
      <Link to={backUrl} className="text-primary hover:text-primary/80 text-sm">
        Volver al inicio
      </Link>
    </div>
  </PageLayout>
);
