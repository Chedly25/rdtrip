import { motion } from 'framer-motion';
import { Star, X } from 'lucide-react';

interface LandmarkMarkerProps {
  landmarkName: string;
  landmarkImage?: string; // Path to landmark image in /images/landmarks/
  isHovered: boolean;
  detourInfo?: {
    km: number;
    minutes: number;
  };
  agentColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onClick: () => void;
  onRemove?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const LandmarkMarker = ({
  landmarkName,
  landmarkImage,
  isHovered,
  detourInfo,
  agentColors,
  onClick,
  onRemove,
  onMouseEnter,
  onMouseLeave
}: LandmarkMarkerProps) => {
  return (
    <div
      className="flex flex-col items-center cursor-pointer"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Landmark info tooltip - positioned above */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 10
        }}
        className="mb-2 whitespace-nowrap pointer-events-none"
      >
        <div
          className="px-3 py-2 rounded-lg shadow-xl border border-white/20 backdrop-blur-md"
          style={{
            background: `linear-gradient(135deg, ${agentColors.primary}E6, ${agentColors.secondary}E6)`
          }}
        >
          <p className="text-white font-semibold text-sm mb-1">
            {landmarkName}
          </p>
          {detourInfo && (
            <p className="text-white/80 text-xs">
              +{detourInfo.km.toFixed(1)} km • +{Math.round(detourInfo.minutes)} min
            </p>
          )}
        </div>
      </motion.div>

      {/* Marker container */}
      <motion.div
        initial={false}
        animate={{
          scale: isHovered ? 1.15 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
        className="flex flex-col items-center"
      >
        {/* Glow effect */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="absolute w-12 h-12 blur-lg rounded-full"
            style={{
              background: agentColors.accent,
              transform: 'scale(1.8)'
            }}
          />
        )}

        {/* Landmark circle - relative for remove button positioning */}
        <div className="relative">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-3 border-white overflow-hidden flex-shrink-0"
            style={{
              background: landmarkImage
                ? 'white'
                : `linear-gradient(135deg, ${agentColors.accent}, ${agentColors.secondary})`
            }}
          >
            {landmarkImage ? (
              <img
                src={landmarkImage}
                alt={landmarkName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Star className="w-5 h-5 text-white fill-white" />
            )}
          </div>

          {/* Remove button (only on hover) */}
          {isHovered && onRemove && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </div>

        {/* Pin pointer - INSIDE flex container so it's part of element height */}
        <div
          className="w-0 h-0 flex-shrink-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `10px solid ${agentColors.secondary}`,
            marginTop: '-2px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
      </motion.div>
    </div>
  );
};

export default LandmarkMarker;
