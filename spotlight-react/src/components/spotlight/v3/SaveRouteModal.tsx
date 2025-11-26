import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, MapPin, Moon, Loader2, Bookmark } from 'lucide-react';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { Button } from '../../ui';

interface SaveRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

const SaveRouteModal = ({ isOpen, onClose, onSave }: SaveRouteModalProps) => {
  const { route, getCityName } = useSpotlightStoreV2();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const originName = route ? getCityName(route.origin) : 'Unknown';
  const destinationName = route ? getCityName(route.destination) : 'Unknown';
  const totalNights = route?.cities.reduce((sum, city) => sum + (city.nights || 0), 0) || 0;
  const citiesCount = route?.cities.length || 0;

  const getDefaultName = () => {
    return `${originName} to ${destinationName}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSave(name || getDefaultName());
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-rui-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative bg-white rounded-rui-24 shadow-rui-4 w-full max-w-md overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-rui-grey-5 hover:bg-rui-grey-10 flex items-center justify-center transition-colors duration-rui-sm"
          >
            <X className="w-5 h-5 text-rui-black" />
          </button>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-rui-grey-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rui-grey-5 rounded-rui-12 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-rui-black" />
              </div>
              <div>
                <h2 className="text-heading-2 text-rui-black">Save Route</h2>
                <p className="text-body-3 text-rui-grey-50">
                  Give your route a memorable name
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Route Name Input */}
              <div>
                <label htmlFor="routeName" className="block text-emphasis-2 text-rui-black mb-2">
                  Route Name
                </label>
                <input
                  id="routeName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={getDefaultName()}
                  className="w-full px-4 py-3 bg-rui-grey-2 border border-rui-grey-10 rounded-rui-12 text-rui-black placeholder-rui-grey-50 focus:outline-none focus:ring-2 focus:ring-rui-black focus:border-transparent transition-all duration-rui-sm"
                  disabled={isLoading}
                />
                <p className="text-body-3 text-rui-grey-50 mt-2">
                  Leave blank to use default name
                </p>
              </div>

              {/* Route Info */}
              {route && (
                <div className="bg-rui-grey-2 rounded-rui-16 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rui-grey-50" />
                      <span className="text-body-2 text-rui-grey-50">Route</span>
                    </div>
                    <span className="text-emphasis-2 text-rui-black">
                      {originName} → {destinationName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rui-grey-50" />
                      <span className="text-body-2 text-rui-grey-50">Cities</span>
                    </div>
                    <span className="text-emphasis-2 text-rui-black">{citiesCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-rui-grey-50" />
                      <span className="text-body-2 text-rui-grey-50">Nights</span>
                    </div>
                    <span className="text-emphasis-2 text-rui-black">{totalNights}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-rui-12 p-3">
                  <p className="text-body-2 text-danger">{error}</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Route'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export { SaveRouteModal };
export type { SaveRouteModalProps };
