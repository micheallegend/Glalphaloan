import React from 'react';
import { Client } from '../types';
import { Banknote, Users, TrendingUp, Calendar, CheckCircle2, ShieldAlert, ArrowUpRight, PlusCircle, Award, AlertTriangle, TrendingDown, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardProps {
  clients: Client[];
  setActiveTab: (tab: 'dashboard' | 'today' | 'records' | 'clients' | 'new-loan' | 'logs') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, setActiveTab }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const activeClients = clients.filter((c) => c.status === 'Active');
  const completedClients = clients.filter((c) => c.status === 'Completed');

  const totalDisbursed = clients.reduce((acc, c) => acc + c.principal, 0);
  const totalExpected = clients.reduce((acc, c) => acc + c.totalPayable, 0);

  // All payments across clients
  const allPayments = clients.flatMap((c) => c.payments || []);
  const totalCollectedAll = allPayments.reduce((acc, p) => acc + (p.isNotPaid ? 0 : p.amount), 0);

  // Today's collections
  const todaysPayments = allPayments.filter((p) => p.date === todayStr && !p.isNotPaid);
  const totalCollectedToday = todaysPayments.reduce((acc, p) => acc + p.amount, 0);

  // Calculate collections for current week (Mon-Fri)
  const getRecentDaysData = () => {
    const daysMap: { [key: string]: { label: string; amount: number } } = {};
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      daysMap[dStr] = { label, amount: 0 };
    }

    allPayments.forEach((p) => {
      if (!p.isNotPaid && daysMap[p.date]) {
        daysMap[p.date].amount += p.amount;
      }
    });

    return Object.values(daysMap);
  };

  const chartData = getRecentDaysData();

  interface ArrearItem {
    clientId: string;
    clientName: string;
    businessType: string;
    date: string;
    notes?: string;
    type: 'missed' | 'partial';
    paidAmount: number;
    dailyDue: number;
    dailyBalance: number;
    overallBalance: number;
  }

  // Clients who missed or didn't pay (Yesterday balance / arrears) or paid partial daily amount
  const arrearsList: ArrearItem[] = [];
  clients.forEach((c) => {
    const totalPaid = (c.payments || []).reduce((acc, p) => acc + (p.isNotPaid ? 0 : p.amount), 0);
    const overallBalance = Math.max(0, c.totalPayable - totalPaid);

    (c.payments || []).forEach((p) => {
      if (p.isNotPaid) {
        arrearsList.push({
          clientId: c.id,
          clientName: c.name,
          businessType: c.businessType,
          date: p.date,
          notes: p.notes,
          type: 'missed',
          paidAmount: 0,
          dailyDue: c.dailyAmount,
          dailyBalance: c.dailyAmount,
          overallBalance,
        });
      } else if (p.amount > 0 && p.amount < c.dailyAmount) {
        arrearsList.push({
          clientId: c.id,
          clientName: c.name,
          businessType: c.businessType,
          date: p.date,
          notes: p.notes,
          type: 'partial',
          paidAmount: p.amount,
          dailyDue: c.dailyAmount,
          dailyBalance: Math.max(0, c.dailyAmount - p.amount),
          overallBalance,
        });
      }
    });
  });

  // Best Payers vs Low Performance evaluation
  const clientPerformance = clients.map((c) => {
    const payments = c.payments || [];
    const missedCount = payments.filter((p) => p.isNotPaid).length;
    const paidCount = payments.filter((p) => !p.isNotPaid && p.amount > 0).length;
    const totalPaid = payments.reduce((acc, p) => acc + (p.isNotPaid ? 0 : p.amount), 0);
    const remainingBalance = Math.max(0, c.totalPayable - totalPaid);

    return {
      client: c,
      missedCount,
      paidCount,
      totalPaid,
      remainingBalance,
      isBestPayer: missedCount === 0 && paidCount >= 1,
      isLowPerformance: missedCount >= 1 || (c.status === 'Active' && paidCount === 0 && payments.length > 0),
    };
  });

  const bestPayers = clientPerformance.filter((cp) => cp.isBestPayer && cp.client.status === 'Active');
  const lowPerformers = clientPerformance.filter((cp) => cp.isLowPerformance && cp.client.status === 'Active');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs px-3 py-1 rounded-full font-semibold mb-3">
              <span>🌟 Kwacha Loans 💰 • Field Collection Dashboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">G.L Alpha King Loans</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Track daily field collections, analyze weekly collection charts, monitor remaining balances for missed payers, and evaluate best payers for loan increases.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('today')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 text-sm cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Today's Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold px-5 py-3 rounded-xl transition-all flex items-center space-x-2 text-sm cursor-pointer shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Record Keeping 📊</span>
            </button>
            <button
              onClick={() => setActiveTab('new-loan')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-5 py-3 rounded-xl transition-all flex items-center space-x-2 text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>New Loan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Today
            </span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collected Today</div>
          <div className="text-3xl font-black text-white mt-1">K{totalCollectedToday.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2">{todaysPayments.length} collection entries today</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected</div>
          <div className="text-3xl font-black text-white mt-1">K{totalCollectedAll.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2">Across all active & completed loans</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Borrowers</div>
          <div className="text-3xl font-black text-white mt-1">{activeClients.length}</div>
          <div className="text-xs text-slate-500 mt-2">{completedClients.length} loans fully repaid</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">
              Portfolio
            </span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Disbursed</div>
          <div className="text-3xl font-black text-white mt-1">K{totalDisbursed.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2">Expected Return: K{totalExpected.toLocaleString()}</div>
        </div>
      </div>

      {/* Chart Section using Recharts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>Weekly Collection Overview (Kwacha)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Total collection amount per day for the current week</p>
          </div>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1 rounded-full font-semibold">
            Mon–Fri Field Performance
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                formatter={(value: any) => [`K${value}`, 'Collected Amount']}
              />
              <Bar dataKey="amount" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Missed Payments / Yesterday Balance & Best Payers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missed Payments & Remaining Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Missed & Partial Arrears</span>
              </h3>
              <span className="bg-amber-500/15 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {arrearsList.length} Attention
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Borrowers who missed or made incomplete daily repayments:</p>

            {arrearsList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs bg-slate-800/40 rounded-xl border border-slate-800">
                No missed payments or arrears recorded! All clients are up to date.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {arrearsList.map((item, idx) => {
                  const isPartial = item.type === 'partial';

                  return (
                    <div
                      key={`arrears-${item.clientId}-${item.date}-${idx}`}
                      className={`border rounded-xl p-3.5 flex items-center justify-between ${
                        isPartial
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-sm">{item.clientName}</div>
                        <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5 flex-wrap">
                          <span>Date: <strong className={isPartial ? 'text-amber-400' : 'text-red-400'}>{item.date}</strong></span>
                          <span>•</span>
                          <span>{item.businessType}</span>
                        </div>
                        {isPartial && (
                          <div className="mt-1 text-xs text-amber-500 font-semibold">
                            paid K{item.paidAmount} then Balance K{item.dailyBalance}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Loan Bal</div>
                        <div className={`font-bold text-sm ${isPartial ? 'text-amber-500' : 'text-red-400'}`}>
                          K{item.overallBalance}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Best Payers vs Low Performance Review */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          {/* Best Payers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Best Payers (0 Missed Days)</span>
              </h3>
              <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Loan Increase Candidates
              </span>
            </div>
            {bestPayers.length === 0 ? (
              <div className="text-xs text-slate-500 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                No consistent best payers recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {bestPayers.map((bp, idx) => (
                  <div key={`best-${bp.client.id}-${idx}`} className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{bp.client.name}</div>
                      <div className="text-xs text-slate-400">{bp.client.businessType} • Paid: K{bp.totalPaid}</div>
                    </div>
                    <span className="bg-emerald-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-lg">
                      ⭐ Eligible for Loan Upgrade
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Performers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span>Low Performance / High Arrears</span>
              </h3>
              <span className="bg-red-500/15 text-red-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Loan Review / Decrease
              </span>
            </div>
            {lowPerformers.length === 0 ? (
              <div className="text-xs text-slate-500 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                No low-performing clients flagged.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {lowPerformers.map((lp, idx) => (
                  <div key={`low-${lp.client.id}-${idx}`} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{lp.client.name}</div>
                      <div className="text-xs text-slate-400">Missed Days: <strong className="text-red-400">{lp.missedCount}</strong> • Bal: K{lp.remainingBalance}</div>
                    </div>
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      ⚠️ Review Loan Limit
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
