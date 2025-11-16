/**
 * GlobalNav - Persistent top navigation bar
 * Phase 4: Navigation Redesign - Global Navigation Bar
 *
 * Features:
 * - Always visible sticky header
 * - "My Trips" button for quick access
 * - Current trip indicator when in spotlight view
 * - Profile button
 */

import { Home, Map, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSpotlightStoreV2 } from '../../stores/spotlightStoreV2';
import { ThemeToggle } from '../theme/ThemeToggle';

export function GlobalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { route, getCityName } = useSpotlightStoreV2();

  // GlobalNav is always visible in the spotlight app
  // (The actual landing page is a separate app at '/')

  // Get current trip info if in spotlight
  const isInSpotlight = location.pathname === '/' || location.pathname.includes('/spotlight');
  const originName = route ? getCityName(route.origin) : null;
  const destinationName = route ? getCityName(route.destination) : null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/my-trips')}>
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">RDTrip</span>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-4">
            {/* My Trips Button */}
            <button
              onClick={() => navigate('/my-trips')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/my-trips'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">My Trips</span>
            </button>

            {/* Current Trip Indicator (if in spotlight and route is loaded) */}
            {isInSpotlight && route && originName && destinationName && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <Map className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {originName} → {destinationName}
                </span>
              </div>
            )}

            {/* Phase 6.7: Dark Mode Toggle */}
            <ThemeToggle />

            {/* Profile */}
            <button
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              title="Profile"
              onClick={() => {
                // TODO: Implement profile page
                alert('Profile page coming soon!');
              }}
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
