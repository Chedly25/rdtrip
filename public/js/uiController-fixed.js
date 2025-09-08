import { RouteCalculator } from './routeCalculator.js';
import { aiFeatures } from './aiFeatures.js';
import { TripTypesManager } from './tripTypes.js';
import { animationController } from './animations.js';
import { ParallelAgentSystem } from './parallelAgents.js';

/**
 * UI Controller - Manages all user interface interactions and map display
 */
export class UIController {
    constructor() {
        this.map = null;
        this.routeLayer = null;
        this.markersLayer = null;
        this.currentRoute = null;
        this.selectedTheme = 'balanced';
        this.routeCalculator = new RouteCalculator();
        this.parallelAgents = new ParallelAgentSystem(this.routeCalculator, aiFeatures);
        this.tripTypesManager = new TripTypesManager(this.routeCalculator, aiFeatures);
        this.agentResults = new Map();
        
        // Performance optimizations - Cache DOM elements
        this.domCache = new Map();
        this.eventListenerCache = new Map();
        this.updateThrottlers = new Map();
        
        // Bind methods to maintain context
        this.calculateRoute = this.calculateRoute.bind(this);
        this.removeStop = this.removeStop.bind(this);
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Wait for DOM to be fully ready
            await this.waitForDOM();
            
            // Cache frequently accessed DOM elements
            this.cacheDOMElements();
            
            // Skip main map initialization since we removed it
            this.setupEventListeners();
            this.setupAutocomplete();
            
            console.log('Road Trip Planner initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            throw error;
        }
    }
    
    /**
     * Wait for DOM elements to be ready
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.getElementById('destination')) {
                resolve();
            } else {
                setTimeout(() => resolve(this.waitForDOM()), 50);
            }
        });
    }
    
    /**
     * Cache frequently accessed DOM elements for performance
     */
    cacheDOMElements() {
        const elements = {
            destination: document.getElementById('destination'),
            autocomplete: document.getElementById('autocomplete'),
            calculateBtn: document.getElementById('calculate-btn'),
            routeInfo: document.getElementById('route-info'),
            stopsList: document.getElementById('stops-list'),
            totalDistance: document.getElementById('total-distance'),
            totalTime: document.getElementById('total-time'),
            totalStops: document.getElementById('total-stops'),
            aiResults: document.getElementById('ai-results'),
            aiTitle: document.getElementById('ai-title'),
            aiContent: document.getElementById('ai-content'),
            agentsLoadingModal: document.getElementById('agents-loading-modal'),
            overallProgressFill: document.getElementById('overall-progress-fill'),
            overallProgressCount: document.getElementById('overall-progress-count'),
            agentsResultsPage: document.getElementById('agents-results-page'),
            agentsResultsGrid: document.getElementById('agents-results-grid'),
            routeSpotlightPage: document.getElementById('route-spotlight-page')
        };
        
        Object.entries(elements).forEach(([key, element]) => {
            if (element) this.domCache.set(key, element);
        });
    }
    
    /**
     * Get cached DOM element
     */
    getCachedElement(key) {
        return this.domCache.get(key) || document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
    }

    /**
     * Throttle function to prevent excessive DOM updates
     */
    throttle(key, fn, delay = 50) {
        if (this.updateThrottlers.has(key)) {
            clearTimeout(this.updateThrottlers.get(key));
        }
        
        const timeoutId = setTimeout(fn, delay);
        this.updateThrottlers.set(key, timeoutId);
    }

    /**
     * Cleanup method for proper resource disposal
     */
    cleanup() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        // Clear cached DOM elements
        this.domCache.clear();
        
        // Clear event listener cache
        this.eventListenerCache.forEach((listener, element) => {
            if (element && listener) {
                element.removeEventListener(listener.type, listener.fn);
            }
        });
        this.eventListenerCache.clear();
        
        // Clear throttlers
        this.updateThrottlers.clear();
        
        // Main map container was removed, no cleanup needed for it
        
        // Cleanup animation controller
        if (animationController) {
            animationController.cleanup();
        }
        
        this.routeLayer = null;
        this.markersLayer = null;
        this.currentRoute = null;
    }
    
    /**
     * Initialize Leaflet map (main map removed - this method is no longer used)
     */
    initializeMap() {
        // Main map was removed for better performance
        // Maps are now only created in spotlight view and agent results
        console.log('Main map initialization skipped - using dedicated maps instead');
        return;
    }
    
    /**
     * Add starting point marker to map (deprecated - main map removed)
     */
    addStartingPointMarker() {
        // No longer needed since main map was removed
        console.log('Starting point marker not needed - main map removed');
    }