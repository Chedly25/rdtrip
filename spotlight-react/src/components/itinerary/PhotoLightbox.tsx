import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Download from 'yet-another-react-lightbox/plugins/download';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface PhotoLightboxProps {
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function PhotoLightbox({ photos, isOpen, onClose, initialIndex = 0 }: PhotoLightboxProps) {
  // Convert photo URLs to lightbox format
  const slides = photos.map((photo) => ({
    src: photo,
    alt: 'Activity photo',
    download: photo
  }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={initialIndex}
      plugins={[Zoom, Download, Thumbnails]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true
      }}
      thumbnails={{
        position: 'bottom',
        width: 120,
        height: 80,
        border: 2,
        borderRadius: 4,
        padding: 4,
        gap: 16,
        imageFit: 'cover'
      }}
      animation={{ fade: 300, swipe: 250 }}
      carousel={{
        finite: false,
        preload: 2,
        padding: '16px',
        spacing: '30%',
        imageFit: 'contain'
      }}
      controller={{
        closeOnBackdropClick: true,
        closeOnPullDown: true,
        closeOnPullUp: false
      }}
      styles={{
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)'
        }
      }}
    />
  );
}
