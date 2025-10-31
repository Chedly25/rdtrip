import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Utensils, Star, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

export function StayDineSection() {
  const [budget, setBudget] = useState<'budget' | 'mid' | 'luxury'>('mid')
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const { routeData } = useRouteDataStore()
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  const budgetOptions = [
    { value: 'budget' as const, label: 'Budget (€-€€)', icon: '💰' },
    { value: 'mid' as const, label: 'Mid-range (€€-€€€)', icon: '💎' },
    { value: 'luxury' as const, label: 'Luxury (€€€-€€€€)', icon: '👑' },
  ]

  const handleLoadRecommendations = async () => {
    setIsLoading(true)
    // TODO: Call API to load hotels and restaurants
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasLoaded(true)
  }

  // Mock data for demonstration
  const mockHotels = [
    {
      id: 1,
      name: 'Grand Hotel Central',
      stars: 4,
      price: '€120-180',
      distance: '0.5km from center',
      amenities: ['WiFi', 'Breakfast', 'Pool'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    },
    {
      id: 2,
      name: 'Boutique Residence',
      stars: 3,
      price: '€80-120',
      distance: '1.2km from center',
      amenities: ['WiFi', 'Breakfast'],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
    },
  ]

  const mockRestaurants = [
    {
      id: 1,
      name: 'Le Bernardin',
      cuisine: 'French Fine Dining',
      price: '€€€',
      rating: 4.8,
      specialties: ['Bouillabaisse', 'Duck Confit'],
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    },
    {
      id: 2,
      name: 'Tapas Bar',
      cuisine: 'Spanish',
      price: '€€',
      rating: 4.5,
      specialties: ['Patatas Bravas', 'Jamón Ibérico'],
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Hotel className="h-6 w-6 text-primary-500" />
          Stay & Dine
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {budgetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
          <Button
            onClick={handleLoadRecommendations}
            isLoading={isLoading}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Load Recommendations'}
          </Button>
        </div>
      </div>

      {!hasLoaded ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white to-gray-50 p-12 text-center shadow-lg"
          style={{ borderColor: theme.primary }}
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
            }}
          />

          {/* Content */}
          <div className="relative">
            {/* Icons with gradient background */}
            <div className="mb-6 flex justify-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="rounded-2xl p-4"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                }}
              >
                <Hotel className="h-8 w-8 text-white" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="rounded-2xl p-4"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                }}
              >
                <Utensils className="h-8 w-8 text-white" />
              </motion.div>
            </div>

            {/* Sparkles icon */}
            <motion.div
              initial={{ opacity: 0, rotate: -20 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 flex justify-center"
            >
              <Sparkles className="h-6 w-6" style={{ color: theme.primary }} />
            </motion.div>

            {/* Text */}
            <h3 className="mb-3 text-xl font-bold text-gray-900">Discover Amazing Places</h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600">
              Click <span className="font-semibold" style={{ color: theme.primary }}>"Load Recommendations"</span> to discover hand-picked hotels and restaurants for each city on your route
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Hotels */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Hotel className="h-5 w-5 text-primary-500" />
              Hotels
            </h3>
            <div className="grid gap-4">
              {mockHotels.map((hotel, index) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div className="h-32 w-48 flex-shrink-0 overflow-hidden">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{hotel.name}</h4>
                          <div className="mt-1 flex items-center gap-1">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary-600">{hotel.price}</div>
                          <div className="text-xs text-gray-500">per night</div>
                        </div>
                      </div>
                      <p className="mb-2 text-sm text-gray-600">{hotel.distance}</p>
                      <div className="flex flex-wrap gap-2">
                        {hotel.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Restaurants */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Utensils className="h-5 w-5 text-primary-500" />
              Restaurants
            </h3>
            <div className="grid gap-4">
              {mockRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div className="h-32 w-48 flex-shrink-0 overflow-hidden">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{restaurant.name}</h4>
                          <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{restaurant.rating}</span>
                          </div>
                          <div className="text-xs text-gray-500">{restaurant.price}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-500">Must Try:</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {restaurant.specialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
