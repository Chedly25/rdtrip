/**
 * ArtifactRenderer - Routes artifacts to appropriate display components
 *
 * Each artifact type gets its own specialized component with
 * enhanced interactivity and actions
 *
 * Includes error boundary for graceful error handling
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import type { Artifact } from '../../contexts/AgentProvider';
import { ActivityGridArtifact } from './artifacts/ActivityGridArtifact';
import { HotelListArtifact } from './artifacts/HotelListArtifact';
import { WeatherDisplayArtifact } from './artifacts/WeatherDisplayArtifact';
import { DirectionsMapArtifact } from './artifacts/DirectionsMapArtifact';
import { CityInfoArtifact } from './artifacts/CityInfoArtifact';
import { ErrorState } from './artifacts/ErrorState';

interface ArtifactRendererProps {
  artifact: Artifact;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Error boundary to catch rendering errors
class ArtifactErrorBoundary extends Component<
  { children: ReactNode; onRetry?: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onRetry?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Artifact rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          error={this.state.error?.message || 'Failed to render artifact'}
          onRetry={this.props.onRetry}
        />
      );
    }

    return this.props.children;
  }
}

export function ArtifactRenderer({ artifact }: ArtifactRendererProps) {
  const renderArtifact = () => {
    // Validate artifact data
    if (!artifact.data) {
      return <ErrorState error="No data available for this artifact" />;
    }

    switch (artifact.type) {
      case 'activity_grid':
        if (!Array.isArray(artifact.data) || artifact.data.length === 0) {
          return <ErrorState error="No activities found" />;
        }
        return <ActivityGridArtifact activities={artifact.data} metadata={artifact.metadata} />;

      case 'hotel_list':
        if (!Array.isArray(artifact.data) || artifact.data.length === 0) {
          return <ErrorState error="No hotels found" />;
        }
        return <HotelListArtifact hotels={artifact.data} metadata={artifact.metadata} />;

      case 'weather_display':
        return <WeatherDisplayArtifact data={artifact.data} />;

      case 'directions_map':
        return <DirectionsMapArtifact data={artifact.data} />;

      case 'city_info':
        return <CityInfoArtifact data={artifact.data} />;

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">❓</span>
            </div>
            <p className="font-medium">Unknown artifact type</p>
            <p className="text-sm">Type: {artifact.type}</p>
          </div>
        );
    }
  };

  return (
    <ArtifactErrorBoundary onRetry={() => window.location.reload()}>
      {renderArtifact()}
    </ArtifactErrorBoundary>
  );
}
