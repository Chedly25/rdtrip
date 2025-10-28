import { useState, useEffect, useRef } from 'react'

interface ScrapedImage {
  name: string
  imageUrl: string
  source: 'opengraph' | 'jsonld' | 'dom' | 'unsplash'
}

interface CityDetails {
  cityName: string
  restaurants?: Array<{
    name: string
    website?: string
  }>
  accommodations?: Array<{
    areaName: string
    bookingUrl?: string
  }>
  eventsFestivals?: Array<{
    name: string
    website?: string
  }>
  highlights?: Array<{
    name: string
    type?: string
  }>
}

export function useScrapedImages(cityDetails: CityDetails | null) {
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedCityRef = useRef<string | null>(null)

  useEffect(() => {
    if (!cityDetails) {
      setImages({})
      setLoading(false)
      fetchedCityRef.current = null
      return
    }

    // CRITICAL: Only fetch once per city to prevent infinite loop
    if (fetchedCityRef.current === cityDetails.cityName) {
      return
    }
    fetchedCityRef.current = cityDetails.cityName

    const fetchImages = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build entity array from cityDetails
        const entities: Array<{
          type: 'restaurant' | 'hotel' | 'event' | 'highlight'
          name: string
          city: string
          website?: string
        }> = []

        // Add restaurants - ALL of them, even without website (Unsplash API will handle fallback)
        if (cityDetails.restaurants) {
          cityDetails.restaurants.forEach((restaurant) => {
            entities.push({
              type: 'restaurant',
              name: restaurant.name,
              city: cityDetails.cityName,
              website: restaurant.website // Can be undefined, backend will use Unsplash API
            })
          })
        }

        // Add accommodations - ALL of them (use areaName as the entity name)
        if (cityDetails.accommodations) {
          cityDetails.accommodations.forEach((accommodation) => {
            entities.push({
              type: 'hotel',
              name: accommodation.areaName,
              city: cityDetails.cityName,
              website: accommodation.bookingUrl // Can be undefined, backend will use Unsplash API
            })
          })
        }

        // Add events/festivals - ALL of them
        if (cityDetails.eventsFestivals) {
          cityDetails.eventsFestivals.forEach((event) => {
            entities.push({
              type: 'event',
              name: event.name,
              city: cityDetails.cityName,
              website: event.website // Can be undefined, backend will use Unsplash API
            })
          })
        }

        // Add highlights - ALL of them (landmarks are perfect for Unsplash!)
        if (cityDetails.highlights) {
          cityDetails.highlights.forEach((highlight) => {
            entities.push({
              type: 'highlight',
              name: highlight.name,
              city: cityDetails.cityName,
              website: undefined // Highlights never have websites, will use Unsplash API
            })
          })
        }

        // If no entities to scrape, exit early
        if (entities.length === 0) {
          setLoading(false)
          return
        }

        console.log(`📸 Fetching scraped images for ${entities.length} entities in ${cityDetails.cityName}`)

        // Call scraping API
        const response = await fetch('https://rdtrip-4d4035861576.herokuapp.com/api/images/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ entities })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch images')
        }

        const data = await response.json()

        // Build image map: name -> imageUrl
        const imageMap: Record<string, string> = {}
        data.results.forEach((result: ScrapedImage) => {
          imageMap[result.name] = result.imageUrl
          console.log(`✅ Image for "${result.name}": ${result.source}`, result.imageUrl)
        })

        console.log('📦 Full image map:', imageMap)
        setImages(imageMap)
      } catch (err: any) {
        console.error('Error fetching scraped images:', err)
        setError(err.message || 'Failed to load images')
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [cityDetails])

  return { images, loading, error }
}
