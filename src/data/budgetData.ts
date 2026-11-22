export enum ExpenseCategory {
  Alimentacion = 'Alimentación',
  Transporte = 'Transporte',
  ServiciosPublicos = 'Servicios públicos',
  RopaYCompras = 'Ropa y compras personales',
  Entretenimiento = 'Entretenimiento y ocio',
}

export enum IncomeCategory {
  Salario = 'Salario',
  TrabajoIndependiente = 'Trabajo independiente',
  Negocio = 'Negocio',
  Inversiones = 'Inversiones',
  Regalo = 'Regalo',
  Bonificacion = 'Bonificación',
  Reembolso = 'Reembolso',
  Otro = 'Otro',
}

export enum PaymentMethod {
  Efectivo = 'Efectivo',
  CuentaBancaria = 'Cuenta bancaria',
  Nequi = 'Nequi',
  Daviplata = 'Daviplata',
  Tarjeta = 'Tarjeta',
  Otro = 'Otro',
}

export const ALL_CATEGORIES: ExpenseCategory[] = [
  ExpenseCategory.Alimentacion,
  ExpenseCategory.Transporte,
  ExpenseCategory.ServiciosPublicos,
  ExpenseCategory.RopaYCompras,
  ExpenseCategory.Entretenimiento,
];

export const ALL_INCOME_CATEGORIES: IncomeCategory[] = [
  IncomeCategory.Salario,
  IncomeCategory.TrabajoIndependiente,
  IncomeCategory.Negocio,
  IncomeCategory.Inversiones,
  IncomeCategory.Regalo,
  IncomeCategory.Bonificacion,
  IncomeCategory.Reembolso,
  IncomeCategory.Otro,
];

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.Efectivo,
  PaymentMethod.CuentaBancaria,
  PaymentMethod.Nequi,
  PaymentMethod.Daviplata,
  PaymentMethod.Tarjeta,
  PaymentMethod.Otro,
];

export type MovementType = 'expense' | 'income';

export interface ExpenseMovement {
  id: string;
  type: MovementType;
  day: number;
  title: string;
  category: ExpenseCategory | IncomeCategory;
  dateLabel: string;
  timeLabel: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  note?: string;
}

export interface DailyExpensePoint {
  day: number;
  dateLabel: string;
  weekdayShort: string;
  amount: number;
  primaryCategory: ExpenseCategory | null;
  summary: string;
  isFuture: boolean;
}

export interface MonthConfig {
  id: string;
  label: string;
  shortMonth: string;
  monthNumber: string;
  year: number;
  rangeLabel: string;
  monthlyBudget: number;
  currentDayOfMonth: number;
  totalDaysInMonth: number;
  startWeekdayIndex: number; // 0 = Dom, 1 = Lun, ...
  initialMovements: ExpenseMovement[];
}

const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MONTHS_SHORT_NAMES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export const MONTHS_CONFIG: MonthConfig[] = [
  {
    id: '2026-11',
    label: 'Noviembre 2026',
    shortMonth: 'nov',
    monthNumber: '11',
    year: 2026,
    rangeLabel: '01 - 30 Nov',
    monthlyBudget: 3200000,
    currentDayOfMonth: 22,
    totalDaysInMonth: 30,
    startWeekdayIndex: 0, // 1 Nov 2026 is Sunday
    initialMovements: [],
  },
  {
    id: '2026-10',
    label: 'Octubre 2026',
    shortMonth: 'oct',
    monthNumber: '10',
    year: 2026,
    rangeLabel: '01 - 31 Oct',
    monthlyBudget: 3000000,
    currentDayOfMonth: 31,
    totalDaysInMonth: 31,
    startWeekdayIndex: 4, // 1 Oct 2026 is Thursday
    initialMovements: [
      { id: 'oct-15', type: 'expense', day: 31, title: 'Reunión y compras de cierre', category: ExpenseCategory.Alimentacion, dateLabel: '31 oct 2026', timeLabel: '19:10', amount: 115000, note: 'Pasabocas y bebidas' },
      { id: 'oct-14', type: 'expense', day: 30, title: 'Restaurante y música en vivo', category: ExpenseCategory.Entretenimiento, dateLabel: '30 oct 2026', timeLabel: '21:05', amount: 88000, note: 'Salida cultural de viernes' },
      { id: 'oct-13', type: 'expense', day: 29, title: 'Trayectos en taxi y bus', category: ExpenseCategory.Transporte, dateLabel: '29 oct 2026', timeLabel: '18:20', amount: 27000, note: 'Desplazamiento por lluvia' },
      { id: 'oct-12', type: 'expense', day: 28, title: 'Almuerzo ejecutivo y café', category: ExpenseCategory.Alimentacion, dateLabel: '28 oct 2026', timeLabel: '13:15', amount: 33000, note: 'Almuerzo cerca de la oficina' },
      { id: 'oct-11', type: 'expense', day: 27, title: 'Accesorios y papelería', category: ExpenseCategory.RopaYCompras, dateLabel: '27 oct 2026', timeLabel: '16:40', amount: 64000, note: 'Útiles personales' },
      { id: 'oct-10', type: 'expense', day: 24, title: 'Mercado de fin de semana', category: ExpenseCategory.Alimentacion, dateLabel: '24 oct 2026', timeLabel: '10:30', amount: 145000, note: 'Despensa semanal' },
      { id: 'oct-9', type: 'expense', day: 21, title: 'Cena y bebidas', category: ExpenseCategory.Alimentacion, dateLabel: '21 oct 2026', timeLabel: '20:00', amount: 52000, note: 'Cena ligera' },
      { id: 'oct-8', type: 'expense', day: 17, title: 'Artículos de cuidado personal', category: ExpenseCategory.RopaYCompras, dateLabel: '17 oct 2026', timeLabel: '15:10', amount: 120000, note: 'Higiene y vestuario' },
      { id: 'oct-7', type: 'expense', day: 16, title: 'Acueducto y gas natural', category: ExpenseCategory.ServiciosPublicos, dateLabel: '16 oct 2026', timeLabel: '09:20', amount: 78000, note: 'Servicios públicos del hogar' },
      { id: 'oct-6', type: 'expense', day: 15, title: 'Compra quincenal de despensa', category: ExpenseCategory.Alimentacion, dateLabel: '15 oct 2026', timeLabel: '11:50', amount: 175000, note: 'Mercado completo' },
      { id: 'oct-5', type: 'expense', day: 10, title: 'Mercado semanal completo', category: ExpenseCategory.Alimentacion, dateLabel: '10 oct 2026', timeLabel: '10:15', amount: 162000, note: 'Víveres y frutas' },
      { id: 'oct-4', type: 'expense', day: 8, title: 'Internet hogar', category: ExpenseCategory.ServiciosPublicos, dateLabel: '8 oct 2026', timeLabel: '08:40', amount: 89000, note: 'Factura mensual' },
      { id: 'oct-3', type: 'expense', day: 5, title: 'Factura energía eléctrica', category: ExpenseCategory.ServiciosPublicos, dateLabel: '5 oct 2026', timeLabel: '09:05', amount: 152000, note: 'Consumo del mes' },
      { id: 'oct-2', type: 'expense', day: 3, title: 'Chaqueta ligera', category: ExpenseCategory.RopaYCompras, dateLabel: '3 oct 2026', timeLabel: '17:00', amount: 140000, note: 'Prenda para lluvia' },
      { id: 'oct-1', type: 'expense', day: 1, title: 'Mercado de inicio de mes', category: ExpenseCategory.Alimentacion, dateLabel: '1 oct 2026', timeLabel: '11:00', amount: 110000, note: 'Abastecimiento inicial' },
    ],
  },
];

