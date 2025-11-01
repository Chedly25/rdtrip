import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { EditableActivityCard } from './EditableActivityCard';
import { GripVertical } from 'lucide-react';

interface SortableActivityCardProps {
  activity: any;
  dayId: string;
}

function SortableActivityCard({ activity, dayId }: SortableActivityCardProps) {
  const activityId = activity.id || activity.customId || activity.name;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activityId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10 p-2 hover:bg-gray-100 rounded transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>

      {/* Activity Card with left padding for drag handle */}
      <div className="pl-12">
        <EditableActivityCard activity={activity} dayId={dayId} isDragging={isDragging} />
      </div>
    </div>
  );
}

interface SortableActivityListProps {
  activities: any[];
  dayId: string;
}

export function SortableActivityList({ activities, dayId }: SortableActivityListProps) {
  const { reorderItems } = useItineraryStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex(a =>
        (a.id || a.customId || a.name) === active.id
      );
      const newIndex = activities.findIndex(a =>
        (a.id || a.customId || a.name) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(activities, oldIndex, newIndex);
        const newIds = newOrder.map(a => a.id || a.customId || a.name);
        reorderItems(dayId, 'activities', newIds);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activities yet. Click "+ Add Activity" to customize your day.
      </div>
    );
  }

  const activityIds = activities.map(a => a.id || a.customId || a.name);
  const activeActivity = activities.find(a =>
    (a.id || a.customId || a.name) === activeId
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {activities.map((activity) => (
            <SortableActivityCard
              key={activity.id || activity.customId || activity.name}
              activity={activity}
              dayId={dayId}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeActivity ? (
          <div className="pl-12 opacity-90">
            <EditableActivityCard activity={activeActivity} dayId={dayId} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
