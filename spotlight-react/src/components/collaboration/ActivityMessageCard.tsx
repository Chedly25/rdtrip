/**
 * Activity Message Card - "The Destination Card"
 *
 * A vintage destination postcard aesthetic for shared activity messages.
 * Features postcard borders, location stamps, and editorial typography.
 *
 * Design: Wanderlust Editorial with vintage postcard aesthetics
 */

import { MapPin, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

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
  espresso: '#2C1810',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',
  parchment: '#F5E6C8',
};

interface Activity {
  name: string;
  city?: string;
  duration?: string;
  description?: string;
  url?: string;
}

interface ActivityMessageCardProps {
  activity: Activity;
  isCurrentUser: boolean;
}

export function ActivityMessageCard({ activity, isCurrentUser }: ActivityMessageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        background: isCurrentUser
          ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
          : colors.warmWhite,
        border: `2px solid ${isCurrentUser ? colors.terracottaLight : colors.golden}`,
        boxShadow: `0 2px 8px rgba(44, 24, 16, 0.12)`,
      }}
    >
      {/* Postcard Header with stamp effect */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: `1px ${isCurrentUser ? 'solid' : 'dashed'} ${isCurrentUser ? colors.terracottaLight : colors.golden}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: isCurrentUser ? 'rgba(255,255,255,0.2)' : `${colors.terracotta}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin
              style={{
                width: 14,
                height: 14,
                color: isCurrentUser ? colors.cream : colors.terracotta,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: isCurrentUser ? 'rgba(255,255,255,0.9)' : colors.mediumBrown,
              textTransform: 'uppercase',
            }}
          >
            Shared Destination
          </span>
        </div>

        {/* Decorative stamp */}
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: `2px dashed ${isCurrentUser ? 'rgba(255,255,255,0.3)' : colors.golden}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
          }}
        >
          ✈
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        <h4
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            fontWeight: 700,
            color: isCurrentUser ? colors.cream : colors.espresso,
            margin: '0 0 8px 0',
          }}
        >
          {activity.name}
        </h4>

        {/* Metadata */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: activity.description ? '10px' : 0,
          }}
        >
          {activity.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin
                style={{
                  width: 12,
                  height: 12,
                  color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.lightBrown,
                }}
              />
              <span
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  color: isCurrentUser ? 'rgba(255,255,255,0.8)' : colors.mediumBrown,
                }}
              >
                {activity.city}
              </span>
            </div>
          )}
          {activity.duration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock
                style={{
                  width: 12,
                  height: 12,
                  color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.lightBrown,
                }}
              />
              <span
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  color: isCurrentUser ? 'rgba(255,255,255,0.8)' : colors.mediumBrown,
                }}
              >
                {activity.duration}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
              lineHeight: 1.5,
              color: isCurrentUser ? 'rgba(255,255,255,0.9)' : colors.espresso,
              margin: '0 0 10px 0',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {activity.description}
          </p>
        )}

        {/* Link */}
        {activity.url && (
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: isCurrentUser ? colors.cream : colors.terracotta,
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              background: isCurrentUser ? 'rgba(255,255,255,0.15)' : `${colors.terracotta}10`,
              border: `1px solid ${isCurrentUser ? 'rgba(255,255,255,0.2)' : `${colors.terracotta}30`}`,
              transition: 'all 0.2s ease',
            }}
          >
            VIEW DETAILS
            <ExternalLink style={{ width: 11, height: 11 }} />
          </a>
        )}
      </div>
    </motion.div>
  );
}
