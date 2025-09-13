/**
 * Performance Utilities - Optimization helpers for better performance
 */

export class PerformanceUtils {
    constructor() {
        this.observers = new Map();
        this.throttleTimers = new Map();
        this.rafQueue = new Set();
    }

    /**
     * Throttle function execution
     */
    throttle(key, fn, delay = 16) {
        if (this.throttleTimers.has(key)) {
            clearTimeout(this.throttleTimers.get(key));
        }
        
        const timeoutId = setTimeout(() => {
            fn();
            this.throttleTimers.delete(key);
        }, delay);
        
        this.throttleTimers.set(key, timeoutId);
    }

    /**
     * Debounce function execution
     */
    debounce(key, fn, delay = 200) {
        if (this.throttleTimers.has(key)) {
            clearTimeout(this.throttleTimers.get(key));
        }
        
        const timeoutId = setTimeout(() => {
            fn();
            this.throttleTimers.delete(key);
        }, delay);
        
        this.throttleTimers.set(key, timeoutId);
    }

    /**
     * Queue function for next animation frame
     */
    requestAnimationFrame(key, fn) {
        if (this.rafQueue.has(key)) {
            return; // Already queued
        }
        
        this.rafQueue.add(key);
        requestAnimationFrame(() => {
            fn();
            this.rafQueue.delete(key);
        });
    }

    /**
     * Lazy load maps using Intersection Observer
     */
    lazyLoadMap(element, initFunction) {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            setTimeout(() => initFunction(), 100);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add small delay to prevent multiple maps initializing at once
                    setTimeout(() => initFunction(), Math.random() * 200);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px' // Start loading when element is 50px from viewport
        });

        observer.observe(element);
        this.observers.set(element, observer);
    }

    /**
     * Optimize DOM batch operations
     */
    batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            // Hide elements to prevent reflows during updates
            const elementsToHide = [];
            updates.forEach(update => {
                if (update.element && update.element.style) {
                    elementsToHide.push({
                        element: update.element,
                        originalVisibility: update.element.style.visibility
                    });
                    update.element.style.visibility = 'hidden';
                }
            });

            // Apply all updates
            updates.forEach(update => {
                try {
                    update.fn();
                } catch (error) {
                    console.warn('Batch update failed:', error);
                }
            });

            // Restore visibility
            requestAnimationFrame(() => {
                elementsToHide.forEach(({ element, originalVisibility }) => {
                    element.style.visibility = originalVisibility || '';
                });
            });
        });
    }

    /**
     * Create optimized progress bar update function
     */
    createProgressUpdater(element) {
        let lastValue = 0;
        
        return (value) => {
            // Skip update if value hasn't changed significantly
            if (Math.abs(value - lastValue) < 1) return;
            
            this.requestAnimationFrame(`progress-${element.id}`, () => {
                if (element && element.style) {
                    element.style.transform = `scaleX(${value / 100})`;
                    element.style.transformOrigin = 'left center';
                    lastValue = value;
                }
            });
        };
    }

    /**
     * Preload images for better performance
     */
    preloadImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    /**
     * Memory cleanup
     */
    cleanup() {
        // Clear all timers
        this.throttleTimers.forEach(timerId => clearTimeout(timerId));
        this.throttleTimers.clear();
        
        // Clear RAF queue
        this.rafQueue.clear();
        
        // Disconnect observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }

    /**
     * Monitor performance and log slow operations
     */
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        const duration = end - start;
        if (duration > 16) { // Longer than one frame
            console.warn(`Slow operation "${name}": ${duration.toFixed(2)}ms`);
        }
        
        return result;
    }

    /**
     * Create optimized event listener with passive option
     */
    addOptimizedEventListener(element, event, handler, options = {}) {
        const optimizedOptions = {
            passive: true,
            ...options
        };
        
        element.addEventListener(event, handler, optimizedOptions);
        
        return () => element.removeEventListener(event, handler, optimizedOptions);
    }

    /**
     * Virtual scrolling helper for large lists
     */
    createVirtualList(container, items, renderItem, itemHeight = 50) {
        const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
        let scrollTop = 0;
        let startIndex = 0;
        
        const updateList = () => {
            startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + visibleItems, items.length);
            
            const fragment = document.createDocumentFragment();
            
            // Add spacer for items above visible area
            if (startIndex > 0) {
                const spacer = document.createElement('div');
                spacer.style.height = `${startIndex * itemHeight}px`;
                fragment.appendChild(spacer);
            }
            
            // Render visible items
            for (let i = startIndex; i < endIndex; i++) {
                const itemElement = renderItem(items[i], i);
                fragment.appendChild(itemElement);
            }
            
            // Add spacer for items below visible area
            const remainingItems = items.length - endIndex;
            if (remainingItems > 0) {
                const spacer = document.createElement('div');
                spacer.style.height = `${remainingItems * itemHeight}px`;
                fragment.appendChild(spacer);
            }
            
            container.innerHTML = '';
            container.appendChild(fragment);
        };
        
        const handleScroll = this.throttle('virtual-scroll', () => {
            scrollTop = container.scrollTop;
            updateList();
        }, 16);
        
        container.addEventListener('scroll', handleScroll, { passive: true });
        updateList();
        
        return {
            update: updateList,
            destroy: () => container.removeEventListener('scroll', handleScroll)
        };
    }
}

// Create singleton instance
export const performanceUtils = new PerformanceUtils();

// Auto cleanup on page unload
window.addEventListener('beforeunload', () => {
    performanceUtils.cleanup();
});