import { motion } from 'framer-motion'
import { Mail, Github, Twitter, Linkedin, Heart } from 'lucide-react'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

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
    <footer className="bg-rui-black text-rui-grey-20">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: ruiEasing }}
            >
              <div className="mb-4">
                <span className="font-marketing text-2xl text-rui-white">RoadTrip</span>
              </div>
              <p className="mb-6 max-w-sm text-body-2 text-rui-grey-50">
                AI-powered route planning for unforgettable adventures. Plan
                smarter, travel better, and discover the world your way.
              </p>
              <div className="flex items-center gap-2 text-sm text-rui-grey-50">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:hello@roadtrip.com"
                  className="transition-colors duration-rui-sm hover:text-rui-white"
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
            transition={{ duration: 0.5, delay: 0.1, ease: ruiEasing }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-rui-grey-50">
              Product
            </h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="text-sm text-rui-grey-20 transition-colors duration-rui-sm hover:text-rui-white"
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
            transition={{ duration: 0.5, delay: 0.2, ease: ruiEasing }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-rui-grey-50">
              Company
            </h3>
            <ul className="space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="text-sm text-rui-grey-20 transition-colors duration-rui-sm hover:text-rui-white"
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
            transition={{ duration: 0.5, delay: 0.3, ease: ruiEasing }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-rui-grey-50">
              Legal
            </h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-rui-grey-20 transition-colors duration-rui-sm hover:text-rui-white"
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
          transition={{ duration: 0.5, delay: 0.4, ease: ruiEasing }}
          className="mt-16"
        >
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-rui-grey-50">
            Powered By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Perplexity AI */}
            <div className="group flex items-center gap-2 rounded-rui-12 bg-rui-white/5 px-5 py-3 transition-all duration-rui-sm hover:bg-rui-white/10">
              <svg className="h-5 w-5 text-rui-grey-50 transition-colors duration-rui-sm group-hover:text-rui-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              <span className="text-sm font-medium text-rui-grey-50 transition-colors duration-rui-sm group-hover:text-rui-white">
                Perplexity AI
              </span>
            </div>

            {/* Mapbox */}
            <div className="group flex items-center gap-2 rounded-rui-12 bg-rui-white/5 px-5 py-3 transition-all duration-rui-sm hover:bg-rui-white/10">
              <svg className="h-5 w-5 text-rui-grey-50 transition-colors duration-rui-sm group-hover:text-rui-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-sm font-medium text-rui-grey-50 transition-colors duration-rui-sm group-hover:text-rui-white">
                Mapbox
              </span>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="my-10 border-t border-rui-white/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: ruiEasing }}
            className="flex items-center gap-1 text-sm text-rui-grey-50"
          >
            <span>2024 RoadTrip. Made with</span>
            <Heart className="h-4 w-4 fill-danger text-danger" />
            <span>for travelers</span>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: ruiEasing }}
            className="flex items-center gap-2"
          >
            {navigation.social.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex h-10 w-10 items-center justify-center rounded-rui-8 text-rui-grey-50 transition-all duration-rui-sm hover:bg-rui-white/10 hover:text-rui-white"
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
