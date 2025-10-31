import { Cloud, CloudRain, Sun, Wind, Droplets, Eye } from 'lucide-react';

interface WeatherWidgetProps {
  weather: any;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const getWeatherIcon = (conditions: string) => {
    const lower = conditions?.toLowerCase() || '';
    if (lower.includes('rain') || lower.includes('shower')) {
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    }
    if (lower.includes('cloud') || lower.includes('overcast')) {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    }
    return <Sun className="h-6 w-6 text-yellow-500" />;
  };

  const getWeatherGradient = (conditions: string) => {
    const lower = conditions?.toLowerCase() || '';
    if (lower.includes('rain')) return 'from-blue-50 to-blue-100';
    if (lower.includes('cloud')) return 'from-gray-50 to-gray-100';
    return 'from-yellow-50 to-orange-50';
  };

  return (
    <div className={`rounded-lg bg-gradient-to-r ${getWeatherGradient(weather.conditions)} p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getWeatherIcon(weather.conditions)}
          <div>
            <h5 className="font-semibold text-gray-900">Weather Forecast</h5>
            <p className="mt-1 text-sm text-gray-700">{weather.conditions}</p>
          </div>
        </div>
        {weather.temp && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {weather.temp.high}°
            </div>
            <div className="text-xs text-gray-600">
              Low {weather.temp.low}°
            </div>
          </div>
        )}
      </div>

      {/* Weather details */}
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-gray-200 pt-3 text-xs">
        {weather.precipitation !== undefined && (
          <div className="flex items-center gap-1 text-gray-700">
            <Droplets className="h-3.5 w-3.5" />
            <span>{weather.precipitation}% rain</span>
          </div>
        )}
        {weather.windSpeed && (
          <div className="flex items-center gap-1 text-gray-700">
            <Wind className="h-3.5 w-3.5" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        )}
        {weather.uvIndex && (
          <div className="flex items-center gap-1 text-gray-700">
            <Eye className="h-3.5 w-3.5" />
            <span>UV {weather.uvIndex}</span>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {weather.recommendation && (
        <div className="mt-3 rounded-md bg-white bg-opacity-60 p-2 text-xs text-gray-700">
          ☀️ {weather.recommendation}
        </div>
      )}
    </div>
  );
}
