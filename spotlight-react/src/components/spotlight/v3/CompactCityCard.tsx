import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchCityImage } from '../../../services/cityImages';

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
  highlight,
  hasActivities = false,
  isSelected,
  onSelect,
}: CompactCityCardProps) => {
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  // Display text - highlight or country fallback
  const subtitle = highlight || country || '';

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
        flex-shrink-0 w-[140px] bg-white rounded-xl cursor-pointer overflow-hidden
        transition-all duration-200 ease-out select-none
        ${isSelected
          ? 'shadow-md ring-2 ring-neutral-900 scale-[1.02]'
          : 'shadow-sm hover:shadow-md hover:scale-[1.01]'
        }
        ${isDragging ? 'shadow-lg z-50 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      {/* Image - Full width, fixed height */}
      <div className="relative w-full h-[80px] bg-neutral-100">
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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* City number badge */}
        <div className="absolute top-2 left-2 w-5 h-5 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-bold text-neutral-900">{index + 1}</span>
        </div>

        {/* Activity indicator */}
        {hasActivities && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}

        {/* City name on image */}
        <h3 className="absolute bottom-2 left-2 right-2 text-sm font-semibold text-white truncate drop-shadow-md">
          {cityName}
        </h3>
      </div>

      {/* Content - Compact */}
      <div className="p-2.5">
        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] text-neutral-500 truncate mb-1.5 leading-tight">
            {subtitle}
          </p>
        )}

        {/* Nights */}
        <div className="flex items-center gap-1 text-neutral-700">
          <Moon className="w-3 h-3" />
          <span className="text-[11px] font-medium">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export { CompactCityCard };
export type { CompactCityCardProps };
