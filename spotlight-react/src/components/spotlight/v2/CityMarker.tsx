import { motion } from 'framer-motion';

interface CityMarkerProps {
  index: number;
  cityName: string;
  isSelected: boolean;
  isHovered: boolean;
  agentColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const CityMarker = ({
  index,
  cityName,
  isSelected,
  isHovered,
  agentColors,
  onClick,
  onMouseEnter,
  onMouseLeave
}: CityMarkerProps) => {
  return (
    <div
      className="relative cursor-pointer"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      // Removed transform - Mapbox anchor handles positioning
    >
      {/* Marker pin */}
      <motion.div
        initial={{ scale: 0, y: -20 }}
        animate={{
          scale: isSelected || isHovered ? 1.2 : 1,
          y: 0
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20
        }}
        className="relative"
      >
        {/* Glow effect */}
        {(isSelected || isHovered) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="absolute inset-0 blur-xl rounded-full"
            style={{
              background: agentColors.accent,
              transform: 'scale(1.5)'
            }}
          />
        )}

        {/* Pin body */}
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white"
          style={{
            background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
          }}
        >
          <span className="text-white font-bold text-lg z-10">
            {index + 1}
          </span>
        </div>

        {/* Pin pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `12px solid ${agentColors.secondary}`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
      </motion.div>

      {/* City name tooltip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: isHovered || isSelected ? 1 : 0,
          y: isHovered || isSelected ? -10 : 0
        }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap"
      >
        <div
          className="px-3 py-2 rounded-lg shadow-xl border border-white/20 backdrop-blur-md"
          style={{
            background: `linear-gradient(135deg, ${agentColors.primary}E6, ${agentColors.secondary}E6)`
          }}
        >
          <p className="text-white font-semibold text-sm">
            {cityName}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CityMarker;
