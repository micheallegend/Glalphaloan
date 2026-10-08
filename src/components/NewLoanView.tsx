import React, { useState } from 'react';
import { Agent, Client, PaymentRecord } from '../types';
import { LOAN_TIERS } from '../data/mockData';
import { PlusCircle, Banknote, User, Phone, MapPin, Briefcase, Calendar, CheckCircle2, Store, Calculator, CheckSquare } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Existing Loan ("Already in Business") state
  const [existingPrincipal, setExistingPrincipal] = useState<number>(500);
  const [existingCustomPrincipal, setExistingCustomPrincipal] = useState<string>('500');
  const [existingTierOptionIndex, setExistingTierOptionIndex] = useState<number>(0);
  const [alreadyPaidInput, setAlreadyPaidInput] = useState<string>('0');
  const [existingName, setExistingName] = useState('');
  const [existingPhone, setExistingPhone] = useState('');
  const [existingAddress, setExistingAddress] = useState('');
  const [existingBusinessType, setExistingBusinessType] = useState('');
  const [existingStartDate, setExistingStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingFinishDate, setExistingFinishDate] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  // Standard calculations
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

  // Existing mode calculations
  const currentExistingTier = LOAN_TIERS.find((t) => t.principal === existingPrincipal);
  const isExistingCustom = !currentExistingTier;

  const existingActiveOption = currentExistingTier
    ? currentExistingTier.options[existingTierOptionIndex] || currentExistingTier.options[0]
    : {
        dailyAmount: Math.round(parseFloat(existingCustomPrincipal || '500') * 0.05),
        weeks: 4,
        days: 20,
        interest: Math.round(parseFloat(existingCustomPrincipal || '500') * 0.4),
        totalPayable: Math.round(parseFloat(existingCustomPrincipal || '500') * 1.4),
      };

  const alreadyPaidAmt = Math.max(0, parseFloat(alreadyPaidInput) || 0);
  const existingTotalPayable = isExistingCustom
    ? Math.round(parseFloat(existingCustomPrincipal || '500') * 1.4)
    : existingActiveOption.totalPayable;
  const existingRemainingBalance = Math.max(0, existingTotalPayable - alreadyPaidAmt);
  const existingDaysCovered = Math.floor(alreadyPaidAmt / existingActiveOption.dailyAmount);
  const existingRemainingDays = Math.ceil(existingRemainingBalance / existingActiveOption.dailyAmount);
  const existingPaidPercent = Math.min(100, Math.round((alreadyPaidAmt / existingTotalPayable) * 100));

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
    const principalVal = isExistingCustom ? parseFloat(existingCustomPrincipal) || 500 : existingPrincipal;
    const clientId = 'client-' + Date.now();

    const initialPayments: PaymentRecord[] =
      alreadyPaidAmt > 0
        ? [
            {
              id: 'pre-pay-' + Date.now(),
              clientId: clientId,
              clientName: existingName.trim(),
              amount: alreadyPaidAmt,
              date: existingStartDate || new Date().toISOString().split('T')[0],
              agentName: currentAgent.name,
              timestamp: Date.now() - 3600000,
              notes: `Pre-existing payments made before recording into system (K${alreadyPaidAmt})`,
            },
          ]
        : [];

    const newClient: Client = {
      id: clientId,
      name: existingName.trim(),
      phone: existingPhone.trim(),
      address: existingAddress.trim(),
      businessType: existingBusinessType.trim(),
      principal: principalVal,
      dailyAmount: existingActiveOption.dailyAmount,
      totalDays: existingActiveOption.days,
      interest: isExistingCustom ? Math.round(principalVal * 0.4) : existingActiveOption.interest,
      totalPayable: existingTotalPayable,
      startDate: existingStartDate,
      finishDate: existingFinishDate,
      status: existingRemainingBalance === 0 ? 'Completed' : 'Active',
      createdByAgent: currentAgent.name,
      createdAt: Date.now(),
      payments: initialPayments,
      isExistingLoan: true,
      remainingBalance: existingRemainingBalance,
    };

    onAddClient(newClient);
    setSuccessMessage(`Successfully added ${existingName}! (Plan: K${principalVal}, Already Paid: K${alreadyPaidAmt}, Remaining: K${existingRemainingBalance})`);

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
              Disburse a brand new loan or transfer an existing business loan with payments already made.
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
                {[500, 1000, 1500].map((amt, amtIdx) => {
                  const isSelected = selectedPrincipal === amt;
                  const tier = LOAN_TIERS.find((t) => t.principal === amt);
                  return (
                    <button
                      type="button"
                      key={`tier-btn-${amt}-${amtIdx}`}
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
                        key={`tier-opt-${opt.dailyAmount}-${opt.days}-${idx}`}
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
              <p className="font-bold text-sm mb-1 flex items-center space-x-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span>Already in Business • Existing Client Onboarding</span>
              </p>
              <p>
                Select the loan package the client originally took from our available tiers, then input the total amount they have already paid prior to using this system.
              </p>
            </div>

            {/* Step 1: Select the Loan Option they took */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <CheckSquare className="w-4 h-4" />
                  <span>1. Option of Loan They Took (Original Plan)</span>
                </label>
                <span className="text-[11px] text-slate-400">Select standard rate or custom</span>
              </div>

              {/* Tiers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[500, 1000, 1500].map((amt, amtIdx) => {
                  const isSelected = existingPrincipal === amt;
                  const tier = LOAN_TIERS.find((t) => t.principal === amt);
                  return (
                    <button
                      type="button"
                      key={`exist-tier-${amt}-${amtIdx}`}
                      onClick={() => {
                        setExistingPrincipal(amt);
                        setExistingTierOptionIndex(0);
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800/60 border-slate-700 text-white hover:border-slate-600'
                      }`}
                    >
                      <div className="text-lg font-black">K{amt}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-950 font-bold' : 'text-amber-400'}`}>
                        {tier?.label}
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setExistingPrincipal(0)}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    existingPrincipal === 0
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800/60 border-slate-700 text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-lg font-black">Custom</div>
                  <div className={`text-[10px] mt-0.5 ${existingPrincipal === 0 ? 'text-slate-950 font-bold' : 'text-amber-400'}`}>
                    Custom Plan
                  </div>
                </button>
              </div>

              {existingPrincipal === 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Custom Loan Principal Amount (Kwacha)
                  </label>
                  <input
                    type="number"
                    value={existingCustomPrincipal}
                    onChange={(e) => setExistingCustomPrincipal(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              )}

              {/* Repayment options for selected plan */}
              {currentExistingTier && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Repayment Schedule They Agreed To (Mon–Fri):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentExistingTier.options.map((opt, idx) => {
                      const isOptSelected = existingTierOptionIndex === idx;
                      return (
                        <div
                          key={`exist-opt-${opt.dailyAmount}-${opt.days}-${idx}`}
                          onClick={() => setExistingTierOptionIndex(idx)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                            isOptSelected
                              ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                checked={isOptSelected}
                                onChange={() => setExistingTierOptionIndex(idx)}
                                className="text-amber-500 focus:ring-amber-500"
                              />
                              <span className="font-bold text-amber-400 text-sm">K{opt.dailyAmount} / day</span>
                            </div>
                            <div className="text-[11px] text-slate-400 pl-5">
                              {opt.weeks} Weeks ({opt.days} Days)
                            </div>
                          </div>
                          <div className="text-right text-[11px]">
                            <div className="text-slate-400">Total: <strong className="text-amber-400">K{opt.totalPayable}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Amount they have ALREADY paid */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Calculator className="w-4 h-4" />
                <span>2. Money They Have Already Paid So Far</span>
              </label>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Amount Already Collected Before Today (Kwacha)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-amber-400 font-bold text-lg">K</span>
                  <input
                    type="number"
                    value={alreadyPaidInput}
                    onChange={(e) => setAlreadyPaidInput(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white font-black text-xl focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[0, 100, 200, 300, 500, 750].map((preset) => (
                    <button
                      type="button"
                      key={`preset-${preset}`}
                      onClick={() => setAlreadyPaidInput(preset.toString())}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3 py-1 rounded-lg text-amber-400 font-semibold cursor-pointer"
                    >
                      K{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Calculation Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Live Balance Calculation:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Total Payable</div>
                    <div className="text-base font-black text-white">K{existingTotalPayable}</div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Already Paid</div>
                    <div className="text-base font-black text-emerald-400">K{alreadyPaidAmt}</div>
                  </div>
                  <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30 col-span-2 sm:col-span-2">
                    <div className="text-[10px] uppercase text-amber-300 font-bold">Remaining Balance Due</div>
                    <div className="text-xl font-black text-amber-400">K{existingRemainingBalance}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                  <span>
                    Days completed: <strong className="text-white">{existingDaysCovered} days</strong>
                  </span>
                  <span>
                    Remaining collection days: <strong className="text-amber-400">{existingRemainingDays} days</strong> (@ K{existingActiveOption.dailyAmount}/day)
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${existingPaidPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Step 3: Borrower Info */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <User className="w-4 h-4" />
                <span>3. Borrower Contact & Location</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Borrower Full Name</label>
                  <input
                    type="text"
                    value={existingName}
                    onChange={(e) => setExistingName(e.target.value)}
                    placeholder="e.g. Mary Banda"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
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
                    placeholder="e.g. Restaurant / Market Stall"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Market / Address Location</label>
                  <input
                    type="text"
                    value={existingAddress}
                    onChange={(e) => setExistingAddress(e.target.value)}
                    placeholder="e.g. Kamwala Market, Stand 14"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Original Loan Start Date</label>
                  <input
                    type="date"
                    value={existingStartDate}
                    onChange={(e) => setExistingStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Expected Finish Date (Optional)</label>
                  <input
                    type="date"
                    value={existingFinishDate}
                    onChange={(e) => setExistingFinishDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Recording Agent (Stamped)</label>
                <input
                  type="text"
                  value={currentAgent.name}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-amber-400 font-bold text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-4 px-6 rounded-xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
            >
              <Store className="w-5 h-5" />
              <span>Save Existing Client to Sheet (Remaining: K{existingRemainingBalance})</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
