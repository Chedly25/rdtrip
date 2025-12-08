import React, { useEffect, useRef } from 'react';
import { useDiscoveryStore, type DiscoveryAction } from '../stores/discoveryStore';
import { useCompanion } from '../contexts/CompanionProvider';

/**
 * useDiscoveryCompanionSync
 *
 * Syncs discovery phase actions with the CompanionProvider for:
 * - Contextual suggestions based on user actions
 * - Entity highlighting when cities are selected
 * - Proactive recommendations when cities are empty
 *
 * WI-1.6: Companion Integration
 */
export function useDiscoveryCompanionSync() {
  const lastProcessedActionRef = useRef<Date>(new Date());

  // Discovery store state
  const recentActions = useDiscoveryStore((state) => state.recentActions);
  const getRecentActions = useDiscoveryStore((state) => state.getRecentActions);
  const selectedCityId = useDiscoveryStore((state) => state.selectedCityId);
  const route = useDiscoveryStore((state) => state.route);

  // Companion context
  const {
    onCitySelect,
    triggerSuggestion,
    isPanelExpanded,
    recordInteraction,
  } = useCompanion();

  // Sync city selection with companion
  useEffect(() => {
    if (!route) return;

    // Find the selected city's name
    if (selectedCityId) {
      const allCities = [route.origin, ...route.suggestedCities, route.destination];
      const city = allCities.find((c) => c.id === selectedCityId);
      if (city) {
        onCitySelect(city.name);
      }
    } else {
      onCitySelect(null);
    }
  }, [selectedCityId, route, onCitySelect]);

  // Process new actions and trigger companion suggestions
  useEffect(() => {
    const newActions = getRecentActions(lastProcessedActionRef.current);
    if (newActions.length === 0) return;

    // Update last processed time
    lastProcessedActionRef.current = new Date();

    // Record interaction to reset idle timer
    recordInteraction();

    // Process each action for potential suggestions
    newActions.forEach((action) => {
      processActionForSuggestion(action);
    });
  }, [recentActions, getRecentActions, recordInteraction]);

  // Process individual actions and potentially trigger suggestions
  const processActionForSuggestion = (action: DiscoveryAction) => {
    // Don't suggest if panel is already expanded (user is engaged)
    if (isPanelExpanded) return;

    switch (action.type) {
      case 'city_added': {
        const cityName = action.data?.cityName as string | undefined;
        if (cityName) {
          // After adding a city, suggest exploring its places
          setTimeout(() => {
            triggerSuggestion({
              id: `discover-${Date.now()}`,
              message: `Great choice adding ${cityName}! Want me to find hidden gems there?`,
              prompt: `Find hidden gems and unique experiences in ${cityName}`,
              priority: 'low',
              triggerType: 'context',
            });
          }, 2000); // Delay to not interrupt the add flow
        }
        break;
      }

      case 'city_removed': {
        const cityName = action.data?.cityName as string | undefined;
        if (cityName) {
          // Offer alternatives when city is removed
          setTimeout(() => {
            triggerSuggestion({
              id: `alternative-${Date.now()}`,
              message: `No worries about ${cityName}. Want me to suggest an alternative stop?`,
              prompt: `Suggest an alternative city to ${cityName} for my road trip`,
              priority: 'low',
              triggerType: 'context',
            });
          }, 3000);
        }
        break;
      }

      case 'place_favourited': {
        // After favouriting a few places, offer to find more like them
        const favouritedPlaceIds = useDiscoveryStore.getState().favouritedPlaceIds;
        if (favouritedPlaceIds.length === 3) {
          setTimeout(() => {
            triggerSuggestion({
              id: `more-like-${Date.now()}`,
              message: "I'm noticing your taste! Want me to find more places you'll love?",
              prompt: 'Based on my favourited places, find more similar recommendations',
              priority: 'low',
              triggerType: 'context',
            });
          }, 1500);
        }
        break;
      }

      case 'nights_adjusted': {
        // After adjusting nights, offer day planning help
        const nights = action.data?.nights as number | undefined;
        if (nights && nights >= 3) {
          setTimeout(() => {
            triggerSuggestion({
              id: `plan-days-${Date.now()}`,
              message: `${nights} nights is a great amount of time! Want help planning what to do each day?`,
              prompt: 'Help me plan activities for each day in this city',
              priority: 'low',
              triggerType: 'context',
            });
          }, 2000);
        }
        break;
      }

      default:
        break;
    }
  };

  return null;
}

/**
 * DiscoveryCompanionSyncProvider
 *
 * Component wrapper that activates companion sync.
 * Place this inside both DiscoveryPhaseContainer and CompanionProvider.
 */
export function DiscoveryCompanionSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useDiscoveryCompanionSync();
  return <>{children}</>;
}

export default useDiscoveryCompanionSync;
