import { ThemeColor } from '../types';

interface MonthViewProps {
  year: number;
  month: number; // 0-11
  availableDates: Set<string>; // Set of "YYYY-MM-DD"
  bookedDates: Set<string>;
  pendingDates?: Set<string>;
  onDateClick: (dateStr: string) => void;
  isAdminMode?: boolean;
  color?: ThemeColor;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Color mapping for Tailwind classes
const COLOR_VARIANTS: Record<ThemeColor, { 
    bgAvailable: string, 
    bgAvailableHover: string, 
    textAvailable: string, 
    ringAvailable: string,
    marker: string 
}> = {
    amber: { 
        bgAvailable: 'bg-amber-100 dark:bg-amber-900/30', 
        bgAvailableHover: 'hover:bg-amber-200 dark:hover:bg-amber-900/50', 
        textAvailable: 'text-amber-800 dark:text-amber-400',
        ringAvailable: 'ring-amber-300 dark:ring-amber-800',
        marker: 'bg-amber-500'
    },
    blue: { 
        bgAvailable: 'bg-blue-100 dark:bg-blue-900/30', 
        bgAvailableHover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50', 
        textAvailable: 'text-blue-800 dark:text-blue-400',
        ringAvailable: 'ring-blue-300 dark:ring-blue-800',
        marker: 'bg-blue-500'
    },
    rose: { 
        bgAvailable: 'bg-rose-100 dark:bg-rose-900/30', 
        bgAvailableHover: 'hover:bg-rose-200 dark:hover:bg-rose-900/50', 
        textAvailable: 'text-rose-800 dark:text-rose-400',
        ringAvailable: 'ring-rose-300 dark:ring-rose-800',
        marker: 'bg-rose-500'
    },
    emerald: { 
        bgAvailable: 'bg-emerald-100 dark:bg-emerald-900/30', 
        bgAvailableHover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50', 
        textAvailable: 'text-emerald-800 dark:text-emerald-400',
        ringAvailable: 'ring-emerald-300 dark:ring-emerald-800',
        marker: 'bg-emerald-500'
    },
    violet: { 
        bgAvailable: 'bg-violet-100 dark:bg-violet-900/30', 
        bgAvailableHover: 'hover:bg-violet-200 dark:hover:bg-violet-900/50', 
        textAvailable: 'text-violet-800 dark:text-violet-400',
        ringAvailable: 'ring-violet-300 dark:ring-violet-800',
        marker: 'bg-violet-500'
    },
    cyan: { 
        bgAvailable: 'bg-cyan-100 dark:bg-cyan-900/30', 
        bgAvailableHover: 'hover:bg-cyan-200 dark:hover:bg-cyan-900/50', 
        textAvailable: 'text-cyan-800 dark:text-cyan-400',
        ringAvailable: 'ring-cyan-300 dark:ring-cyan-800',
        marker: 'bg-cyan-500'
    },
};

export default function MonthView({
  year,
  month,
  availableDates,
  bookedDates,
  pendingDates,
  onDateClick,
  isAdminMode = false,
  color = 'amber',
}: MonthViewProps) {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  const theme = COLOR_VARIANTS[color];

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null); // Empty slot
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDayClick = (day: number) => {
    // Format YYYY-MM-DD
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateClick(dateStr);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-8 transition-colors duration-200">
      <div className="bg-neutral-900 dark:bg-neutral-950 text-white px-6 py-4 flex justify-between items-center border-b border-neutral-800">
        <h3 className="text-xl font-bold">
          {monthName} <span className="text-neutral-400 font-normal">{year}</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-7 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr bg-neutral-200 dark:bg-neutral-800 gap-px">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-neutral-50/50 dark:bg-neutral-900/50 min-h-[100px]" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isAvailable = availableDates.has(dateStr);
          const isBooked = bookedDates.has(dateStr);
          const isPending = pendingDates?.has(dateStr);

          let bgClass = "bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800";
          let statusLabel = null;

          if (isAdminMode) {
             if (isAvailable) {
                bgClass = `${theme.bgAvailable} ring-inset ring-1 ${theme.ringAvailable}`;
             }
             if (isBooked) {
                 statusLabel = <span className="absolute bottom-2 right-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 border dark:border-neutral-600 px-2 py-0.5 rounded-full">Booked</span>;
             } else if (isPending) {
                 bgClass = "bg-yellow-50 dark:bg-yellow-900/20";
                 statusLabel = <span className="absolute bottom-2 right-2 text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 px-2 py-0.5 rounded-full">Request</span>;
             }
          } else {
             // Guest Mode
             if (isBooked || isPending) { // Pending slots are also blocked for guests
                 bgClass = "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600";
                 statusLabel = <span className="block mt-2 text-xs font-medium text-neutral-400 dark:text-neutral-600">Taken</span>;
             } else if (isAvailable) {
                 bgClass = `${theme.bgAvailable} ${theme.bgAvailableHover} transition-colors cursor-pointer ring-inset ring-1 ${theme.ringAvailable}`;
                 statusLabel = <span className={`block mt-2 text-xs font-bold ${theme.textAvailable}`}>Available</span>;
             } else {
                 bgClass = "bg-white dark:bg-neutral-900 text-neutral-300 dark:text-neutral-700";
             }
          }

          // In admin mode, we can click anything. In guest mode, only available and not booked.
          const isClickable = isAdminMode || (isAvailable && !isBooked && !isPending);

          return (
            <div
              key={dateStr}
              onClick={() => isClickable && handleDayClick(day)}
              className={`
                min-h-[120px] p-3 relative transition-all duration-200
                ${bgClass}
                ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
              `}
            >
              <div className="font-semibold text-lg">{day}</div>
              {statusLabel}
              {isAdminMode && isAvailable && !isBooked && !isPending && (
                 <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full shadow-sm shadow-neutral-900/50 ${theme.marker}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
