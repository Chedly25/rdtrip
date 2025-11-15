/**
 * MyTripsPage - Dashboard for all user's saved trips
 * Phase 2: Navigation Redesign
 *
 * Features:
 * - Lists all user's trips with metadata
 * - Empty state for new users
 * - Archive trips functionality
 * - Navigate to spotlight view
 * - Beautiful grid layout with animations
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Plus, Loader2, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Trip {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'completed';
  origin: { name: string; country: string };
  destination: { name: string; country: string };
  nights: number;
  selected_agent_type: string;
  created_at: string;
  updated_at: string;
  proposal_count: number;
}

export function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/my-trips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTrips(data.trips);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTrip = (tripId: string) => {
    navigate(`/spotlight-new?tripId=${tripId}`);
  };

  const handleArchiveTrip = async (tripId: string) => {
    if (!confirm('Archive this trip?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/my-trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchTrips(); // Refresh list
    } catch (error) {
      console.error('Failed to archive trip:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-1">Plan, save, and manage your road trips</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Generate New Route
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {trips.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No trips yet</h2>
            <p className="text-gray-600 mb-6">Start planning your first road trip!</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Generate Route
            </button>
          </div>
        ) : (
          /* Trip Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
                onClick={() => handleViewTrip(trip.id)}
              >
                {/* Header with gradient based on agent type */}
                <div className={`h-2 ${getAgentGradient(trip.selected_agent_type)}`} />

                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {trip.title}
                  </h3>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">
                      {trip.origin.name} → {trip.destination.name}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {trip.nights} nights
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {trip.proposal_count} proposals
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trip.status === 'active' ? 'bg-green-100 text-green-700' :
                      trip.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>

                    {/* Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveTrip(trip.id);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Archive trip"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                    </button>
                  </div>

                  {/* Last updated */}
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    Updated {formatRelativeTime(trip.updated_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getAgentGradient(agentType: string): string {
  const gradients: Record<string, string> = {
    adventure: 'bg-gradient-to-r from-orange-500 to-red-500',
    culinary: 'bg-gradient-to-r from-green-500 to-teal-500',
    cultural: 'bg-gradient-to-r from-purple-500 to-pink-500',
    budget: 'bg-gradient-to-r from-blue-500 to-indigo-500'
  };
  return gradients[agentType] || 'bg-gradient-to-r from-gray-400 to-gray-500';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
