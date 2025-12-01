import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchCityImage } from '../../../services/cityImages';
import { useCompanion } from '../../../contexts/CompanionProvider';

interface CompactCityCardProps {
  id: string;
  cityName: string;
  country?: string;
  index: number;
  nights: number;
  highlight?: string;
  hasActivities?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const CompactCityCard = ({
  id,
  cityName,
  country,
  index,
  nights,
  isSelected,
  onSelect,
}: CompactCityCardProps) => {
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get companion highlight state
  const { isEntityHighlighted } = useCompanion();
  const isHighlightedByCompanion = isEntityHighlighted('city', cityName);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Fetch city image
  useEffect(() => {
    const loadImage = async () => {
      const imageUrl = await fetchCityImage(cityName);
      setCityImage(imageUrl);
    };
    loadImage();
  }, [cityName]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.6 : 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onSelect}
      className={`
        flex-shrink-0 w-[180px] bg-[#FFFBF5] rounded-2xl cursor-pointer overflow-hidden
        transition-all duration-200 ease-out select-none relative
        ${isHighlightedByCompanion
          ? 'shadow-xl ring-2 ring-[#D4A853] scale-[1.03] animate-pulse'
          : isSelected
          ? 'shadow-lg ring-2 ring-[#C45830] scale-[1.02]'
          : 'shadow-md hover:shadow-lg hover:scale-[1.01]'
        }
        ${isDragging ? 'shadow-xl z-50 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      {/* Image Container */}
      <div className="relative w-full h-[120px] bg-[#F5F0E8] overflow-hidden">
        {cityImage && (
          <img
            src={cityImage}
            alt={cityName}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* City number badge - top right */}
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#C45830] rounded-lg flex items-center justify-center shadow-md">
          <span className="text-[11px] font-bold text-white">{index + 1}</span>
        </div>

        {/* Subtle vignette for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content - Clean and minimal */}
      <div className="p-3">
        {/* City name */}
        <h3 className="font-semibold text-[15px] text-[#2C2417] leading-tight mb-1 truncate">
          {cityName}
        </h3>

        {/* Country + Nights row */}
        <div className="flex items-center justify-between">
          {country && (
            <span className="text-xs text-[#8B7355] truncate max-w-[80px]">
              {country}
            </span>
          )}
          <div className="flex items-center gap-1 text-[#8B7355]">
            <Moon className="w-3 h-3" />
            <span className="text-xs font-medium">
              {nights}
            </span>
          </div>
        </div>
      </div>

      {/* Selection indicator - left accent bar */}
      {isSelected && (
        <motion.div
          layoutId="selection-bar"
          className="absolute left-0 top-0 bottom-0 w-1 bg-[#C45830]"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Companion highlight indicator */}
      <AnimatePresence>
        {isHighlightedByCompanion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-[#D4A853] to-[#C45830] rounded-full flex items-center justify-center shadow-lg z-10"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export { CompactCityCard };
export type { CompactCityCardProps };
