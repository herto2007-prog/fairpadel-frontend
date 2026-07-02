import { motion } from 'framer-motion';
import { Quote, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn } from './AnimatedSection';

const perfiles = [
  {
    name: 'Jugador de Pádel',
    role: '¿Sos jugador?',
    content: 'Encontrá torneos en tu ciudad, inscribite con tu pareja, seguí tu cuadro y horarios desde el celular y mirá tu evolución en los rankings.',
    avatar: 'JP',
    cta: 'Crear mi cuenta gratis',
    ctaLink: '/register',
  },
  {
    name: 'Organizador de Torneos',
    role: '¿Sos organizador?',
    content: 'Creá tu torneo en minutos: sorteo justo automático, agenda por cancha y horario, control de pagos y tu propio ranking para fidelizar jugadores.',
    avatar: 'OT',
    cta: 'Organizar mi primer torneo',
    ctaLink: '/organizar',
  },
  {
    name: 'Dueño de Sede',
    role: '¿Tenés canchas?',
    content: 'Ofrecé reservas online a tus clientes, sumá tu sede al catálogo nacional y atraé más jugadores con torneos en tus canchas.',
    avatar: 'DS',
    cta: 'Sumar mi sede',
    ctaLink: '/suma-tu-sede',
  },
];

export const Testimonials = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-4"
          >
            Para cada uno
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-lg text-white mb-6"
          >
            Una plataforma, tres maneras de{' '}
            <span className="text-gradient">vivirla</span>
          </motion.h2>
        </div>

        {/* Perfiles Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {perfiles.map((perfil, index) => (
            <FadeIn key={perfil.name} delay={index * 0.15}>
              <motion.div
                whileHover={{ y: -5 }}
                className="glass rounded-2xl p-8 h-full flex flex-col border border-transparent hover:border-primary/20 transition-all duration-500"
              >
                {/* Quote Icon */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Quote className="w-5 h-5 text-primary" />
                </div>

                {/* Content */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {perfil.content}
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-red-600 flex items-center justify-center text-white font-bold">
                    {perfil.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{perfil.name}</p>
                    <p className="text-gray-500 text-sm">{perfil.role}</p>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  to={perfil.ctaLink}
                  className="mt-6 inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium group"
                >
                  {perfil.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Value proposition */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 glass rounded-2xl p-8 md:p-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-gradient mb-2">Brackets</p>
              <p className="text-gray-400 text-sm">Automáticos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gradient mb-2">Rankings</p>
              <p className="text-gray-400 text-sm">En tiempo real</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gradient mb-2">Reservas</p>
              <p className="text-gray-400 text-sm">De canchas online</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gradient mb-2">Torneos</p>
              <p className="text-gray-400 text-sm">Simples de organizar</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
