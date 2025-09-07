import { UIController } from './uiController.js';

/**
 * Main Application Entry Point
 * Initializes the road trip planner when DOM is loaded
 */

class RoadTripApp {
    constructor() {
        this.uiController = null;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Road Trip Planner...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Check if required dependencies are loaded
            this.checkDependencies();
            
            // Wait a bit for all resources to load
            await this.delay(100);
            
            // Initialize UI controller
            this.uiController = new UIController();
            await this.uiController.init();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('Road Trip Planner loaded successfully!');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.hideLoadingScreen();
            this.showInitializationError(error);
        }
    }
    
    /**
     * Simple delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    /**
     * Check if all required dependencies are available
     */
    checkDependencies() {
        const requiredGlobals = ['L']; // Leaflet
        const missing = requiredGlobals.filter(global => typeof window[global] === 'undefined');
        
        if (missing.length > 0) {
            throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
        }
    }
    
    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Show user-friendly error for API-related issues
            if (event.reason && event.reason.message) {
                const message = event.reason.message;
                if (message.includes('API') || message.includes('fetch')) {
                    this.showUserError('Network error: Please check your internet connection and API key.');
                }
            }
        });
        
        // Handle general JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            
            // Don't show every error to users, just log them
            if (event.error && event.error.stack) {
                console.error('Stack trace:', event.error.stack);
            }
        });
    }
    
    /**
     * Show initialization error to user
     */
    showInitializationError(error) {
        const errorHtml = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: #fee; border: 2px solid #c33; border-radius: 8px; 
                        padding: 2rem; max-width: 500px; text-align: center; z-index: 10000;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h2 style="color: #c33; margin-bottom: 1rem;">Failed to Load Application</h2>
                <p style="margin-bottom: 1rem; color: #666;">
                    ${error.message || 'An unexpected error occurred while loading the road trip planner.'}
                </p>
                <button onclick="window.location.reload()" 
                        style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; 
                               border-radius: 6px; cursor: pointer; font-size: 1rem;">
                    Reload Page
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHtml);
    }
    
    /**
     * Show user-friendly error message
     */
    showUserError(message) {
        // Create or update error notification
        let notification = document.getElementById('error-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'error-notification';
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                background: #fee; color: #c33; padding: 1rem 1.5rem;
                border-radius: 6px; border-left: 4px solid #c33;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 400px; font-size: 0.9rem;
                transform: translateX(100%); transition: transform 0.3s ease;
            `;
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        
        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Global app instance for cleanup
window.roadTripApp = null;

// Cleanup any existing instance
function cleanupExistingApp() {
    if (window.roadTripApp && window.roadTripApp.uiController) {
        window.roadTripApp.uiController.cleanup();
    }
}

// Initialize app function
async function initializeApp() {
    try {
        cleanupExistingApp();
        window.roadTripApp = new RoadTripApp();
        await window.roadTripApp.init();
    } catch (error) {
        console.error('App initialization failed:', error);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Also handle the case where DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, event listener will handle it
} else {
    // DOM is already loaded
    initializeApp();
}