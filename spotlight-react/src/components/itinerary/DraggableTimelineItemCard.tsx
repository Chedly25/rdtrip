import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TimelineItemCard } from './TimelineItemCard';

interface DraggableTimelineItemCardProps {
  id: string;
  type: 'activity' | 'restaurant' | 'accommodation' | 'drive';
  time?: string;
  item: any;
  color?: string;
}

export function DraggableTimelineItemCard({
  id,
  type,
  time,
  item,
  color = '#3B82F6'
}: DraggableTimelineItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      {/* Timeline Item Card with left padding for drag handle */}
      <div className="pl-8">
        <TimelineItemCard
          type={type}
          time={time}
          item={item}
          color={color}
        />
      </div>
    </div>
  );
}
