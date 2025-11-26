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
        flex-shrink-0 w-[180px] bg-white rounded-2xl p-3 cursor-pointer
        transition-all duration-200 ease-out select-none
        ${isSelected
          ? 'shadow-md ring-2 ring-neutral-900 scale-[1.02]'
          : 'shadow-sm hover:shadow-md hover:scale-[1.01]'
        }
        ${isDragging ? 'shadow-lg z-50 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      <div className="flex gap-3">
        {/* Image Thumbnail */}
        <div className="relative w-[60px] h-[60px] flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100">
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

          {/* City number badge - positioned on image */}
          <div className="absolute top-1 left-1 w-5 h-5 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm">
            <span className="text-[11px] font-semibold text-neutral-900">{index + 1}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* City Name */}
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900 truncate leading-tight">
              {cityName}
            </h3>
            {subtitle && (
              <p className="text-[12px] text-neutral-500 truncate leading-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Bottom row: nights + activity indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-neutral-600">
              <Moon className="w-3 h-3" />
              <span className="text-[12px] font-medium">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>

            {hasActivities && (
              <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export { CompactCityCard };
export type { CompactCityCardProps };
