/**
 * Budget Optimizer (Premium Feature)
 * Calculates total trip cost and provides breakdown
 */

class BudgetOptimizer {
  constructor(itineraryData, preferences) {
    this.itineraryData = itineraryData;
    this.preferences = preferences;
  }

  calculate() {
    console.log('💰 Budget Optimizer: Calculating costs...');

    const budget = {
      accommodation: 0,
      meals: 0,
      activities: 0,
      transportation: 0,
      total: 0,
      perPerson: 0,
      perDay: 0,
      breakdown: []
    };

    // Calculate accommodation costs
    if (this.itineraryData.accommodations) {
      this.itineraryData.accommodations.forEach(hotel => {
        const cost = hotel.pricePerNight || 0;
        budget.accommodation += cost;
        budget.breakdown.push({
          category: 'Accommodation',
          item: hotel.name,
          date: hotel.date,
          city: hotel.city,
          cost
        });
      });
    }

    // Calculate meal costs
    if (this.itineraryData.restaurants) {
      this.itineraryData.restaurants.forEach(dayMeals => {
        if (dayMeals.meals) {
          ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
            const meal = dayMeals.meals[mealType];
            if (meal && meal.estimatedCostPerPerson) {
              const cost = meal.estimatedCostPerPerson;
              budget.meals += cost;
              budget.breakdown.push({
                category: 'Meals',
                item: `${mealType} at ${meal.name}`,
                date: dayMeals.date,
                city: dayMeals.city,
                cost
              });
            }
          });
        }
      });
    }

    // Calculate activity costs
    if (this.itineraryData.activities) {
      this.itineraryData.activities.forEach(dayActivities => {
        if (dayActivities.activities) {
          dayActivities.activities.forEach(activity => {
            const cost = this.parseActivityCost(activity.admission);
            if (cost > 0) {
              budget.activities += cost;
              budget.breakdown.push({
                category: 'Activities',
                item: activity.name,
                date: dayActivities.date,
                city: dayActivities.city,
                cost
              });
            }
          });
        }
      });
    }

    // Calculate transportation (fuel)
    if (this.itineraryData.dayStructure) {
      const totalKm = this.itineraryData.dayStructure.days.reduce((sum, day) => {
        return sum + (day.driveSegments || []).reduce((s, seg) => s + (seg.distance || 0), 0);
      }, 0);

      // Estimate: 8L/100km × €1.80/L
      budget.transportation = Math.round((totalKm / 100) * 8 * 1.8);
      budget.breakdown.push({
        category: 'Transportation',
        item: `Fuel for ${totalKm}km`,
        date: null,
        city: null,
        cost: budget.transportation
      });
    }

    // Calculate totals
    budget.total = budget.accommodation + budget.meals + budget.activities + budget.transportation;

    const totalDays = this.itineraryData.dayStructure?.totalDays || 1;
    budget.perDay = Math.round(budget.total / totalDays);

    const travelers = this.preferences.travelers || 2;
    budget.perPerson = Math.round(budget.total / travelers);

    // Add summary
    budget.summary = {
      accommodationPercent: Math.round((budget.accommodation / budget.total) * 100),
      mealsPercent: Math.round((budget.meals / budget.total) * 100),
      activitiesPercent: Math.round((budget.activities / budget.total) * 100),
      transportationPercent: Math.round((budget.transportation / budget.total) * 100)
    };

    console.log(`✓ Budget: €${budget.total} total (€${budget.perPerson}/person, €${budget.perDay}/day)`);

    return budget;
  }

  parseActivityCost(admission) {
    if (!admission) return 0;

    // Try to extract number from strings like "€8", "Free", "€5-10"
    const match = admission.match(/€?(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }

    if (admission.toLowerCase().includes('free')) {
      return 0;
    }

    // Default estimate for paid activities
    return 10;
  }
}

module.exports = BudgetOptimizer;
