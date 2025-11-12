# Phase 3: Expense Tracking & Splitting - Implementation Plan

**Feature**: Real-time expense tracking with AI-powered receipt scanning and automatic splitting
**Status**: Planning → Ready for Implementation
**Estimated Time**: 2-3 weeks
**Complexity**: High
**Priority**: High (monetization + user value)

---

## 📋 Overview

Phase 3 transforms RDTrip into a complete trip financial management platform. Users can track expenses in real-time, scan receipts with AI, split costs automatically (like Splitwise/Tricount), and stay within budget.

### Key Capabilities

1. **Expense Tracking** - Log all trip expenses with categories and receipts
2. **AI Receipt Scanning** - OCR + GPT-4 Vision to extract receipt data automatically
3. **Automatic Splitting** - Fair cost distribution among trip participants
4. **Balance Calculation** - Smart debt simplification algorithm
5. **Budget Management** - Per-category budgets with alerts
6. **Real-time Sync** - Expenses visible to all collaborators instantly

---

## 🎯 Success Criteria

- ✅ Users can add expenses manually or via receipt scanning
- ✅ AI receipt scanning accuracy > 85%
- ✅ AI categorization accuracy > 90%
- ✅ Balance calculations are mathematically correct
- ✅ Debt simplification minimizes number of transactions
- ✅ Real-time expense sync < 200ms latency
- ✅ 70% of multi-day trips use expense tracking

---

## 🏗️ Architecture Overview

### Technology Stack

**Backend**:
- Database: PostgreSQL (3 new tables)
- AI Service: GPT-4 Vision for receipt OCR
- Currency API: ExchangeRate-API for conversions
- Real-time: WebSocket (reuse Phase 2 infrastructure)

**Frontend**:
- Components: React + TypeScript
- State: React hooks + Zustand
- UI: Framer Motion animations
- File upload: Camera capture for receipts

### Data Flow

```
Receipt Photo (User)
  ↓
GPT-4 Vision API
  ↓
Extract: Amount, Merchant, Date, Items
  ↓
AI Categorization
  ↓
Save to Database
  ↓
WebSocket Broadcast
  ↓
All Collaborators See Update (Real-time)
```

---

## 📊 Database Schema

### New Tables (Migration: `011_add_expense_tracking.sql`)

#### 1. trip_expenses
**Purpose**: Store all trip expenses with splitting data

```sql
CREATE TABLE trip_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,

  -- Who paid
  paid_by UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Expense details
  description VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'accommodation', 'food', 'transportation', 'activities',
    'shopping', 'fuel', 'tolls', 'parking', 'other'
  )),

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  amount_eur DECIMAL(10,2), -- Converted for calculations

  -- Date and location
  expense_date DATE NOT NULL,
  location VARCHAR(255),
  city_name VARCHAR(100),

  -- Receipt
  receipt_url TEXT,
  receipt_data JSONB, -- OCR extracted data

  -- Splitting
  split_method VARCHAR(20) DEFAULT 'equal' CHECK (split_method IN (
    'equal', 'percentage', 'shares', 'custom'
  )),
  split_data JSONB, -- { userId: amount } for custom splits
  participants UUID[], -- Array of user IDs sharing this expense

  -- AI categorization
  ai_suggested_category VARCHAR(50),
  ai_confidence DECIMAL(3,2),
  is_ai_categorized BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  tags TEXT[],
  is_reimbursed BOOLEAN DEFAULT false,
  reimbursement_status JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_participants CHECK (ARRAY_LENGTH(participants, 1) > 0)
);

CREATE INDEX idx_trip_expenses_route_id ON trip_expenses(route_id);
CREATE INDEX idx_trip_expenses_paid_by ON trip_expenses(paid_by);
CREATE INDEX idx_trip_expenses_expense_date ON trip_expenses(expense_date);
CREATE INDEX idx_trip_expenses_category ON trip_expenses(category);
CREATE INDEX idx_trip_expenses_participants ON trip_expenses USING GIN(participants);
```

#### 2. expense_settlements
**Purpose**: Track who owes whom (simplified debts)

