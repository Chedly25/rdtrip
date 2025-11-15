/**
 * RouteProposalsPage - Compare all 4 agent proposals
 * Phase 5: Navigation Redesign - Route Proposals Comparison
 *
 * Features:
 * - View all 4 agent proposals side-by-side
 * - Preview each proposal before selecting
 * - Select proposal to make it active
 * - Visual indicators for selected proposal
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, MapPin, Calendar, Loader2 } from 'lucide-react';

interface Proposal {
  id: string;
  agent_type: string;
  route_data: any;
  is_selected: boolean;
  cost_estimate: number;
}

interface Trip {
  id: string;
  title: string;
  origin: { name: string; country: string };
  destination: { name: string; country: string };
  nights: number;
}

export function RouteProposalsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, [tripId]);

  const fetchProposals = async () => {
    try {
      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/my-trips/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTrip(data.trip);
      setProposals(data.proposals);
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProposal = async (proposalId: string) => {
    try {
      const token = localStorage.getItem('rdtrip_auth_token');
      await fetch(`/api/my-trips/${tripId}/proposals/${proposalId}/select`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Navigate to spotlight with this proposal
      navigate(`/?tripId=${tripId}`);
    } catch (error) {
      console.error('Failed to select proposal:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">
            Compare Route Proposals
          </h1>
          <p className="text-gray-600 mt-1">
            {trip?.origin?.name} → {trip?.destination?.name} • {trip?.nights} nights
          </p>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposals.map((proposal, index) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                proposal.is_selected
                  ? 'border-teal-500 shadow-lg'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              {/* Agent Type Header */}
              <div className={`h-2 ${getAgentGradient(proposal.agent_type)}`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 capitalize mb-1">
                      {proposal.agent_type} Agent
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getAgentDescription(proposal.agent_type)}
                    </p>
                  </div>
                  {proposal.is_selected && (
                    <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </div>

                {/* Route Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {proposal.route_data.cities?.length || 0} cities
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {proposal.route_data.cities?.map((c: any) => c.city?.name || c.city).join(' → ')}
                      </p>
                    </div>
                  </div>

                  {proposal.route_data.landmarks && proposal.route_data.landmarks.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {proposal.route_data.landmarks.length} landmarks
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSelectProposal(proposal.id)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      proposal.is_selected
                        ? 'bg-gray-100 text-gray-600 cursor-default'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                    disabled={proposal.is_selected}
                  >
                    {proposal.is_selected ? 'Currently Selected' : 'Select This Route'}
                  </button>

                  <button
                    onClick={() => {
                      // Preview mode - view without selecting
                      navigate(`/?tripId=${tripId}&preview=${proposal.agent_type}`);
                    }}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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

function getAgentDescription(agentType: string): string {
  const descriptions: Record<string, string> = {
    adventure: 'Outdoor activities, hiking, scenic routes',
    culinary: 'Best restaurants, local cuisine, food markets',
    cultural: 'Museums, historical sites, art galleries',
    budget: 'Cost-effective options, free activities'
  };
  return descriptions[agentType] || '';
}
