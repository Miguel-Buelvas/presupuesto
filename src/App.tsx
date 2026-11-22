/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AssistantDrawer,
  RegisterExpenseArgs,
  RegisteredExpenseReceipt,
} from './components/AssistantDrawer';
import { CreateExpenseView } from './components/CreateExpenseView';
import { CreateIncomeView } from './components/CreateIncomeView';
import { DailyExpensesChart } from './components/DailyExpensesChart';
import { MonthlySummary } from './components/MonthlySummary';
import { MovementDetailView } from './components/MovementDetailView';
import { MovementsModal } from './components/MovementsModal';
import { RecentMovements } from './components/RecentMovements';
import {
  ALL_CATEGORIES,
  ExpenseCategory,
  ExpenseMovement,
  IncomeCategory,
  MONTHS_CONFIG,
  MONTHS_SHORT_NAMES,
  PaymentMethod,
  formatCOP,
  getBudgetSummary,
} from './data/budgetData';

type ScreenView = 'dashboard' | 'detail' | 'create-expense' | 'create-income';

function sortChronologicallyDesc(list: ExpenseMovement[]): ExpenseMovement[] {
  return [...list].sort((a, b) => {
    if (b.day !== a.day) return b.day - a.day;
    return b.timeLabel.localeCompare(a.timeLabel);
  });
}

function normalizeExpenseCategory(rawCategory: string): ExpenseCategory {
  const clean = rawCategory
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const exactMatch = ALL_CATEGORIES.find(
    (cat) =>
      cat
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase() === clean
  );
  if (exactMatch) return exactMatch;

  if (
    clean.includes('aliment') ||
    clean.includes('comida') ||
    clean.includes('restaurante') ||
    clean.includes('mercado') ||
    clean.includes('cafe')
  ) {
    return ExpenseCategory.Alimentacion;
  }
  if (
    clean.includes('transport') ||
    clean.includes('taxi') ||
    clean.includes('uber') ||
    clean.includes('bus') ||
    clean.includes('gasolina')
  ) {
    return ExpenseCategory.Transporte;
  }
  if (
    clean.includes('servicio') ||
    clean.includes('luz') ||
    clean.includes('agua') ||
    clean.includes('internet') ||
    clean.includes('gas')
  ) {
    return ExpenseCategory.ServiciosPublicos;
  }
  if (
    clean.includes('ropa') ||
    clean.includes('compra') ||
    clean.includes('personal')
  ) {
    return ExpenseCategory.RopaYCompras;
  }
  if (
    clean.includes('entretenimiento') ||
    clean.includes('ocio') ||
    clean.includes('cine') ||
    clean.includes('salida')
  ) {
    return ExpenseCategory.Entretenimiento;
  }

  return ExpenseCategory.Alimentacion;
}

