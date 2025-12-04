/**
 * Story Cards - Social Media Ready Cards
 *
 * Beautiful, shareable card templates for Instagram Stories,
 * TikTok, and other social platforms.
 *
 * Design: "Editorial Postcards" - magazine-quality layouts,
 * beautiful typography, and eye-catching compositions
 *
 * Features:
 * - Multiple template styles
 * - Auto-layout with trip data
 * - Branded but subtle rdtrip watermark
 * - Stats overlays
 * - Route visualization
 * - Photo collage options
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Camera,
  Car,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Star,
  Sparkles,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
};

// Template types
export type TemplateStyle = 'classic' | 'minimal' | 'bold' | 'collage' | 'stats' | 'route';

// Story Card data interface
export interface StoryCardData {
  tripName: string;
  dates: string;
  cities: string[];
  stats: {
    days: number;
    distance: number;
    photos: number;
  };
  coverPhoto?: string;
  photos?: string[];
  highlightPhoto?: string;
  tagline?: string;
}

// Template 1: Classic - Hero photo with elegant overlay
const ClassicTemplate = ({ data }: { data: StoryCardData }) => (
  <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden">
    {/* Background image */}
    {data.coverPhoto ? (
      <img
        src={data.coverPhoto}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
    ) : (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 50%, ${colors.golden} 100%)`,
        }}
      />
    )}

    {/* Gradient overlay */}
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(to bottom, rgba(44,36,23,0.1) 0%, rgba(44,36,23,0.3) 40%, rgba(44,36,23,0.85) 100%)',
      }}
    />

    {/* Top badge */}
    <div className="absolute top-6 left-0 right-0 flex justify-center">
      <div
        className="px-4 py-1.5 rounded-full text-xs uppercase tracking-widest"
        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
      >
        Trip Complete
      </div>
    </div>

    {/* Content */}
    <div className="absolute bottom-0 left-0 right-0 p-6">
      <h1
        className="text-3xl font-serif font-medium text-white mb-2 leading-tight"
        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
      >
        {data.tripName}
      </h1>

      <p className="text-white/80 text-sm mb-4">
        {data.tagline || `${data.cities.join(' → ')}`}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1.5 text-white/90">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{data.stats.days} days</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/90">
          <Car className="w-4 h-4" />
          <span className="text-sm">{data.stats.distance} km</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/90">
          <Camera className="w-4 h-4" />
          <span className="text-sm">{data.stats.photos}</span>
        </div>
      </div>

      {/* Dates */}
      <p className="text-white/60 text-xs">{data.dates}</p>

      {/* rdtrip branding */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/20">
        <MapPin className="w-4 h-4 text-white/60" />
        <span className="text-white/60 text-xs">Made with rdtrip</span>
      </div>
    </div>
  </div>
);

// Template 2: Minimal - Clean, typography-focused
const MinimalTemplate = ({ data }: { data: StoryCardData }) => (
  <div
    className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden p-8 flex flex-col justify-between"
    style={{ background: colors.cream }}
  >
    {/* Top section */}
    <div>
      <div className="flex items-center gap-2 mb-8">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: colors.darkBrown }}
        >
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs uppercase tracking-widest" style={{ color: colors.lightBrown }}>
          Trip Complete
        </span>
      </div>

      <h1
        className="text-4xl font-serif font-medium leading-tight mb-4"
        style={{ color: colors.darkBrown }}
      >
        {data.tripName}
      </h1>

      <p className="text-lg" style={{ color: colors.lightBrown }}>
        {data.dates}
      </p>
    </div>

    {/* Middle - Route */}
    <div className="py-8">
      <div className="flex flex-wrap items-center gap-2">
        {data.cities.map((city, index) => (
          <div key={city} className="flex items-center">
            <span
              className="text-sm font-medium"
              style={{ color: colors.darkBrown }}
            >
              {city}
            </span>
            {index < data.cities.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-1" style={{ color: colors.lightBrown }} />
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Bottom stats */}
    <div>
      <div
        className="grid grid-cols-3 gap-4 py-6 border-t border-b mb-6"
        style={{ borderColor: colors.border }}
      >
        <div className="text-center">
          <span className="text-3xl font-serif font-bold" style={{ color: colors.darkBrown }}>
            {data.stats.days}
          </span>
          <span className="text-xs block uppercase tracking-wider" style={{ color: colors.lightBrown }}>
            Days
          </span>
        </div>
        <div className="text-center">
          <span className="text-3xl font-serif font-bold" style={{ color: colors.darkBrown }}>
            {data.stats.distance}
          </span>
          <span className="text-xs block uppercase tracking-wider" style={{ color: colors.lightBrown }}>
            Km
          </span>
        </div>
        <div className="text-center">
          <span className="text-3xl font-serif font-bold" style={{ color: colors.darkBrown }}>
            {data.stats.photos}
          </span>
          <span className="text-xs block uppercase tracking-wider" style={{ color: colors.lightBrown }}>
            Photos
          </span>
        </div>
      </div>

      {/* Branding */}
      <div className="flex items-center justify-center gap-2">
        <MapPin className="w-4 h-4" style={{ color: colors.terracotta }} />
        <span className="text-xs" style={{ color: colors.lightBrown }}>
          Made with rdtrip
        </span>
      </div>
    </div>
  </div>
);

// Template 3: Bold - High contrast, impactful
const BoldTemplate = ({ data }: { data: StoryCardData }) => (
  <div
    className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden"
    style={{ background: colors.darkBrown }}
  >
    {/* Photo strip */}
    {data.coverPhoto && (
      <div className="absolute top-0 left-0 right-0 h-[45%]">
        <img
          src={data.coverPhoto}
          alt=""
          className="w-full h-full object-cover"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: `linear-gradient(to top, ${colors.darkBrown} 0%, transparent 100%)`,
          }}
        />
      </div>
    )}

    {/* Content */}
    <div className="absolute bottom-0 left-0 right-0 p-6">
      {/* Trip badge */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5" style={{ color: colors.golden }} />
        <span className="text-sm uppercase tracking-widest" style={{ color: colors.golden }}>
          Journey Complete
        </span>
      </div>

      <h1
        className="text-4xl font-serif font-bold text-white leading-tight mb-3"
      >
        {data.tripName}
      </h1>

      <p className="text-lg text-white/70 mb-6">
        {data.cities.join(' • ')}
      </p>

      {/* Big stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-3xl font-bold text-white">{data.stats.days}</span>
          <span className="text-xs block text-white/60 mt-1">DAYS</span>
        </div>
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-3xl font-bold text-white">{data.cities.length}</span>
          <span className="text-xs block text-white/60 mt-1">CITIES</span>
        </div>
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-3xl font-bold text-white">{data.stats.photos}</span>
          <span className="text-xs block text-white/60 mt-1">PHOTOS</span>
        </div>
      </div>

      {/* Branding */}
      <div className="flex items-center justify-center gap-2">
        <MapPin className="w-4 h-4 text-white/40" />
        <span className="text-xs text-white/40">rdtrip</span>
      </div>
    </div>
  </div>
);

// Template 4: Collage - Multiple photos grid
const CollageTemplate = ({ data }: { data: StoryCardData }) => {
  const photos = data.photos?.slice(0, 4) || [];

  return (
    <div
      className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden"
      style={{ background: colors.cream }}
    >
      {/* Photo grid */}
      <div className="absolute top-0 left-0 right-0 h-[60%] grid grid-cols-2 gap-1 p-1">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg"
          >
            <img
              src={photo}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {photos.length < 4 &&
          Array.from({ length: 4 - photos.length }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className="rounded-lg"
              style={{ background: colors.border }}
            />
          ))
        }
      </div>

      {/* Fade */}
      <div
        className="absolute top-[55%] left-0 right-0 h-16"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${colors.cream} 100%)`,
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h1
          className="text-2xl font-serif font-medium mb-2"
          style={{ color: colors.darkBrown }}
        >
          {data.tripName}
        </h1>

        <p className="text-sm mb-4" style={{ color: colors.lightBrown }}>
          {data.dates}
        </p>

        {/* Route */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          {data.cities.map((city, index) => (
            <div key={city} className="flex items-center">
              <span
                className="px-2 py-1 rounded-full text-xs"
                style={{ background: `${colors.sage}15`, color: colors.sage }}
              >
                {city}
              </span>
              {index < data.cities.length - 1 && (
                <span className="mx-1" style={{ color: colors.lightBrown }}>→</span>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5" style={{ color: colors.mediumBrown }}>
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{data.stats.days} days</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: colors.mediumBrown }}>
            <Camera className="w-4 h-4" />
            <span className="text-sm">{data.stats.photos} photos</span>
          </div>
        </div>

        {/* Branding */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: colors.terracotta }} />
          <span className="text-xs" style={{ color: colors.lightBrown }}>
            Made with rdtrip
          </span>
        </div>
      </div>
    </div>
  );
};

// Template 5: Stats - Data visualization focused
const StatsTemplate = ({ data }: { data: StoryCardData }) => (
  <div
    className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden p-6 flex flex-col"
    style={{
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
    }}
  >
    {/* Header */}
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" style={{ color: colors.golden }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: colors.golden }}>
          Trip Stats
        </span>
      </div>
      <h1 className="text-3xl font-serif font-medium text-white">
        {data.tripName}
      </h1>
    </div>

    {/* Big stat cards */}
    <div className="flex-1 flex flex-col gap-4">
      {/* Days */}
      <div
        className="flex-1 rounded-2xl p-5 flex flex-col justify-center"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-end gap-2">
          <span className="text-6xl font-serif font-bold text-white">
            {data.stats.days}
          </span>
          <span className="text-lg text-white/60 mb-2">days</span>
        </div>
        <div className="text-sm text-white/40 mt-2">{data.dates}</div>
      </div>

      {/* Distance & Photos */}
      <div className="flex gap-4">
        <div
          className="flex-1 rounded-2xl p-5"
          style={{ background: `${colors.sage}30` }}
        >
          <Car className="w-6 h-6 text-white mb-2" />
          <span className="text-4xl font-serif font-bold text-white block">
            {data.stats.distance}
          </span>
          <span className="text-sm text-white/60">kilometers</span>
        </div>
        <div
          className="flex-1 rounded-2xl p-5"
          style={{ background: `${colors.golden}30` }}
        >
          <Camera className="w-6 h-6 text-white mb-2" />
          <span className="text-4xl font-serif font-bold text-white block">
            {data.stats.photos}
          </span>
          <span className="text-sm text-white/60">photos</span>
        </div>
      </div>

      {/* Cities */}
      <div
        className="rounded-2xl p-5"
        style={{ background: `${colors.terracotta}30` }}
      >
        <MapPin className="w-6 h-6 text-white mb-2" />
        <span className="text-4xl font-serif font-bold text-white block">
          {data.cities.length}
        </span>
        <span className="text-sm text-white/60">cities visited</span>
        <p className="text-xs text-white/40 mt-2">
          {data.cities.join(' → ')}
        </p>
      </div>
    </div>

    {/* Branding */}
    <div className="flex items-center justify-center gap-2 mt-6">
      <MapPin className="w-4 h-4 text-white/30" />
      <span className="text-xs text-white/30">rdtrip</span>
    </div>
  </div>
);

// Template 6: Route - Map-style visualization
const RouteTemplate = ({ data }: { data: StoryCardData }) => (
  <div
    className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden p-6 flex flex-col"
    style={{ background: colors.warmWhite }}
  >
    {/* Header */}
    <div className="text-center mb-6">
      <h1
        className="text-2xl font-serif font-medium mb-1"
        style={{ color: colors.darkBrown }}
      >
        {data.tripName}
      </h1>
      <p className="text-sm" style={{ color: colors.lightBrown }}>
        {data.dates}
      </p>
    </div>

    {/* Route visualization */}
    <div className="flex-1 relative">
      {/* Vertical line */}
      <div
        className="absolute left-8 top-4 bottom-4 w-0.5"
        style={{
          background: `linear-gradient(to bottom, ${colors.terracotta}, ${colors.sage})`,
        }}
      />

      {/* Cities */}
      <div className="space-y-6 relative z-10">
        {data.cities.map((city, index) => (
          <div key={city} className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: index === 0
                  ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
                  : index === data.cities.length - 1
                    ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
                    : colors.cream,
                border: index === 0 || index === data.cities.length - 1
                  ? 'none'
                  : `2px solid ${colors.border}`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <MapPin
                className="w-6 h-6"
                style={{
                  color: index === 0 || index === data.cities.length - 1
                    ? 'white'
                    : colors.lightBrown,
                }}
              />
            </div>
            <div>
              <h3 className="font-medium" style={{ color: colors.darkBrown }}>
                {city}
              </h3>
              <p className="text-xs" style={{ color: colors.lightBrown }}>
                {index === 0 ? 'Start' : index === data.cities.length - 1 ? 'End' : `Stop ${index}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Stats bar */}
    <div
      className="grid grid-cols-3 gap-2 py-4 mt-4 border-t"
      style={{ borderColor: colors.border }}
    >
      <div className="text-center">
        <span className="text-xl font-bold" style={{ color: colors.darkBrown }}>
          {data.stats.days}
        </span>
        <span className="text-xs block" style={{ color: colors.lightBrown }}>days</span>
      </div>
      <div className="text-center">
        <span className="text-xl font-bold" style={{ color: colors.darkBrown }}>
          {data.stats.distance}
        </span>
        <span className="text-xs block" style={{ color: colors.lightBrown }}>km</span>
      </div>
      <div className="text-center">
        <span className="text-xl font-bold" style={{ color: colors.darkBrown }}>
          {data.stats.photos}
        </span>
        <span className="text-xs block" style={{ color: colors.lightBrown }}>photos</span>
      </div>
    </div>

    {/* Branding */}
    <div className="flex items-center justify-center gap-2 mt-4">
      <MapPin className="w-4 h-4" style={{ color: colors.terracotta }} />
      <span className="text-xs" style={{ color: colors.lightBrown }}>
        Made with rdtrip
      </span>
    </div>
  </div>
);

// Template selector
const templates: Record<TemplateStyle, React.FC<{ data: StoryCardData }>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  bold: BoldTemplate,
  collage: CollageTemplate,
  stats: StatsTemplate,
  route: RouteTemplate,
};

const templateInfo: Record<TemplateStyle, { name: string; description: string }> = {
  classic: { name: 'Classic', description: 'Hero photo with elegant overlay' },
  minimal: { name: 'Minimal', description: 'Clean, typography-focused' },
  bold: { name: 'Bold', description: 'High contrast, impactful' },
  collage: { name: 'Collage', description: 'Multiple photos grid' },
  stats: { name: 'Stats', description: 'Data visualization focused' },
  route: { name: 'Route', description: 'Map-style journey' },
};

interface StoryCardsProps {
  data: StoryCardData;
  onDownload?: (template: TemplateStyle) => void;
  onShare?: (template: TemplateStyle) => void;
  className?: string;
}

export const StoryCards: React.FC<StoryCardsProps> = ({
  data,
  onDownload,
  onShare,
  className = '',
}) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateStyle>('classic');
  const templateOrder: TemplateStyle[] = ['classic', 'minimal', 'bold', 'collage', 'stats', 'route'];
  const currentIndex = templateOrder.indexOf(activeTemplate);

  const Template = templates[activeTemplate];

  const handlePrev = () => {
    const prevIndex = currentIndex === 0 ? templateOrder.length - 1 : currentIndex - 1;
    setActiveTemplate(templateOrder[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = currentIndex === templateOrder.length - 1 ? 0 : currentIndex + 1;
    setActiveTemplate(templateOrder[nextIndex]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Template selector dots */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {templateOrder.map((template) => (
          <motion.button
            key={template}
            onClick={() => setActiveTemplate(template)}
            className="w-2 h-2 rounded-full"
            style={{
              background: template === activeTemplate ? colors.terracotta : colors.border,
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Card preview with navigation */}
      <div className="relative">
        {/* Navigation arrows */}
        <motion.button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: colors.darkBrown }} />
        </motion.button>

        <motion.button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-5 h-5" style={{ color: colors.darkBrown }} />
        </motion.button>

        {/* Card */}
        <div className="max-w-xs mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTemplate}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
            >
              <Template data={data} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Template info */}
      <div className="text-center">
        <h3 className="font-medium" style={{ color: colors.darkBrown }}>
          {templateInfo[activeTemplate].name}
        </h3>
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          {templateInfo[activeTemplate].description}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4">
        <motion.button
          onClick={() => onDownload?.(activeTemplate)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
          style={{
            background: colors.darkBrown,
            color: 'white',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">Download</span>
        </motion.button>

        <motion.button
          onClick={() => onShare?.(activeTemplate)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
            color: 'white',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </motion.button>
      </div>
    </div>
  );
};

// Export individual templates for direct use
export {
  ClassicTemplate,
  MinimalTemplate,
  BoldTemplate,
  CollageTemplate,
  StatsTemplate,
  RouteTemplate,
};

export default StoryCards;
