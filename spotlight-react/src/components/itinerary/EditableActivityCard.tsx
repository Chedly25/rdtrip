import { useState } from 'react';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { URLActionButtons } from './URLActionButtons';
import { Trash2, RefreshCw, Star, StarOff, Clock, DollarSign, StickyNote, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntityGradient } from '../../utils/gradients';

interface EditableActivityCardProps {
  activity: any;
  dayId?: string;
  isDragging?: boolean;
}

export function EditableActivityCard({ activity, isDragging = false }: EditableActivityCardProps) {
  const { removeItem, editItem, addNote, setFlag, regenerateItem } = useItineraryStore();
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [localTime, setLocalTime] = useState(activity.time);
  const [localAdmission, setLocalAdmission] = useState(activity.admission);
  const [showActions, setShowActions] = useState(false);

  const activityId = activity.id || activity.customId || activity.name;
  const userFlag = activity.userFlag;
  const userNote = activity.userNote || '';
  const hasImage = activity.imageUrl;
  const gradient = getEntityGradient('activity', activity.name);

  const handleSaveTime = () => {
    editItem(activityId, { time: localTime });
    setIsEditingTime(false);
  };

  const handleSavePrice = () => {
    editItem(activityId, { admission: localAdmission });
    setIsEditingPrice(false);
  };

  const handleRemove = () => {
    if (confirm(`Remove "${activity.name}" from your itinerary?`)) {
      removeItem('activities', activityId);
    }
  };

  const handleRegenerate = async () => {
    if (confirm(`Generate an alternative to "${activity.name}"?`)) {
      try {
        await regenerateItem('activities', activityId);
      } catch (error) {
        console.error('Failed to regenerate:', error);
      }
    }
  };

  const toggleFlag = () => {
    if (userFlag === 'must-see') {
      setFlag(activityId, 'optional');
    } else if (userFlag === 'optional') {
      setFlag(activityId, null);
    } else {
      setFlag(activityId, 'must-see');
    }
  };

  return (
    <motion.div
      layout
      className={`relative bg-white rounded-lg border overflow-hidden ${
        userFlag === 'must-see'
          ? 'border-yellow-400 shadow-lg'
          : userFlag === 'optional'
          ? 'border-gray-300'
          : 'border-gray-200'
      } ${isDragging ? 'opacity-50' : 'opacity-100'} transition-all hover:shadow-md group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image Header */}
      {hasImage ? (
        <div className="relative w-full bg-gray-100" style={{ background: gradient }}>
          <img
            src={activity.imageUrl}
            alt={activity.name}
            className="w-full h-48 object-contain"
            onError={(e) => {
              // Fallback to gradient if image fails to load
              const target = e.currentTarget.parentElement;
              if (target) {
                target.innerHTML = `
                  <div class="h-48 flex items-center justify-center" style="background: ${gradient}">
                    <svg class="h-10 w-10 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div
          className="relative h-48 w-full flex items-center justify-center"
          style={{ background: gradient }}
        >
          <MapPin className="h-10 w-10 text-white opacity-40" />
        </div>
      )}

      {/* Content Container */}
      <div className="p-4">
        {/* Flag Badge */}
        {userFlag && (
          <div className={`absolute top-56 left-2 px-2 py-1 rounded-full text-xs font-medium ${
            userFlag === 'must-see'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {userFlag === 'must-see' ? '⭐ Must See' : '○ Optional'}
          </div>
        )}

        {/* Quick Actions */}
        <div className={`absolute top-56 right-2 flex gap-1 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
        <button
          onClick={toggleFlag}
          className="p-1.5 bg-white rounded-md border border-gray-200 hover:bg-yellow-50 transition-colors"
          title={userFlag === 'must-see' ? 'Mark as optional' : 'Mark as must-see'}
        >
          {userFlag === 'must-see' ? (
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <button
          onClick={handleRegenerate}
          className="p-1.5 bg-white rounded-md border border-gray-200 hover:bg-blue-50 transition-colors"
          title="Find alternative"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
        </button>

        <button
          onClick={handleRemove}
          className="p-1.5 bg-white rounded-md border border-gray-200 hover:bg-red-50 transition-colors"
          title="Remove from itinerary"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

        {/* Activity Name */}
        <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${userFlag ? 'mt-8' : 'mt-0'}`}>
          {activity.name}
        </h3>

        {/* Time (Editable) */}
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-gray-400" />
          {isEditingTime ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={localTime?.start || ''}
                onChange={(e) => setLocalTime({ ...localTime, start: e.target.value })}
                className="border rounded px-2 py-1 text-sm"
              />
              <span>-</span>
              <input
                type="time"
                value={localTime?.end || ''}
                onChange={(e) => setLocalTime({ ...localTime, end: e.target.value })}
                className="border rounded px-2 py-1 text-sm"
              />
              <button onClick={handleSaveTime} className="text-sm text-blue-600 hover:underline">
                Save
              </button>
              <button onClick={() => setIsEditingTime(false)} className="text-sm text-gray-500 hover:underline">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTime(true)}
              className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
            >
              {activity.time?.start} - {activity.time?.end}
            </button>
          )}
        </div>

        {/* Price (Editable) */}
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          {isEditingPrice ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={localAdmission}
                onChange={(e) => setLocalAdmission(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-32"
                placeholder="e.g., €15"
              />
              <button onClick={handleSavePrice} className="text-sm text-blue-600 hover:underline">
                Save
              </button>
              <button onClick={() => setIsEditingPrice(false)} className="text-sm text-gray-500 hover:underline">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingPrice(true)}
              className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
            >
              {activity.admission || 'Add price'}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3">{activity.description}</p>

        {/* Personal Note */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <StickyNote className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Personal Note</span>
          </div>
          <textarea
            value={userNote}
            onChange={(e) => addNote(activityId, e.target.value)}
            placeholder="Add your thoughts, reminders, or tips..."
            className="w-full text-sm border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        {/* URL Action Buttons */}
        <URLActionButtons urls={activity.urls} compact />
      </div>
    </motion.div>
  );
}
