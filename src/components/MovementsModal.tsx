import { ChevronRight, Clock, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  ALL_CATEGORIES,
  ExpenseCategory,
  ExpenseMovement,
  formatCOP,
} from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

type ModalFilter = ExpenseCategory | 'all' | 'incomes';

interface MovementsModalProps {
  monthLabel: string;
  movements: ExpenseMovement[];
  onClose: () => void;
  onSelectMovement: (movement: ExpenseMovement) => void;
  onCreateNewExpense: () => void;
  onCreateNewIncome: () => void;
}

export function MovementsModal({
  monthLabel,
  movements,
  onClose,
  onSelectMovement,
  onCreateNewExpense,
  onCreateNewIncome,
}: MovementsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ModalFilter>('all');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredMovements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return movements.filter((item) => {
      const matchesFilter =
        selectedFilter === 'all'
          ? true
          : selectedFilter === 'incomes'
          ? item.type === 'income'
          : item.type === 'expense' && item.category === selectedFilter;
      const matchesQuery =
        query === '' ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.dateLabel.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [movements, searchQuery, selectedFilter]);

  const filteredNetTotal = useMemo(() => {
    return filteredMovements.reduce(
      (sum, item) =>
        item.type === 'income' ? sum + item.amount : sum - item.amount,
      0
    );
  }, [filteredMovements]);

  const filteredSpentOnly = useMemo(() => {
    return filteredMovements
      .filter((m) => m.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [filteredMovements]);

  const hasIncomesInFilter = filteredMovements.some((m) => m.type === 'income');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#05040d]/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-historial-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-violet-400/30 bg-[#121124] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-violet-400/15 bg-[#161430] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shrink-0"
            >
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="modal-historial-titulo"
                className="text-base sm:text-lg font-bold text-white tracking-tight truncate"
              >
                Historial de {monthLabel}
              </h2>
              <p className="text-xs text-slate-400 tabular-nums">
                {filteredMovements.length} movimientos &middot;{' '}
                {hasIncomesInFilter ? (
                  <strong className="text-[#10f5a0] font-semibold">
                    Balance: {filteredNetTotal >= 0 ? '+' : ''}
                    {formatCOP(filteredNetTotal)}
                  </strong>
                ) : (
                  <strong className="text-[#10f5a0] font-semibold">
                    {formatCOP(filteredSpentOnly)}
                  </strong>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onCreateNewIncome}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B3DF5] hover:bg-[#6c51f7] px-3 py-2 text-xs font-bold text-white transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={onCreateNewExpense}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00c97e] to-[#10f5a0] px-3 py-2 text-xs font-bold text-[#090915] hover:brightness-110 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
              <span>Gasto</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar historial"
              className="w-9 h-9 rounded-xl border border-violet-400/20 bg-[#141328] hover:border-violet-400/45 flex items-center justify-center text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Search & Category Filters */}
        <div className="px-5 sm:px-6 py-4 border-b border-violet-400/15 bg-[#100f22] space-y-3 shrink-0">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por concepto, categoría o fecha..."
              aria-label="Buscar en el historial de movimientos"
              className="w-full rounded-xl border border-violet-400/20 bg-[#0b0a18] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/40"
            />
            {searchQuery !== '' && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filtrar por tipo o categoría"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 min-h-[32px] text-xs font-medium rounded-full border transition-all whitespace-nowrap shrink-0 ${
                selectedFilter === 'all'
                  ? 'border-violet-400/50 bg-[#5B3DF5] text-white shadow-[0_0_14px_rgba(91,61,245,0.45)]'
                  : 'border-violet-400/15 bg-[#181632] text-slate-300 hover:text-white hover:border-violet-400/35'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('incomes')}
              className={`px-3 py-1.5 min-h-[32px] text-xs font-medium rounded-full border transition-all whitespace-nowrap shrink-0 ${
                selectedFilter === 'incomes'
                  ? 'border-emerald-400/60 bg-emerald-500/20 text-[#10f5a0]'
                  : 'border-violet-400/15 bg-[#181632] text-slate-300 hover:text-[#10f5a0] hover:border-emerald-400/35'
              }`}
            >
              Ingresos
            </button>
            {ALL_CATEGORIES.map((category) => {
              const isActive = selectedFilter === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedFilter(category)}
                  className={`px-3 py-1.5 min-h-[32px] text-xs font-medium rounded-full border transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-violet-400/50 bg-[#5B3DF5] text-white shadow-[0_0_14px_rgba(91,61,245,0.45)]'
                      : 'border-violet-400/15 bg-[#181632] text-slate-300 hover:text-white hover:border-violet-400/35'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Chronological List or Movimientos Vacío */}
        <div className="flex-1 overflow-y-auto">
          {movements.length === 0 ? (
            <div className="p-10 sm:p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-lg font-bold text-white">
                  Tus gastos van a vivir aquí
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  cada vez que pagues algo, lo registras y aparece en esta lista
                </p>
              </div>
              <button
                type="button"
                onClick={onCreateNewExpense}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7c5dfa] px-5 py-2.5 min-h-[42px] text-sm font-bold text-white shadow-[0_0_20px_rgba(91,61,245,0.4)] hover:brightness-110 transition-all"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
                <span>Registrar gasto</span>
              </button>
              <p className="pt-2 text-xs text-slate-400">
                Selecciona un gasto en Movimientos para ver el detalle
              </p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-medium text-white">
                No se encontraron movimientos con estos filtros.
              </p>
              <p className="text-xs text-slate-400">
                Prueba limpiando la búsqueda o seleccionando otra categoría.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-xl border border-violet-400/30 bg-violet-500/15 text-xs font-medium text-violet-200 hover:bg-violet-500/25 transition-colors"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-violet-400/10">
              {filteredMovements.map((movement) => {
                const isIncome = movement.type === 'income';
                return (
                  <li key={movement.id}>
                    <button
                      type="button"
                      onClick={() => onSelectMovement(movement)}
                      className="w-full px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-violet-400/10 transition-colors group focus-visible:outline-none focus-visible:bg-violet-400/15"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
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
                            <span>{movement.timeLabel}</span>
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

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                            isIncome ? 'text-[#10f5a0]' : 'text-white'
                          }`}
                        >
                          {isIncome
                            ? `+${formatCOP(movement.amount)}`
                            : formatCOP(movement.amount)}
                        </span>
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
      </div>
    </div>
  );
}
