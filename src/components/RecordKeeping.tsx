import React, { useState, useMemo, useRef } from 'react';
import { Client, Agent, PaymentRecord } from '../types';
import {
  CalendarDays,
  Calendar,
  Download,
  Image as ImageIcon,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Wallet,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  ArrowUpRight,
  Filter,
  Check,
  Clock,
  User,
  Phone,
  Building,
  DollarSign
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RecordKeepingProps {
  clients: Client[];
  currentAgent: Agent;
}

export const RecordKeeping: React.FC<RecordKeepingProps> = ({ clients, currentAgent }) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'partial' | 'unpaid'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Hidden/printable container ref for high-quality export
  const reportPrintRef = useRef<HTMLDivElement>(null);

  // Discover all unique dates across all payments
  const allRecordedDates = useMemo(() => {
    const datesSet = new Set<string>();
    // Always include today
    datesSet.add(todayStr);

    clients.forEach((client) => {
      (client.payments || []).forEach((payment) => {
        if (payment.date) {
          datesSet.add(payment.date);
        }
      });
    });

    // Sort descending (latest dates first)
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }, [clients, todayStr]);

  // Quick navigation helpers
  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // Compile detailed information for each client for the selected date
  const dayRecords = useMemo(() => {
    return clients.map((client) => {
      // Find all payment records for this client on selected date
      const paymentsOnDate = (client.payments || []).filter((p) => p.date === selectedDate);
      
      const totalPaidOnDate = paymentsOnDate.reduce((sum, p) => sum + (p.amount || 0), 0);
      const isMarkedNotPaid = paymentsOnDate.some((p) => p.isNotPaid);
      const hasPaymentEntry = paymentsOnDate.length > 0;

      // Check if client had started loan on or before this date
      const loanStarted = !client.startDate || client.startDate <= selectedDate;
      const expectedDue = loanStarted ? client.dailyAmount : 0;

      let paymentStatus: 'full' | 'partial' | 'unpaid' | 'not_due';
      if (!loanStarted) {
        paymentStatus = 'not_due';
      } else if (totalPaidOnDate >= expectedDue && expectedDue > 0) {
        paymentStatus = 'full';
      } else if (totalPaidOnDate > 0 && totalPaidOnDate < expectedDue) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'unpaid';
      }

      const balanceRemainingForDay = Math.max(0, expectedDue - totalPaidOnDate);

      // Collecting agents on this date
      const agentsOnDate = Array.from(
        new Set(paymentsOnDate.map((p) => p.agentName).filter(Boolean))
      );

      const latestPayment = paymentsOnDate[paymentsOnDate.length - 1];

      // Total paid so far across all time
      const totalPaidLifetime = (client.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const remainingLoanBalance = Math.max(0, client.totalPayable - totalPaidLifetime);

      return {
        client,
        expectedDue,
        totalPaidOnDate,
        balanceRemainingForDay,
        isMarkedNotPaid,
        hasPaymentEntry,
        paymentStatus,
        paymentsOnDate,
        agentsOnDate,
        notes: latestPayment?.notes || '',
        timestamp: latestPayment?.timestamp || 0,
        totalPaidLifetime,
        remainingLoanBalance,
      };
    });
  }, [clients, selectedDate]);

  // Aggregate statistics for selected date
  const summaryStats = useMemo(() => {
    let totalCollected = 0;
    let totalExpected = 0;
    let fullPaidCount = 0;
    let partialPaidCount = 0;
    let unpaidCount = 0;
    let totalActiveBorrowers = 0;
    const agentBreakdown: Record<string, { collected: number; count: number }> = {};

    dayRecords.forEach((record) => {
      if (record.expectedDue > 0) {
        totalActiveBorrowers += 1;
        totalExpected += record.expectedDue;
      }
      totalCollected += record.totalPaidOnDate;

      if (record.paymentStatus === 'full') {
        fullPaidCount += 1;
      } else if (record.paymentStatus === 'partial') {
        partialPaidCount += 1;
      } else if (record.paymentStatus === 'unpaid') {
        unpaidCount += 1;
      }

      // Track by agent
      record.paymentsOnDate.forEach((p) => {
        const agent = p.agentName || 'Unknown Agent';
        if (!agentBreakdown[agent]) {
          agentBreakdown[agent] = { collected: 0, count: 0 };
        }
        agentBreakdown[agent].collected += p.amount || 0;
        agentBreakdown[agent].count += 1;
      });
    });

    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
    const dayBalance = Math.max(0, totalExpected - totalCollected);

    return {
      totalCollected,
      totalExpected,
      collectionRate,
      dayBalance,
      fullPaidCount,
      partialPaidCount,
      unpaidCount,
      totalActiveBorrowers,
      agentBreakdown,
    };
  }, [dayRecords]);

  // Filtered day records based on search and filters
  const filteredRecords = useMemo(() => {
    return dayRecords.filter((record) => {
      // Exclude clients who hadn't started yet
      if (record.paymentStatus === 'not_due') return false;

      // Status filter
      if (statusFilter !== 'all' && record.paymentStatus !== statusFilter) {
        return false;
      }

      // Agent filter
      if (agentFilter !== 'all') {
        const match = record.agentsOnDate.includes(agentFilter);
        if (!match) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const c = record.client;
        const matchesName = c.name.toLowerCase().includes(term);
        const matchesBusiness = c.businessType.toLowerCase().includes(term);
        const matchesPhone = c.phone.toLowerCase().includes(term);
        const matchesAddress = c.address.toLowerCase().includes(term);
        if (!matchesName && !matchesBusiness && !matchesPhone && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [dayRecords, statusFilter, agentFilter, searchTerm]);

  // Historical summary for past days (multi-day archive list)
  const historicalDaysOverview = useMemo(() => {
    return allRecordedDates.slice(0, 15).map((date) => {
      let collected = 0;
      let expected = 0;
      let paidCount = 0;
      let unpaidCount = 0;

      clients.forEach((c) => {
        const payments = (c.payments || []).filter((p) => p.date === date);
        const amt = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        collected += amt;

        if (!c.startDate || c.startDate <= date) {
          expected += c.dailyAmount;
          if (amt >= c.dailyAmount) {
            paidCount += 1;
          } else {
            unpaidCount += 1;
          }
        }
      });

      return {
        date,
        collected,
        expected,
        paidCount,
        unpaidCount,
        rate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      };
    });
  }, [allRecordedDates, clients]);

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    if (!reportPrintRef.current) return;
    setIsExportingPDF(true);
    setExportSuccessMessage(null);

    try {
      const element = reportPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`GL_Alpha_King_Loans_Daily_Record_${selectedDate}.pdf`);

      setExportSuccessMessage(`PDF Report for ${selectedDate} downloaded successfully!`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Download Image (PNG) Handler
  const handleDownloadImage = async () => {
    if (!reportPrintRef.current) return;
    setIsExportingImage(true);
    setExportSuccessMessage(null);

    try {
      const element = reportPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `GL_Alpha_King_Loans_Daily_Record_${selectedDate}.png`;
      link.click();

      setExportSuccessMessage(`Image Report for ${selectedDate} downloaded successfully!`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Date Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>G.L Alpha King Loans • Daily Record Keeping & Archives</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <span>Collection History & Records</span>
              <span className="text-amber-400">({selectedDate})</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Inspect total collected funds, expected daily revenue, borrower payment breakdowns, and agent performance for any selected day. Export official PDF or image statements.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              title="Download full official PDF report"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPDF ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer"
              title="Download high-resolution image (PNG) for WhatsApp or device"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>{isExportingImage ? 'Saving PNG...' : 'Download Image'}</span>
            </button>

            <button
              onClick={handleNativePrint}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white p-2.5 rounded-xl text-xs transition-all cursor-pointer"
              title="Print Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">Choose Day:</span>

            {/* Previous Day */}
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Native Date Input */}
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white shadow-inner">
              <Calendar className="w-4 h-4 text-amber-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Next Day */}
            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Today quick jump */}
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              Today
            </button>
          </div>

          {/* Quick Date Pills of days with recorded payments */}
          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap mr-1">
              Active Days:
            </span>
            {allRecordedDates.slice(0, 5).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedDate === d
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                {d === todayStr ? 'Today' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Success Alert Banner */}
        {exportSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Main KPI Financial Summary Cards for the Chosen Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Money Collected */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected on Day</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              K{summaryStats.totalCollected.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <span>Performance:</span>
              <strong className="text-emerald-400">{summaryStats.collectionRate}%</strong>
              <span>of expected</span>
            </div>
          </div>
        </div>

        {/* Expected Money */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected Collection</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white tracking-tight">
              K{summaryStats.totalExpected.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <span>Required from:</span>
              <strong className="text-amber-400">{summaryStats.totalActiveBorrowers} borrowers</strong>
            </div>
          </div>
        </div>

        {/* Remaining Day Balance / Shortfall */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day Balance (Shortfall)</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black tracking-tight ${summaryStats.dayBalance > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
              K{summaryStats.dayBalance.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <span>Unpaid / partial deficit</span>
            </div>
          </div>
        </div>

        {/* People Paid vs Not Paid breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Borrower Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div>
              <div className="text-emerald-400 font-black text-xl">{summaryStats.fullPaidCount}</div>
              <div className="text-slate-400 text-[11px]">Paid Full</div>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <div className="text-amber-500 font-black text-xl">{summaryStats.partialPaidCount}</div>
              <div className="text-slate-400 text-[11px]">Partial Paid</div>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <div className="text-red-400 font-black text-xl">{summaryStats.unpaidCount}</div>
              <div className="text-slate-400 text-[11px]">Not Paid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Collections Breakdown on Chosen Date */}
      {Object.keys(summaryStats.agentBreakdown).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Agent Collections Summary for {selectedDate}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(summaryStats.agentBreakdown).map(([agentName, data]) => (
              <div
                key={agentName}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-sm">{agentName}</div>
                  <div className="text-[11px] text-slate-400">{data.count} collections recorded</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-black text-base">K{data.collected}</div>
                  <div className="text-[10px] text-slate-400">total collected</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtering & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            All Borrowers ({dayRecords.filter((r) => r.paymentStatus !== 'not_due').length})
          </button>

          <button
            onClick={() => setStatusFilter('full')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'full'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fully Paid ({summaryStats.fullPaidCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'partial'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-amber-500 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Partial Paid ({summaryStats.partialPaidCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'unpaid'
                ? 'bg-red-500 text-white font-black shadow-md shadow-red-500/20'
                : 'bg-slate-800 text-red-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Not Paid ({summaryStats.unpaidCount})</span>
          </button>
        </div>

        {/* Search & Agent Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search borrower name, market..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-60"
            />
          </div>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Agents</option>
            <option value="Micheal Legend">Micheal Legend</option>
            <option value="Brian Nyimbili">Brian Nyimbili</option>
          </select>
        </div>
      </div>

      {/* Client Records Table & Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-black text-white text-base sm:text-lg">
              Detailed Daily Breakdown for {selectedDate}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Showing {filteredRecords.length} records matching your filter criteria
            </p>
          </div>
          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
            Kwacha Loans • Mon–Fri
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
            <p className="text-sm font-semibold">No borrower records found matching this filter for {selectedDate}.</p>
            <p className="text-xs text-slate-600">Try changing your search term, status filter, or picking another date above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRecords.map((record) => {
              const { client, expectedDue, totalPaidOnDate, balanceRemainingForDay, paymentStatus, paymentsOnDate, notes } = record;

              return (
                <div
                  key={client.id}
                  className="p-5 sm:p-6 hover:bg-slate-800/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Client Identification */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <h4 className="font-black text-white text-base">{client.name}</h4>
                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs text-slate-300 font-medium">
                        {client.businessType}
                      </span>

                      {/* Payment Status Badges */}
                      {paymentStatus === 'full' && (
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid in Full (+K{totalPaidOnDate})</span>
                        </span>
                      )}

                      {/* Underpaid / Partial Paid in ORANGE per user specification */}
                      {paymentStatus === 'partial' && (
                        <span className="bg-amber-500/15 border border-amber-500/40 text-amber-500 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1.5 shadow-sm shadow-amber-500/10">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>paid K{totalPaidOnDate} then Balance K{balanceRemainingForDay}</span>
                        </span>
                      )}

                      {/* Not Paid Badge */}
                      {paymentStatus === 'unpaid' && (
                        <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Not Paid</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.phone}</span>
                      </span>
                      <span>•</span>
                      <span>{client.address}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">
                        Daily Requirement: K{expectedDue}
                      </span>
                      {notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300 italic bg-slate-800/80 px-2 py-0.5 rounded text-[11px]">
                            "{notes}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics for this Client on Selected Date */}
                  <div className="flex items-center space-x-6 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                    {/* Amount Paid on Date */}
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Paid on {selectedDate}
                      </div>
                      <div className="text-lg font-black text-white">
                        K{totalPaidOnDate}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {paymentStatus === 'full' ? 'Complete' : paymentStatus === 'partial' ? `Short by K${balanceRemainingForDay}` : 'K0 collected'}
                      </div>
                    </div>

                    {/* Collecting Agent */}
                    <div className="text-left sm:text-right min-w-[120px]">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Received By
                      </div>
                      <div className="text-xs font-bold text-amber-400 flex items-center sm:justify-end space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{record.agentsOnDate.join(', ') || 'Pending'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {record.timestamp ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No timestamp'}
                      </div>
                    </div>

                    {/* Lifetime Loan Progress */}
                    <div className="text-right hidden sm:block min-w-[110px]">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Total Loan Paid
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        K{record.totalPaidLifetime} / K{client.totalPayable}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Rem: K{record.remainingLoanBalance}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-Day Historical Archive Overview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CalendarDays className="w-4 h-4" />
              <span>Multi-Day Historical Archive</span>
            </div>
            <h3 className="text-xl font-black text-white">Past Days Record Log</h3>
          </div>
          <span className="text-xs text-slate-400">Click any day to inspect full details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Expected Revenue</th>
                <th className="py-3 px-4 font-bold">Actual Collected</th>
                <th className="py-3 px-4 font-bold">Collection Rate</th>
                <th className="py-3 px-4 font-bold">Paid Borrowers</th>
                <th className="py-3 px-4 font-bold">Unpaid Deficit</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {historicalDaysOverview.map((hist) => {
                const isSelected = hist.date === selectedDate;
                const shortfall = Math.max(0, hist.expected - hist.collected);

                return (
                  <tr
                    key={hist.date}
                    onClick={() => setSelectedDate(hist.date)}
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-500/10 font-bold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{hist.date}</span>
                      {hist.date === todayStr && (
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded">
                          TODAY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">K{hist.expected}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">K{hist.collected}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{hist.rate}%</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, hist.rate)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">{hist.paidCount} clients</td>
                    <td className="py-3.5 px-4 text-red-400 font-bold">
                      {shortfall > 0 ? `K${shortfall} (${hist.unpaidCount} unpaid)` : 'Nil (100% Cleared)'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(hist.date);
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold text-xs underline cursor-pointer"
                      >
                        Inspect Record →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 
        OFFICIAL PRINTABLE & HIGH-RESOLUTION EXPORT CONTAINER 
        This dedicated view is styled with high contrast, sharp fonts, headers, and signatures
        for seamless conversion to PDF and PNG Image!
      */}
      <div className="hidden">
        {/* Rendered into ref for html2canvas & jsPDF */}
        <div
          ref={reportPrintRef}
          style={{ width: '850px', minHeight: '1100px', padding: '40px' }}
          className="bg-slate-950 text-white font-sans"
        >
          {/* Header */}
          <div className="border-b-2 border-amber-500 pb-6 mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl">👑</span>
                <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                  G.L Alpha King Loans
                </h1>
              </div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Official Mon–Fri Field Collection & Daily Settlement Record
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Authorized Field Agents: Micheal Legend & Brian Nyimbili • Lusaka / Copperbelt
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">RECORD DATE</div>
              <div className="text-2xl font-black text-amber-400">{selectedDate}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                Generated: {new Date().toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">
                Printed by: <strong className="text-white">{currentAgent.name}</strong>
              </div>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Expected</div>
              <div className="text-lg font-black text-white mt-1">K{summaryStats.totalExpected}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Total Collected</div>
              <div className="text-lg font-black text-emerald-400 mt-1">K{summaryStats.totalCollected}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-[10px] text-amber-400 uppercase font-bold">Shortfall / Balance</div>
              <div className="text-lg font-black text-amber-400 mt-1">K{summaryStats.dayBalance}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Collection Rate</div>
              <div className="text-lg font-black text-white mt-1">{summaryStats.collectionRate}%</div>
            </div>
          </div>

          {/* Breakdown Counts */}
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl mb-6 flex justify-around text-xs">
            <div>
              <span className="text-slate-400">Total Borrowers: </span>
              <strong className="text-white">{summaryStats.totalActiveBorrowers}</strong>
            </div>
            <div>
              <span className="text-slate-400">Paid Full: </span>
              <strong className="text-emerald-400">{summaryStats.fullPaidCount}</strong>
            </div>
            <div>
              <span className="text-slate-400">Partial Paid: </span>
              <strong className="text-amber-500">{summaryStats.partialPaidCount}</strong>
            </div>
            <div>
              <span className="text-slate-400">Not Paid: </span>
              <strong className="text-red-400">{summaryStats.unpaidCount}</strong>
            </div>
          </div>

          {/* Client Table */}
          <table className="w-full text-left text-xs mb-8 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Client Name</th>
                <th className="py-2 px-2">Market / Business</th>
                <th className="py-2 px-2 text-right">Daily Due</th>
                <th className="py-2 px-2 text-right">Paid Amount</th>
                <th className="py-2 px-2 text-right">Day Balance</th>
                <th className="py-2 px-2 text-center">Status</th>
                <th className="py-2 px-2">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.map((r, idx) => (
                <tr key={r.client.id} className="text-xs">
                  <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2 font-bold text-white">{r.client.name}</td>
                  <td className="py-2 px-2 text-slate-300">{r.client.businessType}</td>
                  <td className="py-2 px-2 text-right font-medium text-slate-200">K{r.expectedDue}</td>
                  <td className="py-2 px-2 text-right font-bold text-emerald-400">K{r.totalPaidOnDate}</td>
                  <td className="py-2 px-2 text-right font-bold text-amber-500">
                    {r.balanceRemainingForDay > 0 ? `K${r.balanceRemainingForDay}` : 'K0'}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {r.paymentStatus === 'full' && (
                      <span className="text-emerald-400 font-bold">PAID FULL</span>
                    )}
                    {r.paymentStatus === 'partial' && (
                      <span className="text-amber-500 font-bold">
                        PAID K{r.totalPaidOnDate} BAL K{r.balanceRemainingForDay}
                      </span>
                    )}
                    {r.paymentStatus === 'unpaid' && (
                      <span className="text-red-400 font-bold">NOT PAID</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-amber-400 font-medium">
                    {r.agentsOnDate.join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Verification & Signatures Block */}
          <div className="border-t border-slate-800 pt-8 mt-12 grid grid-cols-2 gap-8 text-xs text-slate-400">
            <div>
              <div className="border-b border-slate-700 pb-8 mb-2"></div>
              <div className="font-bold text-white">Micheal Legend</div>
              <div className="text-[10px]">Field Collection Agent Signature & Date</div>
            </div>
            <div>
              <div className="border-b border-slate-700 pb-8 mb-2"></div>
              <div className="font-bold text-white">Brian Nyimbili</div>
              <div className="text-[10px]">Field Collection Agent Signature & Date</div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-600">
            G.L Alpha King Loans Management System • Strict Confidentiality & Daily Mon–Fri Field Records
          </div>
        </div>
      </div>
    </div>
  );
};
