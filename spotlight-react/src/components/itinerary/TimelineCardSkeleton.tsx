export function TimelineCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-4">
        {/* Time marker */}
        <div className="flex-shrink-0 w-16 h-4 bg-gray-200 rounded" />

        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg" />

        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md" />

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>

        {/* Rating */}
        <div className="flex-shrink-0 space-y-1">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export function DayCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-pulse">
      {/* Header */}
      <div className="px-6 py-5 border-l-4 border-gray-300">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="flex gap-4">
            <div className="h-6 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="border-t border-gray-100 p-6 space-y-3">
        <TimelineCardSkeleton />
        <TimelineCardSkeleton />
        <TimelineCardSkeleton />
      </div>
    </div>
  );
}
