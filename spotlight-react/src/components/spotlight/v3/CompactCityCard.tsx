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
        flex-shrink-0 w-[260px] bg-rui-white rounded-rui-24 cursor-pointer overflow-hidden
        transition-all duration-200 ease-out select-none
        ${isSelected
          ? 'shadow-rui-3 ring-2 ring-rui-accent scale-[1.02]'
          : 'shadow-rui-2 hover:shadow-rui-3 hover:scale-[1.01]'
        }
        ${isDragging ? 'shadow-rui-4 z-50 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      {/* Image - Full width, taller */}
      <div className="relative w-full h-[140px] bg-rui-grey-5">
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
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-rui-white/95 backdrop-blur-sm px-2.5 py-1 shadow-sm">
            <span className="text-xs font-semibold text-rui-black">{country}</span>
          </div>
        )}

        {/* City number badge */}
        <div className="absolute top-3 right-3 w-7 h-7 bg-rui-accent rounded-rui-8 flex items-center justify-center shadow-accent">
          <span className="text-xs font-bold text-white">{index + 1}</span>
        </div>

        {/* City name on image */}
        <h3 className="absolute bottom-3 left-3 right-3 font-marketing text-xl font-bold text-white drop-shadow-lg">
          {cityName}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Subtitle */}
        {subtitle && (
          <p className="text-body-2 text-rui-grey-50 mb-3 line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rui-black">
            <Moon className="w-4 h-4 text-rui-grey-50" />
            <span className="text-body-2 font-medium">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          </div>

          {hasActivities && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rui-accent-light">
              <Check className="w-3.5 h-3.5 text-rui-accent" strokeWidth={3} />
              <span className="text-body-3 font-medium text-rui-accent">Activities</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export { CompactCityCard };
export type { CompactCityCardProps };
