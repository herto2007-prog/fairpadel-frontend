import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BackgroundEffects } from '../components/ui/BackgroundEffects';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />

      <main className="relative z-10">
        {/* Header */}
        <section className="pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Volver al inicio</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Términos y Condiciones
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Última actualización: abril 2025
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 md:p-10 space-y-8 text-gray-300 leading-relaxed"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-3">1. Aceptación de los términos</h2>
                <p>
                  Al acceder y utilizar FairPadel, aceptás estos Términos y Condiciones de uso. 
                  Si no estás de acuerdo con alguna parte de estos términos, no deberías usar la plataforma. 
                  FairPadel se reserva el derecho de modificar estos términos en cualquier momento. 
                  Los cambios entrarán en vigor una vez publicados en esta página.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">2. Descripción del servicio</h2>
                <p>
                  FairPadel es una plataforma digital que permite a organizadores de torneos de pádel 
                  gestionar inscripciones, crear brackets automáticos, programar partidos, registrar 
                  resultados y administrar rankings. Los jugadores pueden inscribirse en torneos, 
                  consultar fixtures, seguir su progreso y reservar canchas en sedes afiliadas.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">3. Registro de cuenta</h2>
                <p>
                  Para utilizar ciertas funciones de FairPadel, deberás crear una cuenta proporcionando 
                  información veraz, exacta y completa. Sos responsable de mantener la confidencialidad 
                  de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. FairPadel no 
                  será responsable por pérdidas o daños derivados de tu incumplimiento de esta obligación.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">4. Conducta del usuario</h2>
                <p className="mb-2">Al usar FairPadel, te comprometés a no:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Usar la plataforma para fines ilegales o no autorizados.</li>
                  <li>Publicar contenido falso, engañoso, difamatorio o ofensivo.</li>
                  <li>Interferir con el funcionamiento normal de la plataforma o de otros usuarios.</li>
                  <li>Crear cuentas múltiples para eludir restricciones o cometer fraude.</li>
                  <li>Compartir datos personales de terceros sin su consentimiento.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">5. Pagos y comisiones</h2>
                <p>
                  FairPadel puede cobrar comisiones a los organizadores por el uso de la plataforma 
                  para gestionar torneos con cobro de inscripciones. Las tarifas aplicables se mostrarán 
                  claramente antes de confirmar cualquier transacción. Los pagos de inscripciones de 
                  jugadores se procesan a través de proveedores de pago externos (Bancard). FairPadel 
                  no almacena datos de tarjetas de crédito.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">6. Propiedad intelectual</h2>
                <p>
                  FairPadel y su contenido (logos, diseños, código, textos) son propiedad de sus 
                  creadores y están protegidos por las leyes de propiedad intelectual de Paraguay. 
                  No podés copiar, modificar, distribuir o crear trabajos derivados sin autorización 
                  expresa.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">7. Limitación de responsabilidad</h2>
                <p>
                  FairPadel actúa como una plataforma de intermediación. No somos responsables por 
                  disputas entre jugadores, organizadores o sedes, ni por lesiones, daños materiales 
                  o incumplimientos que ocurran durante los torneos o alquileres de canchas. Los 
                  organizadores son responsables de la logística, seguridad y cumplimiento de normas 
                  en sus eventos.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">8. Cancelación y suspensión</h2>
                <p>
                  FairPadel se reserva el derecho de suspender o cancelar cuentas que violen estos 
                  términos, sin previo aviso. Podés cerrar tu cuenta en cualquier momento desde la 
                  configuración de perfil.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">9. Ley aplicable</h2>
                <p>
                  Estos términos se rigen por las leyes de la República del Paraguay. Cualquier 
                  controversia será sometida a los tribunales competentes de Asunción, Paraguay.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">10. Contacto</h2>
                <p>
                  Para consultas sobre estos términos, podés contactarnos a{' '}
                  <a href="mailto:admin@fairpadel.com" className="text-primary hover:underline">
                    admin@fairpadel.com
                  </a>{' '}
                  o a través de nuestros canales de redes sociales.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