```sql
CREATE TABLE expense_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

  -- Who owes whom
  debtor UUID REFERENCES users(id) ON DELETE CASCADE,
  creditor UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'cancelled'
  )),
  settled_at TIMESTAMP WITH TIME ZONE,

  -- Payment tracking
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT different_users CHECK (debtor != creditor),
  CONSTRAINT positive_settlement CHECK (amount > 0)
);

CREATE INDEX idx_settlements_route_id ON expense_settlements(route_id);
CREATE INDEX idx_settlements_debtor ON expense_settlements(debtor);
CREATE INDEX idx_settlements_creditor ON expense_settlements(creditor);
CREATE INDEX idx_settlements_status ON expense_settlements(status);
```

#### 3. trip_budgets
**Purpose**: Per-category budget tracking

```sql
CREATE TABLE trip_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

  -- Budget per category
  category VARCHAR(50) NOT NULL,
  budgeted_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Alerts
  alert_threshold DECIMAL(3,2) DEFAULT 0.80, -- Alert at 80%
  alert_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(route_id, category),
  CONSTRAINT positive_budget CHECK (budgeted_amount > 0),
  CONSTRAINT valid_threshold CHECK (alert_threshold > 0 AND alert_threshold <= 1)
);

CREATE INDEX idx_trip_budgets_route_id ON trip_budgets(route_id);
```

#### Helper Views

```sql
-- View: Expense summary per user
CREATE OR REPLACE VIEW expense_summary_by_user AS
SELECT
  e.route_id,
  e.paid_by as user_id,
  COUNT(*) as expense_count,
  SUM(e.amount_eur) as total_paid,
  AVG(e.amount_eur) as avg_expense,
  e.category,
  COUNT(*) FILTER (WHERE e.is_ai_categorized = true) as ai_categorized_count
FROM trip_expenses e
GROUP BY e.route_id, e.paid_by, e.category;

-- View: Balance calculation (who owes whom)
CREATE OR REPLACE VIEW user_balances AS
WITH expense_shares AS (
  SELECT
    route_id,
    paid_by,
    UNNEST(participants) as participant,
    CASE
      WHEN split_method = 'equal' THEN amount_eur / ARRAY_LENGTH(participants, 1)
      WHEN split_method = 'custom' THEN (split_data->>participant::text)::decimal
      ELSE amount_eur / ARRAY_LENGTH(participants, 1)
    END as share_amount
  FROM trip_expenses
)
SELECT
  route_id,
  participant as user_id,
  SUM(CASE WHEN participant = paid_by THEN 0 ELSE -share_amount END) +
  SUM(CASE WHEN participant != paid_by THEN 0 ELSE amount_eur END) as balance
FROM expense_shares
GROUP BY route_id, participant;

-- View: Budget vs actual spending
CREATE OR REPLACE VIEW budget_vs_actual AS
SELECT
  b.route_id,
  b.category,
  b.budgeted_amount,
  COALESCE(SUM(e.amount_eur), 0) as actual_spent,
  b.budgeted_amount - COALESCE(SUM(e.amount_eur), 0) as remaining,
  (COALESCE(SUM(e.amount_eur), 0) / b.budgeted_amount) as spend_percentage
FROM trip_budgets b
LEFT JOIN trip_expenses e ON b.route_id = e.route_id AND b.category = e.category
GROUP BY b.id, b.route_id, b.category, b.budgeted_amount;
```

---

## 📝 Implementation Roadmap

### STEP 1: Database Setup ⏱️ 3 hours

**Goal**: Create expense tracking tables and views

**Tasks**:
- [ ] Create migration file `db/migrations/011_add_expense_tracking.sql`
- [ ] Add 3 tables: trip_expenses, expense_settlements, trip_budgets
- [ ] Create helper views for calculations
- [ ] Run migration locally
- [ ] Verify tables and indexes

**Verification**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('trip_expenses', 'expense_settlements', 'trip_budgets');

