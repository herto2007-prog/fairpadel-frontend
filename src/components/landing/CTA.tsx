import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FadeIn } from './AnimatedSection';

export const CTA = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto section-padding">
        <FadeIn>
          <div className="glass rounded-3xl p-8 md:p-16 text-center border border-primary/30 glow-primary">
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Empezá hoy mismo</span>
            </motion.div>

            {/* Headline */}
            <h2 className="heading-lg text-white mb-6">
              El pádel paraguayo{' '}
              <span className="text-gradient">ya está acá</span>
            </h2>

            {/* Subheadline */}
            <p className="text-body text-lg mb-10 max-w-2xl mx-auto">
              Creá tu cuenta gratis: inscribite a un torneo, organizá el tuyo
              o reservá una cancha. Todo en minutos.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/register"
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Crear Mi Cuenta Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <motion.a
                href="https://wa.me/595982342473"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Hablar por WhatsApp
              </motion.a>
            </div>

            {/* Trust Text */}
            <p className="mt-8 text-gray-500 text-sm">
              ✓ Cuenta gratis en 2 minutos • ✓ Sin tarjeta de crédito • ✓ Soporte en español
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
