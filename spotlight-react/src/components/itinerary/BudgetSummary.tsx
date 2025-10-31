import { useState } from 'react';
import { DollarSign, Hotel, Utensils, Map, Car, ChevronDown, ChevronUp } from 'lucide-react';

interface BudgetSummaryProps {
  budget: any;
}

export function BudgetSummary({ budget }: BudgetSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'accommodation':
        return <Hotel className="h-4 w-4" />;
      case 'meals':
        return <Utensils className="h-4 w-4" />;
      case 'activities':
        return <Map className="h-4 w-4" />;
      case 'transportation':
        return <Car className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'accommodation':
        return { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' };
      case 'meals':
        return { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' };
      case 'activities':
        return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' };
      case 'transportation':
        return { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' };
    }
  };

  const categories = [
    { name: 'Accommodation', amount: budget.accommodation },
    { name: 'Meals', amount: budget.meals },
    { name: 'Activities', amount: budget.activities },
    { name: 'Transportation', amount: budget.transportation },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Summary Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 text-teal-700">
          <DollarSign className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Trip Budget</h3>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Cost</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">
              ${budget.total?.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Per Person</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              ${budget.perPerson?.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Per Day</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              ${budget.perDay?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-6 space-y-3">
          {categories.map((category) => {
            const colors = getCategoryColor(category.name);
            const percentage = budget.total > 0 ? (category.amount / budget.total) * 100 : 0;

            return (
              <div key={category.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-1 ${colors.bg}`}>
                      {getCategoryIcon(category.name)}
                    </div>
                    <span className="font-medium text-gray-700">{category.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${category.amount?.toLocaleString()} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full ${colors.bar} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown (Expandable) */}
      {budget.breakdown && budget.breakdown.length > 0 && (
        <div className="border-t border-teal-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between bg-white bg-opacity-50 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-opacity-70"
          >
            <span>View detailed breakdown</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="max-h-64 overflow-y-auto bg-white p-4">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
                  <tr>
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {budget.breakdown.map((item: any, index: number) => (
                    <tr key={index} className="text-gray-700">
                      <td className="py-2">{item.item}</td>
                      <td className="py-2">
                        <span className={`rounded px-2 py-0.5 text-xs ${getCategoryColor(item.category).bg} ${getCategoryColor(item.category).text}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{item.date}</td>
                      <td className="py-2 text-right font-medium">${item.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
