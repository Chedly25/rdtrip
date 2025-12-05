/**
 * Poll Card - "The Traveler's Ballot"
 *
 * A vintage ballot box / voting card aesthetic for group decisions.
 * Features pencil-mark checkboxes, paper ballot styling, and seal stamps.
 *
 * Design: Wanderlust Editorial with vintage polling/ballot aesthetics
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Vote,
  Check,
  Clock,
  X,
  Users,
  Lock,
  Unlock,
  Award,
} from 'lucide-react';
import type { TripPoll } from '../../types';

// =============================================================================
// WANDERLUST EDITORIAL COLOR PALETTE
// =============================================================================
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  sageDark: '#4A6B5A',
  espresso: '#2C1810',
  darkBrown: '#3D2A1E',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',

  // Ballot accents
  parchment: '#F5E6C8',
  inkBlue: '#1A365D',
  stampRed: '#8B2323',
  pencilGray: '#4A4A4A',
  ballotBg: '#FDFBF7',
};

interface PollCardProps {
  poll: TripPoll;
  routeId: string;
  currentUserId?: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  onVote?: (pollId: string, selectedOptions: string[]) => void;
  onClose?: (pollId: string) => void;
}

// Poll type icons
const POLL_TYPE_ICONS: Record<string, string> = {
  general: '📋',
  activity: '🎯',
  restaurant: '🍽️',
  accommodation: '🏨',
  schedule: '📅',
};

// =============================================================================
// BALLOT HEADER SEAL
// =============================================================================
const BallotSeal: React.FC<{ status: string }> = ({ status }) => {
  const sealConfig = {
    active: { color: colors.sage, text: 'OPEN', icon: <Unlock style={{ width: 12, height: 12 }} /> },
    closed: { color: colors.lightBrown, text: 'CLOSED', icon: <Lock style={{ width: 12, height: 12 }} /> },
    executed: { color: colors.golden, text: 'DECIDED', icon: <Award style={{ width: 12, height: 12 }} /> },
  };

  const config = sealConfig[status as keyof typeof sealConfig] || sealConfig.active;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      style={{
        position: 'absolute',
        top: '-8px',
        right: '16px',
        padding: '6px 12px',
        background: `${config.color}20`,
        border: `2px solid ${config.color}`,
        borderRadius: '4px',
        transform: 'rotate(3deg)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: config.color,
      }}
    >
      {config.icon}
      <span
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '1px',
        }}
      >
        {config.text}
      </span>
    </motion.div>
  );
};

// =============================================================================
// PENCIL CHECKBOX
// =============================================================================
const PencilCheckbox: React.FC<{
  checked: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isMultiple?: boolean;
}> = ({ checked, onClick, disabled, isMultiple }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.05 }}
    whileTap={disabled ? {} : { scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 24,
      height: 24,
      borderRadius: isMultiple ? '4px' : '50%',
      background: colors.ballotBg,
      border: `2px solid ${checked ? colors.terracotta : colors.lightBrown}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      position: 'relative',
      flexShrink: 0,
    }}
  >
    {checked && (
      <motion.svg
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        style={{ position: 'absolute' }}
      >
        <motion.path
          d="M 2 7 L 5 10 L 12 3"
          fill="none"
          stroke={colors.pencilGray}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.svg>
    )}
  </motion.button>
);

// =============================================================================
// PROGRESS BAR (BALLOT FILL)
// =============================================================================
const BallotProgressBar: React.FC<{
  percentage: number;
  isWinning: boolean;
  showResults: boolean;
}> = ({ percentage, isWinning, showResults }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 0,
    }}
  >
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: showResults ? `${percentage}%` : 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      style={{
        height: '100%',
        background: isWinning
          ? `linear-gradient(90deg, ${colors.golden}30 0%, ${colors.goldenLight}20 100%)`
          : `linear-gradient(90deg, ${colors.sage}20 0%, ${colors.sageLight}15 100%)`,
      }}
    />
  </div>
);

// =============================================================================
// VOTER AVATARS
// =============================================================================
const VoterAvatars: React.FC<{ voters: string[]; maxDisplay?: number }> = ({
  voters,
  maxDisplay = 3,
}) => {
  const displayVoters = voters.slice(0, maxDisplay);
  const remaining = voters.length - maxDisplay;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {displayVoters.map((voter, i) => (
        <div
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: '4px',
            background: colors.parchment,
            border: `1px solid ${colors.golden}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Courier New", monospace',
            fontSize: '9px',
            fontWeight: 700,
            color: colors.espresso,
            marginLeft: i > 0 ? '-6px' : 0,
          }}
          title={voter}
        >
          {voter.charAt(0).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <span
          style={{
            marginLeft: '4px',
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            color: colors.lightBrown,
          }}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function PollCard({
  poll,
  routeId,
  currentUserId,
  userRole = 'viewer',
  onVote,
  onClose,
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(poll.status !== 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has voted
  useEffect(() => {
    const userVote = poll.votes.find((v) => v.userId === currentUserId);
    if (userVote) {
      setSelectedOptions(userVote.selectedOptions);
      setHasVoted(true);
    }
  }, [poll.votes, currentUserId]);

  // Vote calculations
  const getVoteCount = (optionId: string): number =>
    poll.votes.filter((vote) => vote.selectedOptions.includes(optionId)).length;

  const getVotePercentage = (optionId: string): number => {
    if (poll.votes.length === 0) return 0;
    return (getVoteCount(optionId) / poll.votes.length) * 100;
  };

  const getVoters = (optionId: string): string[] =>
    poll.votes.filter((vote) => vote.selectedOptions.includes(optionId)).map((vote) => vote.userName);

  const maxVotes = Math.max(...poll.options.map((o) => getVoteCount(o.id)), 0);

  // Handle option click
  const handleOptionClick = (optionId: string) => {
    if (poll.status !== 'active' || hasVoted) return;

    if (poll.multipleChoice) {
      setSelectedOptions((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId);
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
    if (selectedOptions.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/routes/${routeId}/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ selectedOptions }),
      });

      if (response.ok) {
        setHasVoted(true);
        setShowResults(true);
        onVote?.(poll.id, selectedOptions);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close poll
  const handleClosePoll = async () => {
    if (userRole === 'viewer') return;

    try {
      const response = await fetch(`/api/routes/${routeId}/polls/${poll.id}/close`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        onClose?.(poll.id);
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

    if (hours < 0) return { text: 'Expired', urgent: true };
    if (hours < 24) return { text: `${hours}h remaining`, urgent: true };
    const days = Math.floor(hours / 24);
    return { text: `${days}d remaining`, urgent: false };
  };

  const isPollActive = poll.status === 'active';
  const canVote = isPollActive && !hasVoted;
  const canClosePoll = isPollActive && (userRole === 'owner' || userRole === 'editor' || poll.createdBy === currentUserId);
  const pollTypeIcon = POLL_TYPE_ICONS[poll.pollType] || POLL_TYPE_ICONS.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.parchment} 100%)`,
        borderRadius: '12px',
        border: `1px solid ${colors.golden}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      {/* Decorative ballot edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `repeating-linear-gradient(
            90deg,
            ${colors.golden} 0,
            ${colors.golden} 8px,
            transparent 8px,
            transparent 16px
          )`,
        }}
      />

      <BallotSeal status={poll.status} />

      {/* Header */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              background: `${colors.terracotta}15`,
              border: `1px solid ${colors.terracotta}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            {pollTypeIcon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontFamily: 'Georgia, serif',
                fontSize: '17px',
                fontWeight: 700,
                color: colors.espresso,
                lineHeight: 1.3,
              }}
            >
              {poll.question}
            </h3>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  color: colors.lightBrown,
                }}
              >
                by {poll.createdByName}
              </span>

              {poll.votes.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: colors.mediumBrown,
                  }}
                >
                  <Users style={{ width: 12, height: 12 }} />
                  <span
                    style={{
                      fontFamily: '"Courier New", monospace',
                      fontSize: '11px',
                    }}
                  >
                    {poll.votes.length} vote{poll.votes.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {poll.deadline && (() => {
                const deadline = formatDeadline(poll.deadline);
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: deadline.urgent ? colors.terracotta : colors.sage,
                    }}
                  >
                    <Clock style={{ width: 12, height: 12 }} />
                    <span
                      style={{
                        fontFamily: '"Courier New", monospace',
                        fontSize: '11px',
                        fontWeight: deadline.urgent ? 700 : 400,
                      }}
                    >
                      {deadline.text}
                    </span>
                  </div>
                );
              })()}
            </div>

            {poll.description && (
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontFamily: 'Georgia, serif',
                  fontSize: '13px',
                  color: colors.mediumBrown,
                  fontStyle: 'italic',
                }}
              >
                {poll.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {canVote && (
        <div
          style={{
            margin: '0 20px 12px',
            padding: '8px 12px',
            background: `${colors.sage}15`,
            borderRadius: '6px',
            borderLeft: `3px solid ${colors.sage}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              color: colors.sage,
            }}
          >
            {poll.multipleChoice
              ? `Select up to ${poll.maxChoices} option${poll.maxChoices > 1 ? 's' : ''}`
              : 'Select one option'}
          </p>
        </div>
      )}

      {/* Options */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {poll.options.map((option) => {
            const voteCount = getVoteCount(option.id);
            const percentage = getVotePercentage(option.id);
            const isSelected = selectedOptions.includes(option.id);
            const voters = getVoters(option.id);
            const isWinning = voteCount === maxVotes && maxVotes > 0;

            return (
              <motion.div
                key={option.id}
                whileHover={canVote ? { scale: 1.01 } : {}}
                onClick={() => canVote && handleOptionClick(option.id)}
                style={{
                  position: 'relative',
                  padding: '14px 16px',
                  background: isSelected
                    ? `${colors.terracotta}10`
                    : colors.ballotBg,
                  border: `1px solid ${isSelected ? colors.terracotta : colors.golden}`,
                  borderRadius: '8px',
                  cursor: canVote ? 'pointer' : 'default',
                  overflow: 'hidden',
                }}
              >
                <BallotProgressBar
                  percentage={percentage}
                  isWinning={isWinning}
                  showResults={hasVoted || showResults}
                />

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  {/* Checkbox */}
                  {canVote && (
                    <PencilCheckbox
                      checked={isSelected}
                      isMultiple={poll.multipleChoice}
                      disabled={!canVote}
                    />
                  )}

                  {/* Winning indicator */}
                  {(hasVoted || showResults) && isWinning && voteCount > 0 && (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: colors.golden,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Award style={{ width: 14, height: 14, color: colors.cream }} />
                    </div>
                  )}

                  {/* Option content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'Georgia, serif',
                        fontSize: '14px',
                        fontWeight: isWinning && (hasVoted || showResults) ? 600 : 400,
                        color: colors.espresso,
                      }}
                    >
                      {option.label}
                    </p>
                    {option.description && (
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontFamily: 'Georgia, serif',
                          fontSize: '12px',
                          color: colors.lightBrown,
                        }}
                      >
                        {option.description}
                      </p>
                    )}
                    {(hasVoted || showResults) && voters.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <VoterAvatars voters={voters} />
                      </div>
                    )}
                  </div>

                  {/* Vote count */}
                  {(hasVoted || showResults) && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: '"Courier New", monospace',
                          fontSize: '18px',
                          fontWeight: 700,
                          color: isWinning ? colors.golden : colors.espresso,
                        }}
                      >
                        {voteCount}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: '"Courier New", monospace',
                          fontSize: '10px',
                          color: colors.lightBrown,
                        }}
                      >
                        {percentage.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.golden}`,
          background: colors.cream,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {canVote && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0 || isSubmitting}
              style={{
                padding: '10px 20px',
                background:
                  selectedOptions.length === 0
                    ? colors.lightBrown
                    : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                border: 'none',
                borderRadius: '8px',
                fontFamily: '"Courier New", monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: colors.cream,
                cursor: selectedOptions.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: selectedOptions.length === 0 ? 'none' : '0 2px 8px rgba(196, 88, 48, 0.3)',
              }}
            >
              <Vote style={{ width: 16, height: 16 }} />
              {isSubmitting ? 'SUBMITTING...' : 'CAST VOTE'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowResults(!showResults)}
              style={{
                padding: '10px 16px',
                background: colors.cream,
                border: `1px solid ${colors.golden}`,
                borderRadius: '8px',
                fontFamily: '"Courier New", monospace',
                fontSize: '11px',
                fontWeight: 700,
                color: colors.mediumBrown,
                cursor: 'pointer',
              }}
            >
              {showResults ? 'Hide Results' : 'Peek Results'}
            </motion.button>
          </>
        )}

        {hasVoted && isPollActive && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowResults(!showResults)}
            style={{
              padding: '10px 16px',
              background: colors.cream,
              border: `1px solid ${colors.golden}`,
              borderRadius: '8px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              fontWeight: 700,
              color: colors.mediumBrown,
              cursor: 'pointer',
            }}
          >
            {showResults ? 'Hide Results' : 'Show Results'}
          </motion.button>
        )}

        {hasVoted && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: `${colors.sage}15`,
              borderRadius: '6px',
              color: colors.sage,
            }}
          >
            <Check style={{ width: 14, height: 14 }} />
            <span
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              VOTED
            </span>
          </div>
        )}

        {canClosePoll && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClosePoll}
            style={{
              marginLeft: 'auto',
              padding: '10px 16px',
              background: `${colors.stampRed}10`,
              border: `1px solid ${colors.stampRed}`,
              borderRadius: '8px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              fontWeight: 700,
              color: colors.stampRed,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
            Close Poll
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
