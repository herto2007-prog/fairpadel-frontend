import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BackgroundEffects } from '../components/ui/BackgroundEffects';
import { ArrowLeft, Mail, Phone, Instagram, Facebook, MapPin } from 'lucide-react';

export default function ContactoPage() {
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
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Contacto
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                ¿Tenés preguntas, sugerencias o querés saber más sobre FairPadel?
                Estamos para ayudarte.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                href="mailto:admin@fairpadel.com"
                className="glass rounded-2xl p-6 md:p-8 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                      Email
                    </h2>
                    <p className="text-gray-400 text-sm mb-2">
                      Escribinos en cualquier momento.
                    </p>
                    <p className="text-primary font-medium">
                      admin@fairpadel.com
                    </p>
                  </div>
                </div>
              </motion.a>

              {/* WhatsApp */}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                href="https://wa.me/595982342473"
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-2xl p-6 md:p-8 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">
                      WhatsApp
                    </h2>
                    <p className="text-gray-400 text-sm mb-2">
                      Respondemos lo antes posible.
                    </p>
                    <p className="text-green-400 font-medium">
                      +595 982 342 473
                    </p>
                  </div>
                </div>
              </motion.a>

              {/* Instagram */}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                href="https://www.instagram.com/fairpadel/"
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-2xl p-6 md:p-8 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">
                      Instagram
                    </h2>
                    <p className="text-gray-400 text-sm mb-2">
                      Seguinos para novedades y torneos.
                    </p>
                    <p className="text-pink-400 font-medium">
                      @fairpadel
                    </p>
                  </div>
                </div>
              </motion.a>

              {/* Facebook */}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                href="https://www.facebook.com/fairpadel"
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-2xl p-6 md:p-8 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Facebook className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      Facebook
                    </h2>
                    <p className="text-gray-400 text-sm mb-2">
                      Enterate de todo en nuestra página.
                    </p>
                    <p className="text-blue-400 font-medium">
                      /fairpadel
                    </p>
                  </div>
                </div>
              </motion.a>
            </div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 glass rounded-2xl p-6 md:p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                Ubicación
              </h2>
              <p className="text-gray-400">
                Asunción, Paraguay
              </p>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
