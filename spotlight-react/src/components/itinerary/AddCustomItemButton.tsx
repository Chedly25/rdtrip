import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCustomItemButtonProps {
  itemType: 'activities' | 'restaurants' | 'accommodations' | 'scenicStops';
  dayId: string;
}

export function AddCustomItemButton({ itemType, dayId }: AddCustomItemButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'search' | 'manual'>('manual');
  const { addCustomItem } = useItineraryStore();

  // Manual entry form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    time: { start: '', end: '' },
    price: '',
  });

  const handleSubmit = () => {
    if (!formData.name) {
      alert('Please enter a name');
      return;
    }

    // Create item based on type
    const item: any = {
      name: formData.name,
      address: formData.address,
      description: formData.description,
    };

    if (itemType === 'activities') {
      item.time = formData.time;
      item.admission = formData.price || 'Free';
      item.type = 'custom';
    } else if (itemType === 'restaurants') {
      item.cuisine = 'Custom';
      item.priceRange = formData.price || '€€';
      item.meal = 'custom';
    }

    addCustomItem(itemType, dayId, item);

    // Reset and close
    setFormData({
      name: '',
      address: '',
      description: '',
      time: { start: '', end: '' },
      price: '',
    });
    setIsOpen(false);
  };

  const getLabel = () => {
    switch (itemType) {
      case 'activities': return 'Activity';
      case 'restaurants': return 'Restaurant';
      case 'accommodations': return 'Hotel';
      case 'scenicStops': return 'Scenic Stop';
      default: return 'Item';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Custom {getLabel()}</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  Add Custom {getLabel()}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setTab('manual')}
                  className={`flex-1 py-3 px-4 font-medium transition-colors ${
                    tab === 'manual'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => setTab('search')}
                  className={`flex-1 py-3 px-4 font-medium transition-colors ${
                    tab === 'search'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Search className="w-4 h-4" />
                    Search (Coming Soon)
                  </div>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {tab === 'manual' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Eiffel Tower, Le Bistro..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="City center, or specific address..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Why do you want to visit? Any special notes..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {itemType === 'activities' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={formData.time.start}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                time: { ...formData.time, start: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={formData.time.end}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                time: { ...formData.time, end: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {itemType === 'activities' ? 'Admission Price' : 'Price Range'}
                      </label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder={itemType === 'activities' ? 'e.g., €15' : 'e.g., €€€'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium">Search feature coming soon!</p>
                    <p className="text-sm mt-2">
                      Google Places integration will allow you to search and add items quickly.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {tab === 'manual' && (
                <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add to Itinerary
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