export default function App() {
  const [selectedMonthId, setSelectedMonthId] = useState<string>(
    MONTHS_CONFIG[0].id
  );
  const [budgetsByMonth, setBudgetsByMonth] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      for (const month of MONTHS_CONFIG) {
        initial[month.id] = month.monthlyBudget;
      }
      return initial;
    }
  );
  const [movementsByMonth, setMovementsByMonth] = useState<
    Record<string, ExpenseMovement[]>
  >(() => {
    const initial: Record<string, ExpenseMovement[]> = {};
    for (const month of MONTHS_CONFIG) {
      initial[month.id] = sortChronologicallyDesc(month.initialMovements);
    }
    return initial;
  });

  const [currentView, setCurrentView] = useState<ScreenView>('dashboard');
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [detailFromModal, setDetailFromModal] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(
    null
  );
  const [lastSavedMovement, setLastSavedMovement] =
    useState<ExpenseMovement | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [userName, setUserName] = useState('Miguel');

  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMonthMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMonthMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMonthMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMonthMenuOpen]);

  const activeMonth =
    MONTHS_CONFIG.find((m) => m.id === selectedMonthId) ?? MONTHS_CONFIG[0];

  const activeMovements = useMemo(
    () => movementsByMonth[activeMonth.id] ?? [],
    [movementsByMonth, activeMonth.id]
  );

  const hasExpenses = useMemo(
    () => activeMovements.some((m) => m.type === 'expense'),
    [activeMovements]
  );

  const activeBaseBudget =
    budgetsByMonth[activeMonth.id] ?? activeMonth.monthlyBudget;

  const summary = useMemo(
    () => getBudgetSummary(activeMonth, activeMovements, activeBaseBudget),
    [activeMonth, activeMovements, activeBaseBudget]
  );

  const handleUpdateBudget = (newBaseBudget: number) => {
    setBudgetsByMonth((prev) => ({
      ...prev,
      [activeMonth.id]: newBaseBudget,
    }));
  };

  const selectedMovement = useMemo(
    () => activeMovements.find((m) => m.id === selectedMovementId) ?? null,
    [activeMovements, selectedMovementId]
  );

  const handleOpenDetail = (movement: ExpenseMovement, fromModal: boolean) => {
    setSelectedMovementId(movement.id);
    setDetailFromModal(fromModal);
    setIsMovementsModalOpen(false);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setCurrentView('dashboard');
    if (detailFromModal) {
      setIsMovementsModalOpen(true);
    }
  };

  const handleOpenCreateExpense = () => {
    setLastSavedMovement(null);
    setIsMovementsModalOpen(false);
    setCurrentView('create-expense');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreateIncome = () => {
    setLastSavedMovement(null);
    setIsMovementsModalOpen(false);
    setCurrentView('create-income');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveExpense = (payload: {
    amount: number;
    category: ExpenseCategory;
    title: string;
    day: number;
    note: string;
  }) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const newMovement: ExpenseMovement = {
      id: `exp-${Date.now()}`,
      type: 'expense',
      day: payload.day,
      title: payload.title,
      category: payload.category,
      dateLabel: `${payload.day} ${activeMonth.shortMonth} ${activeMonth.year}`,
      timeLabel: `${hours}:${minutes}`,
      amount: payload.amount,
      note: payload.note || undefined,
    };

    setMovementsByMonth((prev) => ({
      ...prev,
      [activeMonth.id]: sortChronologicallyDesc([
        newMovement,
        ...(prev[activeMonth.id] ?? []),
      ]),
    }));

    setLastSavedMovement(newMovement);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveIncome = (payload: {
    amount: number;
    description: string;
    category: IncomeCategory;
    dateIso: string;
    paymentMethod: PaymentMethod;
    observations: string;
  }) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const [yearStr, monthStr, dayStr] = payload.dateIso.split('-');
    const parsedYear = Number(yearStr) || activeMonth.year;
    const parsedMonthIdx = (Number(monthStr) || 11) - 1;
    const parsedDay = Number(dayStr) || activeMonth.currentDayOfMonth;
    const shortMonthName =
      MONTHS_SHORT_NAMES[parsedMonthIdx] ?? activeMonth.shortMonth;

    const newIncome: ExpenseMovement = {
      id: `inc-${Date.now()}`,
      type: 'income',
      day: Math.min(activeMonth.totalDaysInMonth, Math.max(1, parsedDay)),
      title: payload.description,
      category: payload.category,
      dateLabel: `${parsedDay} ${shortMonthName} ${parsedYear}`,
      timeLabel: `${hours}:${minutes}`,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      note: payload.observations || undefined,
    };

    setMovementsByMonth((prev) => ({
      ...prev,
      [activeMonth.id]: sortChronologicallyDesc([
        newIncome,
        ...(prev[activeMonth.id] ?? []),
      ]),
    }));

    setLastSavedMovement(newIncome);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterExpenseFromAssistant = (
    args: RegisterExpenseArgs
  ): RegisteredExpenseReceipt | null => {
    const amount = Math.round(Number(args.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    let parsedDay = activeMonth.currentDayOfMonth;
    let dateLabel = `${parsedDay} ${activeMonth.shortMonth} ${activeMonth.year}`;

    if (typeof args.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      const [yearStr, monthStr, dayStr] = args.date.split('-');
      const yearNum = Number(yearStr) || activeMonth.year;
      const monthIdx = (Number(monthStr) || Number(activeMonth.monthNumber)) - 1;
      const dayNum = Number(dayStr);
      if (Number.isFinite(dayNum) && dayNum >= 1) {
        parsedDay = Math.min(activeMonth.totalDaysInMonth, Math.max(1, dayNum));
        const shortMonth =
          MONTHS_SHORT_NAMES[monthIdx] ?? activeMonth.shortMonth;
        dateLabel = `${dayNum} ${shortMonth} ${yearNum}`;
      }
    }

    const category = normalizeExpenseCategory(args.category);
    const title = args.description.trim() || 'Gasto registrado';

    const newMovement: ExpenseMovement = {
      id: `exp-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'expense',
      day: parsedDay,
      title,
      category,
      dateLabel,
      timeLabel: `${hours}:${minutes}`,
      amount,
      note: 'Registrado mediante el Asistente',
    };

    setMovementsByMonth((prev) => ({
      ...prev,
      [activeMonth.id]: sortChronologicallyDesc([
        newMovement,
        ...(prev[activeMonth.id] ?? []),
      ]),
    }));

    setLastSavedMovement(newMovement);

    return {
      title,
      amount,
      category,
      dateLabel,
    };
  };

  const assistantBudgetContext = useMemo(
    () => ({
      monthLabel: activeMonth.label,
      monthId: activeMonth.id,
      monthlyBudget: summary.monthlyBudget,
      totalSpent: summary.totalSpent,
      availableBalance: summary.availableBalance,
      totalIncome: summary.totalIncome,
    }),
    [activeMonth, summary]
  );

  return (
    <div className="relative min-h-screen flex flex-col bg-[#090915] text-slate-100 overflow-x-hidden">
      {/* Subtle Ambient Violet Mesh Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(91,58,214,0.22),transparent_60%)]"
      />

      {/* Header */}
      <header className="relative z-20 border-b border-violet-400/15 bg-[#0b0a18]/85 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <button
            type="button"
            onClick={() => {
              setIsMovementsModalOpen(false);
              setCurrentView('dashboard');
            }}
            className="flex items-center gap-3 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0] rounded-xl"
          >
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b6dff] to-[#5B3DF5] shadow-[0_0_20px_rgba(91,61,245,0.45)] flex items-center justify-center shrink-0 text-white"
            >
              <Wallet className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate">
              Mi Presupuesto Mensual
            </h1>
          </button>

          {/* Month Selector & Period Range */}
          <div
            className="flex items-center gap-3 shrink-0"
            ref={dropdownRef}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMonthMenuOpen((open) => !open)}
                aria-expanded={isMonthMenuOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-2 rounded-xl border border-violet-400/20 bg-[#141328] hover:border-violet-400/40 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0] whitespace-nowrap"
              >
                <Calendar
                  className="w-4 h-4 text-slate-300 shrink-0"
                  aria-hidden="true"
                />
                <span>{activeMonth.label}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                    isMonthMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isMonthMenuOpen && (
                <ul
                  role="listbox"
                  aria-label="Seleccionar mes"
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-violet-400/25 bg-[#16152c] py-1 shadow-xl z-30"
                >
                  {MONTHS_CONFIG.map((month) => {
                    const isSelected = month.id === activeMonth.id;
                    return (
                      <li key={month.id} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMonthId(month.id);
                            setIsMonthMenuOpen(false);
                            setLastSavedMovement(null);
                            if (currentView === 'detail') {
                              setCurrentView('dashboard');
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm transition-colors ${
                            isSelected
                              ? 'bg-violet-500/20 text-[#10f5a0] font-semibold'
                              : 'text-slate-200 hover:bg-violet-500/10'
                          }`}
                        >
                          {month.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <span
              className="hidden sm:inline-block h-4 w-px bg-violet-400/20"
              aria-hidden="true"
            />
            <span className="hidden sm:inline-block text-xs sm:text-sm text-slate-300 tabular-nums whitespace-nowrap">
              {activeMonth.rangeLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content with Smooth Screen Transitions */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="view-dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {lastSavedMovement && (
                <div
                  role="status"
                  className="rounded-xl border border-[#10f5a0]/35 bg-emerald-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white">
                    <CheckCircle2
                      className="w-4 h-4 text-[#10f5a0] shrink-0"
                      aria-hidden="true"
                    />
                    {lastSavedMovement.type === 'income' ? (
                      <span>
                        ✅ Ingreso registrado correctamente:{' '}
                        <strong className="text-[#10f5a0] tabular-nums">
                          +{formatCOP(lastSavedMovement.amount)}
                        </strong>{' '}
                        ({lastSavedMovement.title} &middot;{' '}
                        {lastSavedMovement.category})
                      </span>
                    ) : (
                      <span>
                        Gasto registrado:{' '}
                        <strong className="text-[#10f5a0] tabular-nums">
                          {formatCOP(lastSavedMovement.amount)}
                        </strong>{' '}
                        en {lastSavedMovement.title} ({lastSavedMovement.category})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(lastSavedMovement, false)}
                      className="text-xs font-semibold text-[#10f5a0] hover:underline"
                    >
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => setLastSavedMovement(null)}
                      aria-label="Cerrar aviso"
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <MonthlySummary
                baseBudget={summary.baseBudget}
                totalIncome={summary.totalIncome}
                monthlyBudget={summary.monthlyBudget}
                totalSpent={summary.totalSpent}
                availableBalance={summary.availableBalance}
                spentPercentage={summary.spentPercentage}
                availablePercentage={summary.availablePercentage}
                recordedDaysCount={summary.recordedDaysCount}
                onUpdateBudget={handleUpdateBudget}
                onOpenCreateIncome={handleOpenCreateIncome}
                onOpenCreateExpense={handleOpenCreateExpense}
              />

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] gap-5 items-stretch">
                <div className="min-w-0">
                  <DailyExpensesChart
                    monthId={activeMonth.id}
                    currentDayOfMonth={activeMonth.currentDayOfMonth}
                    dailyExpenses={summary.dailyExpenses}
                    dailyAverage={summary.dailyAverage}
                    peakDay={summary.peakDay}
                    hasExpenses={hasExpenses}
                    onCreateFirstExpense={handleOpenCreateExpense}
                  />
                </div>

                <div className="min-w-0">
                  <RecentMovements
                    movements={activeMovements}
                    hasExpenses={hasExpenses}
                    onSelectMovement={(mov) => handleOpenDetail(mov, false)}
                    onViewAllMovements={() => setIsMovementsModalOpen(true)}
                    onCreateExpense={handleOpenCreateExpense}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'detail' && (
            <motion.div
              key="view-detail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <MovementDetailView
                movement={selectedMovement}
                monthlyBudget={summary.monthlyBudget}
                totalSpent={summary.totalSpent}
                backLabel={
                  detailFromModal ? 'al historial' : 'al Dashboard'
                }
                onBack={handleBackFromDetail}
              />
            </motion.div>
          )}

          {currentView === 'create-expense' && (
            <motion.div
              key="view-create-expense"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <CreateExpenseView
                month={activeMonth}
                currentAvailableBalance={summary.availableBalance}
                onCancel={() => setCurrentView('dashboard')}
                onSaveExpense={handleSaveExpense}
              />
            </motion.div>
          )}

          {currentView === 'create-income' && (
            <motion.div
              key="view-create-income"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <CreateIncomeView
                month={activeMonth}
                currentAvailableBalance={summary.availableBalance}
                onCancel={() => setCurrentView('dashboard')}
                onSaveIncome={handleSaveIncome}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Historial / Movimientos Modal */}
      {isMovementsModalOpen && (
        <MovementsModal
          monthLabel={activeMonth.label}
          movements={activeMovements}
          onClose={() => setIsMovementsModalOpen(false)}
          onSelectMovement={(mov) => handleOpenDetail(mov, true)}
          onCreateNewExpense={handleOpenCreateExpense}
          onCreateNewIncome={handleOpenCreateIncome}
        />
      )}

      {/* Floating Assistant Trigger */}
      {!isAssistantOpen && (
        <button
          type="button"
          onClick={() => setIsAssistantOpen(true)}
          aria-label="Abrir asistente inteligente de presupuesto"
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2.5 rounded-2xl border border-violet-300/35 bg-gradient-to-r from-[#5B3DF5] to-[#7c5dfa] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_28px_rgba(91,61,245,0.5)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0]"
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Asistente</span>
        </button>
      )}

      {/* Assistant Drawer (persisted across open/close) */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        userName={userName}
        onChangeUserName={setUserName}
        budgetContext={assistantBudgetContext}
        onRegisterExpense={handleRegisterExpenseFromAssistant}
      />
    </div>
  );
}
