/**
 * IdeasBoardContext - Collects all agent recommendations for later action
 *
 * This context stores "ideas" from agent tool results:
 * - Activities from searchActivities
 * - Hotels from searchHotels
 * - Places from mentionPlace
 *
 * Users can later:
 * - Add ideas to their trip
 * - Save favorites
 * - Dismiss/skip ideas
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================

export type IdeaCategory = 'activity' | 'restaurant' | 'hotel' | 'attraction' | 'place';

export interface Idea {
  id: string;
  category: IdeaCategory;
  name: string;
  photo?: string;
  rating?: number;
  userRatingsTotal?: number;
  address?: string;
  vicinity?: string;
  priceLevel?: number;
  types?: string[];
  isOpen?: boolean;
  city?: string;
  lat?: number;
  lng?: number;
  placeId?: string;

  // Metadata
  addedAt: Date;
  source: string; // Tool that created this: 'searchActivities', 'mentionPlace', etc.

  // User actions
  status: 'pending' | 'saved' | 'added' | 'skipped';
  savedAt?: Date;
  addedToDay?: number;
}

export interface IdeasBoardContextValue {
  // State
  ideas: Idea[];
  savedIdeas: Idea[];
  pendingIdeas: Idea[];

  // Stats
  totalCount: number;
  pendingCount: number;
  savedCount: number;

  // Actions
  addIdea: (idea: Omit<Idea, 'id' | 'addedAt' | 'status'>) => void;
  addIdeas: (ideas: Array<Omit<Idea, 'id' | 'addedAt' | 'status'>>) => void;
  saveIdea: (id: string) => void;
  skipIdea: (id: string) => void;
  markAsAdded: (id: string, dayNumber: number) => void;
  restoreIdea: (id: string) => void;
  clearAll: () => void;

  // Panel state
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

// ==================== CONTEXT ====================

const IdeasBoardContext = createContext<IdeasBoardContextValue | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'rdtrip_ideas_board';

// ==================== PROVIDER ====================

interface IdeasBoardProviderProps {
  children: React.ReactNode;
}

export function IdeasBoardProvider({ children }: IdeasBoardProviderProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Rehydrate dates
        const rehydrated = parsed.map((idea: any) => ({
          ...idea,
          addedAt: new Date(idea.addedAt),
          savedAt: idea.savedAt ? new Date(idea.savedAt) : undefined,
        }));
        setIdeas(rehydrated);
        console.log(`📋 [IdeasBoard] Loaded ${rehydrated.length} ideas from storage`);
      }
    } catch (error) {
      console.warn('Failed to load ideas from storage:', error);
    }
  }, []);

  // Save to localStorage when ideas change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
    } catch (error) {
      console.warn('Failed to save ideas to storage:', error);
    }
  }, [ideas]);

  // Listen for tool_execution events to capture recommendations
  useEffect(() => {
    const handleToolExecution = (event: CustomEvent) => {
      const { tools } = event.detail || {};
      if (!tools) return;

      for (const tool of tools) {
        try {
          const content = typeof tool.content === 'string'
            ? JSON.parse(tool.content)
            : tool.content;

          // Handle searchActivities results
          if (tool.name === 'searchActivities' && content.success && content.activities) {
            const newIdeas = content.activities.map((activity: any) => ({
              category: detectCategory(activity.types),
              name: activity.name,
              photo: activity.photo,
              rating: activity.rating,
              userRatingsTotal: activity.userRatingsTotal,
              address: activity.address,
              vicinity: activity.vicinity,
              priceLevel: activity.priceLevel,
              types: activity.types,
              isOpen: activity.isOpen,
              city: content.city,
              lat: activity.lat,
              lng: activity.lng,
              placeId: activity.placeId,
              source: 'searchActivities',
            }));

            addIdeasBatch(newIdeas);
            console.log(`📋 [IdeasBoard] Added ${newIdeas.length} activities from searchActivities`);
          }

          // Handle searchHotels results
          if (tool.name === 'searchHotels' && content.success && content.hotels) {
            const newIdeas = content.hotels.map((hotel: any) => ({
              category: 'hotel' as IdeaCategory,
              name: hotel.name,
              photo: hotel.photo,
              rating: hotel.rating,
              userRatingsTotal: hotel.userRatingsTotal,
              address: hotel.address,
              priceLevel: hotel.priceLevel,
              city: content.city,
              lat: hotel.lat,
              lng: hotel.lng,
              placeId: hotel.placeId,
              source: 'searchHotels',
            }));

            addIdeasBatch(newIdeas);
            console.log(`📋 [IdeasBoard] Added ${newIdeas.length} hotels from searchHotels`);
          }

          // Handle mentionPlace results
          if (tool.name === 'mentionPlace' && content.success && content.place) {
            const place = content.place;
            addIdeaSingle({
              category: detectCategory(place.types),
              name: place.name,
              photo: place.photo,
              rating: place.rating,
              userRatingsTotal: place.userRatingsTotal,
              address: place.address,
              vicinity: place.vicinity,
              priceLevel: place.priceLevel,
              types: place.types,
              isOpen: place.isOpen,
              lat: place.lat,
              lng: place.lng,
              placeId: place.placeId,
              source: 'mentionPlace',
            });
            console.log(`📋 [IdeasBoard] Added place from mentionPlace: ${place.name}`);
          }

        } catch (error) {
          console.warn('Failed to parse tool result for ideas board:', error);
        }
      }
    };

    // Subscribe to custom event from AgentProvider
    window.addEventListener('ideas_board_tool_result', handleToolExecution as EventListener);

    return () => {
      window.removeEventListener('ideas_board_tool_result', handleToolExecution as EventListener);
    };
  }, []);

  // Helper to detect category from types array
  const detectCategory = (types?: string[]): IdeaCategory => {
    if (!types || types.length === 0) return 'place';

    const typeStr = types.join(' ').toLowerCase();

    if (typeStr.includes('restaurant') || typeStr.includes('food') || typeStr.includes('cafe') || typeStr.includes('bar')) {
      return 'restaurant';
    }
    if (typeStr.includes('lodging') || typeStr.includes('hotel')) {
      return 'hotel';
    }
    if (typeStr.includes('museum') || typeStr.includes('park') || typeStr.includes('point_of_interest') || typeStr.includes('tourist')) {
      return 'attraction';
    }

    return 'activity';
  };

  // Add a single idea (avoiding duplicates)
  const addIdeaSingle = useCallback((idea: Omit<Idea, 'id' | 'addedAt' | 'status'>) => {
    setIdeas(prev => {
      // Check for duplicate by name + city
      const exists = prev.some(i =>
        i.name.toLowerCase() === idea.name.toLowerCase() &&
        i.city?.toLowerCase() === idea.city?.toLowerCase()
      );

      if (exists) {
        console.log(`📋 [IdeasBoard] Skipping duplicate: ${idea.name}`);
        return prev;
      }

      const newIdea: Idea = {
        ...idea,
        id: uuidv4(),
        addedAt: new Date(),
        status: 'pending',
      };

      return [newIdea, ...prev]; // Add to front
    });
  }, []);

  // Add multiple ideas at once
  const addIdeasBatch = useCallback((newIdeas: Array<Omit<Idea, 'id' | 'addedAt' | 'status'>>) => {
    setIdeas(prev => {
      const existingNames = new Set(prev.map(i => `${i.name.toLowerCase()}-${i.city?.toLowerCase()}`));

      const unique = newIdeas.filter(idea =>
        !existingNames.has(`${idea.name.toLowerCase()}-${idea.city?.toLowerCase()}`)
      );

      if (unique.length === 0) return prev;

      const withIds: Idea[] = unique.map(idea => ({
        ...idea,
        id: uuidv4(),
        addedAt: new Date(),
        status: 'pending',
      }));

      return [...withIds, ...prev]; // Add to front
    });
  }, []);

  // Public add functions
  const addIdea = useCallback((idea: Omit<Idea, 'id' | 'addedAt' | 'status'>) => {
    addIdeaSingle(idea);
  }, [addIdeaSingle]);

  const addIdeas = useCallback((ideas: Array<Omit<Idea, 'id' | 'addedAt' | 'status'>>) => {
    addIdeasBatch(ideas);
  }, [addIdeasBatch]);

  // Save idea (favorite)
  const saveIdea = useCallback((id: string) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === id
        ? { ...idea, status: 'saved', savedAt: new Date() }
        : idea
    ));
  }, []);

  // Skip/dismiss idea
  const skipIdea = useCallback((id: string) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === id
        ? { ...idea, status: 'skipped' }
        : idea
    ));
  }, []);

  // Mark as added to trip
  const markAsAdded = useCallback((id: string, dayNumber: number) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === id
        ? { ...idea, status: 'added', addedToDay: dayNumber }
        : idea
    ));
  }, []);

  // Restore skipped idea
  const restoreIdea = useCallback((id: string) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === id
        ? { ...idea, status: 'pending' }
        : idea
    ));
  }, []);

  // Clear all ideas
  const clearAll = useCallback(() => {
    setIdeas([]);
  }, []);

  // Panel actions
  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);

  // Computed values
  const savedIdeas = ideas.filter(i => i.status === 'saved');
  const pendingIdeas = ideas.filter(i => i.status === 'pending');

  const value: IdeasBoardContextValue = {
    ideas,
    savedIdeas,
    pendingIdeas,
    totalCount: ideas.length,
    pendingCount: pendingIdeas.length,
    savedCount: savedIdeas.length,
    addIdea,
    addIdeas,
    saveIdea,
    skipIdea,
    markAsAdded,
    restoreIdea,
    clearAll,
    isOpen,
    openPanel,
    closePanel,
    togglePanel,
  };

  return (
    <IdeasBoardContext.Provider value={value}>
      {children}
    </IdeasBoardContext.Provider>
  );
}

// ==================== HOOK ====================

export function useIdeasBoard() {
  const context = useContext(IdeasBoardContext);

  if (context === undefined) {
    throw new Error('useIdeasBoard must be used within IdeasBoardProvider');
  }

  return context;
}
