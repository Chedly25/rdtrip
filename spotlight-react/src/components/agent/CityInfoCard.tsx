/**
 * CityInfoCard - Visual City Information Display
 *
 * Displays comprehensive city information in a structured format
 */

import { MapPin, Info, Globe, Users } from 'lucide-react';

interface CityInfoData {
  city: string;
  country?: string;
  summary?: string;
  population?: string;
  language?: string;
  currency?: string;
  timezone?: string;
  facts?: string[];
  tips?: string[];
}

interface CityInfoCardProps {
  data: CityInfoData;
}

export function CityInfoCard({ data }: CityInfoCardProps) {
  const { city, country, summary, population, language, currency, timezone, facts, tips } = data;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
          <MapPin className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{city}</h3>
          {country && <p className="text-sm text-gray-600">{country}</p>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Quick Facts Grid */}
      {(population || language || currency || timezone) && (
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
          {population && (
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600 mb-1">Population</div>
                <div className="text-sm font-semibold text-gray-900">{population}</div>
              </div>
            </div>
          )}

          {language && (
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600 mb-1">Language</div>
                <div className="text-sm font-semibold text-gray-900">{language}</div>
              </div>
            </div>
          )}

          {currency && (
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600 mb-1">Currency</div>
                <div className="text-sm font-semibold text-gray-900">{currency}</div>
              </div>
            </div>
          )}

          {timezone && (
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600 mb-1">Timezone</div>
                <div className="text-sm font-semibold text-gray-900">{timezone}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interesting Facts */}
      {facts && facts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Interesting Facts</h4>
          <ul className="space-y-2">
            {facts.map((fact, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-teal-600 mt-1">•</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Travel Tips */}
      {tips && tips.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Travel Tips</h4>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-600 mt-1">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
