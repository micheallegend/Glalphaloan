import React, { useState } from 'react';
import { Agent, Client, LoanTier } from '../types';
import { LOAN_TIERS } from '../data/mockData';
import { PlusCircle, Banknote, User, Phone, MapPin, Briefcase, Calendar, CheckCircle2, Store } from 'lucide-react';

interface NewLoanViewProps {
  currentAgent: Agent;
  onAddClient: (client: Client) => void;
  onSuccessRedirect: () => void;
}

export const NewLoanView: React.FC<NewLoanViewProps> = ({ currentAgent, onAddClient, onSuccessRedirect }) => {
  const [loanMode, setLoanMode] = useState<'standard' | 'existing'>('standard');

  // Standard Mode state
  const [selectedPrincipal, setSelectedPrincipal] = useState<number>(500);
  const [customPrincipalInput, setCustomPrincipalInput] = useState<string>('500');
  const [selectedTierOptionIndex, setSelectedTierOptionIndex] = useState<number>(0);

  // Existing Loan ("Already in Business") state
  const [existingName, setExistingName] = useState('');
  const [existingPhone, setExistingPhone] = useState('');
  const [existingAddress, setExistingAddress] = useState('');
  const [existingBusinessType, setExistingBusinessType] = useState('');
  const [existingRemainingBalance, setExistingRemainingBalance] = useState<string>('500');
  const [existingDailyAmount, setExistingDailyAmount] = useState<string>('30');
  const [existingFinishDate, setExistingFinishDate] = useState('');

  // Standard Client form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMessage, setSuccessMessage] = useState('');

  const currentTier = LOAN_TIERS.find((t) => t.principal === selectedPrincipal);
  const isCustom = !currentTier;

  const activeOption = currentTier
    ? currentTier.options[selectedTierOptionIndex] || currentTier.options[0]
    : {
        dailyAmount: Math.round(parseFloat(customPrincipalInput || '500') * 0.05),
        weeks: 4,
        days: 20,
        interest: Math.round(parseFloat(customPrincipalInput || '500') * 0.4),
        totalPayable: parseFloat(customPrincipalInput || '500') * 1.4,
      };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principalVal = isCustom ? parseFloat(customPrincipalInput) || 500 : selectedPrincipal;

    const newClient: Client = {
      id: 'client-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      businessType: businessType.trim(),
      principal: principalVal,
      dailyAmount: activeOption.dailyAmount,
      totalDays: activeOption.days,
      interest: activeOption.interest,
      totalPayable: activeOption.totalPayable,
      startDate: startDate,
      status: 'Active',
      createdByAgent: currentAgent.name,
      createdAt: Date.now(),
      payments: [],
      isExistingLoan: false,
    };

    onAddClient(newClient);
    setSuccessMessage(`Successfully disbursed K${principalVal} loan to ${name}! Stamped by Agent ${currentAgent.name}.`);

    setTimeout(() => {
      onSuccessRedirect();
    }, 1500);
  };

  const handleExistingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const remBal = parseFloat(existingRemainingBalance) || 500;
    const dailyAmt = parseFloat(existingDailyAmount) || 30;
    const calcDays = Math.ceil(remBal / dailyAmt);

    const newClient: Client = {
      id: 'client-' + Date.now(),
      name: existingName.trim(),
      phone: existingPhone.trim(),
      address: existingAddress.trim(),
      businessType: existingBusinessType.trim(),
      principal: remBal,
      dailyAmount: dailyAmt,
      totalDays: calcDays,
      interest: 0,
      totalPayable: remBal,
      startDate: new Date().toISOString().split('T')[0],
      finishDate: existingFinishDate,
      status: 'Active',
      createdByAgent: currentAgent.name,
      createdAt: Date.now(),
      payments: [],
      isExistingLoan: true,
      remainingBalance: remBal,
    };

    onAddClient(newClient);
    setSuccessMessage(`Successfully added existing business loan for ${existingName} (Finish Date: ${existingFinishDate})! Stamped by Agent ${currentAgent.name}.`);

    setTimeout(() => {
      onSuccessRedirect();
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 font-bold">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Add New Client / Loan</h2>
            <p className="text-slate-400 text-sm">
              Choose between a brand new loan disbursal or adding an existing business loan.
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setLoanMode('standard')}
            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              loanMode === 'standard'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>New Loan Disbursal</span>
          </button>
          <button
            type="button"
            onClick={() => setLoanMode('existing')}
            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              loanMode === 'existing'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Already in Business (Existing)</span>
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <span className="font-semibold text-sm">{successMessage}</span>
          </div>
        )}

        {loanMode === 'standard' ? (
          <form onSubmit={handleStandardSubmit} className="space-y-6">
            {/* Loan Tier Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Select Loan Starting Point / Tier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[500, 1000, 1500].map((amt) => {
                  const isSelected = selectedPrincipal === amt;
                  const tier = LOAN_TIERS.find((t) => t.principal === amt);
                  return (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        setSelectedPrincipal(amt);
                        setSelectedTierOptionIndex(0);
                      }}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800/60 border-slate-700 text-white hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xl font-black">K{amt}</div>
                      <div className={`text-[10px] mt-1 ${isSelected ? 'text-slate-900 font-bold' : 'text-amber-400'}`}>
                        {tier?.label}
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSelectedPrincipal(0)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedPrincipal === 0
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800/60 border-slate-700 text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-xl font-black">Custom</div>
                  <div className={`text-[10px] mt-1 ${selectedPrincipal === 0 ? 'text-slate-900 font-bold' : 'text-amber-400'}`}>
                    Custom Amount
                  </div>
                </button>
              </div>
            </div>

            {selectedPrincipal === 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Custom Principal Amount (Kwacha)
                </label>
                <input
                  type="number"
                  value={customPrincipalInput}
                  onChange={(e) => setCustomPrincipalInput(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            )}

            {/* Repayment Options (Mon-Fri) */}
            {currentTier && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Repayment Option (Mon–Fri) for K{selectedPrincipal} Loan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentTier.options.map((opt, idx) => {
                    const isOptSelected = selectedTierOptionIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedTierOptionIndex(idx)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                          isOptSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={isOptSelected}
                              onChange={() => setSelectedTierOptionIndex(idx)}
                              className="text-amber-500 focus:ring-amber-500"
                            />
                            <span className="font-bold text-amber-400 text-base">K{opt.dailyAmount} / day</span>
                          </div>
                          <div className="text-xs text-slate-400 pl-5">
                            {opt.weeks} Weeks ({opt.days} Collection Days)
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-slate-400">Interest: <span className="text-white font-semibold">K{opt.interest}</span></div>
                          <div className="text-amber-400 font-bold mt-0.5">Total: K{opt.totalPayable}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Client Details */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-amber-400" />
                <span>Borrower Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Mwansa"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+260 970 000000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Business Type</label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g. Market Stall / Grocery"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Market / Address Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Soweto Market, Stand 12"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Disbursing Agent (Stamped)</label>
                  <input
                    type="text"
                    value={currentAgent.name}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-amber-400 font-bold text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-4 px-6 rounded-xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
            >
              <Banknote className="w-5 h-5" />
              <span>Disburse Loan & Save to Collection Sheet</span>
            </button>
          </form>
        ) : (
          /* Existing Loan / Already in Business Mode */
          <form onSubmit={handleExistingSubmit} className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-300 text-xs">
              <p className="font-bold mb-1">🌟 Already in Business / Existing Loan Transfer</p>
              <p>Enter client details, their remaining balance, daily repayment amount, and the expected finish date.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Borrower Full Name</label>
                  <input
                    type="text"
                    value={existingName}
                    onChange={(e) => setExistingName(e.target.value)}
                    placeholder="e.g. Mary Banda"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={existingPhone}
                    onChange={(e) => setExistingPhone(e.target.value)}
                    placeholder="+260 970 000000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Business Type</label>
                  <input
                    type="text"
                    value={existingBusinessType}
                    onChange={(e) => setExistingBusinessType(e.target.value)}
                    placeholder="e.g. Restaurant / Boutique"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Market / Address Location</label>
                  <input
                    type="text"
                    value={existingAddress}
                    onChange={(e) => setExistingAddress(e.target.value)}
                    placeholder="e.g. Kamwala Market"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Remaining Balance (K)</label>
                  <input
                    type="number"
                    value={existingRemainingBalance}
                    onChange={(e) => setExistingRemainingBalance(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Daily Installment (K)</label>
                  <input
                    type="number"
                    value={existingDailyAmount}
                    onChange={(e) => setExistingDailyAmount(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Finish Date</label>
                  <input
                    type="date"
                    value={existingFinishDate}
                    onChange={(e) => setExistingFinishDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Recording Agent (Stamped)</label>
                <input
                  type="text"
                  value={currentAgent.name}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-amber-400 font-bold text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-4 px-6 rounded-xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
            >
              <Store className="w-5 h-5" />
              <span>Save Existing Business Loan to Sheet</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
