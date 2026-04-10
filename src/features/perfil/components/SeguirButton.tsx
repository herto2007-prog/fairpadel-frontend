import { useState, useEffect } from 'react';
import { Users, UserCheck, Loader2 } from 'lucide-react';
import { seguimientoService } from '../../../services/seguimientoService';
import { useAuth } from '../../auth/context/AuthContext';

interface SeguirButtonProps {
  usuarioId: string;
  initialSeguidoresCount: number;
  onSeguimientoChange?: (siguiendo: boolean, seguidoresCount: number) => void;
}

export function SeguirButton({
  usuarioId,
  initialSeguidoresCount,
  onSeguimientoChange,
}: SeguirButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [siguiendo, setSiguiendo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [seguidoresCount, setSeguidoresCount] = useState(initialSeguidoresCount);

  // Verificar estado inicial
  useEffect(() => {
    if (isAuthenticated && user?.id !== usuarioId) {
      checkEstadoSeguimiento();
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, user, usuarioId]);

  const checkEstadoSeguimiento = async () => {
    try {
      const result = await seguimientoService.checkSiguiendo(usuarioId);
      setSiguiendo(result.siguiendo);
    } catch (err) {
      console.error('Error verificando seguimiento:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleClick = async () => {
    if (!isAuthenticated) {
      // Redirigir a login
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setLoading(true);
    try {
      if (siguiendo) {
        const result = await seguimientoService.dejarDeSeguir(usuarioId);
        if (result.success) {
          setSiguiendo(false);
          const newCount = result.data?.seguidoresCount ?? seguidoresCount - 1;
          setSeguidoresCount(newCount);
          onSeguimientoChange?.(false, newCount);
        }
      } else {
        const result = await seguimientoService.seguirUsuario(usuarioId);
        if (result.success) {
          setSiguiendo(true);
          const newCount = result.data?.seguidoresCount ?? seguidoresCount + 1;
          setSeguidoresCount(newCount);
          onSeguimientoChange?.(true, newCount);
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al procesar la solicitud';
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  // No mostrar si es el perfil del usuario autenticado
  if (user?.id === usuarioId) {
    return null;
  }

  if (checking) {
    return (
      <button
        type="button"
        className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white rounded-xl font-medium opacity-50 cursor-not-allowed"
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando...
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
        siguiendo
          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          : 'bg-[#df2531] hover:bg-[#df2531]/90 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : siguiendo ? (
        <>
          <UserCheck className="w-4 h-4" />
          <span>Siguiendo</span>
        </>
      ) : (
        <>
          <Users className="w-4 h-4" />
          <span>Seguir</span>
        </>
      )}
    </button>
  );
}
