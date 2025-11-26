import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, MapPin, Utensils, ChevronRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NightStepper } from '../../ui';
import { fetchCityImage } from '../../../services/cityImages';

interface CityCardProps {
  id: string;
  cityName: string;
  country?: string;
  index: number;
  nights: number;
  activitiesCount?: number;
  restaurantsCount?: number;
  isSelected: boolean;
  onSelect: () => void;
  onNightsChange: (nights: number) => void;
  onViewDetails: () => void;
}

const CityCard = ({
  id,
  cityName,
  country,
  index,
  nights,
  activitiesCount = 0,
  restaurantsCount = 0,
  isSelected,
  onSelect,
  onNightsChange,
  onViewDetails,
}: CityCardProps) => {
  const [cityImage, setCityImage] = useState<string | null>(null);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.15, 0.5, 0.5, 1] }}
      className={`
        flex-shrink-0 w-72 bg-white rounded-rui-24 overflow-hidden
        transition-all duration-rui-sm ease-rui-default cursor-pointer
        ${isSelected
          ? 'ring-2 ring-rui-black shadow-rui-4 scale-[1.02]'
          : 'shadow-rui-2 hover:shadow-rui-3 hover:scale-[1.01]'
        }
        ${isDragging ? 'shadow-rui-4 z-50' : ''}
      `}
      onClick={onSelect}
    >
      {/* Image Section */}
      <div className="relative h-36 bg-rui-grey-5">
        {cityImage && (
          <img
            src={cityImage}
            alt={cityName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* City number badge */}
        <div className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-rui-2">
          <span className="text-emphasis-2 text-rui-black">{index + 1}</span>
        </div>

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-rui-8 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-rui-1 hover:bg-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-rui-grey-50" />
        </div>

        {/* City name on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-heading-3 text-white truncate">{cityName}</h3>
          {country && (
            <p className="text-body-3 text-white/80">{country}</p>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Night Stepper */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-body-2 text-rui-grey-50">Nights</span>
          <NightStepper
            value={nights}
            onChange={(value) => {
              onNightsChange(value);
            }}
            min={0}
            max={14}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4">
          {activitiesCount > 0 && (
            <div className="flex items-center gap-1.5 text-body-3 text-rui-grey-50">
              <MapPin className="w-3.5 h-3.5" />
              <span>{activitiesCount} activities</span>
            </div>
          )}
          {restaurantsCount > 0 && (
            <div className="flex items-center gap-1.5 text-body-3 text-rui-grey-50">
              <Utensils className="w-3.5 h-3.5" />
              <span>{restaurantsCount} restaurants</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="w-full py-2.5 flex items-center justify-center gap-1.5 text-emphasis-2 text-rui-black hover:bg-rui-grey-5 rounded-rui-12 transition-colors duration-rui-sm"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export { CityCard };
export type { CityCardProps };
