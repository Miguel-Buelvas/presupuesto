import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Landmark,
  Tag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import {
  ALL_INCOME_CATEGORIES,
  ALL_PAYMENT_METHODS,
  IncomeCategory,
  MonthConfig,
  PaymentMethod,
  formatCOP,
  formatCOPValue,
} from '../data/budgetData';

interface CreateIncomeViewProps {
  month: MonthConfig;
  currentAvailableBalance: number;
  onCancel: () => void;
  onSaveIncome: (payload: {
    amount: number;
    description: string;
    category: IncomeCategory;
    dateIso: string;
    paymentMethod: PaymentMethod;
    observations: string;
  }) => void;
}

const QUICK_DESCRIPTIONS = [
  'Salario',
  'Freelance',
  'Venta de computador',
  'Bonificación',
  'Reembolso',
];

export function CreateIncomeView({
  month,
  currentAvailableBalance,
  onCancel,
  onSaveIncome,
}: CreateIncomeViewProps) {
  const defaultDateIso = `${month.year}-${month.monthNumber}-${String(
    month.currentDayOfMonth
  ).padStart(2, '0')}`;

  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncomeCategory>(
    IncomeCategory.Salario
  );
  const [dateIso, setDateIso] = useState(defaultDateIso);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CuentaBancaria
  );
  const [observations, setObservations] = useState('');
  const [isSavingSuccess, setIsSavingSuccess] = useState(false);

  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    dateIso?: string;
  }>({});

  const parsedAmount = Number(rawAmount.replace(/\D/g, '')) || 0;
  const projectedBalance = currentAvailableBalance + parsedAmount;

  const handleAmountChange = (value: string) => {
    if (value.includes('-')) {
      setErrors((prev) => ({
        ...prev,
        amount: 'No se permiten valores negativos.',
      }));
      return;
    }
    const digitsOnly = value.replace(/\D/g, '');
    setRawAmount(digitsOnly);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSavingSuccess) return;

    const nextErrors: {
      amount?: string;
      description?: string;
      dateIso?: string;
    } = {};

    if (!rawAmount || parsedAmount <= 0) {
      nextErrors.amount =
        'Ingresa un valor válido mayor que cero en pesos colombianos.';
    } else if (parsedAmount > 500000000) {
      nextErrors.amount =
        'El monto ingresado supera el límite permitido para un registro.';
    }

    if (description.trim().length < 2) {
      nextErrors.description =
        'Ingresa una descripción para identificar el ingreso.';
    }

    if (!dateIso) {
      nextErrors.dateIso = 'Selecciona la fecha del ingreso.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSavingSuccess(true);
    setTimeout(() => {
      onSaveIncome({
        amount: parsedAmount,
        description: description.trim(),
        category,
        dateIso,
        paymentMethod,
        observations: observations.trim(),
      });
    }, 650);
  };

  return (
    <section
      aria-labelledby="registrar-ingreso-titulo"
      className="max-w-2xl mx-auto space-y-5"
    >
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-[#141328] hover:border-violet-400/45 px-4 py-2.5 text-xs sm:text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
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
        className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#171436] via-[#121124] to-[#111022] p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-start gap-3.5">
          <div
            aria-hidden="true"
            className="w-11 h-11 rounded-xl bg-[#5B3DF5]/20 border border-[#5B3DF5]/40 flex items-center justify-center text-[#10f5a0] shrink-0"
          >
            <Banknote className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <h2
              id="registrar-ingreso-titulo"
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
            >
              Registrar Nuevo Ingreso
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Registra cualquier ingreso recibido durante el mes para sumar
              automáticamente a tu presupuesto disponible.
            </p>
          </div>
        </div>

        {/* 1. Valor del ingreso (obligatorio) */}
        <div className="space-y-2">
          <label
            htmlFor="valor-ingreso"
            className="block text-xs sm:text-sm font-medium text-slate-200"
          >
            Valor del ingreso (COP){' '}
            <span className="text-[#5B3DF5] font-semibold">*</span>
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl font-bold text-[#10f5a0]"
            >
              $
            </span>
            <input
              id="valor-ingreso"
              type="text"
              inputMode="numeric"
              autoFocus
              value={
                parsedAmount > 0 ? formatCOPValue(parsedAmount).slice(1) : ''
              }
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="850.000"
              className={`w-full rounded-xl border bg-[#0b0a18] pl-9 pr-16 py-3.5 font-display text-2xl sm:text-3xl font-bold text-white placeholder:text-slate-600 tabular-nums focus:outline-none transition-colors ${
                errors.amount
                  ? 'border-rose-400/70 focus:border-rose-400'
                  : 'border-violet-400/25 focus:border-[#5B3DF5]'
              }`}
            />
            <span
              aria-hidden="true"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-semibold text-slate-400"
            >
              COP
            </span>
          </div>
          {parsedAmount > 0 && (
            <p className="text-xs text-[#10f5a0] tabular-nums">
              Formato aplicado: {formatCOP(parsedAmount)}
            </p>
          )}
          {errors.amount && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.amount}</span>
            </p>
          )}
        </div>

        {/* 2. Descripción */}
        <div className="space-y-2.5">
          <label
            htmlFor="descripcion-ingreso"
            className="block text-xs sm:text-sm font-medium text-slate-200"
          >
            Descripción <span className="text-[#5B3DF5] font-semibold">*</span>
          </label>
          <input
            id="descripcion-ingreso"
            type="text"
            maxLength={90}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            placeholder="Ej. Salario, Freelance, Venta de computador..."
            className={`w-full rounded-xl border bg-[#0b0a18] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
              errors.description
                ? 'border-rose-400/70 focus:border-rose-400'
                : 'border-violet-400/25 focus:border-[#5B3DF5]'
            }`}
          />
          {errors.description && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.description}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {QUICK_DESCRIPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setDescription(item);
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                className="px-2.5 py-1 rounded-lg border border-violet-400/15 bg-[#191733] hover:border-[#5B3DF5]/60 text-xs text-slate-300 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Categoría & 4. Fecha del ingreso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="categoria-ingreso"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200"
            >
              <Tag className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
              <span>Categoría</span>
            </label>
            <select
              id="categoria-ingreso"
              value={category}
              onChange={(e) => setCategory(e.target.value as IncomeCategory)}
              className="w-full rounded-xl border border-violet-400/25 bg-[#0b0a18] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#5B3DF5]"
            >
              {ALL_INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fecha-ingreso"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200"
            >
              <Calendar
                className="w-3.5 h-3.5 text-violet-400"
                aria-hidden="true"
              />
              <span>Fecha del ingreso</span>
            </label>
            <input
              id="fecha-ingreso"
              type="date"
              value={dateIso}
              onChange={(e) => {
                setDateIso(e.target.value);
                if (errors.dateIso) {
                  setErrors((prev) => ({ ...prev, dateIso: undefined }));
                }
              }}
              className={`w-full rounded-xl border bg-[#0b0a18] px-3.5 py-3 text-sm text-white focus:outline-none transition-colors ${
                errors.dateIso
                  ? 'border-rose-400/70 focus:border-rose-400'
                  : 'border-violet-400/25 focus:border-[#5B3DF5]'
              }`}
            />
            {errors.dateIso && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{errors.dateIso}</span>
              </p>
            )}
          </div>
        </div>

        {/* 5. Medio de pago */}
        <div className="space-y-2">
          <label
            htmlFor="medio-pago-ingreso"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200"
          >
            <Landmark
              className="w-3.5 h-3.5 text-violet-400"
              aria-hidden="true"
            />
            <span>Medio de pago</span>
          </label>
          <select
            id="medio-pago-ingreso"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
            className="w-full rounded-xl border border-violet-400/25 bg-[#0b0a18] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#5B3DF5]"
          >
            {ALL_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Observaciones (opcional) */}
        <div className="space-y-2">
          <label
            htmlFor="observaciones-ingreso"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200"
          >
            <FileText
              className="w-3.5 h-3.5 text-violet-400"
              aria-hidden="true"
            />
            <span>Observaciones (opcional)</span>
          </label>
          <textarea
            id="observaciones-ingreso"
            rows={3}
            maxLength={240}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Agrega detalles adicionales sobre este ingreso..."
            className="w-full rounded-xl border border-violet-400/25 bg-[#0b0a18] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] resize-none"
          />
        </div>

        {/* Live Balance Impact Preview */}
        <div className="rounded-xl border border-emerald-400/20 bg-[#0c0b1a] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400">Saldo disponible actual: </span>
            <strong className="font-semibold text-white tabular-nums">
              {formatCOP(currentAvailableBalance)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Nuevo saldo disponible: </span>
            <strong className="font-bold text-[#10f5a0] tabular-nums">
              {formatCOP(projectedBalance)}
            </strong>
          </div>
        </div>

        {/* Saving Animation Confirmation Banner */}
        {isSavingSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="rounded-xl border border-[#10f5a0]/50 bg-emerald-500/15 px-4 py-3.5 flex items-center gap-2.5 text-sm font-semibold text-[#10f5a0]"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>✅ Ingreso registrado correctamente.</span>
          </motion.div>
        )}

        {/* Buttons: Guardar ingreso (#5B3DF5) + Cancelar (gray) */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSavingSuccess}
            onClick={onCancel}
            className="rounded-xl border border-slate-500/35 bg-slate-700/55 hover:bg-slate-600/70 px-5 py-3 text-sm font-medium text-slate-100 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <motion.button
            type="submit"
            disabled={isSavingSuccess}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] hover:bg-[#6c51f7] px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(91,61,245,0.45)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-75"
          >
            <Check className="w-4 h-4" strokeWidth={2.75} aria-hidden="true" />
            <span>
              {isSavingSuccess ? 'Guardando...' : 'Guardar ingreso'}
            </span>
          </motion.button>
        </div>
      </form>
    </section>
  );
}
