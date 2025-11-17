/**
 * Budget Calculator Service
 * Trip budget planning and calculation
 */
const BaseService = require('./BaseService');

class BudgetCalculatorService extends BaseService {
  constructor() {
    super('BudgetCalculator');
  }

  /**
   * Calculate trip budget based on preferences
   */
  async calculateTripBudget(params) {
    const {
      duration,
      travelers,
      destination,
      accommodation_type = 'mid-range',
      dining_preference = 'mix',
      activity_level = 'moderate'
    } = params;

    this.logAction('Calculate trip budget', { duration, travelers, destination });

    const budget = {
      accommodation: this.calculateAccommodationBudget(duration, travelers, accommodation_type),
      food: this.calculateFoodBudget(duration, travelers, dining_preference),
      activities: this.calculateActivitiesBudget(duration, activity_level),
      transportation: this.calculateTransportationBudget(duration, destination),
      miscellaneous: 0
    };

    // Add 10-15% for miscellaneous
    budget.miscellaneous = Math.round((budget.accommodation + budget.food + budget.activities + budget.transportation) * 0.12);

    budget.total = Object.values(budget).reduce((sum, val) => sum + val, 0);
    budget.perPerson = Math.round(budget.total / travelers);
    budget.perDay = Math.round(budget.total / duration);

    this.logger.info(`Budget calculated: €${budget.total} total (€${budget.perPerson}/person)`);
    return budget;
  }

  /**
   * Calculate accommodation budget
   */
  calculateAccommodationBudget(nights, travelers, type) {
    const baseRates = {
      'budget': { single: 40, double: 60, multiple: 80 },
      'mid-range': { single: 80, double: 120, multiple: 150 },
      'luxury': { single: 150, double: 250, multiple: 350 }
    };

    const rates = baseRates[type] || baseRates['mid-range'];
    
    let roomType = 'single';
    if (travelers === 2) roomType = 'double';
    if (travelers > 2) roomType = 'multiple';

    const perNight = rates[roomType];
    const rooms = Math.ceil(travelers / 2);

    return nights * perNight * rooms;
  }

  /**
   * Calculate food budget
   */
  calculateFoodBudget(days, travelers, preference) {
    const dailyBudgets = {
      'budget': 25,      // Street food, cheap eats
      'mix': 45,         // Mix of cheap and nice restaurants
      'restaurants': 70, // Mostly sit-down restaurants
      'fine-dining': 120 // Fine dining experiences
    };

    const perPersonPerDay = dailyBudgets[preference] || dailyBudgets['mix'];
    return days * travelers * perPersonPerDay;
  }

  /**
   * Calculate activities budget
   */
  calculateActivitiesBudget(days, level) {
    const dailyBudgets = {
      'light': 20,      // Mostly free activities, occasional paid
      'moderate': 40,   // Mix of free and paid activities
      'active': 60,     // Many paid activities and tours
      'intensive': 100  // Tours, experiences, adventure activities
    };

    const perDay = dailyBudgets[level] || dailyBudgets['moderate'];
    return days * perDay;
  }

  /**
   * Calculate transportation budget
   */
  calculateTransportationBudget(days, destination) {
    // Base estimate for car rental, fuel, tolls, parking
    const carRentalPerDay = 40;
    const fuelPerDay = 30;
    const tollsAndParkingPerDay = 15;

    return days * (carRentalPerDay + fuelPerDay + tollsAndParkingPerDay);
  }

  /**
   * Calculate daily spending for specific day
   */
  calculateDailySpending(dayActivities, meals, transportation) {
    this.logAction('Calculate daily spending');

    const spending = {
      activities: dayActivities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0),
      meals: meals.reduce((sum, m) => sum + (m.estimatedCost || 0), 0),
      transportation: transportation.reduce((sum, t) => sum + (t.estimatedCost || 0), 0),
      other: 0
    };

    spending.total = Object.values(spending).reduce((sum, val) => sum + val, 0);

