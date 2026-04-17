import { motion } from 'framer-motion';

export const SEOSection = () => {
  return (
    <section id="sobre-fairpadel" className="relative py-20 bg-dark-100/50">
      <div className="max-w-7xl mx-auto section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="prose prose-invert max-w-none"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            FairPadel: La Plataforma Líder de Pádel en Paraguay
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 text-gray-300 leading-relaxed">
            <div className="space-y-4">
              <p>
                <strong className="text-white">FairPadel</strong> es una plataforma de 
                <strong className="text-white"> pádel en Paraguay</strong>, diseñada para conectar 
                jugadores, organizadores y sedes en un solo ecosistema digital. Nuestro sistema 
                permite crear y gestionar torneos de pádel profesionales con brackets automáticos, 
                sistema de acomodación paraguaya y rankings en tiempo real.
              </p>
              
              <p>
                En Paraguay, el pádel ha experimentado un crecimiento exponencial en los últimos años. 
                FairPadel nace para cubrir la necesidad de una herramienta integral que simplifique la 
                organización de torneos, desde las inscripciones hasta la gestión de resultados. 
                Somos una plataforma pensada por y para la comunidad de pádel paraguaya.
              </p>
              
              <p>
                Nuestro sistema de <strong className="text-white">fixture automático</strong> genera 
                brackets profesionales donde todos los jugadores disputan mínimo dos partidos, 
                garantizando una experiencia competitiva y entretenida. Además, el sistema de 
                categorías automáticas clasifica a los jugadores según su nivel, permitiendo 
                torneos equilibrados y competitivos para todos los participantes.
              </p>
            </div>
            
            <div className="space-y-4">
              <p>
                Para los <strong className="text-white">organizadores de torneos</strong>, FairPadel 
                ofrece herramientas completas: gestión de inscripciones con lista de espera inteligente, 
                cobro de inscripciones online integrado con Bancard, scheduling automático de partidos 
                por cancha y horario, y un sistema de notificaciones que mantiene informados a todos 
                los participantes sobre sus próximos partidos.
              </p>
              
              <p>
                Los <strong className="text-white">jugadores de pádel</strong> pueden encontrar torneos 
                en su ciudad, inscribirse fácilmente con sus parejas, seguir su progreso en los rankings 
                y recibir notificaciones de sus partidos. La plataforma está disponible desde cualquier 
                dispositivo, permitiendo acceder a la información de torneos, resultados y rankings 
                desde la computadora, tablet o celular.
              </p>
              
              <p>
                FairPadel opera en Paraguay conectando jugadores de Asunción, 
                Ciudad del Este, Encarnación, San Lorenzo, Luque y Lambaré. Nuestra red 
                de sedes registradas está creciendo constantemente, uniendo a los 
                mejores clubes de pádel del país con tecnología moderna para 
                ofrecer la mejor experiencia a sus jugadores.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">
              ¿Organizás torneos de pádel? ¿Sos jugador y querés encontrar competencias? 
              <strong className="text-white"> Unite a FairPadel hoy</strong> y descubrí por qué somos 
              la plataforma preferida de la comunidad de pádel paraguaya.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
