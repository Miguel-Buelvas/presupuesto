import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  ALL_CATEGORIES,
  ExpenseCategory,
  MonthConfig,
  formatCOP,
  formatCOPValue,
} from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

interface CreateExpenseViewProps {
  month: MonthConfig;
  currentAvailableBalance: number;
  onCancel: () => void;
  onSaveExpense: (payload: {
    amount: number;
    category: ExpenseCategory;
    title: string;
    day: number;
    note: string;
  }) => void;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];
const QUICK_CONCEPTS = [
  'Almuerzo',
  'Transporte público',
  'Café y panadería',
  'Mercado',
  'Domicilio',
];

export function CreateExpenseView({
  month,
  currentAvailableBalance,
  onCancel,
  onSaveExpense,
}: CreateExpenseViewProps) {
  const [rawAmount, setRawAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(
    ExpenseCategory.Alimentacion
  );
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<number>(month.currentDayOfMonth);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{
    amount?: string;
    title?: string;
    day?: string;
  }>({});

  const parsedAmount = Number(rawAmount.replace(/\D/g, '')) || 0;
  const projectedBalance = currentAvailableBalance - parsedAmount;

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setRawAmount(digitsOnly);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleQuickAddAmount = (increment: number) => {
    const next = parsedAmount + increment;
    setRawAmount(String(next));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: { amount?: string; title?: string; day?: string } = {};

    if (!parsedAmount || parsedAmount <= 0) {
      nextErrors.amount = 'Ingresa un monto válido mayor a $0 COP.';
    } else if (parsedAmount > 50000000) {
      nextErrors.amount =
        'El monto ingresado supera el límite permitido para un gasto individual.';
    }

    if (title.trim().length < 2) {
      nextErrors.title = 'Escribe un concepto breve de al menos 2 caracteres.';
    }

    if (day < 1 || day > month.totalDaysInMonth) {
      nextErrors.day = `Selecciona un día entre 1 y ${month.totalDaysInMonth}.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSaveExpense({
      amount: parsedAmount,
      category,
      title: title.trim(),
      day,
      note: note.trim(),
    });
  };

  return (
    <section
      aria-labelledby="registrar-gasto-titulo"
      className="max-w-2xl mx-auto space-y-5"
    >
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-[#141328] hover:border-violet-400/45 px-4 py-2.5 text-xs sm:text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver al Dashboard</span>
        </button>

        <span className="text-xs text-slate-400 tabular-nums">
          {month.label}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#161432] via-[#121124] to-[#111022] p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2
            id="registrar-gasto-titulo"
            className="text-xl sm:text-2xl font-bold text-white tracking-tight"
          >
            Registrar nuevo gasto
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Completa el monto, la categoría y el concepto para actualizar tu saldo
            al instante.
          </p>
        </div>

        {/* 1. Monto */}
        <div className="space-y-2.5">
          <label
            htmlFor="monto-gasto"
            className="block text-xs sm:text-sm font-medium text-slate-200"
          >
            Monto pagado (COP)
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl font-bold text-slate-400"
            >
              $
            </span>
            <input
              id="monto-gasto"
              type="text"
              inputMode="numeric"
              autoFocus
              value={parsedAmount > 0 ? formatCOPValue(parsedAmount).slice(1) : ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="25.000"
              className={`w-full rounded-xl border bg-[#0b0a18] pl-9 pr-16 py-3.5 font-display text-2xl sm:text-3xl font-bold text-white placeholder:text-slate-600 tabular-nums focus:outline-none transition-colors ${
                errors.amount
                  ? 'border-rose-400/70 focus:border-rose-400'
                  : 'border-violet-400/25 focus:border-[#10f5a0]'
              }`}
            />
            <span
              aria-hidden="true"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-semibold text-slate-400"
            >
              COP
            </span>
          </div>

          {errors.amount && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.amount}</span>
            </p>
          )}

          {/* Quick Amount Increments */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAddAmount(amount)}
                className="px-3 py-1.5 rounded-lg border border-violet-400/20 bg-[#191733] hover:border-[#10f5a0]/50 hover:text-[#10f5a0] text-xs font-medium text-slate-300 tabular-nums transition-colors"
              >
                +{formatCOPValue(amount)}
              </button>
            ))}
            {parsedAmount > 0 && (
              <button
                type="button"
                onClick={() => setRawAmount('')}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* 2. Categoría */}
        <div className="space-y-2.5">
          <span className="block text-xs sm:text-sm font-medium text-slate-200">
            Categoría
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_CATEGORIES.map((item) => {
              const isSelected = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0] ${
                    isSelected
                      ? 'border-[#10f5a0]/70 bg-emerald-500/10 text-white shadow-[0_0_16px_rgba(16,245,160,0.15)]'
                      : 'border-violet-400/15 bg-[#0e0d1e] text-slate-300 hover:border-violet-400/35 hover:text-white'
                  }`}
                >
                  <CategoryIcon category={item} className="w-9 h-9" />
                  <span className="text-xs sm:text-sm font-medium truncate flex-1">
                    {item}
                  </span>
                  {isSelected && (
                    <Check
                      className="w-4 h-4 text-[#10f5a0] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Concepto */}
        <div className="space-y-2.5">
          <label
            htmlFor="concepto-gasto"
            className="block text-xs sm:text-sm font-medium text-slate-200"
          >
            ¿En qué gastaste?
          </label>
          <input
            id="concepto-gasto"
            type="text"
            maxLength={80}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: undefined }));
              }
            }}
            placeholder="Ej. Almuerzo del día, pasaje, mercado..."
            className={`w-full rounded-xl border bg-[#0b0a18] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
              errors.title
                ? 'border-rose-400/70 focus:border-rose-400'
                : 'border-violet-400/25 focus:border-[#10f5a0]'
            }`}
          />
          {errors.title && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.title}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {QUICK_CONCEPTS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setTitle(suggestion);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className="px-2.5 py-1 rounded-lg border border-violet-400/15 bg-[#191733] hover:border-violet-400/40 text-xs text-slate-300 hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Fecha y Nota opcional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="dia-gasto"
              className="block text-xs sm:text-sm font-medium text-slate-200"
            >
              Día del mes
            </label>
            <select
              id="dia-gasto"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full rounded-xl border border-violet-400/25 bg-[#0b0a18] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#10f5a0]"
            >
              {Array.from(
                { length: month.totalDaysInMonth },
                (_, idx) => idx + 1
              )
                .reverse()
                .map((d) => (
                  <option key={d} value={d}>
                    {d} {month.shortMonth} {month.year}
                    {d === month.currentDayOfMonth ? ' (Hoy)' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="nota-gasto"
              className="block text-xs sm:text-sm font-medium text-slate-200"
            >
              Nota opcional
            </label>
            <input
              id="nota-gasto"
              type="text"
              maxLength={120}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Pago en efectivo"
              className="w-full rounded-xl border border-violet-400/25 bg-[#0b0a18] px-3.5 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#10f5a0]"
            />
          </div>
        </div>

        {/* Live Balance Impact Preview */}
        <div className="rounded-xl border border-violet-400/20 bg-[#0c0b1a] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400">Saldo disponible actual: </span>
            <strong className="font-semibold text-white tabular-nums">
              {formatCOP(currentAvailableBalance)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Saldo después del gasto: </span>
            <strong
              className={`font-bold tabular-nums ${
                projectedBalance >= 0 ? 'text-[#10f5a0]' : 'text-rose-400'
              }`}
            >
              {formatCOP(projectedBalance)}
            </strong>
          </div>
        </div>

        {/* Submit & Cancel */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-violet-400/20 bg-transparent hover:bg-violet-400/10 px-5 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00c97e] to-[#10f5a0] px-6 py-3 text-sm font-bold text-[#090915] shadow-[0_0_24px_rgba(16,245,160,0.4)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Check className="w-4 h-4" strokeWidth={2.75} aria-hidden="true" />
            <span>Guardar gasto</span>
          </button>
        </div>
      </form>
    </section>
  );
}
