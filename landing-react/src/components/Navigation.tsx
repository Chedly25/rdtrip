import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { AuthButton } from './auth/AuthButton'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 shadow-lg backdrop-blur-md'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <motion.a
          href="/"
          className={`text-2xl font-bold transition-colors ${
            isScrolled
              ? 'text-slate-900'
              : 'text-white'
          }`}
          whileHover={{ scale: 1.05 }}
        >
          RoadTrip
        </motion.a>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollToSection('route-form')}
            className={`font-medium transition-colors hover:text-slate-900 ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`}
          >
            Plan Route
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className={`font-medium transition-colors hover:text-slate-900 ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className={`font-medium transition-colors hover:text-slate-900 ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`}
          >
            About
          </button>
          <AuthButton />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`md:hidden ${isScrolled ? 'text-gray-700' : 'text-white'}`}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white shadow-lg md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-4 px-4 py-6">
              <button
                onClick={() => scrollToSection('route-form')}
                className="text-left font-medium text-gray-700 hover:text-slate-900"
              >
                Plan Route
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left font-medium text-gray-700 hover:text-slate-900"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left font-medium text-gray-700 hover:text-slate-900"
              >
                About
              </button>
              <div className="pt-2">
                <AuthButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
