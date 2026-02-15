import { useState, useEffect } from 'react';
import { Crown, Check, Loader2, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { suscripcionesService, PlanPremium, Suscripcion } from '../../../services/suscripcionesService';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function PremiumPage() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<PlanPremium | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [cuponValidado, setCuponValidado] = useState<any>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [planes, miSuscripcion] = await Promise.all([
        suscripcionesService.obtenerPlanes(),
        user ? suscripcionesService.obtenerMiSuscripcion() : null,
      ]);
      if (planes.length > 0) setPlan(planes[0]);
      setSuscripcion(miSuscripcion);
    } catch {
      // silent
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

  const handleSuscribirse = async () => {
    if (!plan || !user) return;
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
    try {
      const resultado = await suscripcionesService.cancelarSuscripcion();
      toast.success(resultado.message);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleReactivar = async () => {
    try {
      const resultado = await suscripcionesService.reactivarSuscripcion();
      toast.success(resultado.message);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-dark-accent" />
      </div>
    );
  }

  const caracteristicas: string[] = plan?.caracteristicas
    ? JSON.parse(plan.caracteristicas)
    : [];

  const playerFeatures = caracteristicas.filter(f => !f.includes('(organizadores)'));
  const organizerFeatures = caracteristicas.filter(f => f.includes('(organizadores)'));

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

      {/* Suscripción activa */}
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
                  <Button variant="outline" size="sm" onClick={handleCancelar}>
                    Cancelar renovación
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleReactivar}>
                    Reactivar
                  </Button>
                )}
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
          {!suscripcion || suscripcion.estado !== 'ACTIVA' ? (
            <Card>
              <CardHeader>
                <CardTitle>Suscribirse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cupón */}
                <div>
                  <label className="block text-sm text-dark-textSecondary mb-1">Cupón de descuento</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cuponCodigo}
                      onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
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
                    <p className="text-green-400 text-xs mt-1">Cupón aplicado: {cuponValidado.mensaje}</p>
                  )}
                </div>

                {/* Price summary */}
                <div className="bg-dark-bg rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-textSecondary">Plan mensual</span>
                    <span className="text-dark-text">${plan?.precioMensual || '3.00'}</span>
                  </div>
                  {cuponValidado?.valido && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-400">Descuento</span>
                      <span className="text-green-400">-Cupón aplicado</span>
                    </div>
                  )}
                  <div className="border-t border-dark-border pt-2 flex justify-between font-semibold">
                    <span className="text-dark-text">Total/mes</span>
                    <span className="text-yellow-400">${plan?.precioMensual || '3.00'} USD</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold"
                  onClick={handleSuscribirse}
                  disabled={subscribing || !plan}
                >
                  {subscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Crown className="h-4 w-4 mr-2" />
                  )}
                  Activar Premium
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
                  Cobro mensual automático vía Bancard. $3 USD al mes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
