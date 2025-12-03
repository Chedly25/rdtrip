import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { AuthButton } from './auth/AuthButton'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <motion.header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-rui-md ease-rui-default ${
          isScrolled
            ? 'bg-rui-white/80 backdrop-blur-xl shadow-rui-1 border-b border-rui-grey-10'
            : 'bg-transparent'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: ruiEasing }}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2 transition-opacity duration-rui-sm hover:opacity-80"
          >
            <img
              src="/logos/primary_horizontal_logo.png"
              alt="Waycraft"
              className="h-8 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            <NavLink onClick={() => scrollToSection('route-form')}>
              Plan Route
            </NavLink>
            <NavLink href="/marketplace">
              Marketplace
            </NavLink>
            <NavLink onClick={() => scrollToSection('features')}>
              Features
            </NavLink>
            <NavLink onClick={() => scrollToSection('about')}>
              About
            </NavLink>
          </div>

          {/* Right side - Auth */}
          <div className="hidden items-center gap-3 md:flex">
            <AuthButton isScrolled={isScrolled} />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-rui-12 text-rui-black transition-colors duration-rui-sm hover:bg-rui-grey-5 md:hidden"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2, ease: ruiEasing }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2, ease: ruiEasing }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-rui-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: ruiEasing }}
              className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-rui-24 bg-rui-white shadow-rui-4 md:hidden"
            >
              <div className="flex flex-col p-4">
                <MobileNavLink onClick={() => scrollToSection('route-form')}>
                  Plan Route
                </MobileNavLink>
                <MobileNavLink href="/marketplace">
                  Marketplace
                </MobileNavLink>
                <MobileNavLink onClick={() => scrollToSection('features')}>
                  Features
                </MobileNavLink>
                <MobileNavLink onClick={() => scrollToSection('about')}>
                  About
                </MobileNavLink>

                <div className="mt-4 border-t border-rui-grey-10 pt-4">
                  <AuthButton />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Desktop nav link with Revolut-style state layer
function NavLink({
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
      className="group relative px-4 py-2 text-sm font-medium text-rui-grey-50 transition-colors duration-rui-sm hover:text-rui-black"
    >
      {/* State layer */}
      <span className="absolute inset-0 rounded-rui-8 bg-rui-grey-5 opacity-0 transition-opacity duration-rui-sm group-hover:opacity-100" />
      <span className="relative">{children}</span>
    </Element>
  )
}

// Mobile nav link
function MobileNavLink({
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
      className="flex w-full items-center rounded-rui-12 px-4 py-3 text-left text-base font-medium text-rui-black transition-colors duration-rui-sm hover:bg-rui-grey-5"
    >
      {children}
    </Element>
  )
}
