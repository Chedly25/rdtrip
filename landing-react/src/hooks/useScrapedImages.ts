import { useState, useEffect } from 'react'

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
}

export function useScrapedImages(cityDetails: CityDetails | null) {
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cityDetails) {
      setImages({})
      setLoading(false)
      return
    }

    const fetchImages = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build entity array from cityDetails
        const entities: Array<{
          type: 'restaurant' | 'hotel' | 'event'
          name: string
          city: string
          website?: string
        }> = []

        // Add restaurants
        if (cityDetails.restaurants) {
          cityDetails.restaurants.forEach((restaurant) => {
            if (restaurant.website) {
              entities.push({
                type: 'restaurant',
                name: restaurant.name,
                city: cityDetails.cityName,
                website: restaurant.website
              })
            }
          })
        }

        // Add accommodations (use areaName as the entity name)
        if (cityDetails.accommodations) {
          cityDetails.accommodations.forEach((accommodation) => {
            if (accommodation.bookingUrl) {
              entities.push({
                type: 'hotel',
                name: accommodation.areaName,
                city: cityDetails.cityName,
                website: accommodation.bookingUrl
              })
            }
          })
        }

        // Add events/festivals
        if (cityDetails.eventsFestivals) {
          cityDetails.eventsFestivals.forEach((event) => {
            if (event.website) {
              entities.push({
                type: 'event',
                name: event.name,
                city: cityDetails.cityName,
                website: event.website
              })
            }
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
          console.log(`✅ Image for "${result.name}": ${result.source}`)
        })

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
