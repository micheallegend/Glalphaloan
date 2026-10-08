import React, { useState } from 'react';
import { Agent, NotificationItem } from '../types';
import { LayoutDashboard, CalendarDays, Users, PlusCircle, History, LogOut, ShieldCheck, Settings, Bell, CheckCheck, X, FileSpreadsheet } from 'lucide-react';
import { AgentSettingsModal } from './AgentSettingsModal';

interface NavbarProps {
  currentAgent: Agent;
  activeTab: 'dashboard' | 'today' | 'records' | 'clients' | 'new-loan' | 'logs';
  setActiveTab: (tab: 'dashboard' | 'today' | 'records' | 'clients' | 'new-loan' | 'logs') => void;
  onLogout: () => void;
  onUpdateAgent: (agent: Agent) => void;
  notifications: NotificationItem[];
  onMarkNotificationsAsRead: () => void;
  notificationPermission?: NotificationPermission | 'unsupported';
  onRequestPermission?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAgent,
  activeTab,
  setActiveTab,
  onLogout,
  onUpdateAgent,
  notifications = [],
  onMarkNotificationsAsRead,
  notificationPermission = 'default',
  onRequestPermission,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readBy.includes(currentAgent.name)).length;

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

            {/* Notifications & Logged in Agent Info */}
            <div className="flex items-center space-x-3">
              {/* Notification Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer relative"
                  title="Notifications Feed"
                >
                  <Bell className="w-5 h-5 text-amber-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                      <span className="font-bold text-white text-sm">Notifications Stream 🔔</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            onMarkNotificationsAsRead();
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Device Notification Status & Prompt */}
                    <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Device Push Alerts:</span>
                      {notificationPermission === 'granted' ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Active on this device</span>
                        </span>
                      ) : (
                        <button
                          onClick={onRequestPermission}
                          className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer flex items-center space-x-1"
                        >
                          <span>🔔 Turn on alerts</span>
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                          No notifications recorded yet.
                        </div>
                      ) : (
                        notifications.map((notif, index) => {
                          const isUnread = !notif.readBy.includes(currentAgent.name);
                          return (
                            <div
                              key={`${notif.id}-${index}`}
                              className={`p-4 transition-all text-xs ${
                                isUnread ? 'bg-amber-500/5 font-semibold text-slate-100' : 'text-slate-400'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="text-slate-200">{notif.message}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {new Date(notif.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                {isUnread && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1"></div>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Settings Button */}
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
              onClick={() => setActiveTab('records')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Record Keeping 📊</span>
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
