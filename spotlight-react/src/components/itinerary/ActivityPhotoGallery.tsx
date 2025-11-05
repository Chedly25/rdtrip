import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GooglePhoto {
  url: string;
  thumbnail?: string;
  attribution?: string;
  width?: number;
  height?: number;
  isPrimary?: boolean;
}

interface ActivityPhotoGalleryProps {
  photos: GooglePhoto[];
  activityName?: string;
}

export function ActivityPhotoGallery({ photos, activityName }: ActivityPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="relative">
        {/* Main Photo */}
        <motion.div
          key={`main-${activeIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={photos[activeIndex].url}
            alt={activityName || 'Activity photo'}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Gradient overlay for attribution */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Photo count badge */}
          {photos.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
              {activeIndex + 1} / {photos.length}
            </div>
          )}

          {/* Attribution (required by Google) */}
          {photos[activeIndex].attribution && (
            <div
              className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
              dangerouslySetInnerHTML={{ __html: photos[activeIndex].attribution || '' }}
            />
          )}

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </motion.div>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {photos.map((photo, idx) => (
              <motion.button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`
                  flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                  ${idx === activeIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={photo.thumbnail || photo.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Photo count */}
            <div className="absolute top-4 left-4 bg-white/10 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
              {activeIndex + 1} / {photos.length}
            </div>

            {/* Main fullscreen image */}
            <motion.div
              key={`fullscreen-${activeIndex}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[activeIndex].url}
                alt={activityName || 'Activity photo'}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />

              {/* Attribution in fullscreen */}
              {photos[activeIndex].attribution && (
                <div
                  className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-2 rounded backdrop-blur-sm"
                  dangerouslySetInnerHTML={{ __html: photos[activeIndex].attribution || '' }}
                />
              )}
            </motion.div>

            {/* Navigation in fullscreen */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Compact version for preview cards
export function CompactPhotoGallery({ photos }: { photos: GooglePhoto[] }) {
  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
      <img
        src={photos[0].thumbnail || photos[0].url}
        alt="Preview"
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {photos.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          +{photos.length - 1} photos
        </div>
      )}
    </div>
  );
}
