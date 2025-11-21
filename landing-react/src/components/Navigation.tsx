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
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-smooth ${
        isScrolled
          ? 'bg-white/90 shadow-sm border-b border-gray-200/50'
          : 'bg-transparent'
      } backdrop-blur-xl`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <motion.a
          href="/"
          className={`text-xl font-bold tracking-tight transition-colors duration-200 ${
            isScrolled
              ? 'text-gray-900'
              : 'text-gray-900'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          RoadTrip
        </motion.a>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-2 md:flex">
          <NavItem
            onClick={() => scrollToSection('route-form')}
            isScrolled={isScrolled}
          >
            Plan Route
          </NavItem>
          <NavItem
            href="/marketplace"
            isScrolled={isScrolled}
          >
            Marketplace
          </NavItem>
          <NavItem
            onClick={() => scrollToSection('features')}
            isScrolled={isScrolled}
          >
            Features
          </NavItem>
          <NavItem
            onClick={() => scrollToSection('about')}
            isScrolled={isScrolled}
          >
            About
          </NavItem>
          <div className="ml-4">
            <AuthButton isScrolled={isScrolled} />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            isScrolled
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-900 hover:bg-white/10'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-1 px-6 py-4">
              <MobileNavItem
                onClick={() => scrollToSection('route-form')}
              >
                Plan Route
              </MobileNavItem>
              <MobileNavItem href="/marketplace">
                Marketplace
              </MobileNavItem>
              <MobileNavItem
                onClick={() => scrollToSection('features')}
              >
                Features
              </MobileNavItem>
              <MobileNavItem
                onClick={() => scrollToSection('about')}
              >
                About
              </MobileNavItem>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <AuthButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// Desktop Navigation Item with pill hover
function NavItem({
  children,
  onClick,
  href,
  isScrolled
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  isScrolled: boolean
}) {
  const Element = href ? 'a' : 'button'

  return (
    <Element
      onClick={onClick}
      href={href}
      className={`
        relative px-4 py-2
        text-sm font-medium
        transition-all duration-200 ease-smooth
        rounded-full
        ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}
        before:absolute before:inset-0
        before:bg-gray-100 before:rounded-full
        before:scale-0
        hover:before:scale-100
        before:transition-transform before:duration-300 before:ease-smooth
        before:-z-10
      `}
    >
      {children}
    </Element>
  )
}

// Mobile Navigation Item
function MobileNavItem({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
}) {
  const Element = href ? 'a' : 'button'

  return (
    <Element
      onClick={onClick}
      href={href}
      className="
        text-left px-4 py-3
        text-base font-medium
        text-gray-700 hover:text-gray-900
        hover:bg-gray-100
        rounded-xl
        transition-all duration-200 ease-smooth
      "
    >
      {children}
    </Element>
  )
}