    return spending;
  }

  /**
   * Compare actual expenses vs budget
   */
  compareToBudget(plannedBudget, actualExpenses) {
    this.logAction('Compare to budget');

    const comparison = {
      categories: {},
      totalPlanned: plannedBudget.total,
      totalActual: actualExpenses.total,
      difference: actualExpenses.total - plannedBudget.total,
      percentageUsed: (actualExpenses.total / plannedBudget.total * 100).toFixed(1)
    };

    // Compare each category
    ['accommodation', 'food', 'activities', 'transportation', 'miscellaneous'].forEach(category => {
      if (plannedBudget[category]) {
        comparison.categories[category] = {
          planned: plannedBudget[category],
          actual: actualExpenses[category] || 0,
          difference: (actualExpenses[category] || 0) - plannedBudget[category],
          percentageUsed: ((actualExpenses[category] || 0) / plannedBudget[category] * 100).toFixed(1)
        };
      }
    });

    comparison.status = comparison.difference > 0 ? 'over-budget' : 'under-budget';
    comparison.remaining = plannedBudget.total - actualExpenses.total;

    this.logger.info(`Budget comparison: ${comparison.percentageUsed}% used, €${comparison.remaining} remaining`);
    return comparison;
  }

  /**
   * Generate budget recommendations
   */
  generateBudgetRecommendations(tripParams) {
    this.logAction('Generate budget recommendations');

    const recommendations = [];

    // Accommodation recommendations
    if (tripParams.travelers > 2) {
      recommendations.push({
        category: 'accommodation',
        tip: 'Consider vacation rentals or apartments for groups - often more cost-effective than multiple hotel rooms',
        potentialSavings: '20-40%'
      });
    }

    // Food recommendations
    if (tripParams.duration > 7) {
      recommendations.push({
        category: 'food',
        tip: 'Mix street food and grocery shopping with restaurant meals to save on food costs',
        potentialSavings: '30-50%'
      });
    }

    // Activity recommendations
    recommendations.push({
      category: 'activities',
      tip: 'Many museums offer free entry on certain days - plan accordingly',
      potentialSavings: '€20-50 per person'
    });

    recommendations.push({
      category: 'activities',
      tip: 'Look for city passes that bundle attractions - often save 20-40%',
      potentialSavings: '€30-100'
    });

    // Transportation recommendations
    recommendations.push({
      category: 'transportation',
      tip: 'Book car rental in advance and compare prices across providers',
      potentialSavings: '15-30%'
    });

    recommendations.push({
      category: 'transportation',
      tip: 'Use apps to find cheapest fuel stations along your route',
      potentialSavings: '€5-15 per tank'
    });

    // General recommendations
    recommendations.push({
      category: 'general',
      tip: 'Travel in shoulder season (May, September) for better prices and fewer crowds',
      potentialSavings: '20-40%'
    });

    this.logger.info(`Generated ${recommendations.length} budget recommendations`);
    return recommendations;
  }

  /**
   * Estimate fuel costs
   */
  estimateFuelCost(distance, fuelPrice = 1.80, consumption = 7.0) {
    // distance in km, fuelPrice in €/liter, consumption in L/100km
    const litersNeeded = (distance / 100) * consumption;
    const totalCost = litersNeeded * fuelPrice;

    return {
      distance,
      fuelPrice,
      consumption,
      litersNeeded: Math.round(litersNeeded * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100
    };
  }

  /**
   * Estimate toll costs
   */
  estimateTollCost(route, vehicleType = 'car') {
    // Rough estimates for European tolls
    const tollRates = {
      france: 0.10,    // €/km
      italy: 0.08,
      spain: 0.09,
      portugal: 0.08,
      greece: 0.07,
      croatia: 0.06
    };

    let totalTolls = 0;
    
    route.forEach(segment => {
      const country = segment.country?.toLowerCase() || 'france';
      const rate = tollRates[country] || 0.08;
      totalTolls += segment.distance * rate;
    });

    return {
      estimatedTolls: Math.round(totalTolls * 100) / 100,
      note: 'This is a rough estimate. Actual tolls may vary based on specific highways used.'
    };
  }

  /**
   * Calculate cost per kilometer
   */
  calculateCostPerKm(totalExpenses, totalDistance) {
    if (!totalDistance || totalDistance === 0) {
      return 0;
    }

    return Math.round((totalExpenses / totalDistance) * 100) / 100;
  }

  /**
   * Projection for remaining trip
   */
  projectRemainingCosts(daysRemaining, averageDailySpending) {
    this.logAction('Project remaining costs', { daysRemaining });

    const projection = {
      daysRemaining,
      averageDailySpending,
      projectedTotal: daysRemaining * averageDailySpending,
      buffer: Math.round(daysRemaining * averageDailySpending * 0.15), // 15% buffer
    };

    projection.recommendedReserve = projection.projectedTotal + projection.buffer;

    this.logger.info(`Projected remaining costs: €${projection.projectedTotal} + €${projection.buffer} buffer`);
    return projection;
  }
}

module.exports = BudgetCalculatorService;

