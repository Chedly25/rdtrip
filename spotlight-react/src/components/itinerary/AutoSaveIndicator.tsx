import { useItineraryStore } from '../../stores/useItineraryStore';
import { Check, Loader2 } from 'lucide-react';

export function AutoSaveIndicator() {
  const { isDirty, isSaving, lastSaved } = useItineraryStore();

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-1.5 bg-blue-50 rounded-full">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (!isDirty && lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 px-3 py-1.5 bg-green-50 rounded-full">
        <Check className="w-4 h-4" />
        <span>Saved {formatTimeAgo(lastSaved)}</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 px-3 py-1.5 bg-amber-50 rounded-full">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  return null;
}
