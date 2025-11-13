import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, MapPin, Plus, Navigation } from 'lucide-react';
import type { Landmark } from '../../../services/landmarks';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { useState } from 'react';

interface LandmarkDetailsModalProps {
  landmark: Landmark | null;
  onClose: () => void;
}

const LandmarkDetailsModal = ({ landmark, onClose }: LandmarkDetailsModalProps) => {
  const { addLandmarkToRoute, getAgentColors } = useSpotlightStoreV2();
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const agentColors = getAgentColors();

  if (!landmark) return null;

  const handleAddToRoute = async () => {
    setIsAdding(true);
    try {
      // Add landmark to route (store will handle route recalculation)
      await addLandmarkToRoute(landmark);
      setAddSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        setAddSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to add landmark to route:', error);
      setIsAdding(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Landmark Image */}
          {landmark.image_url && (
            <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={landmark.image_url}
                alt={landmark.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback gradient if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%)`
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {landmark.name}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{landmark.city}, {landmark.country}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-200">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${agentColors.primary}20, ${agentColors.secondary}20)`
                  }}
                >
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">
                    {landmark.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Visit Duration */}
              {landmark.visit_duration > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {landmark.visit_duration < 60
                      ? `${landmark.visit_duration} min`
                      : `${Math.round(landmark.visit_duration / 60)} hr`
                    } visit
                  </span>
                </div>
              )}

              {/* Type */}
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                  }}
                >
                  {landmark.type}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {landmark.description || 'A must-see attraction on your European road trip!'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Add to Route Button */}
              <button
                onClick={handleAddToRoute}
                disabled={isAdding || addSuccess}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: addSuccess
                    ? '#10b981' // Green on success
                    : `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                }}
              >
                {addSuccess ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      ✓
                    </motion.div>
                    Added to Route!
                  </>
                ) : isAdding ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Navigation className="w-5 h-5" />
                    </motion.div>
                    Calculating Route...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add to Route
                  </>
                )}
              </button>

              {/* View on Map Button */}
              <button
                onClick={() => {
                  // Zoom to landmark location
                  onClose();
                }}
                className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                View on Map
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LandmarkDetailsModal;
