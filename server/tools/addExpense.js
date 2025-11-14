/**
 * addExpense - Add Expense to Trip
 *
 * Allows the agent to track expenses mentioned during conversation.
 * Integrates with the expense tracking system.
 */

const db = require('../../db/connection');

/**
 * @param {Object} args
 * @param {string} args.routeId - Route ID
 * @param {string} args.description - Expense description
 * @param {number} args.amount - Amount spent
 * @param {string} args.currency - Currency code (e.g., 'EUR', 'USD')
 * @param {string} args.category - Category: 'accommodation', 'food', 'transport', 'activities', 'shopping', 'other'
 * @param {string} [args.date] - Date of expense (YYYY-MM-DD), defaults to today
 * @param {string} [args.paidBy] - User ID who paid (defaults to route owner)
 */
async function addExpense({ routeId, description, amount, currency, category, date, paidBy }) {
  try {
    console.log(`💰 Adding expense: ${amount} ${currency} for ${category} - ${description}`);

    // Get route to find user ID if not specified
    const routeResult = await db.query(
      'SELECT user_id FROM routes WHERE id = $1',
      [routeId]
    );

    if (routeResult.rows.length === 0) {
      return {
        success: false,
        error: 'Route not found'
      };
    }

    const userId = paidBy || routeResult.rows[0].user_id;
    const expenseDate = date || new Date().toISOString().split('T')[0];

    // Insert expense
    const result = await db.query(
      `INSERT INTO trip_expenses
       (route_id, user_id, description, amount, currency, category, expense_date, created_by_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, description, amount, currency, category, expense_date`,
      [routeId, userId, description, amount, currency.toUpperCase(), category, expenseDate]
    );

    const expense = result.rows[0];

    console.log(`✅ Expense added: ${expense.id} - ${amount} ${currency}`);

    return {
      success: true,
      expense: {
        id: expense.id,
        description: expense.description,
        amount: parseFloat(expense.amount),
        currency: expense.currency,
        category: expense.category,
        date: expense.expense_date,
        addedByAgent: true
      },
      message: `Added ${amount} ${currency} expense for ${category}`
    };

  } catch (error) {
    console.error('Error adding expense:', error);
    return {
      success: false,
      error: error.message || 'Failed to add expense'
    };
  }
}

module.exports = addExpense;
