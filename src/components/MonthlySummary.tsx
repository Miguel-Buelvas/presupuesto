import {
  AlertTriangle,
  BarChart2,
  BarChart3,
  Check,
  Pencil,
  Plus,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import {
  formatCOP,
  formatCOPValue,
  formatPercentage,
} from '../data/budgetData';

interface MonthlySummaryProps {
  baseBudget: number;
  totalIncome: number;
  monthlyBudget: number;
  totalSpent: number;
  availableBalance: number;
  spentPercentage: number;
  availablePercentage: number;
  recordedDaysCount: number;
  onUpdateBudget: (newBaseBudget: number) => void;
  onOpenCreateIncome: () => void;
  onOpenCreateExpense: () => void;
}

export function MonthlySummary({
  baseBudget,
  totalIncome,
  monthlyBudget,
  totalSpent,
  availableBalance,
  spentPercentage,
  availablePercentage,
  recordedDaysCount,
  onUpdateBudget,
  onOpenCreateIncome,
  onOpenCreateExpense,
}: MonthlySummaryProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [rawBudgetInput, setRawBudgetInput] = useState(String(baseBudget));
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditingBudget) {
      setRawBudgetInput(String(baseBudget));
      setBudgetError(null);
    }
  }, [baseBudget, isEditingBudget]);

  const isPositiveBalance = availableBalance >= 0;
  const clampedSpent = Math.min(100, Math.max(0, spentPercentage));
  const parsedDraftBudget = Number(rawBudgetInput.replace(/\D/g, '')) || 0;

  const handleOpenEdit = () => {
    setRawBudgetInput(String(baseBudget));
    setBudgetError(null);
    setIsEditingBudget(true);
  };

  const handleCancelEdit = () => {
    setRawBudgetInput(String(baseBudget));
    setBudgetError(null);
    setIsEditingBudget(false);
  };

  const handleSaveEdit = (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!parsedDraftBudget || parsedDraftBudget <= 0) {
      setBudgetError('Ingresa un presupuesto mayor a $0 COP.');
      return;
    }
    onUpdateBudget(parsedDraftBudget);
    setBudgetError(null);
    setIsEditingBudget(false);
  };

  return (
    <section aria-labelledby="resumen-financiero-titulo">
      <h2 id="resumen-financiero-titulo" className="sr-only">
        Resumen financiero del mes
      </h2>

      {/* 3 Glowing KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Presupuesto Mensual (Base + Ingresos) */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-400/25 bg-[#121126] p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-44 rounded-full bg-indigo-500/25 blur-2xl"
          />
          <div className="relative flex items-start gap-4">
            <div
              aria-hidden="true"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-[0_0_24px_rgba(96,165,250,0.45)] flex items-center justify-center shrink-0 text-white"
            >
              <Wallet className="w-5 h-5" strokeWidth={2.2} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  Presupuesto Mensual
                </p>
                {!isEditingBudget && (
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    aria-label="Editar presupuesto mensual"
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/25 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-400/45 px-2.5 py-1 text-[11px] font-medium text-indigo-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0] shrink-0"
                  >
                    <Pencil className="w-3 h-3" aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {isEditingBudget ? (
                <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400"
                    >
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      aria-label="Nuevo presupuesto base mensual en COP"
                      value={
                        parsedDraftBudget > 0
                          ? formatCOPValue(parsedDraftBudget).slice(1)
                          : ''
                      }
                      onChange={(e) => {
                        setRawBudgetInput(e.target.value.replace(/\D/g, ''));
                        if (budgetError) setBudgetError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      placeholder="3.200.000"
                      className="w-full rounded-xl border border-indigo-400/45 bg-[#0b0a18] pl-7 pr-12 py-2 font-display text-lg font-bold text-white tabular-nums focus:outline-none focus:border-[#10f5a0]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400"
                    >
                      COP
                    </span>
                  </div>

                  {budgetError && (
                    <p className="text-[11px] text-rose-400">{budgetError}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-[#10f5a0] px-3 py-1.5 text-xs font-bold text-[#090915] hover:brightness-110 transition-all"
                    >
                      <Check
                        className="w-3.5 h-3.5"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span>Guardar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-400/20 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="mt-1 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-white tabular-nums truncate">
                    {formatCOP(monthlyBudget)}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 tabular-nums">
                    <BarChart2
                      className="w-3.5 h-3.5 text-indigo-400 shrink-0"
                      aria-hidden="true"
                    />
                    {totalIncome > 0 ? (
                      <span className="truncate">
                        Base {formatCOPValue(baseBudget)} + Ingresos{' '}
                        <span className="text-[#10f5a0] font-medium">
                          +{formatCOPValue(totalIncome)}
                        </span>
                      </span>
                    ) : (
                      <span>Límite mensual asignado</span>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Gastado */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-[#121126] p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-44 rounded-full bg-violet-600/25 blur-2xl"
          />
          <div className="relative flex items-center gap-4">
            <div
              aria-hidden="true"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 shadow-[0_0_24px_rgba(167,139,250,0.45)] flex items-center justify-center shrink-0 text-white"
            >
              <BarChart3 className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-300">
                Total Gastado
              </p>
              <p className="mt-1 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-white tabular-nums truncate">
                {formatCOP(totalSpent)}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 tabular-nums">
                <TrendingUp
                  className="w-3.5 h-3.5 text-violet-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {formatPercentage(spentPercentage)} del presupuesto &middot;{' '}
                  {recordedDaysCount} días
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Saldo Disponible + Estado de Cuenta */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-colors ${
            isPositiveBalance
              ? 'border-emerald-400/30 bg-gradient-to-br from-[#0e2026] via-[#0f1a24] to-[#0e1524]'
              : 'border-rose-500/45 bg-gradient-to-br from-[#2b101b] via-[#1c1020] to-[#130f20]'
          }`}
        >
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -bottom-10 -right-8 h-36 w-48 rounded-full blur-2xl ${
              isPositiveBalance ? 'bg-emerald-500/20' : 'bg-rose-500/25'
            }`}
          />
          <div className="relative flex items-center gap-4">
            <div
              aria-hidden="true"
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white ${
                isPositiveBalance
                  ? 'bg-gradient-to-br from-[#2ef5a8] to-[#00c97e] shadow-[0_0_24px_rgba(16,245,160,0.45)]'
                  : 'bg-gradient-to-br from-rose-400 to-red-600 shadow-[0_0_24px_rgba(244,63,94,0.5)]'
              }`}
            >
              {isPositiveBalance ? (
                <Check className="w-6 h-6" strokeWidth={2.75} />
              ) : (
                <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-300">
                Saldo Disponible
              </p>
              <p
                className={`mt-1 font-display text-2xl sm:text-[28px] font-bold tracking-tight tabular-nums truncate ${
                  isPositiveBalance ? 'text-[#10f5a0]' : 'text-rose-400'
                }`}
              >
                {formatCOP(availableBalance)}
              </p>
              <p
                className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold tabular-nums ${
                  isPositiveBalance ? 'text-[#10f5a0]' : 'text-rose-400'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {isPositiveBalance ? 'Balance positivo' : 'Balance negativo'}
                </span>
                <span className="text-slate-500 font-normal" aria-hidden="true">
                  &middot;
                </span>
                <span className="text-slate-300/85 font-normal">
                  {isPositiveBalance
                    ? `${formatPercentage(availablePercentage)} disponible`
                    : `Excedido en ${formatCOP(Math.abs(availableBalance))}`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas: centrado horizontalmente debajo de las 3 tarjetas superiores */}
      <div className="mt-7 flex justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-violet-400/20 bg-[#121124]/95 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_8px_30px_rgba(0,0,0,0.28)]">
          <p className="text-center text-xs font-medium tracking-wide text-slate-400 mb-3.5">
            Acciones rápidas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onOpenCreateIncome}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00c97e] to-[#10f5a0] px-5 py-2.5 text-sm font-bold text-[#090915] shadow-[0_0_20px_rgba(16,245,160,0.3)] hover:brightness-110 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>Registrar ingreso</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateExpense}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7c5dfa] px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(91,61,245,0.4)] hover:brightness-110 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>Registrar gasto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Distribución del Presupuesto Bar */}
      <div className="mt-6 rounded-2xl border border-violet-400/20 bg-[#111024]/95 px-5 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="w-6 h-6 rounded-full bg-violet-500/25 border border-violet-400/30 flex items-center justify-center text-violet-300"
            >
              <Target className="w-3.5 h-3.5" strokeWidth={2.2} />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Distribución del Presupuesto
            </h3>
            <span className="text-slate-600" aria-hidden="true">
              &middot;
            </span>
            <span
              className={`text-xs sm:text-sm font-semibold ${
                isPositiveBalance ? 'text-[#10f5a0]' : 'text-rose-400'
              }`}
            >
              {isPositiveBalance ? 'Balance positivo' : 'Balance negativo'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm tabular-nums">
            <span className="text-slate-300">
              Gastado:{' '}
              <strong className="font-semibold text-white">
                {formatCOPValue(totalSpent)}
              </strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              |
            </span>
            <span
              className={`font-medium ${
                isPositiveBalance ? 'text-[#10f5a0]' : 'text-rose-400'
              }`}
            >
              Disponible:{' '}
              <strong className="font-semibold">
                {formatCOPValue(availableBalance)}
              </strong>
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div
          role="progressbar"
          aria-label="Porcentaje del presupuesto gastado frente al disponible"
          aria-valuenow={Math.round(clampedSpent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-3.5 h-3 w-full rounded-full bg-[#1d1b36] overflow-hidden"
        >
          <div
            style={{ width: `${clampedSpent}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              isPositiveBalance
                ? 'bg-gradient-to-r from-[#7c5dfa] via-[#9277ff] to-[#b09dff] shadow-[0_0_16px_rgba(139,92,246,0.55)]'
                : 'bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_16px_rgba(244,63,94,0.55)]'
            }`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-slate-300 tabular-nums">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isPositiveBalance ? 'bg-[#9277ff]' : 'bg-rose-500'
              }`}
              aria-hidden="true"
            />
            <span>Gastado ({formatPercentage(spentPercentage)} del total)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isPositiveBalance ? 'bg-[#10f5a0]' : 'bg-rose-400/50'
              }`}
              aria-hidden="true"
            />
            <span>
              {isPositiveBalance
                ? `Disponible (${formatPercentage(availablePercentage)})`
                : 'Sin saldo disponible'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
