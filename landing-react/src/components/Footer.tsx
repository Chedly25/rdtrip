import { motion } from 'framer-motion'
import { MapPin, Mail, Github, Twitter, Linkedin, Heart } from 'lucide-react'

const navigation = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#about' },
    { name: 'Plan Route', href: '#route-form' },
    { name: 'Pricing', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
    { name: 'GDPR', href: '#' },
  ],
  social: [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
  ],
}

export function Footer() {
  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.slice(1))
      element?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold text-white">RoadTrip</span>
              </div>
              <p className="mb-6 max-w-sm text-gray-400">
                AI-powered route planning for unforgettable adventures. Plan
                smarter, travel better, and discover the world your way.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:hello@roadtrip.com"
                  className="hover:text-purple-400 transition-colors"
                >
                  hello@roadtrip.com
                </a>
              </div>
            </motion.div>
          </div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Product
            </h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="text-gray-400 transition-colors hover:text-purple-400"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="text-gray-400 transition-colors hover:text-purple-400"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-400 transition-colors hover:text-purple-400"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12"
        >
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-gray-500">
            Powered By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {/* Perplexity AI */}
            <div className="group flex items-center gap-2 rounded-lg bg-gray-800/50 px-6 py-3 transition-all hover:bg-gray-800">
              <svg className="h-6 w-6 text-gray-400 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              <span className="text-sm font-semibold text-gray-400 transition-colors group-hover:text-white">
                Perplexity AI
              </span>
            </div>

            {/* Mapbox */}
            <div className="group flex items-center gap-2 rounded-lg bg-gray-800/50 px-6 py-3 transition-all hover:bg-gray-800">
              <svg className="h-6 w-6 text-gray-400 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-sm font-semibold text-gray-400 transition-colors group-hover:text-white">
                Mapbox
              </span>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-800" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-1 text-sm text-gray-400"
          >
            <span>© 2024 RoadTrip. Made with</span>
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span>for travelers</span>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            {navigation.social.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 transition-colors hover:text-purple-400"
                  aria-label={item.name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              )
            })}
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
