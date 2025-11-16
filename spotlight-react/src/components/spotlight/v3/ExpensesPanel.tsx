/**
 * ExpensesPanel - Budget & Expense Tracking
 * Phase 1: Expenses tab content
 *
 * Preserves ALL expense features:
 * - Add/edit expenses
 * - Receipt scanning (OCR)
 * - AI categorization
 * - Split calculations
 * - Balance summary
 * - Budget tracking
 */

import { useState } from 'react';
import { ExpenseTracker } from '../../expenses/ExpenseTracker';
import { BudgetOverview } from '../../expenses/BudgetOverview';
import { BalanceSummary } from '../../expenses/BalanceSummary';
import { Button } from '../../design-system';
import { DollarSign, PieChart, Users } from 'lucide-react';

interface ExpensesPanelProps {
  routeId: string | null;
  userId?: string;
}

type ExpenseView = 'tracker' | 'budget' | 'balances';

const ExpensesPanel = ({ routeId, userId }: ExpensesPanelProps) => {
  const [view, setView] = useState<ExpenseView>('tracker');

  if (!routeId || !userId) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-semibold mb-2">Expenses Unavailable</h3>
          <p className="text-sm text-gray-600">Save your trip to track expenses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Sub-tabs */}
      <div className="flex-shrink-0 p-2 border-b border-gray-200 flex gap-1">
        <Button
          variant={view === 'tracker' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setView('tracker')}
        >
          <DollarSign className="h-4 w-4" />
          Expenses
        </Button>
        <Button
          variant={view === 'budget' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setView('budget')}
        >
          <PieChart className="h-4 w-4" />
          Budget
        </Button>
        <Button
          variant={view === 'balances' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setView('balances')}
        >
          <Users className="h-4 w-4" />
          Balances
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === 'tracker' && <ExpenseTracker routeId={routeId} userId={userId} />}
        {view === 'budget' && <BudgetOverview routeId={routeId} userId={userId} />}
        {view === 'balances' && <BalanceSummary routeId={routeId} userId={userId} />}
      </div>
    </div>
  );
};

export default ExpensesPanel;