SELECT viewname FROM pg_views
WHERE viewname IN ('expense_summary_by_user', 'user_balances', 'budget_vs_actual');
```

---

### STEP 2: AI Receipt Scanner Service ⏱️ 2 days

**Goal**: Build GPT-4 Vision service for receipt OCR

**File**: `server/services/ReceiptScannerService.js`

**Features**:
- Receipt OCR with GPT-4 Vision
- Extract: merchant, amount, date, items, location
- AI expense categorization
- Confidence scoring
- Currency detection

**Key Methods**:
```javascript
class ReceiptScannerService {
  async scanReceipt(imageBuffer) {
    // Use GPT-4 Vision to extract receipt data
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "user",
        content: [{
          type: "text",
          text: "Extract merchant, amount, currency, date, items from this receipt. Return JSON only."
        }, {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}` }
        }]
      }],
      max_tokens: 500
    });

    const extracted = JSON.parse(response.choices[0].message.content);
    const category = await this.categorizeExpense(extracted.merchant, extracted.items);

    return { ...extracted, category: category.category, confidence: category.confidence };
  }

  async categorizeExpense(merchant, description) {
    // AI categorization into: accommodation, food, transportation, etc.
  }

  async suggestSplitMethod(expense, participants) {
    // AI suggests: equal, percentage, shares, or custom
  }
}
```

**Testing**:
```bash
# Test with sample receipts
node test-receipt-scanner.js --image=test-receipts/restaurant.jpg
node test-receipt-scanner.js --image=test-receipts/hotel.jpg
node test-receipt-scanner.js --image=test-receipts/fuel.jpg
```

---

### STEP 3: Currency Conversion Service ⏱️ 4 hours

**Goal**: Real-time currency conversion

**File**: `server/services/CurrencyService.js`

**Features**:
- Fetch live exchange rates from ExchangeRate-API
- Cache rates for 1 hour
- Convert any currency to EUR (base currency)
- Fallback to manual rates if API fails

**Implementation**:
```javascript
class CurrencyService {
  constructor() {
    this.ratesCache = null;
    this.cacheExpiry = null;
  }

  async getExchangeRates() {
    const now = Date.now();
    if (this.ratesCache && now < this.cacheExpiry) {
      return this.ratesCache;
    }

    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/EUR`);
    const data = await response.json();

    this.ratesCache = data.rates;
    this.cacheExpiry = now + (60 * 60 * 1000); // 1 hour

    return this.ratesCache;
  }

