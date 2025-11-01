import { ExternalLink, MapPin, Star, Ticket, Camera, Car } from 'lucide-react';

interface URLActionButtonsProps {
  urls: any;
  compact?: boolean;
}

export function URLActionButtons({ urls, compact = false }: URLActionButtonsProps) {
  if (!urls) return null;

  const buttonClass = compact
    ? "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
    : "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors";

  const iconSize = compact ? 12 : 16;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-4'}`}>
      {urls.googleMapsUrl && (
        <a
          href={urls.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="View on Google Maps"
        >
          <MapPin size={iconSize} />
          {!compact && 'Maps'}
        </a>
      )}

      {urls.tripAdvisorUrl && (
        <a
          href={urls.tripAdvisorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="Read reviews on TripAdvisor"
        >
          <Star size={iconSize} />
          {!compact && 'Reviews'}
        </a>
      )}

      {urls.bookingUrl && (
        <a
          href={urls.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="Book on Booking.com"
        >
          <ExternalLink size={iconSize} />
          {!compact && 'Book'}
        </a>
      )}

      {urls.getYourGuideUrl && (
        <a
          href={urls.getYourGuideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="Get tickets on GetYourGuide"
        >
          <Ticket size={iconSize} />
          {!compact && 'Tickets'}
        </a>
      )}

      {urls.openTableUrl && (
        <a
          href={urls.openTableUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="Reserve on OpenTable"
        >
          <ExternalLink size={iconSize} />
          {!compact && 'Reserve'}
        </a>
      )}

      {urls.streetViewUrl && (
        <a
          href={urls.streetViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="View on Street View"
        >
          <Camera size={iconSize} />
          {!compact && 'Street View'}
        </a>
      )}

      {urls.directionsUrl && (
        <a
          href={urls.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="Get directions"
        >
          <Car size={iconSize} />
          {!compact && 'Directions'}
        </a>
      )}

      {urls.photosUrl && (
        <a
          href={urls.photosUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          title="View photos"
        >
          <Camera size={iconSize} />
          {!compact && 'Photos'}
        </a>
      )}
    </div>
  );
}
