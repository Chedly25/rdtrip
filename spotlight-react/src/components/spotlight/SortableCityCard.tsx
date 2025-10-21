import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CityCard } from './CityCard'
import type { Waypoint } from '../../types'

interface SortableCityCardProps {
  waypoint: Waypoint
  onRemove?: (id: string) => void
  onClick?: () => void
}

export function SortableCityCard({ waypoint, onRemove, onClick }: SortableCityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CityCard
        waypoint={waypoint}
        onRemove={onRemove}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  )
}
