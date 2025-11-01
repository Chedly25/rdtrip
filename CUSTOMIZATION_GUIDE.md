# User Customization Features - Implementation Guide

## ✅ COMPLETED (Part 3 Foundation)

### Backend Infrastructure
- ✅ Database migration for modification tracking
- ✅ API endpoints for all CRUD operations
- ✅ Zustand store with full state management
- ✅ Optimistic updates with auto-save

### API Endpoints Available
```
PATCH /api/itinerary/:id/customize       - Save customizations
DELETE /api/itinerary/:id/items/:type/:id - Remove items
POST /api/itinerary/:id/items            - Add custom items
POST /api/itinerary/:id/regenerate-item  - Regenerate single item
```

### Zustand Store Usage
```typescript
import { useItineraryStore } from '@/stores/useItineraryStore';

// In your component:
const {
  removeItem,
  addCustomItem,
  editItem,
  reorderItems,
  addNote,
  setFlag,
  getEffectiveItinerary
} = useItineraryStore();

// Remove an activity
removeItem('activities', 'activity-id-123');

// Add custom restaurant
addCustomItem('restaurants', 'day-2', {
  name: "My Favorite Bistro",
  cuisine: "French",
  priceRange: "€€€",
  // ... other fields
});

// Edit item inline
editItem('activity-id-123', {
  time: { start: '10:00', end: '12:00' },
  estimatedCostPerPerson: 25
});

// Reorder with drag & drop
reorderItems('day-1', 'activities', ['id3', 'id1', 'id2']);

// Add personal note
addNote('activity-id-123', "Must visit at sunset!");

// Flag as must-see
setFlag('activity-id-123', 'must-see');

// Get merged itinerary (original + customizations)
const itinerary = getEffectiveItinerary();
```

## 🚧 TO IMPLEMENT (UI Components)

### 1. Editable Card Components

#### EditableActivityCard.tsx
```typescript
import { useState } from 'react';
import { useItineraryStore } from '@/stores/useItineraryStore';
import { Trash2, RefreshCw, Star, Clock, DollarSign } from 'lucide-react';

interface Props {
  activity: any;
  dayId: string;
}

export function EditableActivityCard({ activity, dayId }: Props) {
  const { removeItem, editItem, addNote, setFlag, regenerateItem } = useItineraryStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(activity);

  const handleSave = () => {
    editItem(activity.id, localData);
    setIsEditing(false);
  };

  return (
    <div className="activity-card group relative">
      {/* Quick Actions (show on hover) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => setFlag(activity.id, activity.userFlag === 'must-see' ? null : 'must-see')}>
          <Star className={activity.userFlag === 'must-see' ? 'fill-yellow-400' : ''} />
        </button>
        <button onClick={() => regenerateItem('activities', activity.id)}>
          <RefreshCw />
        </button>
        <button onClick={() => removeItem('activities', activity.id)}>
          <Trash2 className="text-red-500" />
        </button>
      </div>

      {/* Content */}
      {isEditing ? (
        <div>
          <input
            value={localData.time?.start}
            onChange={(e) => setLocalData({...localData, time: {...localData.time, start: e.target.value}})}
          />
          <input
            value={localData.admission}
            onChange={(e) => setLocalData({...localData, admission: e.target.value})}
          />
          <button onClick={handleSave}>Save</button>
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)}>
          <h3>{activity.name}</h3>
          <p>{activity.time?.start} - {activity.time?.end}</p>
          <p>{activity.admission}</p>
        </div>
      )}

      {/* User Note */}
      <textarea
        placeholder="Add personal note..."
        value={activity.userNote || ''}
        onChange={(e) => addNote(activity.id, e.target.value)}
      />

      {/* Action Buttons (URLs from Part 2) */}
      {activity.urls && (
        <div className="flex gap-2">
          <a href={activity.urls.googleMapsUrl} target="_blank">Maps</a>
          <a href={activity.urls.tripAdvisorUrl} target="_blank">Reviews</a>
          <a href={activity.urls.getYourGuideUrl} target="_blank">Tickets</a>
        </div>
      )}
    </div>
  );
}
```

### 2. Drag & Drop Implementation

#### SortableActivityList.tsx
```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useItineraryStore } from '@/stores/useItineraryStore';
import { SortableActivityCard } from './SortableActivityCard';

export function SortableActivityList({ activities, dayId }: Props) {
  const { reorderItems } = useItineraryStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex(a => a.id === active.id);
      const newIndex = activities.findIndex(a => a.id === over.id);

      const newOrder = arrayMove(activities, oldIndex, newIndex);
      reorderItems(dayId, 'activities', newOrder.map(a => a.id));
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
        {activities.map(activity => (
          <SortableActivityCard key={activity.id} activity={activity} dayId={dayId} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

#### SortableActivityCard.tsx (with drag handle)
```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { EditableActivityCard } from './EditableActivityCard';

