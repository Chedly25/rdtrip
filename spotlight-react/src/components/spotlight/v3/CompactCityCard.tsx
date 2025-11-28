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
        flex-shrink-0 w-[260px] bg-white rounded-2xl cursor-pointer overflow-hidden
        transition-all duration-200 ease-out select-none
        ${isSelected
          ? 'shadow-lg ring-2 ring-neutral-900 scale-[1.02]'
          : 'shadow-md hover:shadow-lg hover:scale-[1.01]'
        }
        ${isDragging ? 'shadow-xl z-50 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      {/* Image - Full width, taller */}
      <div className="relative w-full h-[140px] bg-neutral-100">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Country badge */}
        {country && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 shadow-sm">
            <span className="text-xs font-semibold text-neutral-800">{country}</span>
          </div>
        )}

        {/* City number badge */}
        <div className="absolute top-3 right-3 w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center shadow-md">
          <span className="text-xs font-bold text-white">{index + 1}</span>
        </div>

        {/* City name on image */}
        <h3 className="absolute bottom-3 left-3 right-3 text-xl font-bold text-white drop-shadow-lg">
          {cityName}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-neutral-500 mb-3 line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-700">
            <Moon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          </div>

          {hasActivities && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50">
              <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
              <span className="text-xs font-medium text-emerald-700">Activities</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export { CompactCityCard };
export type { CompactCityCardProps };