export function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '-' : ''}$${formatted} COP`;
}

export function formatCOPValue(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '-' : ''}$${formatted}`;
}

export function formatCompactCOP(amount: number): string {
  if (amount === 0) return '$0';
  if (amount >= 1000) {
    const thousands = Math.round(amount / 1000);
    return `$${thousands} mil`;
  }
  return `$${amount}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

export function buildDailyExpenses(
  month: MonthConfig,
  movements: ExpenseMovement[]
): DailyExpensePoint[] {
  const expenseMovements = movements.filter((m) => m.type === 'expense');
  const maxRecordedDay =
    expenseMovements.length > 0
      ? Math.max(month.currentDayOfMonth, ...expenseMovements.map((m) => m.day))
      : 0;

  const points: DailyExpensePoint[] = [];
  for (let day = 1; day <= month.totalDaysInMonth; day++) {
    const dayMovements = expenseMovements.filter((m) => m.day === day);
    const amount = dayMovements.reduce((sum, m) => sum + m.amount, 0);
    const weekdayShort =
      WEEKDAYS_SHORT[(month.startWeekdayIndex + (day - 1)) % 7];
    const dateLabel = `${day} ${month.shortMonth} ${month.year}`;
    const isFuture = day > maxRecordedDay && dayMovements.length === 0;

    let primaryCategory: ExpenseCategory | null = null;
    let summary = 'Sin gastos registrados';

    if (dayMovements.length > 0) {
      const topMovement = dayMovements.reduce((max, cur) =>
        cur.amount > max.amount ? cur : max
      );
      primaryCategory = topMovement.category as ExpenseCategory;
      summary =
        dayMovements.length === 1
          ? topMovement.title
          : `${dayMovements.length} gastos · ${topMovement.title}`;
    }

    points.push({
      day,
      dateLabel,
      weekdayShort,
      amount,
      primaryCategory,
      summary,
      isFuture,
    });
  }

  return points;
}

export function getBudgetSummary(
  month: MonthConfig,
  movements: ExpenseMovement[],
  customBaseBudget?: number
) {
  const baseBudget =
    customBaseBudget !== undefined ? customBaseBudget : month.monthlyBudget;
  const totalIncome = movements
    .filter((m) => m.type === 'income')
    .reduce((acc, m) => acc + m.amount, 0);
  const effectiveBudget = baseBudget + totalIncome;

  const dailyExpenses = buildDailyExpenses(month, movements);
  const recordedDays = dailyExpenses.filter((d) => !d.isFuture);
  const totalSpent = movements
    .filter((m) => m.type === 'expense')
    .reduce((acc, m) => acc + m.amount, 0);
  const availableBalance = effectiveBudget - totalSpent;
  const spentPercentage =
    effectiveBudget > 0 ? (totalSpent / effectiveBudget) * 100 : 0;
  const availablePercentage = Math.max(0, 100 - spentPercentage);
  const dailyAverage =
    recordedDays.length > 0 ? totalSpent / recordedDays.length : 0;

  const peakDay =
    recordedDays.length > 0
      ? recordedDays.reduce((max, current) =>
          current.amount > max.amount ? current : max
        )
      : dailyExpenses[0];

  return {
    baseBudget,
    totalIncome,
    monthlyBudget: effectiveBudget,
    totalSpent,
    availableBalance,
    spentPercentage,
    availablePercentage,
    dailyAverage,
    peakDay,
    dailyExpenses,
    recordedDaysCount: recordedDays.length,
  };
}
