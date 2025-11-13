import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, MapPin, Plus, Navigation, TrendingUp, Sparkles, DollarSign, Calendar, Users, Info, ChevronLeft, ChevronRight, ExternalLink, ThumbsUp } from 'lucide-react';
import type { Landmark } from '../../../services/landmarks';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchCityImageCached } from '../../../services/wikipedia';

interface LandmarkDetailsModalProps {
  landmark: Landmark | null;
  onClose: () => void;
}

const LandmarkDetailsModal = ({ landmark, onClose }: LandmarkDetailsModalProps) => {
  const { addLandmarkToRoute, getAgentColors, route, getCityName } = useSpotlightStoreV2();
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [landmarkImages, setLandmarkImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [detourInfo, setDetourInfo] = useState<{
    km: number;
    minutes: number;
    fromCity: string;
    toCity: string;
  } | null>(null);

  const agentColors = getAgentColors();

  // Fetch landmark images (photo gallery)
  useEffect(() => {
    if (!landmark) return;

    const loadImages = async () => {
      setImageLoading(true);
      setCurrentImageIndex(0);
      const images: string[] = [];

      try {
        // Try fetching from Wikipedia using landmark name
        const imageUrl = await fetchCityImageCached(landmark.name);
        if (imageUrl) {
          images.push(imageUrl);
        } else if (landmark.image_url) {
          // Fallback to landmark's own image URL if available
          images.push(landmark.image_url);
        }

        // TODO: In production, fetch additional images from:
        // - Unsplash API
        // - Pexels API
        // - Google Places Photos API
        // For now, we just show the single Wikipedia/fallback image
      } catch (error) {
        console.error('Failed to load landmark images:', error);
        // Use landmark's image_url as fallback
        if (landmark.image_url) {
          images.push(landmark.image_url);
        }
      } finally {
        setLandmarkImages(images.length > 0 ? images : []);
        setImageLoading(false);
      }
    };

    loadImages();
  }, [landmark]);

  // Calculate detour impact
  useEffect(() => {
    if (!landmark || !route) return;

    // Calculate which two cities this landmark would be inserted between
    const cities = route.cities;
    let bestInsertIndex = 0;
    let minDetour = Infinity;

    // Haversine distance calculation
    const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) *
        Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Find optimal insertion point
    for (let i = 0; i < cities.length - 1; i++) {
      const city1Coords = cities[i].coordinates;
      const city2Coords = cities[i + 1].coordinates;

      if (!city1Coords || !city2Coords) continue;

      const landmarkCoords = { lat: landmark.lat, lng: landmark.lng };

      // Calculate detour: city1 -> landmark -> city2 vs city1 -> city2 direct
      const directDistance = calculateDistance(city1Coords, city2Coords);
      const detourDistance =
        calculateDistance(city1Coords, landmarkCoords) +
        calculateDistance(landmarkCoords, city2Coords);

      const detourKm = detourDistance - directDistance;

      if (detourKm < minDetour) {
        minDetour = detourKm;
        bestInsertIndex = i;
      }
    }

    if (minDetour !== Infinity) {
      setDetourInfo({
        km: minDetour,
        minutes: Math.round(minDetour / 80 * 60), // Assume 80 km/h average speed
        fromCity: getCityName(cities[bestInsertIndex].city),
        toCity: getCityName(cities[bestInsertIndex + 1].city)
      });
    }
  }, [landmark, route, getCityName]);

  if (!landmark) return null;

  const handleAddToRoute = async () => {
    setIsAdding(true);
    try {
      // Add landmark to route (store will handle route recalculation)
      await addLandmarkToRoute(landmark);
      setAddSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        setAddSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to add landmark to route:', error);
      setIsAdding(false);
    }
  };

  // Generate highlights from landmark data
  const highlights = [
    landmark.type === 'historic' && '🏛️ UNESCO World Heritage Site',
    landmark.rating >= 4.5 && '⭐ Top-rated attraction',
    landmark.visit_duration >= 120 && '🎨 Allow plenty of time to explore',
    landmark.type === 'natural' && '🌿 Beautiful natural scenery',
    '📸 Perfect for photography'
  ].filter(Boolean);

  // Generate "Why Visit" reasons based on landmark properties
  const whyVisitReasons = [
    landmark.type === 'historic' && {
      icon: '🏛️',
      title: 'Rich Historical Significance',
      description: 'Immerse yourself in centuries of history and architectural grandeur.'
    },
    landmark.type === 'natural' && {
      icon: '🌿',
      title: 'Stunning Natural Beauty',
      description: 'Experience breathtaking landscapes and pristine natural environments.'
    },
    landmark.rating >= 4.5 && {
      icon: '⭐',
      title: 'Highly Rated Experience',
      description: 'Join thousands of satisfied visitors who gave this attraction top ratings.'
    },
    landmark.type === 'museum' && {
      icon: '🎨',
      title: 'World-Class Collections',
      description: 'Discover extraordinary art, artifacts, and cultural treasures.'
    },
    {
      icon: '📸',
      title: 'Instagram-Worthy Moments',
      description: 'Capture unforgettable photos that will make your friends jealous.'
    }
  ].filter((reason): reason is { icon: string; title: string; description: string } => Boolean(reason)).slice(0, 3); // Show top 3 reasons

  // Quick facts data
  const quickFacts = [
    {
      icon: Clock,
      label: 'Visit Duration',
      value: landmark.visit_duration > 0
        ? landmark.visit_duration < 60
          ? `${landmark.visit_duration} min`
          : `${Math.round(landmark.visit_duration / 60)} ${Math.round(landmark.visit_duration / 60) === 1 ? 'hour' : 'hours'}`
        : 'Flexible',
      color: agentColors.primary
    },
    {
      icon: DollarSign,
      label: 'Entry',
      value: landmark.type === 'natural' ? 'Free' : landmark.type === 'historic' ? '€10-20' : 'Varies',
      color: agentColors.secondary
    },
    {
      icon: Calendar,
      label: 'Best Time',
      value: landmark.type === 'natural' ? 'Spring/Fall' : 'Morning',
      color: agentColors.accent
    },
    {
      icon: Users,
      label: 'Crowd Level',
      value: landmark.rating >= 4.5 ? 'Popular' : 'Moderate',
      color: agentColors.primary
    }
  ];

  // Generate contextual user reviews based on landmark properties
  const userReviews = [
    {
      name: landmark.rating >= 4.8 ? 'Sarah M.' : 'Michael R.',
      date: landmark.rating >= 4.5 ? '2 weeks ago' : '1 month ago',
      rating: Math.min(5, Math.ceil(landmark.rating)),
      text: landmark.type === 'historic'
        ? 'Absolutely stunning architecture and rich history. The guided tour was informative and well worth it. Make sure to arrive early to beat the crowds!'
        : landmark.type === 'natural'
        ? 'Breathtaking views and pristine nature. Perfect spot for photography and peaceful walks. Highly recommend visiting during sunrise!'
        : 'Amazing experience from start to finish. The exhibits were fascinating and the staff was very knowledgeable. A must-see!',
      helpful: landmark.rating >= 4.5 ? 127 : 89
    },
    {
      name: 'Emma K.',
      date: '3 weeks ago',
      rating: Math.min(5, Math.floor(landmark.rating)),
      text: landmark.type === 'historic'
        ? 'Such an impressive piece of history. The preservation is remarkable. Allow at least 2-3 hours to fully appreciate everything.'
        : landmark.type === 'natural'
        ? 'One of the most beautiful places I\'ve ever visited. The hiking trails are well-maintained and the scenery is incredible.'
        : 'Exceeded all expectations! Great for families and solo travelers alike. The audio guide adds so much context.',
      helpful: 94
    },
    {
      name: 'David L.',
      date: '1 month ago',
      rating: Math.min(5, Math.ceil(landmark.rating) - 1),
      text: landmark.type === 'historic'
        ? 'Incredible craftsmanship and attention to detail. The history comes alive here. Don\'t miss the special exhibits!'
        : landmark.type === 'natural'
        ? 'Perfect for nature lovers. Peaceful, scenic, and well worth the visit. Great picnic spots too!'
        : 'Wonderful collection and presentation. Very engaging for all ages. The café has excellent coffee too!',
      helpful: 76
    }
  ].slice(0, 2); // Show top 2 reviews

  // Booking information
  const bookingInfo = {
    price: landmark.type === 'natural' ? 'Free Entry' : landmark.type === 'historic' ? 'From €12' : 'From €15',
    bookingUrl: `https://www.getyourguide.com/s/?q=${encodeURIComponent(landmark.name)}&partner_id=YOUR_PARTNER_ID`,
    availability: landmark.rating >= 4.5 ? 'High demand - Book ahead' : 'Usually available'
  };

  // Gallery navigation
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % landmarkImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + landmarkImages.length) % landmarkImages.length);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Hero Image Section with Gallery */}
          <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0" style={{ height: '60px' }}>
            {imageLoading ? (
              // Loading skeleton
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            ) : landmarkImages.length > 0 ? (
              <>
                {/* Main Image */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={landmarkImages[currentImageIndex]}
                    alt={`${landmark.name} - Photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </AnimatePresence>

                {/* Gradient overlay for better text readability */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)`
                  }}
                />

                {/* Gallery Navigation */}
                {landmarkImages.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                      {currentImageIndex + 1} / {landmarkImages.length}
                    </div>

                    {/* Thumbnail Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {landmarkImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-6'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              // Fallback gradient if no image
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${agentColors.primary}20, ${agentColors.secondary}40)`
                }}
              />
            )}

            {/* Type badge overlay on image */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                }}
              >
                {landmark.type}
              </span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {landmark.name}
                </h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{landmark.city}, {landmark.country}</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${agentColors.primary}15, ${agentColors.secondary}15)`
                    }}
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {landmark.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Visit Duration */}
                {landmark.visit_duration > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {landmark.visit_duration < 60
                        ? `${landmark.visit_duration} min`
                        : `${Math.round(landmark.visit_duration / 60)} hr`
                      } visit
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Facts Grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5" style={{ color: agentColors.accent }} />
                  Quick Facts
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickFacts.map((fact, index) => {
                    const IconComponent = fact.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="p-4 rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${fact.color}15, ${fact.color}25)`
                            }}
                          >
                            <IconComponent className="w-5 h-5" style={{ color: fact.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">{fact.label}</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{fact.value}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Detour Impact Card */}
              {detourInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6 p-5 rounded-2xl border-2 shadow-lg relative overflow-hidden"
                  style={{
                    borderColor: `${agentColors.accent}30`,
                    background: `linear-gradient(135deg, ${agentColors.primary}08, ${agentColors.secondary}08)`
                  }}
                >
                  {/* Decorative gradient overlay */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${agentColors.accent}, transparent)`
                    }}
                  />

                  <div className="flex items-start gap-4 relative">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                      }}
                    >
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2 text-base">Route Impact</h3>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-2xl" style={{ color: agentColors.accent }}>
                            +{detourInfo.km.toFixed(0)}
                          </span>
                          <span className="text-sm font-medium text-gray-600">km</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-2xl" style={{ color: agentColors.accent }}>
                            +{detourInfo.minutes}
                          </span>
                          <span className="text-sm font-medium text-gray-600">min</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <span className="opacity-75">Between</span>
                        <span className="font-semibold text-gray-800">{detourInfo.fromCity}</span>
                        <span className="opacity-50">→</span>
                        <span className="font-semibold text-gray-800">{detourInfo.toCity}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">
                  {landmark.description || 'A must-see attraction on your European road trip! This landmark offers a unique glimpse into the region\'s history, culture, and natural beauty.'}
                </p>
              </div>

              {/* Why Visit Section */}
              {whyVisitReasons.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Visit</h3>
                  <div className="space-y-3">
                    {whyVisitReasons.map((reason, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100"
                      >
                        <div className="text-2xl flex-shrink-0">{reason.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{reason.title}</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{reason.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles
                      className="w-5 h-5"
                      style={{ color: agentColors.accent }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">Highlights</h3>
                  </div>
                  <ul className="space-y-2">
                    {highlights.map((highlight, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-start gap-2 text-gray-700"
                      >
                        <span className="text-sm leading-relaxed">{highlight}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* User Reviews Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" style={{ color: agentColors.accent }} fill={agentColors.accent} />
                  Visitor Reviews
                </h3>
                <div className="space-y-4">
                  {userReviews.map((review, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm"
                    >
                      {/* Review Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-semibold">
                            {review.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                            <p className="text-xs text-gray-500">{review.date}</p>
                          </div>
                        </div>
                        {/* Star Rating */}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4"
                              fill={i < review.rating ? '#fbbf24' : 'none'}
                              stroke={i < review.rating ? '#fbbf24' : '#d1d5db'}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      {/* Review Text */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        {review.text}
                      </p>
                      {/* Helpful Count */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{review.helpful} people found this helpful</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Booking Integration Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mb-6"
              >
                <div className="p-5 rounded-2xl border-2 shadow-lg"
                  style={{
                    borderColor: `${agentColors.primary}30`,
                    background: `linear-gradient(135deg, ${agentColors.primary}05, ${agentColors.secondary}05)`
                  }}
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" style={{ color: agentColors.accent }} />
                    Book Your Visit
                  </h3>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: agentColors.accent }}>
                        {bookingInfo.price}
                      </p>
                      <p className="text-xs text-gray-600">{bookingInfo.availability}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {landmark.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {landmark.visit_duration > 0 ? `${landmark.visit_duration < 60 ? landmark.visit_duration + ' min' : Math.round(landmark.visit_duration / 60) + ' hr'} tour` : 'Self-guided'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={bookingInfo.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3 rounded-xl font-semibold text-white shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                    }}
                  >
                    Check Availability
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    Skip the line • Free cancellation • Mobile tickets
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sticky Footer with Action Buttons */}
          <div className="flex-shrink-0 p-6 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
            <div className="flex items-center gap-3">
              {/* Add to Route Button */}
              <button
                onClick={handleAddToRoute}
                disabled={isAdding || addSuccess}
                className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                style={{
                  background: addSuccess
                    ? 'linear-gradient(135deg, #10b981, #059669)' // Green gradient on success
                    : `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                }}
              >
                {addSuccess ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      ✓
                    </motion.div>
                    Added to Route!
                  </>
                ) : isAdding ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Navigation className="w-5 h-5" />
                    </motion.div>
                    Calculating Route...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add to Route
                  </>
                )}
              </button>

              {/* View on Map Button */}
              <button
                onClick={() => {
                  // Zoom to landmark location (TODO: implement map zoom)
                  onClose();
                }}
                className="px-6 py-3.5 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <MapPin className="w-5 h-5" />
                View on Map
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default LandmarkDetailsModal;
