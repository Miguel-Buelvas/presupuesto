import { ArrowRight, ChevronRight, Clock, Plus } from 'lucide-react';
import { ExpenseMovement, formatCOP } from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

interface RecentMovementsProps {
  movements: ExpenseMovement[];
  hasExpenses: boolean;
  onSelectMovement: (movement: ExpenseMovement) => void;
  onViewAllMovements: () => void;
  onCreateExpense: () => void;
}

export function RecentMovements({
  movements,
  hasExpenses,
  onSelectMovement,
  onViewAllMovements,
  onCreateExpense,
}: RecentMovementsProps) {
  const recentFive = movements.slice(0, 5);
  const recentExpensesTotal = recentFive
    .filter((m) => m.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const recentIncomeTotal = recentFive
    .filter((m) => m.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <section
      aria-labelledby="ultimos-movimientos-titulo"
      className="rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#1a163b] via-[#14122b] to-[#19153f] p-5 sm:p-6 flex flex-col justify-between gap-5 h-full"
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-violet-400/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock
              className="w-5 h-5 text-violet-300 shrink-0"
              aria-hidden="true"
            />
            <h2
              id="ultimos-movimientos-titulo"
              className="text-base sm:text-lg font-semibold text-white tracking-tight truncate"
            >
              Últimos Movimientos
            </h2>
          </div>
          <button
            type="button"
            onClick={onViewAllMovements}
            aria-label={`Ver todo el historial (${movements.length} movimientos)`}
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-[#10f5a0] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0] rounded px-1.5 py-1"
          >
            <span>Ver todo</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {!hasExpenses && movements.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-2 gap-3.5">
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-base font-bold text-white">
                Tus gastos van a vivir aquí
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                cada vez que pagues algo, lo registras y aparece en esta lista
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateExpense}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7c5dfa] px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-bold text-white shadow-[0_0_18px_rgba(91,61,245,0.4)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus
                className="w-4 h-4 shrink-0"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span>Registrar gasto</span>
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-violet-400/10">
            {recentFive.map((movement) => {
              const isIncome = movement.type === 'income';
              return (
                <li key={movement.id}>
                  <button
                    type="button"
                    onClick={() => onSelectMovement(movement)}
                    className="w-full py-3.5 px-1.5 -mx-1.5 rounded-xl flex items-center justify-between gap-3 text-left hover:bg-violet-400/10 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon
                        category={movement.category}
                        type={movement.type}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-[#10f5a0] transition-colors">
                          {movement.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate tabular-nums">
                          <span>{movement.dateLabel}</span>
                          <span
                            className="mx-1.5 text-slate-600"
                            aria-hidden="true"
                          >
                            &middot;
                          </span>
                          {isIncome ? (
                            <span className="text-[#10f5a0] font-medium">
                              Ingreso &middot; {movement.category}
                            </span>
                          ) : (
                            <span>{movement.category}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p
                        className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                          isIncome ? 'text-[#10f5a0]' : 'text-white'
                        }`}
                      >
                        {isIncome
                          ? `+${formatCOP(movement.amount)}`
                          : formatCOP(movement.amount)}
                      </p>
                      <ChevronRight
                        className="w-4 h-4 text-slate-500 group-hover:text-[#10f5a0] transition-colors"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!hasExpenses ? (
        <div className="rounded-xl border border-violet-400/15 bg-[#121029]/70 px-4 py-3 text-center">
          <p className="text-xs text-slate-400">
            Selecciona un gasto en Movimientos para ver el detalle
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-violet-400/25 bg-gradient-to-r from-[#231d52] to-[#2e246a] px-4 py-3.5 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-200">
            {recentIncomeTotal > 0 ? 'Balance Reciente' : 'Subtotal Reciente'}
          </span>
          <span className="text-base font-bold text-[#10f5a0] tabular-nums">
            {recentIncomeTotal > 0
              ? `${
                  recentIncomeTotal - recentExpensesTotal >= 0 ? '+' : ''
                }${formatCOP(recentIncomeTotal - recentExpensesTotal)}`
              : formatCOP(recentExpensesTotal)}
          </span>
        </div>
      )}
    </section>
  );
}
