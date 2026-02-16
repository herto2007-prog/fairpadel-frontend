import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Loader2, Tag, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { suscripcionesService, PlanPremium, Suscripcion } from '../../../services/suscripcionesService';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function PremiumPage() {
  const { user, refreshProfile } = useAuthStore();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanPremium | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [cuponValidado, setCuponValidado] = useState<any>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadError(false);
      const [planes, miSuscripcion] = await Promise.all([
        suscripcionesService.obtenerPlanes(),
        user ? suscripcionesService.obtenerMiSuscripcion() : null,
      ]);
      if (planes.length > 0) setPlan(planes[0]);
      setSuscripcion(miSuscripcion);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleValidarCupon = async () => {
    if (!cuponCodigo.trim()) return;
    setValidandoCupon(true);
    try {
      const resultado = await suscripcionesService.validarCupon(cuponCodigo);
      setCuponValidado(resultado);
      if (!resultado.valido) {
        toast.error(resultado.mensaje);
      } else {
        toast.success('Cupón válido');
      }
    } catch {
      toast.error('Error al validar cupón');
    } finally {
      setValidandoCupon(false);
    }
  };

  const calcularPrecioFinal = (): number => {
    if (!plan) return 0;
    const precio = Number(plan.precioMensual);
    if (!cuponValidado?.valido || !cuponValidado?.cupon) return precio;

    const cupon = cuponValidado.cupon;
    if (cupon.tipo === 'PORCENTAJE') {
      return Math.max(0, precio - (precio * Number(cupon.valor)) / 100);
    }
    return Math.max(0, precio - Number(cupon.valor));
  };

  const calcularDescuento = (): number => {
    if (!plan || !cuponValidado?.valido) return 0;
    return Number(plan.precioMensual) - calcularPrecioFinal();
  };

  const handleSuscribirse = async () => {
    if (!plan) return;
    if (!user) {
      toast.error('Debes iniciar sesión para suscribirte');
      navigate('/login');
      return;
    }
    setSubscribing(true);
    try {
      const resultado = await suscripcionesService.crearSuscripcion(
        plan.id,
        cuponValidado?.valido ? cuponCodigo : undefined,
      );
      if (resultado.checkoutUrl) {
        window.location.href = resultado.checkoutUrl;
      } else {
        toast.success('Suscripción creada. Procesando pago...');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear suscripción');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelar = async () => {
    setActionLoading(true);
    try {
      const resultado = await suscripcionesService.cancelarSuscripcion();
      toast.success(resultado.message);
      await loadData();
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivar = async () => {
    setActionLoading(true);
    try {
      const resultado = await suscripcionesService.reactivarSuscripcion();
      toast.success(resultado.message);
      await loadData();
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-dark-accent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-dark-textSecondary">Error al cargar la información</p>
        <Button variant="outline" onClick={() => { setLoading(true); loadData(); }}>
          Reintentar
        </Button>
      </div>
    );
  }

  // Safe JSON parse for plan features
  let caracteristicas: string[] = [];
  try {
    caracteristicas = plan?.caracteristicas ? JSON.parse(plan.caracteristicas) : [];
  } catch {
    caracteristicas = [];
  }

  const playerFeatures = caracteristicas.filter(f => !f.includes('(organizadores)'));
  const organizerFeatures = caracteristicas.filter(f => f.includes('(organizadores)'));

  const precioFinal = calcularPrecioFinal();
  const descuento = calcularDescuento();

  // Determine if user can subscribe (no ACTIVA subscription)
  const canSubscribe = !suscripcion || suscripcion.estado !== 'ACTIVA';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-2 rounded-full mb-4">
          <Crown className="h-5 w-5 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">FairPadel Premium</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-dark-text mb-3">
          Lleva tu juego al siguiente nivel
        </h1>
        <p className="text-dark-textSecondary text-base sm:text-lg max-w-2xl mx-auto">
          Un solo plan para jugadores y organizadores. Todo lo que necesitas por solo $3 USD/mes.
        </p>
      </div>

      {/* Suscripción ACTIVA */}
      {suscripcion && suscripcion.estado === 'ACTIVA' && (
        <Card className="mb-8 border-yellow-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <span className="text-dark-text font-semibold">Premium Activo</span>
                </div>
                <p className="text-dark-textSecondary text-sm">
                  {suscripcion.autoRenovar
                    ? `Se renueva el ${new Date(suscripcion.fechaFin).toLocaleDateString('es-PY')}`
                    : `Vence el ${new Date(suscripcion.fechaFin).toLocaleDateString('es-PY')} (no se renovará)`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {suscripcion.autoRenovar ? (
                  <Button variant="outline" size="sm" onClick={handleCancelar} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Cancelar renovación
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleReactivar} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Reactivar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suscripción PENDIENTE_PAGO */}
      {suscripcion && suscripcion.estado === 'PENDIENTE_PAGO' && (
        <Card className="mb-8 border-amber-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-dark-text font-semibold mb-1">Pago pendiente</p>
                <p className="text-dark-textSecondary text-sm">
                  Tu suscripción está esperando confirmación de pago. Si ya pagaste, el proceso se completará en breve.
                  Si el pago no se completa en 24 horas, se cancelará automáticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suscripción VENCIDA */}
      {suscripcion && suscripcion.estado === 'VENCIDA' && (
        <Card className="mb-8 border-red-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-dark-text font-semibold mb-1">Premium vencido</p>
                <p className="text-dark-textSecondary text-sm">
                  Tu suscripción venció el {new Date(suscripcion.fechaFin).toLocaleDateString('es-PY')}.
                  Suscribite de nuevo para recuperar todos los beneficios premium.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Features */}
        <Card className="border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>FairPadel Premium</span>
              <span className="text-2xl sm:text-3xl font-bold text-yellow-400">
                $3<span className="text-sm font-normal text-dark-textSecondary">/mes</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-dark-textSecondary uppercase tracking-wider mb-3">
                Para Jugadores
              </h3>
              <ul className="space-y-2">
                {playerFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-dark-text text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-textSecondary uppercase tracking-wider mb-3">
                Para Organizadores
              </h3>
              <ul className="space-y-2">
                {organizerFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <span className="text-dark-text text-sm">{feat.replace(' (organizadores)', '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Subscribe section */}
        <div className="space-y-6">
          {canSubscribe ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {suscripcion?.estado === 'VENCIDA' ? 'Renovar Premium' : 'Suscribirse'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Login prompt for unauthenticated users */}
                {!user && (
                  <div className="bg-dark-bg rounded-lg p-3 text-center">
                    <p className="text-dark-textSecondary text-sm mb-2">
                      Iniciá sesión para suscribirte
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                      Iniciar sesión
                    </Button>
                  </div>
                )}

                {/* Cupón */}
                <div>
                  <label className="block text-sm text-dark-textSecondary mb-1">Cupón de descuento</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cuponCodigo}
                      onChange={(e) => {
                        setCuponCodigo(e.target.value.toUpperCase());
                        setCuponValidado(null);
                      }}
                      placeholder="CODIGO"
                      className="flex-1 bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleValidarCupon}
                      disabled={validandoCupon || !cuponCodigo.trim()}
                    >
                      {validandoCupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                    </Button>
                  </div>
                  {cuponValidado?.valido && (
                    <p className="text-green-400 text-xs mt-1">
                      Cupón aplicado: {cuponValidado.cupon?.tipo === 'PORCENTAJE'
                        ? `${Number(cuponValidado.cupon.valor)}% de descuento`
                        : `$${Number(cuponValidado.cupon.valor)} de descuento`
                      }
                    </p>
                  )}
                </div>

                {/* Price summary */}
                <div className="bg-dark-bg rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-textSecondary">Plan mensual</span>
                    <span className="text-dark-text">${Number(plan?.precioMensual || 3).toFixed(2)}</span>
                  </div>
                  {cuponValidado?.valido && descuento > 0 && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-400">Descuento</span>
                      <span className="text-green-400">-${descuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-dark-border pt-2 flex justify-between font-semibold">
                    <span className="text-dark-text">Total/mes</span>
                    <span className="text-yellow-400">${precioFinal.toFixed(2)} USD</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold"
                  onClick={handleSuscribirse}
                  disabled={subscribing || !plan || !user}
                >
                  {subscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Crown className="h-4 w-4 mr-2" />
                  )}
                  {suscripcion?.estado === 'VENCIDA' ? 'Renovar Premium' : 'Activar Premium'}
                </Button>

                <p className="text-xs text-dark-textSecondary text-center">
                  Cancela cuando quieras. Sin compromisos.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preguntas frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-dark-text">¿Puedo cancelar en cualquier momento?</h4>
                <p className="text-xs text-dark-textSecondary mt-1">
                  Sí, sin penalización. Mantendrás acceso hasta el final del período pagado.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-dark-text">¿Funciona para jugadores y organizadores?</h4>
                <p className="text-xs text-dark-textSecondary mt-1">
                  Sí, un solo plan. Si eres organizador, desbloqueas beneficios de organización automáticamente.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-dark-text">¿Cómo se cobra?</h4>
                <p className="text-xs text-dark-textSecondary mt-1">
                  Cobro mensual vía Bancard. $3 USD al mes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
