import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BackgroundEffects } from '../components/ui/BackgroundEffects';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
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
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Política de Privacidad
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
                <h2 className="text-xl font-bold text-white mb-3">1. Introducción</h2>
                <p>
                  FairPadel respeta tu privacidad y se compromete a proteger tus datos personales. 
                  Esta política explica qué información recopilamos, cómo la usamos y cuáles son 
                  tus derechos respecto a tus datos, de conformidad con la Ley N° 1969/02 de 
                  Protección de Datos Personales de la República del Paraguay.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">2. Datos que recopilamos</h2>
                <p className="mb-2">Podemos recopilar los siguientes datos personales:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Información de registro: nombre, apellido, número de documento, email, teléfono, fecha de nacimiento.</li>
                  <li>Información de perfil: foto, ciudad, país, biografía, redes sociales.</li>
                  <li>Información de actividad: torneos en los que participás, resultados de partidos, inscripciones, reservas de canchas.</li>
                  <li>Información de pago: datos de transacciones procesadas a través de Bancard (no almacenamos datos de tarjetas).</li>
                  <li>Datos técnicos: dirección IP, tipo de dispositivo, navegador y logs de uso.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">3. Cómo usamos tus datos</h2>
                <p className="mb-2">Utilizamos tus datos personales para:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Crear y gestionar tu cuenta de usuario.</li>
                  <li>Permitirte inscribirte en torneos y hacer reservas de canchas.</li>
                  <li>Generar brackets, rankings y estadísticas de torneos.</li>
                  <li>Enviarte notificaciones sobre tus partidos, inscripciones y actividad en la plataforma.</li>
                  <li>Procesar pagos de inscripciones y comisiones.</li>
                  <li>Mejorar la plataforma y prevenir actividades fraudulentas.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">4. Compartición de datos</h2>
                <p>
                  No vendemos ni alquilamos tus datos personales a terceros. Podemos compartir 
                  información con:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li><strong>Organizadores de torneos:</strong> nombre, categoría y pareja para gestionar inscripciones.</li>
                  <li><strong>Sedes afiliadas:</strong> datos necesarios para confirmar reservas de canchas.</li>
                  <li><strong>Proveedores de pago:</strong> Bancard, para procesar transacciones de forma segura.</li>
                  <li><strong>Obligaciones legales:</strong> cuando sea requerido por autoridades competentes.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">5. Cookies y tecnologías similares</h2>
                <p>
                  FairPadel utiliza cookies y tecnologías similares para mantener tu sesión activa, 
                  recordar tus preferencias y analizar el uso de la plataforma. Podés configurar 
                  tu navegador para rechazar cookies, aunque esto puede afectar el funcionamiento 
                  de algunas funciones.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">6. Seguridad de los datos</h2>
                <p>
                  Implementamos medidas técnicas y organizativas para proteger tus datos personales 
                  contra acceso no autorizado, pérdida o alteración. Sin embargo, ningún sistema es 
                  completamente seguro. Al usar FairPadel, aceptás estos riesgos inherentes.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">7. Tus derechos</h2>
                <p className="mb-2">Como titular de datos personales en Paraguay, tenés derecho a:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Acceder a tus datos personales que poseemos.</li>
                  <li>Rectificar datos inexactos o incompletos.</li>
                  <li>Solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
                  <li>Oponerte al tratamiento de tus datos para fines específicos.</li>
                  <li>Retirar tu consentimiento en cualquier momento.</li>
                </ul>
                <p className="mt-2">
                  Para ejercer estos derechos, contactanos a{' '}
                  <a href="mailto:admin@fairpadel.com" className="text-primary hover:underline">
                    admin@fairpadel.com
                  </a>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">8. Conservación de datos</h2>
                <p>
                  Conservamos tus datos personales mientras mantengas una cuenta activa en FairPadel 
                  o mientras sean necesarios para cumplir con obligaciones legales. Podés solicitar 
                  la eliminación de tu cuenta y datos en cualquier momento desde la configuración 
                  de perfil.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">9. Cambios en esta política</h2>
                <p>
                  Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos 
                  sobre cambios significativos a través de la plataforma o por email. El uso 
                  continuado de FairPadel después de cualquier modificación implica la aceptación 
                  de la política actualizada.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-3">10. Contacto</h2>
                <p>
                  Si tenés preguntas sobre esta política o sobre el tratamiento de tus datos, 
                  podés escribirnos a{' '}
                  <a href="mailto:admin@fairpadel.com" className="text-primary hover:underline">
                    admin@fairpadel.com
                  </a>.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