export function SortableActivityCard({ activity, dayId }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: activity.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab">
        <GripVertical className="text-gray-400" />
      </div>

      {/* Activity Card */}
      <EditableActivityCard activity={activity} dayId={dayId} />
    </div>
  );
}
```

### 3. Add Custom Item Component

#### AddCustomItemButton.tsx
```typescript
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useItineraryStore } from '@/stores/useItineraryStore';
import { CustomItemModal } from './CustomItemModal';

export function AddCustomItemButton({ itemType, dayId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { addCustomItem } = useItineraryStore();

  const handleAdd = (item: any) => {
    addCustomItem(itemType, dayId, item);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="add-item-button">
        <Plus /> Add {itemType}
      </button>

      {isOpen && (
        <CustomItemModal
          itemType={itemType}
          onSave={handleAdd}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

#### CustomItemModal.tsx (with Google Places search)
```typescript
import { useState } from 'react';
import { Search } from 'lucide-react';

export function CustomItemModal({ itemType, onSave, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [manualEntry, setManualEntry] = useState({});

  const handleSearch = async () => {
    // TODO: Implement Google Places API search
    const results = await searchPlaces(searchQuery);
    setSearchResults(results);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add Custom {itemType}</h2>

        {/* Search Tab */}
        <div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for restaurants, activities..."
          />
          <button onClick={handleSearch}><Search /></button>

          {searchResults.map(result => (
            <div key={result.id} onClick={() => onSave(result)}>
              {result.name} - {result.address}
            </div>
          ))}
        </div>

        {/* Manual Entry Tab */}
        <div>
          <input placeholder="Name" onChange={(e) => setManualEntry({...manualEntry, name: e.target.value})} />
          <input placeholder="Address" onChange={(e) => setManualEntry({...manualEntry, address: e.target.value})} />
          <button onClick={() => onSave(manualEntry)}>Add Manually</button>
        </div>

        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
```

### 4. Auto-Save Indicator

#### AutoSaveIndicator.tsx
```typescript
import { useItineraryStore } from '@/stores/useItineraryStore';
import { Check, Loader } from 'lucide-react';

export function AutoSaveIndicator() {
  const { isDirty, isSaving, lastSaved } = useItineraryStore();

  if (isSaving) {
    return (
      <div className="save-indicator">
        <Loader className="animate-spin" /> Saving...
      </div>
    );
  }

  if (!isDirty && lastSaved) {
    return (
      <div className="save-indicator text-green-600">
        <Check /> Saved {formatTimeAgo(lastSaved)}
      </div>
    );
  }

  return null;
}
```

### 5. URL Action Buttons (from Part 2)

#### URLActionButtons.tsx
```typescript
export function URLActionButtons({ urls }: { urls: any }) {
  if (!urls) return null;

  return (
    <div className="url-actions flex flex-wrap gap-2 mt-4">
      {urls.googleMapsUrl && (
        <a href={urls.googleMapsUrl} target="_blank" className="btn btn-sm">
          📍 Maps
        </a>
      )}
      {urls.tripAdvisorUrl && (
        <a href={urls.tripAdvisorUrl} target="_blank" className="btn btn-sm">
          ⭐ Reviews
        </a>
      )}
      {urls.bookingUrl && (
        <a href={urls.bookingUrl} target="_blank" className="btn btn-sm">
          🏨 Book
        </a>
      )}
      {urls.getYourGuideUrl && (
        <a href={urls.getYourGuideUrl} target="_blank" className="btn btn-sm">
          🎫 Tickets
        </a>
      )}
      {urls.streetViewUrl && (
        <a href={urls.streetViewUrl} target="_blank" className="btn btn-sm">
          👁️ Street View
        </a>
      )}
    </div>
  );
}
```

## Implementation Checklist

- [ ] Create EditableActivityCard.tsx
- [ ] Create EditableRestaurantCard.tsx
- [ ] Create EditableAccommodationCard.tsx
- [ ] Create SortableActivityList.tsx
- [ ] Create SortableActivityCard.tsx
- [ ] Create AddCustomItemButton.tsx
- [ ] Create CustomItemModal.tsx
- [ ] Create AutoSaveIndicator.tsx
- [ ] Create URLActionButtons.tsx
- [ ] Update ItineraryTimeline.tsx to use editable components
- [ ] Add Google Places API integration
- [ ] Style all components
- [ ] Test drag & drop
- [ ] Test inline editing
- [ ] Test custom item addition
- [ ] Deploy and test in production

## Next Steps

1. **Implement the UI components** following the patterns above
2. **Integrate Google Places API** for custom item search
3. **Add animations** with Framer Motion for smooth transitions
4. **Test thoroughly** - try all CRUD operations
5. **Deploy** and verify in production

The foundation is rock-solid. The store and API are production-ready!
