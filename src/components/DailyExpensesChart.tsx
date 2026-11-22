import { Activity, Calendar, Plus, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  DailyExpensePoint,
  formatCOP,
  formatCompactCOP,
} from '../data/budgetData';

type ChartRange = '7d' | '30d' | '14d';

const CHART_HEIGHT_PX = 208;

interface DailyExpensesChartProps {
  monthId: string;
  currentDayOfMonth: number;
  dailyExpenses: DailyExpensePoint[];
  dailyAverage: number;
  peakDay: DailyExpensePoint;
  hasExpenses: boolean;
  onCreateFirstExpense: () => void;
}

export function DailyExpensesChart({
  monthId,
  currentDayOfMonth,
  dailyExpenses,
  dailyAverage,
  peakDay,
  hasExpenses,
  onCreateFirstExpense,
}: DailyExpensesChartProps) {
  const [range, setRange] = useState<ChartRange>('30d');
  const [selectedDay, setSelectedDay] = useState<number>(currentDayOfMonth);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    setSelectedDay(currentDayOfMonth);
    setHoveredDay(null);
  }, [monthId, currentDayOfMonth]);

  const visibleDays = useMemo(() => {
    const recorded = dailyExpenses.filter((d) => !d.isFuture);
    if (range === '7d') {
      return recorded.slice(-7);
    }
    if (range === '14d') {
      return recorded.slice(-14);
    }
    return dailyExpenses;
  }, [dailyExpenses, range]);

  const maxScale = useMemo(() => {
    const highest = Math.max(...visibleDays.map((d) => d.amount), 200000);
    return Math.ceil(highest / 50000) * 50000;
  }, [visibleDays]);

  const yTicks = useMemo(() => {
    const step = maxScale / 4;
    return [maxScale, step * 3, step * 2, step, 0];
  }, [maxScale]);

  const highlightedDay = hoveredDay ?? selectedDay;

  const activePoint = useMemo(() => {
    const found = visibleDays.find((d) => d.day === highlightedDay);
    if (found) return found;
    return (
      visibleDays.find((d) => d.day === currentDayOfMonth) ??
      visibleDays[visibleDays.length - 1]
    );
  }, [highlightedDay, visibleDays, currentDayOfMonth]);

  const rangeTotal = useMemo(() => {
    return visibleDays.reduce((sum, item) => sum + item.amount, 0);
  }, [visibleDays]);

  if (!hasExpenses) {
    return (
      <section
        aria-labelledby="gastos-diarios-vacio-titulo"
        className="rounded-2xl border border-violet-400/20 bg-[#121124]/95 p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4 h-full min-h-[360px]"
      >
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/15 border border-violet-400/25 flex items-center justify-center text-violet-300"
        >
          <Activity className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="max-w-sm space-y-2">
          <h2
            id="gastos-diarios-vacio-titulo"
            className="text-lg sm:text-xl font-bold text-white tracking-tight"
          >
            Aún no hay gastos este mes
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Registra el primero y empieza a ver en qué se va la plata
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateFirstExpense}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7c5dfa] px-5 py-3 min-h-[44px] text-sm font-bold text-white shadow-[0_0_24px_rgba(91,61,245,0.4)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>Registrar tu primer gasto</span>
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="gastos-diarios-titulo"
      className="rounded-2xl border border-violet-400/20 bg-[#121124]/95 p-5 sm:p-6 flex flex-col justify-between gap-5 h-full"
    >
      {/* Header + Pill Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity
            className="w-5 h-5 text-violet-400 shrink-0"
            aria-hidden="true"
          />
          <h2
            id="gastos-diarios-titulo"
            className="text-base sm:text-lg font-semibold text-white tracking-tight"
          >
            Evolución de gastos diarios
          </h2>
        </div>

        <div
          role="group"
          aria-label="Rango de días del gráfico"
          className="inline-flex items-center p-1 rounded-full bg-[#191733] border border-violet-400/15 self-start sm:self-auto"
        >
          {(
            [
              { id: '7d', label: '7 días' },
              { id: '30d', label: '30 días' },
              { id: '14d', label: '14 días' },
            ] as const
          ).map((option) => {
            const isActive = range === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                className={`px-3.5 py-1.5 min-h-[34px] text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0] ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7c5dfa] to-[#9b7eff] text-white shadow-[0_0_16px_rgba(124,93,250,0.45)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active / Hovered Day Summary Strip */}
      <div className="rounded-xl border border-violet-400/15 bg-[#0c0b1a] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-[#10f5a0] shrink-0"
          >
            <TrendingUp className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              <span className="text-[#10f5a0] font-semibold">
                {activePoint.weekdayShort} {activePoint.dateLabel}
              </span>
              <span className="mx-2 text-slate-500" aria-hidden="true">
                &middot;
              </span>
              <span className="text-slate-300">
                {activePoint.primaryCategory ?? 'Sin registros'}
              </span>
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {activePoint.summary}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">
            Total periodo: {formatCOP(rangeTotal)}
          </p>
          <p className="text-sm sm:text-base font-bold text-[#10f5a0] tabular-nums">
            {formatCOP(activePoint.amount)}
          </p>
        </div>
      </div>

      {/* Bar Chart Canvas */}
      <div className="relative pt-14">
        <div className="flex gap-3">
          {/* Y-Axis Ticks */}
          <div
            aria-hidden="true"
            className="w-12 flex flex-col justify-between text-right pr-1 h-52 text-[11px] text-slate-400 tabular-nums select-none shrink-0"
          >
            {yTicks.map((tick) => (
              <span
                key={tick}
                className="leading-none -translate-y-1 whitespace-nowrap"
              >
                {formatCompactCOP(tick)}
              </span>
            ))}
          </div>

          {/* Grid + Vertical Gradient Bars */}
          <div
            className="relative flex-1 h-52 min-w-0"
            onMouseLeave={() => setHoveredDay(null)}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 flex flex-col justify-between pointer-events-none"
            >
              {yTicks.map((tick) => (
                <div
                  key={tick}
                  className={`w-full border-b ${
                    tick === 0
                      ? 'border-violet-400/20'
                      : 'border-dashed border-violet-400/10'
                  }`}
                />
              ))}
            </div>

            <div
              role="list"
              aria-label="Gastos diarios en pesos colombianos"
              className="relative z-10 h-full flex items-end gap-0.5 sm:gap-1 px-0.5"
            >
              {visibleDays.map((item, idx) => {
                const barHeightPx = item.isFuture
                  ? 4
                  : item.amount === 0
                  ? 4
                  : Math.max(
                      8,
                      Math.round((item.amount / maxScale) * CHART_HEIGHT_PX)
                    );
                const isActive = activePoint.day === item.day;
                const isHovered = hoveredDay === item.day;

                const tooltipAlignClass =
                  idx <= 1
                    ? 'left-0 items-start'
                    : idx >= visibleDays.length - 2
                    ? 'right-0 items-end'
                    : 'left-1/2 -translate-x-1/2 items-center';

                return (
                  <div
                    key={item.day}
                    role="listitem"
                    className="relative flex-1 h-full flex flex-col justify-end items-center group"
                  >
                    {/* Hover / Active Tooltip with Fecha y Monto */}
                    {(isHovered || (hoveredDay === null && isActive)) && (
                      <div
                        style={{ bottom: `${barHeightPx + 10}px` }}
                        className={`pointer-events-none absolute z-30 flex flex-col ${tooltipAlignClass}`}
                      >
                        <div className="px-3 py-1.5 rounded-xl bg-[#16152c]/95 border border-violet-400/40 text-left shadow-[0_10px_28px_rgba(0,0,0,0.6)] backdrop-blur-sm whitespace-nowrap">
                          <p className="text-[10px] font-medium text-slate-300 leading-tight">
                            {item.weekdayShort} {item.dateLabel}
                          </p>
                          <p
                            className={`text-xs font-bold tabular-nums leading-tight mt-0.5 ${
                              item.isFuture ? 'text-slate-400' : 'text-[#10f5a0]'
                            }`}
                          >
                            {item.isFuture
                              ? 'Sin registros'
                              : formatCOP(item.amount)}
                          </p>
                        </div>
                        <span
                          className={`mt-1 w-2 h-2 rounded-full ${
                            item.isFuture
                              ? 'bg-slate-400'
                              : 'bg-[#10f5a0] shadow-[0_0_8px_#10f5a0]'
                          }`}
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onMouseEnter={() => setHoveredDay(item.day)}
                      onFocus={() => setHoveredDay(item.day)}
                      onBlur={() => setHoveredDay(null)}
                      onClick={() => {
                        if (!item.isFuture) {
                          setSelectedDay(item.day);
                        }
                        setHoveredDay(item.day);
                      }}
                      aria-label={`${item.weekdayShort} ${item.dateLabel}: ${formatCOP(
                        item.amount
                      )}`}
                      className="w-full h-full flex items-end justify-center focus-visible:outline-none cursor-pointer"
                    >
                      {item.isFuture ? (
                        <div
                          className={`w-full max-w-[18px] h-[3px] rounded-t-sm transition-colors ${
                            isHovered
                              ? 'bg-violet-300/60'
                              : 'bg-violet-400/20'
                          }`}
                        />
                      ) : (
                        <div
                          style={{ height: `${barHeightPx}px` }}
                          className={`w-full max-w-[20px] rounded-t-md transition-all duration-150 ${
                            isActive
                              ? 'bg-gradient-to-t from-[#00b874] to-[#1ef5a5] shadow-[0_0_18px_rgba(16,245,160,0.45)]'
                              : 'bg-gradient-to-t from-[#533ea8] to-[#9b82ff] group-hover:from-[#6d52d4] group-hover:to-[#bba7ff]'
                          }`}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visible X-Axis Day Numbers + Explicit Axis Label */}
        <div className="flex gap-3 mt-2.5">
          <div className="w-12 shrink-0 flex items-center justify-end pr-1">
            <span className="text-[10px] font-medium text-slate-500">Día</span>
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-0.5 sm:gap-1 px-0.5">
            {visibleDays.map((item, idx) => {
              const isActive = activePoint.day === item.day;
              const showOnMobile =
                range !== '30d' ||
                isActive ||
                item.day === 1 ||
                idx % 3 === 0 ||
                item.day === visibleDays.length;

              return (
                <div
                  key={item.day}
                  className="flex-1 text-center text-[10px] sm:text-[11px] tabular-nums leading-none"
                >
                  <span
                    className={`${
                      showOnMobile ? 'inline-block' : 'hidden sm:inline-block'
                    } px-0.5 py-0.5 rounded ${
                      isActive
                        ? 'font-bold text-[#10f5a0] bg-emerald-500/15'
                        : item.isFuture
                        ? 'text-slate-500'
                        : 'text-slate-300'
                    }`}
                  >
                    {range === '7d'
                      ? `${item.weekdayShort} ${item.day}`
                      : item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
          Eje X: Días del mes (pasa el cursor o toca cualquier barra para ver fecha y monto)
        </p>
      </div>

      {/* Bottom Summary Strip */}
      <div className="rounded-xl border border-violet-400/15 bg-[#0c0b1a] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 tabular-nums">
          <Calendar
            className="w-4 h-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
          <span>Promedio diario:</span>
          <strong className="font-semibold text-white">
            {formatCOP(dailyAverage)}
          </strong>
        </div>

        <div className="flex items-center gap-2 text-slate-300 tabular-nums">
          <span className="text-slate-400">Día pico: {peakDay.dateLabel}</span>
          <strong className="font-semibold text-[#10f5a0]">
            {formatCOP(peakDay.amount)}
          </strong>
        </div>
      </div>
    </section>
  );
}
