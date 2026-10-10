import React, { useState, useEffect } from 'react';
import { Agent, NotificationItem } from '../types';
import { isWeekend, WEEKEND_NOTE } from '../utils/dateUtils';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  PlusCircle,
  History,
  LogOut,
  ShieldCheck,
  Settings,
  Bell,
  CheckCheck,
  X,
  FileSpreadsheet,
  Menu,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readBy.includes(currentAgent.name)).length;

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const isTodayWeekend = isWeekend(new Date());

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Overview, analytics & collections summary',
    },
    {
      id: 'today' as const,
      label: "Today's Sheet",
      icon: CalendarDays,
      badge: isTodayWeekend ? 'Weekend' : 'Live',
      badgeColor: isTodayWeekend
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: isTodayWeekend
        ? `${WEEKEND_NOTE} • No field collection on Sat & Sun`
        : 'Mon–Fri daily field collection register',
    },
    {
      id: 'records' as const,
      label: 'Record Keeping',
      icon: FileSpreadsheet,
      badge: 'New',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      description: 'Historical daily audits & PDF/Image export',
    },
    {
      id: 'clients' as const,
      label: 'All Clients & Loans',
      icon: Users,
      badge: null,
      description: 'Full portfolio, business profiles & balance checks',
    },
    {
      id: 'new-loan' as const,
      label: 'New Loan Calculator',
      icon: PlusCircle,
      badge: '+Add',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: 'Register borrower & customize daily terms',
    },
    {
      id: 'logs' as const,
      label: 'Agent Audit Logs',
      icon: History,
      badge: null,
      description: 'Time-stamped payment history & agent tracking',
    },
  ];

  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Mobile Hamburger & Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile Menu Hamburger Button */}
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-label="Open mobile side menu"
                title="Navigation Menu"
              >
                <Menu className="w-5 h-5 text-amber-400" />
              </button>

              {/* Logo & Title */}
              <button
                onClick={() => handleSelectTab('dashboard')}
                className="flex items-center space-x-2.5 sm:space-x-3 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl sm:text-2xl group-hover:scale-105 transition-transform">
                  👑
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h1 className="text-base sm:text-xl font-black text-white tracking-tight leading-tight">
                      G.L Alpha king
                    </h1>
                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                      Loans
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden xs:block">
                    Daily Mon–Fri Field Collection Sheet
                  </p>
                </div>
              </button>
            </div>

            {/* Right: Notifications & Logged in Agent Info */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Notification Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer relative"
                  title="Notifications Feed"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-3 w-72 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                      <span className="font-bold text-white text-xs sm:text-sm">Notifications Stream 🔔</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            onMarkNotificationsAsRead();
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>

                    {/* Device Notification Status & Prompt */}
                    <div className="px-3 sm:px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Device Alerts:</span>
                      {notificationPermission === 'granted' ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Active on device</span>
                        </span>
                      ) : (
                        <button
                          onClick={onRequestPermission}
                          className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[11px]"
                        >
                          🔔 Turn on alerts
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-800/80 max-h-80 sm:max-h-96 overflow-y-auto">
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
                              className={`p-3.5 sm:p-4 transition-all text-xs ${
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
                className="flex items-center space-x-2 sm:space-x-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer group"
                title="Edit Profile, Photo & Password"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-amber-400 text-sm">
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

              {/* Switch Agent Button */}
              <button
                onClick={onLogout}
                title="Switch Agent / Logout"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Switch</span>
              </button>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Tabs Bar */}
          <nav className="hidden lg:flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none" aria-label="Desktop Primary Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider border ${
                        isActive ? 'bg-slate-950/20 text-slate-950 border-slate-950/30' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MOBILE SIDE NAVIGATION DRAWER (Off-canvas sidebar) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <aside
            className="fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200"
            aria-label="Mobile Side Navigation"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
                  👑
                </div>
                <div>
                  <h2 className="text-base font-black text-white leading-tight">G.L Alpha King</h2>
                  <p className="text-[11px] text-amber-400 font-semibold">Mobile Field Navigation</p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close side menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Agent Profile Card inside Drawer */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center overflow-hidden font-bold text-amber-400 text-base">
                    {currentAgent.photoUrl ? (
                      <img src={currentAgent.photoUrl} alt={currentAgent.name} className="w-full h-full object-cover" />
                    ) : (
                      currentAgent.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Logged Agent
                    </span>
                    <h3 className="text-sm font-bold text-white">{currentAgent.name}</h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setShowSettingsModal(true);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                  title="Edit agent profile"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Navigation Links in Drawer */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Sections
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/15'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold flex items-center space-x-2">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border ${
                                isActive ? 'bg-slate-950/25 text-slate-950 border-slate-950/30' : item.badgeColor
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isActive ? 'text-slate-900 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 ml-2 ${
                        isActive ? 'text-slate-950 font-bold' : 'text-slate-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Quick Actions at Bottom of Drawer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-2">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span>Switch Agent Account</span>
              </button>

              <div className="text-center text-[10px] text-slate-400 pt-1">
                Field Collection System • Mon–Fri
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR FOR ONE-HAND FIELD USE */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl safe-area-pb"
        aria-label="Mobile Bottom Quick Navigation"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-1" />
            <span className="text-[10px] leading-none">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'today'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-4 h-4 mb-1" />
            <span className="text-[10px] leading-none">Today</span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute top-1 right-3"></span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-1" />
            <span className="text-[10px] leading-none">Records</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 mb-1" />
            <span className="text-[10px] leading-none">Clients</span>
          </button>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              mobileDrawerOpen
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu className="w-4 h-4 mb-1 text-amber-400" />
            <span className="text-[10px] leading-none">More</span>
          </button>
        </div>
      </nav>

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