  async convertToEUR(amount, fromCurrency) {
    if (fromCurrency === 'EUR') return amount;

    const rates = await this.getExchangeRates();
    const rate = rates[fromCurrency];

    if (!rate) throw new Error(`Unsupported currency: ${fromCurrency}`);

    return amount / rate;
  }
}
```

---

### STEP 4: Expense API Endpoints ⏱️ 2 days

**Goal**: CRUD endpoints for expense management

**Endpoints to add** (in server.js):

#### Expense Management
```javascript
// POST /api/routes/:id/expenses - Add expense
app.post('/api/routes/:id/expenses', authMiddleware, async (req, res) => {
  const { description, amount, currency, category, expense_date, participants, split_method, receipt_url } = req.body;
  const routeId = req.params.id;
  const userId = req.user.id;

  // Verify permission
  const permission = await checkRoutePermission(routeId, userId);
  if (!permission || permission.role === 'viewer') {
    return res.status(403).json({ error: 'Not authorized to add expenses' });
  }

  // Convert amount to EUR
  const amountEur = await currencyService.convertToEUR(amount, currency);

  // Create expense
  const result = await pool.query(`
    INSERT INTO trip_expenses (
      route_id, paid_by, description, amount, currency, amount_eur,
      category, expense_date, participants, split_method, receipt_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [routeId, userId, description, amount, currency, amountEur, category, expense_date, participants, split_method, receipt_url]);

  // Broadcast to collaborators via WebSocket
  global.collaborationService?.broadcast(routeId, {
    type: 'expense_added',
    data: result.rows[0]
  });

  // Log activity
  await logRouteActivity(routeId, userId, 'expense_added', `Added expense: ${description}`, { amount, currency, category });

  res.json({ expense: result.rows[0] });
});

// GET /api/routes/:id/expenses - List expenses
// PATCH /api/routes/:id/expenses/:expenseId - Update expense
// DELETE /api/routes/:id/expenses/:expenseId - Delete expense
```

#### Balance Calculations
```javascript
// GET /api/routes/:id/expenses/balances - Calculate balances
app.get('/api/routes/:id/expenses/balances', authMiddleware, async (req, res) => {
  const routeId = req.params.id;

  // Get balances from view
  const balances = await pool.query(`
    SELECT user_id, balance FROM user_balances WHERE route_id = $1
  `, [routeId]);

  // Simplify debts using greedy algorithm
  const settlements = simplifyDebts(balances.rows);

  res.json({ balances: balances.rows, settlements });
});
```

#### Receipt Scanning
```javascript
// POST /api/expenses/scan-receipt - OCR scan receipt
app.post('/api/expenses/scan-receipt', authMiddleware, upload.single('receipt'), async (req, res) => {
  const imageBuffer = req.file.buffer;

  const scanned = await receiptScannerService.scanReceipt(imageBuffer);

  res.json({ scanned });
});
```

#### Settlements
```javascript
// POST /api/routes/:id/settlements - Create settlement
// PATCH /api/routes/:id/settlements/:id - Mark as settled
// GET /api/routes/:id/settlements - List settlements
```

**Helper Functions**:
```javascript
// Debt simplification algorithm
function simplifyDebts(balances) {
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const settlements = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i].balance;
    const debt = Math.abs(debtors[j].balance);
    const amount = Math.min(credit, debt);

    settlements.push({
      debtor: debtors[j].user_id,
      creditor: creditors[i].user_id,
      amount: parseFloat(amount.toFixed(2))
    });

    creditors[i].balance -= amount;
    debtors[j].balance += amount;

    if (Math.abs(creditors[i].balance) < 0.01) i++;
    if (Math.abs(debtors[j].balance) < 0.01) j++;
  }

  return settlements;
}
```

---

### STEP 5: Frontend Types ⏱️ 1 hour

**Goal**: TypeScript interfaces for expenses

**File**: `spotlight-react/src/types/index.ts`

```typescript
// Expense types (Phase 3)
export interface TripExpense {
  id: string
  routeId: string
  itineraryId?: string
  paidBy: string
  paidByName: string
  paidByAvatar?: string
  description: string
  category: ExpenseCategory
  amount: number
  currency: string
  amountEur: number
  expenseDate: string
  location?: string
  cityName?: string
  receiptUrl?: string
  receiptData?: any
  splitMethod: SplitMethod
  splitData?: Record<string, number>
  participants: string[]
  aiSuggestedCategory?: string
  aiConfidence?: number
  isAiCategorized: boolean
  notes?: string
  tags?: string[]
  isReimbursed: boolean
  reimbursementStatus?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transportation'
  | 'activities'
  | 'shopping'
  | 'fuel'
  | 'tolls'
  | 'parking'
  | 'other'

export type SplitMethod = 'equal' | 'percentage' | 'shares' | 'custom'

export interface ExpenseSettlement {
  id: string
  routeId: string
  debtor: string
  debtorName: string
  creditor: string
  creditorName: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'cancelled'
  settledAt?: string
  paymentMethod?: string
  paymentReference?: string
  createdAt: string
}

export interface UserBalance {
  userId: string
  userName: string
  userAvatar?: string
  balance: number // Positive = owed money, Negative = owes money
}

export interface TripBudget {
  id: string
  routeId: string
  category: ExpenseCategory
  budgetedAmount: number
  currency: string
  actualSpent: number
  remaining: number
  spendPercentage: number
  alertThreshold: number
  alertSent: boolean
}
```

---

### STEP 6: ExpenseTracker Component ⏱️ 2 days

**Goal**: Main expense tracking UI

**File**: `spotlight-react/src/components/expenses/ExpenseTracker.tsx`

**Features**:
- Tabbed interface (Expenses / Balances / Budget)
- Real-time expense list with filters
- Add expense button
- Total spent indicator
- Category breakdown chart

**State Management**:
```typescript
const [expenses, setExpenses] = useState<TripExpense[]>([])
const [balances, setBalances] = useState<UserBalance[]>([])
const [settlements, setSettlements] = useState<ExpenseSettlement[]>([])
const [budgets, setBudgets] = useState<TripBudget[]>([])
const [view, setView] = useState<'list' | 'balances' | 'budget'>('list')
const [showAddModal, setShowAddModal] = useState(false)
```

**WebSocket Integration**:
```typescript
// Listen for expense updates
const { lastMessage } = useWebSocket('/ws/collab', {
  onMessage: (msg) => {
    if (msg.type === 'expense_added') {
      setExpenses(prev => [...prev, msg.data])
      // Recalculate balances
      fetchBalances()
    }
  }
})
```

---

### STEP 7: AddExpenseModal Component ⏱️ 2 days

**Goal**: Beautiful expense entry modal

**File**: `spotlight-react/src/components/expenses/AddExpenseModal.tsx`

**Features**:
- Receipt camera capture
- Auto-fill from AI scanning
- Manual entry form
- Category selection with icons
- Participant multi-select
- Split method selector
- Date picker

**Receipt Scanning Flow**:
```typescript
const handleReceiptUpload = async (file: File) => {
  setIsScanning(true)

  const formData = new FormData()
  formData.append('receipt', file)

  const res = await fetch('/api/expenses/scan-receipt', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })

  const { scanned } = await res.json()

  // Auto-fill form
  setDescription(scanned.merchant || '')
  setAmount(scanned.amount?.toString() || '')
  setCategory(scanned.category || '')
  setDate(scanned.date || new Date().toISOString().split('T')[0])

  setIsScanning(false)
}
```

---

### STEP 8: BalanceSummary Component ⏱️ 1 day

**Goal**: Who owes whom visualization

**File**: `spotlight-react/src/components/expenses/BalanceSummary.tsx`

**Features**:
- Simplified settlements display
- User avatars with arrows
- "Mark as Paid" buttons
- PayPal/Venmo integration (optional)
- Export settlements list

**UI**:
```
┌─────────────────────────────────┐
│ Who Owes Whom                   │
├─────────────────────────────────┤
│ [Alice] → [Bob]     €45.30      │
│ [Mark as Paid]                  │
├─────────────────────────────────┤
│ [Charlie] → [Bob]   €23.15      │
│ [Mark as Paid]                  │
└─────────────────────────────────┘
```

---

### STEP 9: BudgetOverview Component ⏱️ 1 day

**Goal**: Budget tracking per category

**File**: `spotlight-react/src/components/expenses/BudgetOverview.tsx`

**Features**:
- Budget vs actual bars
- Alert warnings (80% threshold)
- Add/edit category budgets
- Spending trend charts

**Visualization**:
```
Food:         [████████░░] 80% (€640 / €800)
Transport:    [██████░░░░] 60% (€180 / €300)
Activities:   [███████████] 110% ⚠️ (€220 / €200)
```

---

### STEP 10: Integration with Spotlight Page ⏱️ 4 hours

**Goal**: Add ExpenseTracker to route detail page

**File**: `spotlight-react/src/components/spotlight/SpotlightPageComplete.tsx`

**Changes**:
- Add "Expenses" button in header
- Show ExpenseTracker in modal or sidebar
- Badge with total spent amount
- Alert indicator for budget warnings

```typescript
const [showExpenseTracker, setShowExpenseTracker] = useState(false)
const [totalSpent, setTotalSpent] = useState(0)
const [budgetAlerts, setBudgetAlerts] = useState(0)

// In header
<Button onClick={() => setShowExpenseTracker(true)}>
  💰 Expenses {totalSpent > 0 && `(€${totalSpent.toFixed(2)})`}
  {budgetAlerts > 0 && <Badge variant="warning">{budgetAlerts}</Badge>}
</Button>
```

---

### STEP 11: Real-time Sync ⏱️ 4 hours

**Goal**: Broadcast expense changes via WebSocket

**Implementation**:
- Expense added → broadcast to all collaborators
- Expense updated → refresh balances
- Settlement marked paid → update UI
- Budget alert triggered → notify participants

**WebSocket Messages**:
```javascript
// New expense
{ type: 'expense_added', data: expense }

// Expense updated
{ type: 'expense_updated', expenseId, data: changes }

// Settlement completed
{ type: 'settlement_completed', settlementId }

// Budget alert
{ type: 'budget_alert', category, percentage }
```

---

### STEP 12: Testing & QA ⏱️ 2 days

**Unit Tests**:
- Debt simplification algorithm
- Currency conversion
- Balance calculations
- Split calculations (equal, custom, etc.)

**Integration Tests**:
```javascript
describe('Expense Tracking', () => {
  test('Add expense and calculate balances', async () => {
    // Add expense paid by User A
    // Check User B owes correct amount
  })

  test('Debt simplification minimizes transactions', () => {
    // 3 users with complex debts
    // Should simplify to 2 transactions
  })

  test('Receipt scanning extracts data correctly', async () => {
    // Upload test receipt
    // Verify extracted amount, merchant, date
  })

  test('Budget alerts trigger at 80% threshold', async () => {
    // Set budget of €100
    // Add expenses totaling €80
    // Verify alert is triggered
  })
})
```

**Manual Testing Checklist**:
- [ ] Add expense manually
- [ ] Upload receipt photo (mobile)
- [ ] AI auto-fills correctly
- [ ] Participants can be selected
- [ ] Split equally works
- [ ] Custom split works
- [ ] Balances calculate correctly
- [ ] Settlements minimize transactions
- [ ] Mark as paid updates balance
- [ ] Budget warnings appear
- [ ] Real-time sync works
- [ ] Mobile responsive

---

### STEP 13: Deployment ⏱️ 1 day

**Pre-deployment**:
- [ ] Run migration on Heroku Postgres
- [ ] Configure GPT-4 Vision API key
- [ ] Set up currency exchange API
- [ ] Configure file upload (S3 or Cloudinary for receipts)
- [ ] Test receipt scanning in production

**Environment Variables**:
```bash
OPENAI_API_KEY=sk-...  # For receipt scanning
CURRENCY_API_KEY=...   # For exchange rates (optional)
AWS_S3_BUCKET=...      # For receipt storage (optional)
```

**Migration Command**:
```bash
heroku pg:psql -a rdtrip
\i db/migrations/011_add_expense_tracking.sql
```

**Deployment**:
```bash
git add .
git commit -m "Phase 3: Add expense tracking and splitting"
git push origin main
git push heroku main
```

---

## 🧪 Testing Strategy

### Test Scenarios

**Scenario 1: Basic Expense Tracking**
1. User A adds hotel expense (€200)
2. Splits equally with User B
3. Both see expense in list
4. Balance shows User B owes €100

**Scenario 2: Receipt Scanning**
1. User takes photo of restaurant receipt
2. AI extracts: "Restaurant Bella Vista, €45.80, Food"
3. Form auto-fills
4. User confirms and saves
5. Expense appears with receipt attached

**Scenario 3: Complex Splitting**
1. 4 users on trip
2. 10+ expenses with different participants
3. System calculates balances
4. Simplifies to minimum transactions
5. User C owes User A €87.50 (instead of multiple small payments)

**Scenario 4: Budget Alerts**
1. Set food budget: €500
2. Add expenses totaling €400
3. Add another €50 (total €450 = 90%)
4. Alert triggered: "Food budget at 90%"
5. Collaborators receive notification

---

## 📈 Success Metrics

**Technical**:
- Receipt scan accuracy: > 85%
- AI categorization accuracy: > 90%
- Balance calculation precision: 100%
- API response time: < 500ms
- Real-time sync latency: < 200ms

**Product**:
- 70% of multi-day trips use expense tracking
- Average 10+ expenses logged per trip
- Balance settlement completion: > 60%
- Receipt scanning usage: > 40% of expenses
- Budget alerts reduce overspending by 25%

---

## 🚀 Launch Plan

### Soft Launch (Week 1)
- Enable for beta users (Phase 2 collaborators)
- Monitor receipt scanning accuracy
- Collect feedback on UI/UX
- Fix critical bugs

### Full Launch (Week 2)
- Enable for all users
- Announce via email and in-app notification
- Create tutorial video
- Blog post: "Split Trip Costs Fairly with AI"

### Post-Launch
- Monitor adoption metrics
- A/B test different split methods
- Improve AI categorization
- Add premium features (advanced analytics)

---

## 🐛 Known Issues & Limitations

**V1 Limitations**:
- No offline expense entry (requires internet)
- Receipt scanning limited to clear photos
- No multi-currency display (all converted to EUR)
- No expense approval workflow
- Max 20 participants per expense
- No recurring expenses

**Future Enhancements** (Phase 3.1):
- Offline mode with sync when online
- CSV import from other expense apps
- Multi-currency wallet
- Expense approval for large amounts
- Recurring expenses (daily allowance)
- Integration with banking apps
- Tax-deductible expense tagging
- Mileage tracking for fuel

---

## 💡 AI Innovation Highlights

1. **Smart Receipt Scanning**: GPT-4 Vision extracts data from any receipt (any language, any format)
2. **Intelligent Categorization**: Learns from user corrections to improve accuracy
3. **Fair Split Suggestions**: AI recommends best split method based on expense type
4. **Budget Predictions**: Predict total trip cost based on first few days
5. **Anomaly Detection**: Alert if expense is unusually high for category

---

## 📚 Resources

- [ExchangeRate-API Docs](https://www.exchangerate-api.com/docs)
- [GPT-4 Vision Guide](https://platform.openai.com/docs/guides/vision)
- [Debt Simplification Algorithm](https://en.wikipedia.org/wiki/Greedy_algorithm)
- [Phase 2 WebSocket Infrastructure](./PHASE2_IMPLEMENTATION_PLAN.md)

---

**Ready to implement! Let's build the best expense tracker for road trips! 💰**
