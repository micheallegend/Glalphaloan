import React, { useState } from 'react';
import { Client, Agent } from '../types';
import { CalendarDays, CheckCircle2, Search, Plus, Phone, MapPin, X, AlertTriangle, Download, Calendar } from 'lucide-react';

interface TodaysSheetProps {
  clients: Client[];
  currentAgent: Agent;
  onRecordPayment: (clientId: string, amount: number, notes?: string, isNotPaid?: boolean, collectionDate?: string) => void;
}

export const TodaysSheet: React.FC<TodaysSheetProps> = ({ clients, currentAgent, onRecordPayment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionDate, setCollectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClientForPay, setSelectedClientForPay] = useState<Client | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isNotPaidOption, setIsNotPaidOption] = useState<boolean>(false);

  const activeClients = clients.filter((c) => c.status === 'Active');

  const filteredClients = activeClients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPayModal = (client: Client, notPaidDefault = false) => {
    setSelectedClientForPay(client);
    setCustomAmount(client.dailyAmount.toString());
    setNotes('');
    setIsNotPaidOption(notPaidDefault);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPay) return;

    if (isNotPaidOption) {
      onRecordPayment(selectedClientForPay.id, 0, `Not paid on ${collectionDate} (Yesterday balance recorded)`, true, collectionDate);
    } else {
      const amt = parseFloat(customAmount);
      if (isNaN(amt) || amt < 0) return;
      onRecordPayment(selectedClientForPay.id, amt, notes || (amt === 0 ? 'Not paid' : `Payment received for ${collectionDate}`), false, collectionDate);
    }

    setSelectedClientForPay(null);
  };

  const handlePrintOrDownload = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Date Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>Mon–Fri Field Collection Sheet • Kwacha Loans 💰</span>
          </div>
          <h2 className="text-2xl font-black text-white">Collection Sheet ({collectionDate})</h2>
          <p className="text-slate-400 text-sm mt-1">
            Logged in Agent: <strong className="text-amber-400">{currentAgent.name}</strong> • View or enter data for today or previous days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker for Previous Days */}
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search active clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-52 bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={handlePrintOrDownload}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Sheet</span>
          </button>
        </div>
      </div>

      {/* Clients List Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Active Borrowers Collection Sheet for Date: <span className="text-amber-400">{collectionDate}</span></h3>
          <span className="text-xs text-slate-400">Mon–Fri Schedule • Arrears Tracking</span>
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
            <p className="text-base font-semibold">No active clients found matching your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredClients.map((client) => {
              const totalPaidSoFar = (client.payments || []).reduce((acc, p) => acc + (p.isNotPaid ? 0 : p.amount), 0);
              const dayPayment = (client.payments || []).find((p) => p.date === collectionDate);
              const hasPaidOnDate = dayPayment && !dayPayment.isNotPaid && dayPayment.amount > 0;
              const isMarkedNotPaidOnDate = dayPayment && dayPayment.isNotPaid;
              const percentPaid = Math.min(100, Math.round((totalPaidSoFar / client.totalPayable) * 100));
              const daysCollectedCount = (client.payments || []).filter((p) => p.amount > 0 && !p.isNotPaid).length;

              const missedCount = (client.payments || []).filter((p) => p.isNotPaid).length;

              return (
                <div key={client.id} className="p-5 hover:bg-slate-800/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Client Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <h4 className="font-bold text-white text-base">{client.name}</h4>
                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs text-slate-300 font-medium">
                        {client.businessType}
                      </span>
                      {hasPaidOnDate && (
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid on {collectionDate} (+K{dayPayment.amount})</span>
                        </span>
                      )}
                      {isMarkedNotPaidOnDate && (
                        <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Not Paid / Yesterday Balance</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.phone}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.address}</span>
                      </span>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">
                        Daily Due: K{client.dailyAmount}
                      </span>
                      {missedCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-400 font-bold">
                            ⚠️ Total Missed Days: {missedCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center space-x-4 justify-between lg:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        Paid: <strong className="text-white">K{totalPaidSoFar}</strong> / K{client.totalPayable}
                      </div>
                      <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-700">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full"
                          style={{ width: `${percentPaid}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {daysCollectedCount} of {client.totalDays} collection days ({percentPaid}%)
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenPayModal(client, false)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record for {collectionDate}</span>
                      </button>

                      <button
                        onClick={() => handleOpenPayModal(client, true)}
                        className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        Mark Not Paid
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Payment / Not Paid Modal */}
      {selectedClientForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  {isNotPaidOption ? `Mark Not Paid for ${collectionDate}` : `Record Payment for ${collectionDate}`}
                </div>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedClientForPay.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard Daily Due: <strong className="text-white">K{selectedClientForPay.dailyAmount}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForPay(null)}
                className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              <div className="flex space-x-3 mb-2">
                <button
                  type="button"
                  onClick={() => setIsNotPaidOption(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    !isNotPaidOption
                      ? 'bg-amber-500 border-amber-500 text-slate-950'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Paid / Custom Amount
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotPaidOption(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isNotPaidOption
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Not Paid (Yesterday Balance)
                </button>
              </div>

              {!isNotPaidOption ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Custom or Standard Amount (Kwacha)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-amber-400 font-bold">K</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[selectedClientForPay.dailyAmount, 20, 30, 50, 100].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setCustomAmount(amt.toString())}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-amber-400 font-semibold cursor-pointer"
                      >
                        K{amt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-300 text-xs space-y-2">
                  <p className="font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Client did not pay on {collectionDate}.</span>
                  </p>
                  <p>This will be recorded as a missed payment for {collectionDate} and logged as <strong>Yesterday balance</strong>.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Agent Stamped (Automatic)
                </label>
                <input
                  type="text"
                  value={currentAgent.name}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-amber-400 font-semibold text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Arrears settled"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPay(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-bold py-3 rounded-xl text-sm shadow-lg transition-all cursor-pointer ${
                    isNotPaidOption
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  {isNotPaidOption ? 'Confirm Not Paid' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
