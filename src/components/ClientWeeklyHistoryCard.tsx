import React, { useState, useMemo } from 'react';
import { Client, PaymentRecord } from '../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Printer,
  TrendingUp,
  Banknote,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface ClientWeeklyHistoryCardProps {
  client: Client;
  onRecordPaymentForDate?: (dateStr: string) => void;
}

interface DayGridItem {
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  shortDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  dateStr: string;
  formattedDate: string;
  dailyDue: number;
  payments: PaymentRecord[];
  totalPaid: number;
  status: 'paid' | 'partial' | 'not_paid' | 'due_today' | 'upcoming';
  balanceRemaining: number;
  agentName?: string;
  notes?: string;
  timestamp?: number;
}

interface WeekGridItem {
  weekNumber: number;
  startDateStr: string;
  endDateStr: string;
  formattedRange: string;
  days: DayGridItem[];
  totalExpected: number;
  totalCollected: number;
  paidDaysCount: number;
  unpaidDaysCount: number;
  partialDaysCount: number;
  isFullyPaid: boolean;
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  isFutureWeek: boolean;
}

export const ClientWeeklyHistoryCard: React.FC<ClientWeeklyHistoryCardProps> = ({
  client,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedWeekTab, setSelectedWeekTab] = useState<number | 'all'>('all');

  // Compute total weeks (e.g. 20 days = 4 weeks, 25 days = 5 weeks, 30 days = 6 weeks, 40 days = 8 weeks)
  const totalWeeks = useMemo(() => {
    const days = client.totalDays || 20;
    return Math.max(1, Math.ceil(days / 5));
  }, [client.totalDays]);

  // Compute Monday of the start date
  const baseMondayDate = useMemo(() => {
    const rawDateStr = client.startDate || todayStr;
    const parts = rawDateStr.split('T')[0].split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const day = date.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diffToMonday);
    return date;
  }, [client.startDate, todayStr]);

  // Generate weeks 1 up to totalWeeks
  const weeksData = useMemo<WeekGridItem[]>(() => {
    const weeks: WeekGridItem[] = [];
    const dayNames: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
    ];
    const shortDays: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    const clientPayments = client.payments || [];

    for (let w = 1; w <= totalWeeks; w++) {
      const days: DayGridItem[] = [];
      let weekExpected = 0;
      let weekCollected = 0;
      let paidCount = 0;
      let unpaidCount = 0;
      let partialCount = 0;

      // 5 days: Monday to Friday
      for (let d = 0; d < 5; d++) {
        const dayDate = new Date(baseMondayDate);
        // Add (w - 1) * 7 days for the week, plus d days for Mon..Fri
        dayDate.setDate(baseMondayDate.getDate() + (w - 1) * 7 + d);

        const year = dayDate.getFullYear();
        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(dayDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayOfMonth}`;

        const formattedDate = dayDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        // Find payments recorded for this exact client on this date
        const matchingPayments = clientPayments.filter((p) => p.date === dateStr);
        const dayPaid = matchingPayments.reduce((sum, p) => sum + (p.isNotPaid ? 0 : p.amount || 0), 0);
        const hasNotPaidEntry = matchingPayments.some((p) => p.isNotPaid);

        const dailyDue = client.dailyAmount;
        weekExpected += dailyDue;
        weekCollected += dayPaid;

        let status: 'paid' | 'partial' | 'not_paid' | 'due_today' | 'upcoming';
        const balanceRemaining = Math.max(0, dailyDue - dayPaid);

        if (dayPaid >= dailyDue && dailyDue > 0) {
          status = 'paid';
          paidCount += 1;
        } else if (dayPaid > 0 && dayPaid < dailyDue) {
          status = 'partial';
          partialCount += 1;
        } else if (hasNotPaidEntry) {
          status = 'not_paid';
          unpaidCount += 1;
        } else if (dateStr < todayStr) {
          // Past date with no payment record = Missed/Not Paid
          status = 'not_paid';
          unpaidCount += 1;
        } else if (dateStr === todayStr) {
          status = 'due_today';
        } else {
          status = 'upcoming';
        }

        const latestPayment = matchingPayments[matchingPayments.length - 1];

        days.push({
          dayName: dayNames[d],
          shortDay: shortDays[d],
          dateStr,
          formattedDate,
          dailyDue,
          payments: matchingPayments,
          totalPaid: dayPaid,
          status,
          balanceRemaining,
          agentName: latestPayment?.agentName,
          notes: latestPayment?.notes,
          timestamp: latestPayment?.timestamp,
        });
      }

      const weekStartStr = days[0].dateStr;
      const weekEndStr = days[4].dateStr;
      const formattedRange = `${days[0].formattedDate} – ${days[4].formattedDate}`;

      const isCurrentWeek = days.some((day) => day.dateStr === todayStr);
      const isPastWeek = days[4].dateStr < todayStr;
      const isFutureWeek = days[0].dateStr > todayStr;
      const isFullyPaid = paidCount === 5;

      weeks.push({
        weekNumber: w,
        startDateStr: weekStartStr,
        endDateStr: weekEndStr,
        formattedRange,
        days,
        totalExpected: weekExpected,
        totalCollected: weekCollected,
        paidDaysCount: paidCount,
        unpaidDaysCount: unpaidCount,
        partialDaysCount: partialCount,
        isFullyPaid,
        isCurrentWeek,
        isPastWeek,
        isFutureWeek,
      });
    }

    return weeks;
  }, [totalWeeks, baseMondayDate, client.payments, client.dailyAmount, todayStr]);

  // Overall statistics for the full loan
  const overallStats = useMemo(() => {
    let totalPaidDays = 0;
    let totalUnpaidDays = 0;
    let totalPartialDays = 0;
    let totalScheduledDays = totalWeeks * 5;

    weeksData.forEach((w) => {
      totalPaidDays += w.paidDaysCount;
      totalUnpaidDays += w.unpaidDaysCount;
      totalPartialDays += w.partialDaysCount;
    });

    const lifetimePaid = (client.payments || []).reduce(
      (sum, p) => sum + (p.isNotPaid ? 0 : p.amount || 0),
      0
    );
    const overallBalance = Math.max(0, client.totalPayable - lifetimePaid);
    const percentPaid = Math.min(100, Math.round((lifetimePaid / client.totalPayable) * 100));

    const finalEndingDate = weeksData[weeksData.length - 1]?.endDateStr || client.finishDate || '';
    const formattedEndDate = weeksData[weeksData.length - 1]
      ? weeksData[weeksData.length - 1].days[4].formattedDate
      : '';

    return {
      totalPaidDays,
      totalUnpaidDays,
      totalPartialDays,
      totalScheduledDays,
      lifetimePaid,
      overallBalance,
      percentPaid,
      finalEndingDate,
      formattedEndDate,
    };
  }, [weeksData, client.payments, client.totalPayable, totalWeeks, client.finishDate]);

  // Special/Off-grid payments (e.g. payments made on weekends or outside the scheduled weeks)
  const offGridPayments = useMemo(() => {
    const allGridDates = new Set<string>();
    weeksData.forEach((w) => w.days.forEach((d) => allGridDates.add(d.dateStr)));

    return (client.payments || []).filter((p) => !allGridDates.has(p.date));
  }, [weeksData, client.payments]);

  // Filter weeks based on selected tab
  const displayedWeeks = useMemo(() => {
    if (selectedWeekTab === 'all') return weeksData;
    return weeksData.filter((w) => w.weekNumber === selectedWeekTab);
  }, [weeksData, selectedWeekTab]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CalendarDays className="w-4 h-4" />
              <span>Weekly Loan Repayment Grid (Mon – Fri)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2 flex-wrap">
              <span>{client.name} — Loan History</span>
              <span className="text-amber-400 text-base font-bold">
                (Week 1 to Week {totalWeeks})
              </span>
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Loan Ending: <strong className="text-white">Week {totalWeeks} ({overallStats.formattedEndDate || overallStats.finalEndingDate})</strong> • Daily due: <strong className="text-amber-400">K{client.dailyAmount}</strong>/day (Monday to Friday)
            </p>
          </div>

          {/* Quick Progress Indicator */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-right min-w-[200px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Repayment Progress:</span>
              <span className="text-amber-400 font-black">{overallStats.percentPaid}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallStats.percentPaid}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-300 mt-2 font-semibold">
              K{overallStats.lifetimePaid} paid of K{client.totalPayable}
            </div>
          </div>
        </div>

        {/* High-Level Loan Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Duration</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {totalWeeks} Weeks
            </div>
            <div className="text-[10px] text-slate-500">{client.totalDays} collection days</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center">
            <div className="text-[10px] text-emerald-400 uppercase font-bold">Paid Full</div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{overallStats.totalPaidDays} Days</span>
            </div>
            <div className="text-[10px] text-slate-500">cleared on schedule</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center">
            <div className="text-[10px] text-amber-500 uppercase font-bold">Partial Paid</div>
            <div className="text-base sm:text-lg font-black text-amber-500 mt-0.5">
              {overallStats.totalPartialDays} Days
            </div>
            <div className="text-[10px] text-slate-500">short payment</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center">
            <div className="text-[10px] text-red-400 uppercase font-bold">Not Paid / Missed</div>
            <div className="text-base sm:text-lg font-black text-red-400 mt-0.5 flex items-center justify-center space-x-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>{overallStats.totalUnpaidDays} Days</span>
            </div>
            <div className="text-[10px] text-slate-500">in arrears</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Balance Left</div>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
              K{overallStats.overallBalance}
            </div>
            <div className="text-[10px] text-slate-500">principal + interest</div>
          </div>
        </div>
      </div>

      {/* Week Navigation Pills Toolbar */}
      <div className="bg-slate-950/70 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1.5 flex-nowrap">
          <button
            onClick={() => setSelectedWeekTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedWeekTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            All Weeks (1 – {totalWeeks})
          </button>

          {weeksData.map((w) => {
            const isTabActive = selectedWeekTab === w.weekNumber;
            return (
              <button
                key={`tab-week-${w.weekNumber}`}
                onClick={() => setSelectedWeekTab(w.weekNumber)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                  isTabActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>Week {w.weekNumber}</span>
                {w.isFullyPaid && (
                  <Check className={`w-3.5 h-3.5 ${isTabActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                )}
                {w.unpaidDaysCount > 0 && !w.isFullyPaid && (
                  <span className={`w-2 h-2 rounded-full ${isTabActive ? 'bg-slate-950' : 'bg-red-400'}`}></span>
                )}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline whitespace-nowrap">
          Mon – Fri Collection Schedule
        </span>
      </div>

      {/* Main Weekly Cards / Tables Container */}
      <div className="p-4 sm:p-6 space-y-6">
        {displayedWeeks.map((week) => (
          <div
            key={`week-card-${week.weekNumber}`}
            className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Week Header Bar */}
            <div className="p-4 sm:p-5 bg-slate-800/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                  W{week.weekNumber}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-black text-white text-base">
                      Week {week.weekNumber} Record
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      ({week.formattedRange})
                    </span>
                    {week.isCurrentWeek && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Current Week
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Expected: <strong className="text-white">K{week.totalExpected}</strong> (5 days × K{client.dailyAmount}) • Collected: <strong className="text-emerald-400">K{week.totalCollected}</strong>
                  </p>
                </div>
              </div>

              {/* Week Status Pill */}
              <div className="flex items-center space-x-2">
                {week.isFullyPaid ? (
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>5/5 Cleared (100%)</span>
                  </span>
                ) : week.paidDaysCount > 0 ? (
                  <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>{week.paidDaysCount}/5 Days Paid</span>
                  </span>
                ) : week.isPastWeek ? (
                  <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>0/5 Paid (Arrears)</span>
                  </span>
                ) : (
                  <span className="bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full text-xs font-medium">
                    Scheduled
                  </span>
                )}
              </div>
            </div>

            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold">
                    <th className="py-3 px-4">Day of Week</th>
                    <th className="py-3 px-4">Calendar Date</th>
                    <th className="py-3 px-4 text-right">Daily Requirement</th>
                    <th className="py-3 px-4 text-right">Actual Paid</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Collecting Agent</th>
                    <th className="py-3 px-4">Notes & Stamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {week.days.map((day) => {
                    const isToday = day.dateStr === todayStr;

                    return (
                      <tr
                        key={day.dateStr}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          isToday ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Day Name */}
                        <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                          <span className="w-6 text-center text-slate-400 font-medium">
                            {day.shortDay}
                          </span>
                          <span className="font-bold">{day.dayName}</span>
                          {isToday && (
                            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                              TODAY
                            </span>
                          )}
                        </td>

                        {/* Calendar Date */}
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {day.dateStr}
                        </td>

                        {/* Daily Requirement */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                          K{day.dailyDue}
                        </td>

                        {/* Actual Paid */}
                        <td className="py-3.5 px-4 text-right">
                          {day.status === 'paid' && (
                            <span className="font-black text-emerald-400 text-sm">
                              +K{day.totalPaid}
                            </span>
                          )}
                          {day.status === 'partial' && (
                            <span className="font-black text-amber-500 text-sm">
                              +K{day.totalPaid}
                            </span>
                          )}
                          {day.status === 'not_paid' && (
                            <span className="font-bold text-red-400">
                              K0
                            </span>
                          )}
                          {(day.status === 'due_today' || day.status === 'upcoming') && (
                            <span className="text-slate-500 font-medium">
                              —
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {day.status === 'paid' && (
                            <span className="inline-flex items-center space-x-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PAID FULL</span>
                            </span>
                          )}
                          {day.status === 'partial' && (
                            <span className="inline-flex items-center space-x-1 bg-amber-500/15 border border-amber-500/40 text-amber-500 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <span>PAID K{day.totalPaid} • BAL K{day.balanceRemaining}</span>
                            </span>
                          )}
                          {day.status === 'not_paid' && (
                            <span className="inline-flex items-center space-x-1 bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>NOT PAID</span>
                            </span>
                          )}
                          {day.status === 'due_today' && (
                            <span className="inline-flex items-center space-x-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>DUE TODAY</span>
                            </span>
                          )}
                          {day.status === 'upcoming' && (
                            <span className="inline-flex items-center space-x-1 bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full font-medium text-[11px]">
                              <span>UPCOMING</span>
                            </span>
                          )}
                        </td>

                        {/* Collecting Agent */}
                        <td className="py-3.5 px-4">
                          {day.agentName ? (
                            <span className="text-amber-400 font-bold flex items-center space-x-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{day.agentName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">—</span>
                          )}
                        </td>

                        {/* Notes / Timestamp */}
                        <td className="py-3.5 px-4 text-slate-400">
                          {day.notes ? (
                            <span className="italic text-slate-300">"{day.notes}"</span>
                          ) : day.timestamp ? (
                            <span className="text-[10px] text-slate-500">
                              {new Date(day.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Grid View (5-Day Cards) */}
            <div className="md:hidden divide-y divide-slate-800">
              {week.days.map((day) => {
                const isToday = day.dateStr === todayStr;

                return (
                  <div
                    key={`mob-day-${day.dateStr}`}
                    className={`p-3.5 flex items-center justify-between ${
                      isToday ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-white text-sm">{day.dayName}</span>
                        <span className="text-xs text-slate-400 font-mono">({day.formattedDate})</span>
                        {isToday && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded">
                            TODAY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                        <span>Due: K{day.dailyDue}</span>
                        {day.agentName && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">Rec: {day.agentName}</span>
                          </>
                        )}
                      </div>
                      {day.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          "{day.notes}"
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {day.status === 'paid' && (
                        <div className="space-y-0.5">
                          <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold text-xs inline-flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>PAID (+K{day.totalPaid})</span>
                          </span>
                        </div>
                      )}
                      {day.status === 'partial' && (
                        <div className="space-y-0.5">
                          <span className="bg-amber-500/15 border border-amber-500/30 text-amber-500 px-2.5 py-0.5 rounded-full font-bold text-xs">
                            K{day.totalPaid} (Bal K{day.balanceRemaining})
                          </span>
                        </div>
                      )}
                      {day.status === 'not_paid' && (
                        <div className="space-y-0.5">
                          <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full font-bold text-xs inline-flex items-center space-x-1">
                            <X className="w-3 h-3" />
                            <span>NOT PAID</span>
                          </span>
                        </div>
                      )}
                      {day.status === 'due_today' && (
                        <span className="bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          DUE TODAY
                        </span>
                      )}
                      {day.status === 'upcoming' && (
                        <span className="bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full text-[11px]">
                          UPCOMING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Off-Grid / Advance / Weekend Payments Alert if Any */}
        {offGridPayments.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <h5 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              <span>Special Off-Grid & Advance Collections ({offGridPayments.length})</span>
            </h5>
            <div className="space-y-2">
              {offGridPayments.map((p, idx) => (
                <div
                  key={`offgrid-${p.id || idx}`}
                  className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-emerald-400">+K{p.amount}</span>
                    <span className="text-slate-400 ml-2">Date: {p.date} • Agent: {p.agentName}</span>
                    {p.notes && <span className="text-slate-500 ml-2 italic">"{p.notes}"</span>}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(p.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
