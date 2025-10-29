import { useState } from 'react'
import { Download, Calendar, Map, Globe, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ExportMenuProps {
  spotlightData: any
  agentIndex: number
}

export function ExportMenu({ spotlightData, agentIndex }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (format: 'gpx' | 'ics' | 'kml') => {
    try {
      // Encode the spotlight data for URL
      const encodedData = encodeURIComponent(JSON.stringify(spotlightData))

      // Construct API URL with query parameters
      const url = `/api/export/${format}?data=${encodedData}&agentIndex=${agentIndex}`

      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `rdtrip-export.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Close menu after export
      setIsOpen(false)

      console.log(`✅ Exporting ${format.toUpperCase()} file`)
    } catch (error) {
      console.error(`❌ Failed to export ${format}:`, error)
      alert(`Failed to export ${format.toUpperCase()} file. Please try again.`)
    }
  }

  const exportOptions = [
    {
      format: 'gpx' as const,
      icon: Map,
      label: 'GPS Device (GPX)',
      description: 'For offline navigation',
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50'
    },
    {
      format: 'ics' as const,
      icon: Calendar,
      label: 'Calendar (iCal)',
      description: 'Add to your calendar app',
      color: 'text-purple-600',
      bgColor: 'hover:bg-purple-50'
    },
    {
      format: 'kml' as const,
      icon: Globe,
      label: 'Google Earth (KML)',
      description: 'View in Google Earth/Maps',
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50'
    }
  ]

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400"
      >
        <Download className="h-4 w-4" />
        <span>Export Trip</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-xl"
            >
              <div className="p-2">
                <div className="mb-2 px-3 py-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Export Your Trip
                  </h4>
                </div>

                {exportOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.format}
                      onClick={() => handleExport(option.format)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${option.bgColor}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${option.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-600">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Export formats compatible with most GPS devices, calendar apps, and mapping tools.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
