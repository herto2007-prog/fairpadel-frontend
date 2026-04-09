import { motion } from 'framer-motion';
import { Trophy, Users, Target, Heart, MapPin, Award, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackgroundEffects } from '../components/ui/BackgroundEffects';

const stats = [
  { icon: Trophy, value: '500+', label: 'Torneos Organizados' },
  { icon: Users, value: '10,000+', label: 'Jugadores Activos' },
  { icon: MapPin, value: '50+', label: 'Sedes Registradas' },
  { icon: Award, value: '15+', label: 'Ciudades de Paraguay' },
];

const values = [
  {
    icon: Target,
    title: 'Nuestra Misión',
    description: 'Democratizar el acceso al pádel en Paraguay mediante tecnología innovadora que conecte jugadores, organizadores y sedes en una comunidad unida por la pasión al deporte.',
  },
  {
    icon: Heart,
    title: 'Nuestra Pasión',
    description: 'Somos jugadores de pádel apasionados que entendemos las necesidades reales de la comunidad. Cada funcionalidad de FairPadel está diseñada pensando en mejorar la experiencia de juego.',
  },
  {
    icon: Zap,
    title: 'Innovación Constante',
    description: 'Desarrollamos continuamente nuevas funcionalidades basadas en el feedback de nuestra comunidad. El sistema de acomodación paraguaya, los rankings automáticos y los brackets inteligentes son solo el comienzo.',
  },
  {
    icon: Globe,
    title: 'Alcance Nacional',
    description: 'Desde Asunción hasta Ciudad del Este, Encarnación y todas las ciudades intermedias. FairPadel está presente en todo Paraguay, uniendo a la comunidad de pádel del país.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-4 block">
                Sobre Nosotros
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                La Revolución del <span className="text-gradient">Pádel en Paraguay</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                FairPadel nació con una visión clara: transformar la manera en que se organizan 
                y viven los torneos de pádel en Paraguay. Somos la plataforma tecnológica que la 
                comunidad de pádel estaba esperando.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto section-padding">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section - SEO Optimizado */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="prose prose-invert max-w-none"
            >
              <h2 className="text-3xl font-bold text-white mb-8">¿Qué es FairPadel?</h2>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                <strong className="text-white">FairPadel</strong> es la plataforma líder de 
                <strong className="text-white"> pádel en Paraguay</strong>, diseñada específicamente 
                para satisfacer las necesidades de jugadores, organizadores de torneos y sedes deportivas. 
                Nuestra plataforma integral permite gestionar todo el ciclo de vida de un torneo de pádel, 
                desde la apertura de inscripciones hasta la entrega de premios, pasando por la generación 
                automática de fixtures, el seguimiento de resultados y la actualización de rankings.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                El pádel es uno de los deportes de más rápido crecimiento en Paraguay. En los últimos años, 
                hemos visto cómo el número de canchas, jugadores y torneos se ha multiplicado exponencialmente. 
                Sin embargo, la organización de competencias seguía siendo un proceso manual, tedioso y propenso 
                a errores. FairPadel nace para resolver estos problemas, ofreciendo una solución tecnológica 
                moderna, intuitiva y completa que automatiza las tareas repetitivas y permite a los organizadores 
                enfocarse en lo que realmente importa: crear experiencias memorables para los jugadores.
              </p>

              <h3 className="text-2xl font-bold text-white mb-6 mt-12">Características Principales</h3>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                Nuestro <strong className="text-white">sistema de brackets automáticos</strong> implementa 
                el sistema de acomodación paraguaya, garantizando que todos los participantes jueguen 
                mínimo dos partidos independientemente de sus resultados. Esto maximiza el valor de la 
                inscripción para los jugadores y asegura una jornada deportiva completa y entretenida. 
                Además, el sistema permite gestionar múltiples categorías simultáneamente, cada una con 
                su propio fixture y horarios.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                El <strong className="text-white">sistema de rankings</strong> de FairPadel actualiza 
                automáticamente los puntos de los jugadores basándose en sus resultados en torneos. 
                Los rankings son globales (todos los torneos de la plataforma) y también pueden filtrarse 
                por categoría y por sede. Esto permite a los jugadores seguir su progreso y comparar su 
                nivel con otros competidores de Paraguay.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                Para los organizadores, ofrecemos herramientas de <strong className="text-white">gestión financiera</strong> 
                integradas. El sistema permite cobrar inscripciones online mediante integración con Bancard, 
                generando comprobantes digitales automáticos. Los jugadores pueden pagar con tarjeta de crédito, 
                débito o en efectivo en puntos de pago habilitados. Todo el flujo de caja del torneo puede 
                seguirse desde el panel de administración.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                La <strong className="text-white">comunicación automatizada</strong> mantiene informados 
                a todos los participantes. Los jugadores reciben notificaciones por email y WhatsApp 
                (previo consentimiento) sobre sus próximos partidos, cambios de horario, resultados y 
                avances en el bracket. Esto reduce drásticamente las consultas repetitivas a los organizadores 
                y mejora la experiencia general del torneo.
              </p>

              <h3 className="text-2xl font-bold text-white mb-6 mt-12">Cobertura Nacional</h3>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                FairPadel está presente en todas las regiones de Paraguay. Operamos activamente en 
                <strong className="text-white"> Asunción</strong> (Capital y Gran Asunción), 
                <strong className="text-white"> Ciudad del Este</strong> (Alto Paraná), 
                <strong className="text-white"> Encarnación</strong> (Itapúa), 
                <strong className="text-white"> San Lorenzo</strong> (Central), 
                <strong className="text-white"> Luque</strong>, 
                <strong className="text-white"> Lambaré</strong>, 
                <strong className="text-white"> Fernando de la Mora</strong>, y continuamos expandiéndonos 
                a nuevas ciudades. Nuestra red incluye más de 50 sedes de primer nivel: clubes deportivos, 
                complejos de canchas, centros recreativos y academias de pádel.
              </p>

              <h3 className="text-2xl font-bold text-white mb-6 mt-12">Tecnología y Seguridad</h3>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                La plataforma está construida con tecnología de vanguardia, garantizando disponibilidad 
                24/7 y tiempos de respuesta rápidos. Todos los datos de usuarios y transacciones están 
                protegidos mediante encriptación SSL y cumplimos con las normativas de protección de datos 
                personales. La infraestructura cloud permite escalar automáticamente durante picos de uso 
                (como aperturas de inscripción populares) sin degradación del servicio.
              </p>

              <h3 className="text-2xl font-bold text-white mb-6 mt-12">¿Por qué elegir FairPadel?</h3>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                Más de <strong className="text-white">500 torneos</strong> han sido organizados exitosamente 
                a través de nuestra plataforma. Nuestra comunidad supera los <strong className="text-white">10,000 jugadores activos</strong> 
                que confían en FairPadel para encontrar competencias, seguir su progreso y conectar con otros 
                amantes del pádel. Ofrecemos soporte técnico dedicado, capacitación gratuita para nuevos 
                organizadores y actualizaciones constantes basadas en el feedback de nuestra comunidad.
              </p>

              <p className="text-gray-300 leading-relaxed mb-8">
                Ya seas un jugador buscando tu próximo torneo, un organizador queriendo simplificar la 
                gestión de tu evento, o una sede deportiva buscando modernizar sus servicios, 
                <strong className="text-white"> FairPadel es tu aliado ideal</strong>. Unite a la revolución 
                del pádel en Paraguay y descubrí por qué somos la plataforma preferida por la comunidad.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-white mb-4">Nuestros Valores</h2>
              <p className="text-gray-400">Los principios que guían cada decisión en FairPadel</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <value.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto section-padding text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                ¿Listo para ser parte de la comunidad?
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Unite a miles de jugadores y organizadores que ya confían en FairPadel 
                para vivir el pádel de forma profesional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <button className="btn-primary text-lg px-8 py-4">
                    Crear Cuenta Gratis
                  </button>
                </Link>
                <Link to="/torneos">
                  <button className="btn-secondary text-lg px-8 py-4">
                    Explorar Torneos
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
