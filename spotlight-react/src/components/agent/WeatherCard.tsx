/**
 * WeatherCard - Visual Weather Display
 *
 * Displays weather data in a beautiful card format
 * with icons, temperature, conditions, and forecast
 */

import { Cloud, CloudRain, Sun, Wind, Droplets, CloudSnow, CloudDrizzle } from 'lucide-react';

interface WeatherData {
  location: {
    name: string;
    country: string;
  };
  current: {
    temperature: number;
    feelsLike: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    rainProbability: number;
    icon: string;
  };
  forecast?: Array<{
    date: string;
    dayOfWeek: string;
    temperature: number;
    condition: string;
    rainProbability: number;
    icon: string;
  }>;
}

interface WeatherCardProps {
  data: WeatherData;
}

export function WeatherCard({ data }: WeatherCardProps) {
  const { location, current, forecast } = data;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-gray-200 rounded-2xl p-6 max-w-md">
      {/* Location Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {location.name}, {location.country}
        </h3>
        <p className="text-sm text-gray-600 capitalize mt-1">{current.description}</p>
      </div>

      {/* Current Weather */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {getWeatherIcon(current.condition, 'w-20 h-20 text-teal-600')}
          <div>
            <div className="text-6xl font-bold text-gray-900">
              {current.temperature}°
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Feels like {current.feelsLike}°C
            </p>
          </div>
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          <div>
            <div className="text-xs text-gray-600">Humidity</div>
            <div className="text-sm font-semibold text-gray-900">{current.humidity}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Wind</div>
            <div className="text-sm font-semibold text-gray-900">{current.windSpeed} km/h</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-xs text-gray-600">Rain</div>
            <div className="text-sm font-semibold text-gray-900">{current.rainProbability}%</div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {forecast && forecast.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">5-Day Forecast</h4>
          <div className="grid grid-cols-5 gap-2">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-3 text-center border border-gray-200 hover:border-teal-300 transition-colors"
              >
                <div className="text-xs font-medium text-gray-600 mb-2">
                  {day.dayOfWeek.substring(0, 3)}
                </div>
                {getWeatherIcon(day.condition, 'w-8 h-8 text-teal-600 mx-auto mb-2')}
                <div className="text-sm font-bold text-gray-900">{day.temperature}°</div>
                {day.rainProbability > 30 && (
                  <div className="text-xs text-blue-600 mt-1">{day.rainProbability}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get weather icon based on condition
 */
function getWeatherIcon(condition: string, className: string) {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes('rain')) {
    return <CloudRain className={className} />;
  } else if (conditionLower.includes('drizzle')) {
    return <CloudDrizzle className={className} />;
  } else if (conditionLower.includes('snow')) {
    return <CloudSnow className={className} />;
  } else if (conditionLower.includes('cloud')) {
    return <Cloud className={className} />;
  } else if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
    return <Sun className={className} />;
  } else {
    return <Cloud className={className} />;
  }
}
