import {
  Banknote,
  Bus,
  Clapperboard,
  Lightbulb,
  ShoppingBag,
  Utensils,
} from 'lucide-react';
import {
  ExpenseCategory,
  IncomeCategory,
  MovementType,
} from '../data/budgetData';

interface CategoryIconProps {
  category: ExpenseCategory | IncomeCategory;
  type?: MovementType;
  className?: string;
}

const EXPENSE_STYLE_MAP: Record<
  ExpenseCategory,
  { container: string; iconColor: string }
> = {
  [ExpenseCategory.Alimentacion]: {
    container: 'bg-rose-500/15 border-rose-400/20',
    iconColor: 'text-rose-400',
  },
  [ExpenseCategory.Transporte]: {
    container: 'bg-sky-500/15 border-sky-400/20',
    iconColor: 'text-sky-400',
  },
  [ExpenseCategory.ServiciosPublicos]: {
    container: 'bg-emerald-500/15 border-emerald-400/20',
    iconColor: 'text-emerald-400',
  },
  [ExpenseCategory.RopaYCompras]: {
    container: 'bg-amber-500/15 border-amber-400/20',
    iconColor: 'text-amber-400',
  },
  [ExpenseCategory.Entretenimiento]: {
    container: 'bg-violet-500/15 border-violet-400/20',
    iconColor: 'text-violet-300',
  },
};

export function CategoryIcon({
  category,
  type = 'expense',
  className = 'w-10 h-10',
}: CategoryIconProps) {
  if (type === 'income') {
    return (
      <div
        className={`shrink-0 rounded-xl border flex items-center justify-center bg-emerald-500/15 border-emerald-400/35 ${className}`}
      >
        <Banknote
          className="w-4 h-4 text-[#10f5a0]"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </div>
    );
  }

  const expenseCategory = category as ExpenseCategory;
  const styles =
    EXPENSE_STYLE_MAP[expenseCategory] ??
    EXPENSE_STYLE_MAP[ExpenseCategory.Alimentacion];

  const renderIcon = () => {
    const iconProps = {
      className: `w-4 h-4 ${styles.iconColor}`,
      strokeWidth: 2,
      'aria-hidden': true as const,
    };

    switch (expenseCategory) {
      case ExpenseCategory.Alimentacion:
        return <Utensils {...iconProps} />;
      case ExpenseCategory.Transporte:
        return <Bus {...iconProps} />;
      case ExpenseCategory.ServiciosPublicos:
        return <Lightbulb {...iconProps} />;
      case ExpenseCategory.RopaYCompras:
        return <ShoppingBag {...iconProps} />;
      case ExpenseCategory.Entretenimiento:
        return <Clapperboard {...iconProps} />;
      default:
        return <Utensils {...iconProps} />;
    }
  };

  return (
    <div
      className={`shrink-0 rounded-xl border flex items-center justify-center ${styles.container} ${className}`}
    >
      {renderIcon()}
    </div>
  );
}
