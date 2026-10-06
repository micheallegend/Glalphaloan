import React, { useState } from 'react';
import { Agent } from '../types';
import { LayoutDashboard, CalendarDays, Users, PlusCircle, History, LogOut, ShieldCheck, Settings } from 'lucide-react';
import { AgentSettingsModal } from './AgentSettingsModal';

interface NavbarProps {
  currentAgent: Agent;
  activeTab: 'dashboard' | 'today' | 'clients' | 'new-loan' | 'logs';
  setActiveTab: (tab: 'dashboard' | 'today' | 'clients' | 'new-loan' | 'logs') => void;
  onLogout: () => void;
  onUpdateAgent: (agent: Agent) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentAgent, activeTab, setActiveTab, onLogout, onUpdateAgent }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-2xl">
                👑
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-black text-white tracking-tight">G.L Alpha king Loans</h1>
                  <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                    Kwacha Loans
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Daily Mon–Fri Field Collection Sheet</p>
              </div>
            </div>

            {/* Logged in Agent Info & Profile Settings */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center space-x-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-4 py-2 rounded-xl transition-all cursor-pointer group"
                title="Edit Profile, Photo & Password"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-amber-400">
                  {currentAgent.photoUrl ? (
                    <img src={currentAgent.photoUrl} alt={currentAgent.name} className="w-full h-full object-cover" />
                  ) : (
                    currentAgent.name.charAt(0)
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold group-hover:text-amber-400 transition-colors">
                    Agent Profile ⚙️
                  </div>
                  <div className="text-sm font-bold text-white flex items-center space-x-1">
                    <span>{currentAgent.name}</span>
                  </div>
                </div>
              </button>

              <button
                onClick={onLogout}
                title="Switch Agent / Logout"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Switch</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Today's Sheet</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Clients & Loans</span>
            </button>

            <button
              onClick={() => setActiveTab('new-loan')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'new-loan'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Loan Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Agent Audit Logs</span>
            </button>
          </div>
        </div>
      </header>

      {showSettingsModal && (
        <AgentSettingsModal
          currentAgent={currentAgent}
          onUpdateAgent={onUpdateAgent}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
};
