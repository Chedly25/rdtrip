import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Check, Clock, X, Users } from 'lucide-react';
import type { TripPoll } from '../../types';

interface PollCardProps {
  poll: TripPoll;
  routeId: string;
  currentUserId?: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  onVote?: (pollId: string, selectedOptions: string[]) => void;
  onClose?: (pollId: string) => void;
}

export function PollCard({
  poll,
  routeId,
  currentUserId,
  userRole = 'viewer',
  onVote,
  onClose
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(poll.status !== 'active');

  // Check if current user has already voted
  useEffect(() => {
    const userVote = poll.votes.find(v => v.userId === currentUserId);
    if (userVote) {
      setSelectedOptions(userVote.selectedOptions);
      setHasVoted(true);
    }
  }, [poll.votes, currentUserId]);

  // Calculate vote counts for each option
  const getVoteCount = (optionId: string): number => {
    return poll.votes.filter(vote =>
      vote.selectedOptions.includes(optionId)
    ).length;
  };

  // Calculate percentage for each option
  const getVotePercentage = (optionId: string): number => {
    if (poll.votes.length === 0) return 0;
    return (getVoteCount(optionId) / poll.votes.length) * 100;
  };

  // Get voters for an option
  const getVoters = (optionId: string): string[] => {
    return poll.votes
      .filter(vote => vote.selectedOptions.includes(optionId))
      .map(vote => vote.userName);
  };

  // Handle option selection
  const handleOptionClick = (optionId: string) => {
    if (poll.status !== 'active') return;

    if (poll.multipleChoice) {
      setSelectedOptions(prev => {
        if (prev.includes(optionId)) {
          return prev.filter(id => id !== optionId);
        } else if (prev.length < poll.maxChoices) {
          return [...prev, optionId];
        }
        return prev;
      });
    } else {
      setSelectedOptions([optionId]);
    }
  };

  // Submit vote
  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) return;

    try {
      const response = await fetch(`/api/routes/${routeId}/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
        },
        body: JSON.stringify({ selectedOptions })
      });

      if (response.ok) {
        setHasVoted(true);
        setShowResults(true);
        if (onVote) {
          onVote(poll.id, selectedOptions);
        }
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  // Close poll (owner/editor only)
  const handleClosePoll = async () => {
    if (userRole === 'viewer') return;

    try {
      const response = await fetch(`/api/routes/${routeId}/polls/${poll.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
        }
      });

      if (response.ok && onClose) {
        onClose(poll.id);
      }
    } catch (error) {
      console.error('Error closing poll:', error);
    }
  };

  // Format deadline
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return 'Expired';
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  };

  const isPollActive = poll.status === 'active';
  const canVote = isPollActive && !hasVoted;
  const canClosePoll = isPollActive && (userRole === 'owner' || userRole === 'editor' || poll.createdBy === currentUserId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-4"
    >
      {/* Poll Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">{poll.question}</h3>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>by {poll.createdByName}</span>
            {poll.votes.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {poll.votes.length} vote{poll.votes.length !== 1 ? 's' : ''}
              </span>
            )}
            {poll.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDeadline(poll.deadline)}
              </span>
            )}
          </div>

          {poll.description && (
            <p className="text-sm text-gray-600 mt-2">{poll.description}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          poll.status === 'active' ? 'bg-green-100 text-green-700' :
          poll.status === 'closed' ? 'bg-gray-100 text-gray-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {poll.status.toUpperCase()}
        </div>
      </div>

      {/* Poll Instructions */}
      {canVote && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            {poll.multipleChoice
              ? `Select up to ${poll.maxChoices} option${poll.maxChoices > 1 ? 's' : ''}`
              : 'Select one option'}
          </p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((option) => {
          const voteCount = getVoteCount(option.id);
          const percentage = getVotePercentage(option.id);
          const isSelected = selectedOptions.includes(option.id);
          const voters = getVoters(option.id);

          return (
            <motion.div
              key={option.id}
              whileHover={canVote ? { scale: 1.02 } : {}}
              className={`relative rounded-lg border-2 transition-all ${
                canVote ? 'cursor-pointer' : ''
              } ${
                isSelected && canVote
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
              onClick={() => canVote && handleOptionClick(option.id)}
            >
              {/* Progress bar (shown if voted or results visible) */}
              {(hasVoted || showResults) && (
                <div
                  className="absolute inset-0 bg-blue-100 rounded-lg opacity-30 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Checkbox/Radio */}
                  {canVote && (
                    <div className={`w-5 h-5 rounded-${poll.multipleChoice ? 'md' : 'full'} border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}

                  {/* Option Label */}
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    )}
                    {(hasVoted || showResults) && voters.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {voters.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vote Count */}
                {(hasVoted || showResults) && (
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900">{voteCount}</p>
                    <p className="text-xs text-gray-500">{percentage.toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        {canVote && (
          <>
            <button
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Submit Vote
            </button>
            <button
              onClick={() => setShowResults(!showResults)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              {showResults ? 'Hide Results' : 'Show Results'}
            </button>
          </>
        )}

        {hasVoted && isPollActive && (
          <button
            onClick={() => setShowResults(!showResults)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            {showResults ? 'Hide Results' : 'Show Results'}
          </button>
        )}

        {canClosePoll && (
          <button
            onClick={handleClosePoll}
            className="ml-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close Poll
          </button>
        )}
      </div>
    </motion.div>
  );
}
