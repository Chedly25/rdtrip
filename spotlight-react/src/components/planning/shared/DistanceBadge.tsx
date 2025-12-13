/**
 * DistanceBadge
 *
 * Color-coded proximity indicator showing walking time to a cluster.
 * - Green (<10 min): Very close, walkable
 * - Yellow (10-20 min): Moderate distance
 * - Red (>20 min): Far, consider transport
 *
 * Design: Compact badge with directional arrow
 */

import { ArrowUpRight } from 'lucide-react';

export interface DistanceBadgeProps {
  minutes: number;
  fromName?: string;
  compact?: boolean;
}

export function DistanceBadge({ minutes, fromName, compact = false }: DistanceBadgeProps) {
  // Sanity check - walking time should never exceed 24 hours (1440 minutes)
  // If it does, the input was likely in meters instead of minutes
  const validMinutes = Math.min(Math.max(0, Math.round(minutes)), 1440);

  if (minutes > 1440 || minutes < 0) {
    console.warn('[DistanceBadge] Received unrealistic minutes value:', minutes, '- clamping to', validMinutes);
  }

  // Color coding based on walking time
  const getColorClasses = () => {
    if (validMinutes < 10) {
      return {
        text: 'text-[#4A7C59]',
        bg: 'bg-[#F0F7F4]',
        border: 'border-[#4A7C59]/20',
      };
    }
    if (validMinutes <= 20) {
      return {
        text: 'text-[#D4A853]',
        bg: 'bg-[#FFF8E6]',
        border: 'border-[#D4A853]/20',
      };
    }
    return {
      text: 'text-[#C45830]',
      bg: 'bg-[#FEF3EE]',
      border: 'border-[#C45830]/20',
    };
  };

  const colors = getColorClasses();
  const displayTime = validMinutes < 60 ? `${validMinutes} min` : `${Math.floor(validMinutes / 60)}h ${validMinutes % 60}m`;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium font-['Satoshi',sans-serif] ${colors.text}`}>
        {displayTime}
        <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-1
        ${colors.bg} ${colors.text} border ${colors.border}
        rounded-full text-xs font-medium font-['Satoshi',sans-serif]
        transition-all duration-200
      `}
    >
      <span>{displayTime}</span>
      <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
      {fromName && (
        <span className="text-[#8B7355] font-normal">
          from {fromName}
        </span>
      )}
    </span>
  );
}

export default DistanceBadge;
