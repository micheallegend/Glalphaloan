import React, { useState } from 'react';
import { AGENTS } from '../data/mockData';
import { Agent } from '../types';
import { Shield, Lock, KeyRound, UserCheck, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  onLogin: (agent: Agent) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(AGENTS[0].id);
  const [pin, setPin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const agent = AGENTS.find((a) => a.id === selectedAgentId);
    if (!agent) {
      setError('Please select a valid agent.');
      return;
    }

    if (agent.pin !== pin.trim() || agent.password !== password.trim()) {
      setError('Invalid PIN or Password. Please check credentials.');
      return;
    }

    onLogin(agent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-center border-b border-slate-800 relative">
          <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 p-2 rounded-full border border-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div className="w-16 h-16 bg-amber-500/20 rounded-2xl border border-amber-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
            <span className="text-3xl">👑</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">G.L Alpha King Loans</h2>
          <p className="text-amber-400 text-sm font-medium mt-1">Kwacha Loans • Field Collection Security Gate</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Authorized Agent
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AGENTS.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <button
                    type="button"
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setPin('');
                      setPassword('');
                      setError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <UserCheck className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">
                        {agent.role}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">{agent.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Security PIN</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Agent PIN"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-center text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Security Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Agent Password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono text-center text-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
          >
            <Shield className="w-5 h-5" />
            <span>Authenticate & Enter System</span>
          </button>
        </form>

        <div className="bg-slate-950/50 px-6 py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
          G.L Alpha King Loans • Secure Mon–Fri Field Collection Sheet
        </div>
      </div>
    </div>
  );
};
