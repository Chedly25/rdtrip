/**
 * Enhanced Animations and Micro-interactions Module
 * Adds polished UI effects and smooth transitions
 */

export class AnimationController {
    constructor() {
        this.observers = new Map();
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.initializeAnimations();
    }

    /**
     * Initialize all animation systems
     */
    initializeAnimations() {
        if (!this.isReducedMotion) {
            this.setupIntersectionObservers();
            this.setupScrollAnimations();
            this.setupHoverEffects();
            this.setupClickRipples();
            this.setupParallaxEffects();
            this.setupCardAnimations();
        }
        
        this.setupAccessibilityAnimations();
    }

    /**
     * Setup intersection observers for scroll-triggered animations
     */
    setupIntersectionObservers() {
        // Fade in animation observer
        const fadeInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    fadeInObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Slide in animation observer
        const slideInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-in');
                    slideInObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '30px'
        });

        // Stagger animation observer
        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('animate-stagger-in');
                        }, index * 100);
                    });
                    staggerObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        // Store observers for cleanup
        this.observers.set('fadeIn', fadeInObserver);
        this.observers.set('slideIn', slideInObserver);
        this.observers.set('stagger', staggerObserver);

        // Apply observers to elements
        this.observeElements();
    }

    /**
     * Apply observers to DOM elements
     */
    observeElements() {
        // Fade in animations
        document.querySelectorAll('.control-group, .route-info, .ai-results').forEach(el => {
            el.classList.add('will-animate-fade');
            this.observers.get('fadeIn').observe(el);
        });

        // Slide in animations
        document.querySelectorAll('.stop-card').forEach(el => {
            el.classList.add('will-animate-slide');
            this.observers.get('slideIn').observe(el);
        });

        // Stagger animations
        document.querySelectorAll('.theme-selector, .export-buttons').forEach(el => {
            el.classList.add('will-animate-stagger');
            this.observers.get('stagger').observe(el);
        });
    }

    /**
     * Setup smooth scroll animations
     */
    setupScrollAnimations() {
        let ticking = false;

        const updateScrollAnimations = () => {
            const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            
            // Parallax effect for header
            const header = document.querySelector('.header');
            if (header) {
                const translateY = scrollPercent * 50;
                header.style.transform = `translateY(${translateY}px)`;
            }

            // Update background particles
            const body = document.body;
            if (body) {
                const rotation = scrollPercent * 360;
                body.style.setProperty('--scroll-rotation', `${rotation}deg`);
            }

            ticking = false;
        };

        const requestScrollUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }

    /**
     * Setup advanced hover effects
     */
    setupHoverEffects() {
        // Enhanced button hover effects
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.btn, .theme-button, .autocomplete-item')) {
                this.createHoverGlow(e.target);
            }
        });

        // Card tilt effects
        document.addEventListener('mousemove', (e) => {
            if (e.target.closest('.trip-type-card')) {
                this.createTiltEffect(e.target.closest('.trip-type-card'), e);
            }
        });

        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.matches && e.target.matches('.trip-type-card')) {
                e.target.style.transform = '';
            }
        });
    }

    /**
     * Create hover glow effect
     */
    createHoverGlow(element) {
        if (element.querySelector('.hover-glow')) return;

        const glow = document.createElement('div');
        glow.className = 'hover-glow';
        glow.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #667eea, #764ba2, #00c9ff);
            border-radius: inherit;
            z-index: -1;
            opacity: 0;
            filter: blur(8px);
            transition: opacity 0.3s ease;
        `;

        element.style.position = 'relative';
        element.appendChild(glow);

        // Animate glow
        setTimeout(() => {
            glow.style.opacity = '0.7';
        }, 10);

        // Remove glow after animation
        setTimeout(() => {
            if (glow.parentNode) {
                glow.style.opacity = '0';
                setTimeout(() => glow.remove(), 300);
            }
        }, 2000);
    }

    /**
     * Create tilt effect for cards
     */
    createTiltEffect(card, event) {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (event.clientX - centerX) / (rect.width / 2);
        const deltaY = (event.clientY - centerY) / (rect.height / 2);
        
        const rotateX = deltaY * 5;
        const rotateY = deltaX * 5;
        
        card.style.transform = `
            perspective(1000px)
            rotateX(${-rotateX}deg)
            rotateY(${rotateY}deg)
            translateZ(20px)
            scale(1.02)
        `;
    }

    /**
     * Setup click ripple effects
     */
    setupClickRipples() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, .theme-button, .select-trip-btn')) {
                this.createRippleEffect(e.target, e);
            }
        });
    }

    /**
     * Create ripple effect on click
     */
    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 10;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Setup parallax effects
     */
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        const updateParallax = () => {
            const scrollY = window.scrollY;
            
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.parallax) || 0.5;
                const yPos = scrollY * speed;
                element.style.transform = `translateY(${yPos}px)`;
            });
        };

        let parallaxTicking = false;
        const requestParallaxUpdate = () => {
            if (!parallaxTicking) {
                requestAnimationFrame(updateParallax);
                parallaxTicking = true;
                setTimeout(() => { parallaxTicking = false; }, 16);
            }
        };

        window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    }

    /**
     * Setup enhanced card animations
     */
    setupCardAnimations() {
        // Smooth card entrance animations
        const observeNewCards = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches('.stop-card, .trip-type-card')) {
                        this.animateCardEntrance(node);
                    }
                });
            });
        });

        observeNewCards.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Animate card entrance
     */
    animateCardEntrance(card) {
        card.style.cssText += `
            opacity: 0;
            transform: translateY(30px) scale(0.9);
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

        // Trigger animation
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, 50);
    }

    /**
     * Setup accessibility-friendly animations
     */
    setupAccessibilityAnimations() {
        // Focus indicators
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('button, input, [tabindex]')) {
                this.createFocusIndicator(e.target);
            }
        });

        document.addEventListener('focusout', (e) => {
            this.removeFocusIndicator(e.target);
        });

        // Keyboard navigation enhancement
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * Create focus indicator
     */
    createFocusIndicator(element) {
        element.style.outline = '2px solid var(--primary-color)';
        element.style.outlineOffset = '2px';
        element.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.2)';
        element.style.transition = 'box-shadow 0.2s ease';
    }

    /**
     * Remove focus indicator
     */
    removeFocusIndicator(element) {
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.boxShadow = '';
    }

    /**
     * Animate loading states
     */
    animateLoading(element, isLoading = true) {
        if (isLoading) {
            element.classList.add('loading-state');
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
            `;
            element.style.position = 'relative';
            element.appendChild(loadingOverlay);
        } else {
            element.classList.remove('loading-state');
            const overlay = element.querySelector('.loading-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        }
    }

    /**
     * Smooth scroll to element
     */
    smoothScrollTo(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        const startPosition = window.scrollY;
        const distance = elementPosition - startPosition;
        const duration = Math.min(Math.abs(distance) / 2, 1000);
        let startTime = null;

        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);

            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    }

    /**
     * Easing function for smooth animations
     */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    /**
     * Add stagger animation to children elements
     */
    staggerChildren(container, animationClass, delay = 100) {
        const children = Array.from(container.children);
        children.forEach((child, index) => {
            setTimeout(() => {
                child.classList.add(animationClass);
            }, index * delay);
        });
    }

    /**
     * Create floating animation for elements
     */
    createFloatingAnimation(element, duration = 3000, amplitude = 5) {
        let startTime = null;
        const initialY = parseFloat(getComputedStyle(element).transform.split(',')[5]) || 0;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = (elapsed / duration) % 1;
            const y = initialY + Math.sin(progress * Math.PI * 2) * amplitude;
            
            element.style.transform = `translateY(${y}px)`;
            
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    /**
     * Cleanup observers and event listeners
     */
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// CSS Animation Classes (injected dynamically)
const animationStyles = `
    <style>
        /* Keyframe Animations */
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes staggerIn {
            from {
                opacity: 0;
                transform: translateY(15px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Animation Classes */
        .will-animate-fade {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-fade-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }

        .will-animate-slide {
            opacity: 0;
            transform: translateX(-30px);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-slide-in {
            opacity: 1 !important;
            transform: translateX(0) !important;
        }

        .animate-stagger-in {
            animation: staggerIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Loading States */
        .loading-state {
            pointer-events: none;
            opacity: 0.7;
        }

        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 1;
            transition: opacity 0.3s ease;
        }

        .loading-spinner {
            position: relative;
            width: 40px;
            height: 40px;
        }

        .spinner-ring {
            position: absolute;
            width: 32px;
            height: 32px;
            border: 3px solid transparent;
            border-top: 3px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .spinner-ring:nth-child(2) {
            width: 24px;
            height: 24px;
            top: 4px;
            left: 4px;
            border-top-color: var(--secondary-color);
            animation-duration: 0.8s;
            animation-direction: reverse;
        }

        .spinner-ring:nth-child(3) {
            width: 16px;
            height: 16px;
            top: 8px;
            left: 8px;
            border-top-color: var(--accent-color);
            animation-duration: 0.6s;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Keyboard Navigation */
        .keyboard-navigation *:focus {
            outline: 2px solid var(--primary-color) !important;
            outline-offset: 2px !important;
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        }
    </style>
`;

// Inject animation styles
document.head.insertAdjacentHTML('beforeend', animationStyles);

// Export animation controller
export const animationController = new AnimationController();