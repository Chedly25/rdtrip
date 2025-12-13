/**
 * PriceBadge
 *
 * Price level display showing € to €€€€.
 * Active euros shown in primary color, inactive in muted.
 * Optional price estimate tooltip.
 *
 * Design: Subtle, informative badge
 */

export interface PriceBadgeProps {
  level: 1 | 2 | 3 | 4;
  estimate?: string;
  showLabel?: boolean;
}

export function PriceBadge({ level, estimate, showLabel = false }: PriceBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 font-['Satoshi',sans-serif] text-xs"
      title={estimate}
    >
      {showLabel && (
        <span className="text-[#8B7355] mr-0.5">Price:</span>
      )}
      <span className="font-medium">
        {/* Active euros */}
        <span className="text-[#8B7355]">
          {'€'.repeat(level)}
        </span>
        {/* Inactive euros */}
        <span className="text-[#E5DDD0]">
          {'€'.repeat(4 - level)}
        </span>
      </span>
      {estimate && (
        <span className="text-[#C4B8A5] ml-1">
          ({estimate})
        </span>
      )}
    </span>
  );
}

export default PriceBadge;
