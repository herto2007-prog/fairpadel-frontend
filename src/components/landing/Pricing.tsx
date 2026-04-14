import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { FadeIn } from './AnimatedSection';

const plans = [
  {
    name: 'Jugador',
    icon: Zap,
    price: '0',
    period: 'para siempre',
    description: 'Para jugadores que quieren competir y conectar',
    features: [
      'Participar en torneos ilimitados',
      'Perfil con estadísticas y logros',
      'Comunidad de jugadores',
      'Seguir amigos y rivales',
      'Notificaciones de torneos y resultados',
    ],
    cta: 'Unirme a la comunidad',
    ctaLink: 'https://www.fairpadel.com/register',
    popular: false,
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    name: 'Organizador',
    icon: Star,
    price: '10.000',
    period: 'por jugador inscripto',
    description: 'Para quienes organizan torneos de pádel',
    features: [
      'Torneos ilimitados',
      'Equipos ilimitados',
      'Fixture con acomodación paraguaya',
      'Rankings avanzados + estadísticas',
      'Pagos online con Bancard',
      'Notificaciones push/WhatsApp',
      'Soporte prioritario',
    ],
    cta: 'Organizar Torneos',
    ctaLink: 'https://wa.me/595982342473?text=Hola%20FairPadel!%20Me%20interesa%20organizar%20torneos%20con%20ustedes.',
    popular: true,
    gradient: 'from-primary to-red-600',
  },
  {
    name: 'Sede',
    icon: Crown,
    price: '60.000',
    period: 'Gs/mes por sede',
    description: 'Para clubes y sedes que alquilan canchas',
    features: [
      'Gestión de múltiples canchas',
      'Sistema de alquileres integrado',
      'Panel de administración de reservas',
      'Reportes financieros',
      'Instructores integrados',
      'Soporte dedicado 24/7',
    ],
    cta: 'Empezar como Sede',
    ctaLink: 'https://wa.me/595982342473?text=Hola%20FairPadel!%20Tengo%20un%20complejo%20de%20p%C3%A1del%20y%20quiero%20saber%20m%C3%A1s%20sobre%20el%20sistema%20de%20reservas.',
    popular: false,
    gradient: 'from-amber-500 to-orange-600',
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-4"
          >
            Precios
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-lg text-white mb-6"
          >
            Una plataforma para cada necesidad{' '}
            <span className="text-gradient">sin complicaciones</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-body text-lg"
          >
            Jugadores disfrutan gratis, organizadores pagan por uso y las sedes gestionan sus canchas con un costo fijo mensual.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.15}>
              <motion.div
                whileHover={{ y: -10 }}
                className={`relative rounded-2xl overflow-hidden ${
                  plan.popular ? 'lg:-mt-4 lg:mb-4' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-red-600 text-white text-center py-2 text-sm font-semibold z-10">
                    Más Popular • 70% eligen este
                  </div>
                )}

                <div className={`glass rounded-2xl p-8 h-full ${
                  plan.popular ? 'pt-14 border-2 border-primary/50' : 'border border-dark-200'
                }`}>
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <plan.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-gray-400 text-lg">Gs.</span>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                    </div>
                    <span className="text-gray-500 text-sm">/{plan.period}</span>
                    {plan.name === 'Organizador' && (
                      <p className="text-xs text-gray-500 mt-1">Pagás solo al finalizar el torneo</p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <motion.a
                    href={plan.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold text-center block mb-8 transition-all duration-300 ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25'
                        : 'bg-dark-100 hover:bg-dark-200 text-white border border-dark-200'
                    }`}
                  >
                    {plan.cta}
                  </motion.a>

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'bg-primary/20' : 'bg-dark-200'
                        }`}>
                          <Check className={`w-3 h-3 ${plan.popular ? 'text-primary' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Sin tarjeta de crédito para empezar</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Organizadores pagan solo si hay torneo</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Sedes pueden cancelar cuando quieran</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Soporte en español</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
