import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Landmark,
  Pencil,
  Tag,
} from 'lucide-react';
import {
  ExpenseMovement,
  formatCOP,
  formatPercentage,
} from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

interface MovementDetailViewProps {
  movement: ExpenseMovement | null;
  monthlyBudget: number;
  totalSpent: number;
  backLabel: string;
  onBack: () => void;
}

export function MovementDetailView({
  movement,
  monthlyBudget,
  totalSpent,
  backLabel,
  onBack,
}: MovementDetailViewProps) {
  if (!movement) {
    return (
      <section
        aria-label="Detalle vacío"
        className="max-w-3xl mx-auto rounded-2xl border border-violet-400/20 bg-[#121124]/95 p-10 text-center"
      >
        <p className="text-sm text-slate-400">
          Selecciona un gasto en Movimientos para ver el detalle
        </p>
      </section>
    );
  }

  const isIncome = movement.type === 'income';
  const budgetShare =
    monthlyBudget > 0 ? (movement.amount / monthlyBudget) * 100 : 0;
  const spentShare = totalSpent > 0 ? (movement.amount / totalSpent) * 100 : 0;

  return (
    <section
      aria-labelledby="detalle-gasto-titulo"
      className="max-w-3xl mx-auto space-y-5"
    >
      {/* Top Action Strip: Volver + Editar (sin funcionalidad) */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={`Volver ${backLabel}`}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-[#141328] hover:border-violet-400/45 px-4 py-2.5 text-xs sm:text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver</span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Edición no disponible"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-400/15 bg-[#141328]/60 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-400 cursor-not-allowed opacity-70"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
          <span>Editar</span>
        </button>
      </div>

      {/* Main Detail Card */}
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#171533] via-[#121124] to-[#111022] overflow-hidden">
        {/* Hero Amount Header */}
        <div className="p-6 sm:p-8 border-b border-violet-400/15 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <CategoryIcon
              category={movement.category}
              type={movement.type}
              className="w-14 h-14 rounded-2xl"
            />
            <div className="min-w-0">
              <p
                className={`text-xs font-medium ${
                  isIncome ? 'text-[#10f5a0]' : 'text-violet-300'
                }`}
              >
                {isIncome
                  ? 'Detalle del ingreso registrado'
                  : 'Detalle del gasto registrado'}
              </p>
              <h2
                id="detalle-gasto-titulo"
                className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5 break-words"
              >
                {movement.title}
              </h2>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <p className="text-xs text-slate-400">
              {isIncome ? 'Monto recibido' : 'Monto pagado'}
            </p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#10f5a0] tabular-nums mt-0.5">
              {isIncome
                ? `+${formatCOP(movement.amount)}`
                : formatCOP(movement.amount)}
            </p>
          </div>
        </div>

        {/* All Movement Fields */}
        <dl className="divide-y divide-violet-400/10">
          <div className="px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <Tag className="w-4 h-4 text-violet-400 shrink-0" aria-hidden="true" />
              <span>Categoría</span>
            </dt>
            <dd className="sm:col-span-2 text-sm font-medium text-white">
              {movement.category}
            </dd>
          </div>

          <div className="px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <Calendar
                className="w-4 h-4 text-violet-400 shrink-0"
                aria-hidden="true"
              />
              <span>Fecha</span>
            </dt>
            <dd className="sm:col-span-2 text-sm font-medium text-white tabular-nums">
              {movement.dateLabel}
            </dd>
          </div>

          <div className="px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <Clock
                className="w-4 h-4 text-violet-400 shrink-0"
                aria-hidden="true"
              />
              <span>Hora de registro</span>
            </dt>
            <dd className="sm:col-span-2 text-sm font-medium text-white tabular-nums">
              {movement.timeLabel}
            </dd>
          </div>

          {movement.paymentMethod && (
            <div className="px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <dt className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                <Landmark
                  className="w-4 h-4 text-violet-400 shrink-0"
                  aria-hidden="true"
                />
                <span>Medio de pago</span>
              </dt>
              <dd className="sm:col-span-2 text-sm font-medium text-white">
                {movement.paymentMethod}
              </dd>
            </div>
          )}

          <div className="px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs sm:text-sm text-slate-400">
              Impacto en el presupuesto
            </dt>
            <dd className="sm:col-span-2 text-sm text-slate-200 tabular-nums">
              {isIncome ? (
                <>
                  Aporta el{' '}
                  <strong className="font-semibold text-[#10f5a0]">
                    {formatPercentage(budgetShare)}
                  </strong>{' '}
                  del presupuesto total disponible ({formatCOP(monthlyBudget)}).
                </>
              ) : (
                <>
                  Representa el{' '}
                  <strong className="font-semibold text-white">
                    {formatPercentage(budgetShare)}
                  </strong>{' '}
                  del presupuesto mensual ({formatCOP(monthlyBudget)}) y el{' '}
                  <strong className="font-semibold text-white">
                    {formatPercentage(spentShare)}
                  </strong>{' '}
                  del total gastado.
                </>
              )}
            </dd>
          </div>

          <div className="px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <FileText
                className="w-4 h-4 text-violet-400 shrink-0"
                aria-hidden="true"
              />
              <span>{isIncome ? 'Observaciones' : 'Nota / descripción'}</span>
            </dt>
            <dd className="sm:col-span-2 text-sm text-slate-300">
              {movement.note && movement.note.trim() !== ''
                ? movement.note
                : 'Sin notas adicionales registradas.'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
