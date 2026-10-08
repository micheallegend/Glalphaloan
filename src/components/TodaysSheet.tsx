import React, { useState } from 'react';
import { Client, Agent } from '../types';
import {
  CalendarDays,
  CheckCircle2,
  Search,
  Plus,
  Phone,
  MapPin,
  X,
  AlertTriangle,
  Download,
  Calendar,
  Trash2,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface TodaysSheetProps {
  clients: Client[];
  currentAgent: Agent;
  onRecordPayment: (clientId: string, amount: number, notes?: string, isNotPaid?: boolean, collectionDate?: string) => void;
  onDeleteClient?: (clientId: string) => void;
}

export const TodaysSheet: React.FC<TodaysSheetProps> = ({
  clients,
  currentAgent,
  onRecordPayment,
  onDeleteClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionDate, setCollectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClientForPay, setSelectedClientForPay] = useState<Client | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isNotPaidOption, setIsNotPaidOption] = useState<boolean>(false);

  // Secure deletion modal state
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

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

  const handleDeleteConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletingClient || !onDeleteClient) return;

    // Validate current agent PIN and Password
    if (deletePin.trim() !== currentAgent.pin.trim() || deletePassword.trim() !== currentAgent.password.trim()) {
      setDeleteError(`Incorrect PIN or Password for Agent ${currentAgent.name}. Deletion failed.`);
      return;
    }

    if (deleteConfirmText.trim().toLowerCase() !== 'yes') {
      setDeleteError('Please type "yes" in the box to confirm deletion.');
      return;
    }

    onDeleteClient(deletingClient.id);
    setDeletingClient(null);
    setDeletePin('');
    setDeletePassword('');
    setDeleteConfirmText('');
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
            {filteredClients.map((client, idx) => {
              const totalPaidSoFar = (client.payments || []).reduce((acc, p) => acc + (p.isNotPaid ? 0 : p.amount), 0);
              const dayPayment = (client.payments || []).find((p) => p.date === collectionDate);
              const hasPaidOnDate = dayPayment && !dayPayment.isNotPaid && dayPayment.amount > 0;
              const isMarkedNotPaidOnDate = dayPayment && dayPayment.isNotPaid;
              const percentPaid = Math.min(100, Math.round((totalPaidSoFar / client.totalPayable) * 100));
              const daysCollectedCount = (client.payments || []).filter((p) => p.amount > 0 && !p.isNotPaid).length;

              const missedCount = (client.payments || []).filter((p) => p.isNotPaid).length;

              return (
                <div key={`sheet-row-${client.id}-${idx}`} className="p-5 hover:bg-slate-800/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Client Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <h4 className="font-bold text-white text-base">{client.name}</h4>
                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs text-slate-300 font-medium">
                        {client.businessType}
                      </span>
                      {hasPaidOnDate && (
                        (() => {
                          const paidAmt = dayPayment.amount;
                          const requiredAmt = client.dailyAmount;
                          const isUnderpaid = paidAmt < requiredAmt;
                          const balanceRemaining = Math.max(0, requiredAmt - paidAmt);

                          if (isUnderpaid) {
                            return (
                              <span className="bg-amber-500/15 border border-amber-500/40 text-amber-500 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1.5 shadow-sm shadow-amber-500/10">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>paid K{paidAmt} then Balance K{balanceRemaining}</span>
                              </span>
                            );
                          }

                          return (
                            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid on {collectionDate} (+K{paidAmt})</span>
                            </span>
                          );
                        })()
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
                  <div className="flex items-center space-x-3 justify-between lg:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        Paid: <strong className="text-white">K{totalPaidSoFar}</strong> / K{client.totalPayable}
                      </div>
                      <div className="w-28 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-700">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full"
                          style={{ width: `${percentPaid}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {daysCollectedCount} of {client.totalDays} days ({percentPaid}%)
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenPayModal(client, false)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record</span>
                      </button>

                      <button
                        onClick={() => handleOpenPayModal(client, true)}
                        className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Not Paid
                      </button>

                      {onDeleteClient && (
                        <button
                          onClick={() => {
                            setDeletingClient(client);
                            setDeletePin('');
                            setDeletePassword('');
                            setDeleteConfirmText('');
                            setDeleteError('');
                          }}
                          className="bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 p-2.5 rounded-xl transition-all cursor-pointer"
                          title={`Delete ${client.name} (Requires PIN & Password)`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                  Not Paid (Arrears)
                </button>
              </div>

              {!isNotPaidOption ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Payment Amount for {collectionDate} (Kwacha)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-amber-400 font-bold">K</span>
                    <input
                      type="number"
                      step="any"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-bold text-lg focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {[selectedClientForPay.dailyAmount, selectedClientForPay.dailyAmount * 2, selectedClientForPay.dailyAmount * 3, 50, 100].map((amt, aIdx) => (
                      <button
                        type="button"
                        key={`quick-amt-${amt}-${aIdx}`}
                        onClick={() => setCustomAmount(amt.toString())}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-2.5 py-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                      >
                        K{amt}
                      </button>
                    ))}
                  </div>

                  {/* Real-time partial daily payment preview indicator */}
                  {(() => {
                    const entered = parseFloat(customAmount);
                    if (!isNaN(entered) && entered > 0) {
                      const req = selectedClientForPay.dailyAmount;
                      if (entered < req) {
                        const bal = Math.max(0, req - entered);
                        return (
                          <div className="mt-3 bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 text-amber-500 text-xs font-semibold flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                              <span>Partial Payment: <strong>paid K{entered}</strong> then <strong>Balance K{bal}</strong></span>
                            </div>
                            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              Under Daily Due
                            </span>
                          </div>
                        );
                      } else if (entered === req) {
                        return (
                          <div className="mt-2 text-xs text-emerald-400 font-medium">
                            ✓ Exact daily payment amount covered (K{req}).
                          </div>
                        );
                      } else {
                        return (
                          <div className="mt-2 text-xs text-emerald-400 font-medium">
                            ✓ Overpayment / Advance payment (+K{entered - req} extra).
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Yesterday Balance / Not Paid Record</span>
                  </div>
                  <p>
                    Recording client as <strong>NOT PAID</strong> for {collectionDate}. This will register a missed day installment and maintain their pending balance.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Collection Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Promoted to pay double tomorrow"
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

      {/* Security Deletion Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 p-6 border-b border-red-500/20 text-center relative">
              <div className="w-14 h-14 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-400 shadow-lg shadow-red-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">Confirm Client Deletion</h3>
              <p className="text-xs text-red-400 font-medium mt-1">Security PIN & Password Required</p>
            </div>

            {/* Prompt Form */}
            <form onSubmit={handleDeleteConfirm} className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                <p className="text-sm font-bold text-white">
                  Are you sure you want to delete <span className="text-amber-400 font-black">"{deletingClient.name}"</span>?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  This action is permanent and will remove all loan balances, daily payment history, and business records for this client.
                </p>
              </div>

              {deleteError && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Agent Security PIN ({currentAgent.name})</span>
                </label>
                <input
                  type="password"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="Enter your Agent PIN"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono tracking-widest text-center text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Agent Password</span>
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your Agent Password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-center text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Type <strong className="text-amber-400">"yes"</strong> to confirm:</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="yes"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-center text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingClient(null);
                    setDeletePin('');
                    setDeletePassword('');
                    setDeleteConfirmText('');
                    setDeleteError('');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
