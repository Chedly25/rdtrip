/**
 * BudgetMonitor - Budget tracking and overspending alerts
 *
 * STEP 4 Phase 2: Budget Monitoring
 *
 * Responsibilities:
 * - Track expenses from budget_transactions table
 * - Compare against itinerary budget
 * - Alert when approaching or exceeding budget
 * - Daily/category-based spending analysis
 */

const pool = require('../../db/connection');
const NotificationService = require('./NotificationService');

class BudgetMonitor {
  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Check budget for an itinerary and create notifications if needed
   * Returns number of notifications created
   */
  async checkItinerary(itinerary) {
    console.log(`[BudgetMonitor] 💰 Checking budget for itinerary ${itinerary.id}`);

    let notificationsCreated = 0;

    try {
      // Parse route data to get budget information
      const routeData = typeof itinerary.route_data === 'string'
        ? JSON.parse(itinerary.route_data)
        : itinerary.route_data;

      if (!routeData || !routeData.budget) {
        console.log(`[BudgetMonitor] ⚠️  No budget found for itinerary ${itinerary.id}`);
        return 0;
      }

      const totalBudget = routeData.budget.total || 0;
      const dailyBudget = routeData.budget.perDay || 0;

      if (totalBudget === 0 && dailyBudget === 0) {
        return 0;
      }

      // Get total spending from budget_transactions
      const totalSpending = await this.getTotalSpending(itinerary.id);

      // Get daily spending breakdown
      const dailySpending = await this.getDailySpending(itinerary.id);

      // Get category breakdown
      const categorySpending = await this.getCategorySpending(itinerary.id);

      // Calculate trip progress (how many days into the trip)
      const tripStartDate = new Date(itinerary.trip_start_date);
      const now = new Date();
      const daysIntoTrip = Math.floor((now - tripStartDate) / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = itinerary.days || 1;

      // Check total budget alerts
      if (totalBudget > 0) {
        const percentUsed = (totalSpending / totalBudget) * 100;
        const expectedPercentUsed = (daysIntoTrip / totalDays) * 100;

        // Alert if over budget
        if (percentUsed >= 100) {
          await this.notificationService.createNotification(itinerary.id, {
            type: 'budget',
            priority: 'urgent',
            title: `🚨 Budget Exceeded`,
            message: `You've spent €${totalSpending.toFixed(2)} of your €${totalBudget.toFixed(2)} budget (${Math.round(percentUsed)}%). Consider adjusting your spending for the remaining days.`,
            metadata: {
              totalBudget,
              totalSpending,
              percentUsed,
              daysRemaining: totalDays - daysIntoTrip
            }
          });
          notificationsCreated++;
        }
        // Alert if approaching budget (90%)
        else if (percentUsed >= 90 && percentUsed > expectedPercentUsed + 10) {
          await this.notificationService.createNotification(itinerary.id, {
            type: 'budget',
            priority: 'high',
            title: `⚠️ Approaching Budget Limit`,
            message: `You've used ${Math.round(percentUsed)}% of your budget (€${totalSpending.toFixed(2)} of €${totalBudget.toFixed(2)}). You're ahead of expected spending pace.`,
            metadata: {
              totalBudget,
              totalSpending,
              percentUsed,
              expectedPercentUsed
            }
          });
          notificationsCreated++;
        }
        // Alert if spending significantly faster than expected (20% ahead)
        else if (percentUsed > expectedPercentUsed + 20) {
          await this.notificationService.createNotification(itinerary.id, {
            type: 'budget',
            priority: 'medium',
            title: `💸 Faster Spending Pace`,
            message: `You're spending faster than expected. Used ${Math.round(percentUsed)}% of budget on day ${daysIntoTrip} of ${totalDays}. Expected: ${Math.round(expectedPercentUsed)}%.`,
            metadata: {
              totalBudget,
              totalSpending,
              percentUsed,
              expectedPercentUsed,
              daysIntoTrip,
              totalDays
            }
          });
          notificationsCreated++;
        }
      }

      // Check daily budget alerts (for today)
      if (dailyBudget > 0 && dailySpending.today > 0) {
        const dailyPercentUsed = (dailySpending.today / dailyBudget) * 100;

        if (dailyPercentUsed >= 100) {
          await this.notificationService.createNotification(itinerary.id, {
            type: 'budget',
            priority: 'high',
            title: `📅 Daily Budget Exceeded`,
            message: `Today's spending (€${dailySpending.today.toFixed(2)}) has exceeded your daily budget of €${dailyBudget.toFixed(2)}.`,
            metadata: {
              dailyBudget,
              todaySpending: dailySpending.today,
              percentUsed: dailyPercentUsed
            }
          });
          notificationsCreated++;
        } else if (dailyPercentUsed >= 80) {
          await this.notificationService.createNotification(itinerary.id, {
            type: 'budget',
            priority: 'low',
            title: `💳 Nearing Daily Budget`,
            message: `You've used ${Math.round(dailyPercentUsed)}% of today's budget (€${dailySpending.today.toFixed(2)} of €${dailyBudget.toFixed(2)}).`,
            metadata: {
              dailyBudget,
              todaySpending: dailySpending.today,
              percentUsed: dailyPercentUsed
            }
          });
          notificationsCreated++;
        }
      }

      // Check category overspending
      if (routeData.budget.accommodation && categorySpending.accommodation > routeData.budget.accommodation) {
        await this.notificationService.createNotification(itinerary.id, {
          type: 'budget',
          priority: 'medium',
          title: `🏨 Accommodation Over Budget`,
          message: `Accommodation spending (€${categorySpending.accommodation.toFixed(2)}) exceeds budget of €${routeData.budget.accommodation.toFixed(2)}.`,
          metadata: {
            category: 'accommodation',
            budgeted: routeData.budget.accommodation,
            actual: categorySpending.accommodation
          }
        });
        notificationsCreated++;
      }

      if (routeData.budget.food && categorySpending.food > routeData.budget.food) {
        await this.notificationService.createNotification(itinerary.id, {
          type: 'budget',
          priority: 'medium',
          title: `🍽️ Food Budget Exceeded`,
          message: `Food spending (€${categorySpending.food.toFixed(2)}) exceeds budget of €${routeData.budget.food.toFixed(2)}.`,
          metadata: {
            category: 'food',
            budgeted: routeData.budget.food,
            actual: categorySpending.food
          }
        });
        notificationsCreated++;
      }

      console.log(`[BudgetMonitor] ✅ Created ${notificationsCreated} budget notifications`);

    } catch (error) {
      console.error('[BudgetMonitor] ❌ Error checking budget:', error);
    }

    return notificationsCreated;
  }

  /**
   * Get total spending for an itinerary
   */
  async getTotalSpending(itineraryId) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM budget_transactions
      WHERE itinerary_id = $1
    `;

    const result = await pool.query(query, [itineraryId]);
    return parseFloat(result.rows[0].total);
  }

  /**
   * Get daily spending breakdown
   */
  async getDailySpending(itineraryId) {
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN DATE(transaction_date) = CURRENT_DATE THEN amount ELSE 0 END), 0) as today,
        COALESCE(SUM(CASE WHEN DATE(transaction_date) = CURRENT_DATE - INTERVAL '1 day' THEN amount ELSE 0 END), 0) as yesterday
      FROM budget_transactions
      WHERE itinerary_id = $1
    `;

    const result = await pool.query(query, [itineraryId]);
    return {
      today: parseFloat(result.rows[0].today),
      yesterday: parseFloat(result.rows[0].yesterday)
    };
  }

  /**
   * Get spending by category
   */
  async getCategorySpending(itineraryId) {
    const query = `
      SELECT
        category,
        COALESCE(SUM(amount), 0) as total
      FROM budget_transactions
      WHERE itinerary_id = $1
      GROUP BY category
    `;

    const result = await pool.query(query, [itineraryId]);

    const spending = {
      accommodation: 0,
      food: 0,
      activities: 0,
      transport: 0,
      other: 0
    };

    result.rows.forEach(row => {
      spending[row.category] = parseFloat(row.total);
    });

    return spending;
  }
}

module.exports = BudgetMonitor;
