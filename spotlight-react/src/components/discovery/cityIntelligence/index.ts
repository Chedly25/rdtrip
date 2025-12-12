/**
 * City Intelligence Components
 *
 * Export all components related to the City Intelligence Agent system.
 *
 * Component Categories:
 * - Core Components (Phase 2): Card, Status, TimeBlocks, MatchScore, Clusters
 * - Enhancement Components (Phase 3): HiddenGems, Logistics, Weather, PhotoSpots
 */

// =============================================================================
// Core Components (Phase 2)
// =============================================================================

// Core card component
export { CityIntelligenceCard } from '../CityIntelligenceCard';

// Agent status visualization
export {
  AgentStatusIndicator,
  AgentStatusGroup,
  AgentProgressBar,
} from '../AgentStatusIndicator';

// Time blocks display
export {
  TimeBlocksDisplay,
  default as TimeBlocks,
} from '../TimeBlocksDisplay';

// Match score visualization
export {
  MatchScoreRing,
  MatchScoreBadge,
  MatchScoreInline,
} from '../MatchScoreRing';

// Cluster visualization
export {
  ClusterVisualization,
  ClusterPills,
  getClusterMarkers,
} from '../ClusterVisualization';

// =============================================================================
// Enhancement Components (Phase 3)
// =============================================================================

// Hidden gems display
export {
  HiddenGemsDisplay,
  GemPills,
} from '../HiddenGemsDisplay';

// Logistics panel
export {
  LogisticsPanel,
  LogisticsSummary,
} from '../LogisticsPanel';

// Weather display
export {
  WeatherDisplay,
  WeatherBadge,
} from '../WeatherDisplay';

// Photo spots display
export {
  PhotoSpotsDisplay,
  PhotoSpotTimeline,
  PhotoSpotBadge,
} from '../PhotoSpotsDisplay';
