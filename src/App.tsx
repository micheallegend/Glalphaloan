import React, { useState, useEffect, useRef } from 'react';
import { Agent, Client, NotificationItem } from './types';
import { AGENTS, INITIAL_CLIENTS } from './data/mockData';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { SplashLoading } from './components/SplashLoading';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TodaysSheet } from './components/TodaysSheet';
import { AllClients } from './components/AllClients';
import { NewLoanView } from './components/NewLoanView';
import { AuditLogs } from './components/AuditLogs';
import { RecordKeeping } from './components/RecordKeeping';
import {
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
  sendDeviceNotification,
} from './services/deviceNotification';
import { Bell, X } from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('gl_loans_agents');
    return saved ? JSON.parse(saved) : AGENTS;
  });
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('gl_loans_clients');
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'today' | 'records' | 'clients' | 'new-loan' | 'logs'>('dashboard');

  // Device Notifications State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);
  const [toast, setToast] = useState<{ id: string; message: string; type: string } | null>(null);

  const isInitialSnapshotRef = useRef<boolean>(true);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());

  // Ask for notification permission and register Service Worker when the website is opened
  useEffect(() => {
    registerServiceWorker();

    const perm = getNotificationPermission();
    setNotificationPermission(perm);

    // Ask for permission immediately when website is opened
    if (perm === 'default') {
      requestNotificationPermission().then((result) => {
        setNotificationPermission(result);
        if (result === 'default') {
          // If browser prevented auto-popup without user click, show banner
          setShowPermissionBanner(true);
        }
      });
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      setShowPermissionBanner(false);
      sendDeviceNotification(
        'G.L Alpha King Loans',
        'Device notifications enabled! Alerts will appear whenever payments are recorded.'
      );
    }
  };

  const triggerToast = (id: string, message: string, type: string) => {
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 6500);
  };

  // Sync agents with Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'agents'),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreAgents: Agent[] = [];
          snapshot.forEach((docSnap) => {
            firestoreAgents.push(docSnap.data() as Agent);
          });
          setAgents(firestoreAgents);
          localStorage.setItem('gl_loans_agents', JSON.stringify(firestoreAgents));
        } else {
          // Initialize agents in Firestore if empty
          AGENTS.forEach(async (agent) => {
            await setDoc(doc(db, 'agents', agent.id), agent);
          });
        }
      },
      (error) => {
        console.warn('Firestore agents sync notice (using local storage):', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync clients with Firestore in real-time and persist
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'clients'),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreClients: Client[] = [];
          snapshot.forEach((docSnap) => {
            firestoreClients.push(docSnap.data() as Client);
          });
          setClients(firestoreClients);
          localStorage.setItem('gl_loans_clients', JSON.stringify(firestoreClients));
        } else {
          // If Firestore is empty but we have local clients, sync local to Firestore
          const saved = localStorage.getItem('gl_loans_clients');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.length > 0) {
                parsed.forEach(async (client: Client) => {
                  try {
                    await setDoc(doc(db, 'clients', client.id), client);
                  } catch {
                    // silently handled
                  }
                });
                return;
              }
            } catch (e) {
              console.warn('Local clients parse note:', e);
            }
          }
          setClients(INITIAL_CLIENTS);
          localStorage.setItem('gl_loans_clients', JSON.stringify(INITIAL_CLIENTS));
        }
      },
      (error) => {
        console.warn('Firestore clients sync notice (using local storage):', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync notifications from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreNotifications: NotificationItem[] = [];
        snapshot.forEach((docSnap) => {
          firestoreNotifications.push(docSnap.data() as NotificationItem);
        });
        setNotifications(firestoreNotifications);

        // On first snapshot, register historic notifications so we don't spam past alerts
        if (isInitialSnapshotRef.current) {
          firestoreNotifications.forEach((n) => seenNotifIdsRef.current.add(n.id));
          isInitialSnapshotRef.current = false;
          return;
        }

        // On new doc changes added in real-time across all agents' devices
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newNotif = change.doc.data() as NotificationItem;
            if (!seenNotifIdsRef.current.has(newNotif.id)) {
              seenNotifIdsRef.current.add(newNotif.id);
              // Send native device push notification + audio chime
              sendDeviceNotification('G.L Alpha King Loans', newNotif.message, newNotif.id);
              // Trigger in-app live toast
              triggerToast(newNotif.id, newNotif.message, newNotif.type);
            }
          }
        });
      },
      (error) => {
        console.warn('Firestore notifications sync notice (operating offline):', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  if (showSplash) {
    return <SplashLoading onFinish={() => setShowSplash(false)} />;
  }

  const handleLogin = (agent: Agent) => {
    setCurrentAgent(agent);
  };

  const handleLogout = () => {
    setCurrentAgent(null);
  };

  const handleUpdateAgent = async (updatedAgent: Agent) => {
    setCurrentAgent(updatedAgent);
    const updatedAgentsList = agents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a));
    setAgents(updatedAgentsList);
    localStorage.setItem('gl_loans_agents', JSON.stringify(updatedAgentsList));

    try {
      await setDoc(doc(db, 'agents', updatedAgent.id), updatedAgent);
      await createNotification(`Agent ${updatedAgent.name} updated their security credentials & profile photo`, 'edit');
    } catch (e) {
      console.warn('Note: agent updated locally, cloud sync pending:', e);
    }
  };

  const createNotification = async (message: string, type: 'payment' | 'not_paid' | 'disbursal' | 'edit') => {
    if (!currentAgent) return;
    const notifId = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newNotif: NotificationItem = {
      id: notifId,
      message,
      agentName: currentAgent.name,
      timestamp: Date.now(),
      type,
      readBy: [currentAgent.name],
    };
    try {
      await setDoc(doc(db, 'notifications', notifId), newNotif);
    } catch (e) {
      console.warn('Note: notification saved in memory, cloud sync pending:', e);
    }
  };

  const handleRecordPayment = async (clientId: string, amount: number, notes?: string, isNotPaid?: boolean, collectionDate?: string) => {
    if (!currentAgent) return;
    const targetDate = collectionDate || new Date().toISOString().split('T')[0];

    const targetClient = clients.find((c) => c.id === clientId);
    if (!targetClient) return;

    const filteredPayments = (targetClient.payments || []).filter((p) => p.date !== targetDate);
    const newPayment = {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      clientId,
      clientName: targetClient.name,
      amount,
      date: targetDate,
      agentName: currentAgent.name,
      timestamp: Date.now(),
      notes,
      isNotPaid,
    };

    const updatedPayments = [...filteredPayments, newPayment];
    const totalPaid = updatedPayments.reduce((acc, p) => acc + (p.isNotPaid ? 0 : p.amount), 0);
    const newStatus = totalPaid >= targetClient.totalPayable ? 'Completed' : targetClient.status;

    const updatedClient: Client = {
      ...targetClient,
      payments: updatedPayments,
      status: newStatus,
      updatedByAgent: currentAgent.name,
      updatedAt: Date.now(),
    };

    setClients((prev) => {
      const next = prev.map((c) => (c.id === clientId ? updatedClient : c));
      localStorage.setItem('gl_loans_clients', JSON.stringify(next));
      return next;
    });

    try {
      await setDoc(doc(db, 'clients', clientId), updatedClient);

      // Create live notifications
      if (isNotPaid) {
        await createNotification(`${targetClient.name} not paid, Received by Agent ${currentAgent.name}`, 'not_paid');
      } else if (amount < targetClient.dailyAmount) {
        const bal = Math.max(0, targetClient.dailyAmount - amount);
        await createNotification(`${targetClient.name} paid K${amount} then Balance K${bal}, Received by Agent ${currentAgent.name}`, 'payment');
      } else {
        await createNotification(`${targetClient.name} paid K${amount}, Received by Agent ${currentAgent.name}`, 'payment');
      }
    } catch (error) {
      console.warn('Note: payment saved in local storage, cloud sync pending:', error);
    }
  };

  const handleAddClient = async (newClient: Client) => {
    if (!currentAgent) return;

    setClients((prev) => {
      const next = [newClient, ...prev.filter((c) => c.id !== newClient.id)];
      localStorage.setItem('gl_loans_clients', JSON.stringify(next));
      return next;
    });

    try {
      await setDoc(doc(db, 'clients', newClient.id), newClient);
      const label = newClient.isExistingLoan ? 'existing business loan' : `K${newClient.principal} loan`;
      await createNotification(`Agent ${currentAgent.name} disbursed ${label} to ${newClient.name}`, 'disbursal');
    } catch (error) {
      console.warn('Note: client added in local storage, cloud sync pending:', error);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    if (!currentAgent) return;

    setClients((prev) => {
      const next = prev.map((c) => (c.id === updatedClient.id ? updatedClient : c));
      localStorage.setItem('gl_loans_clients', JSON.stringify(next));
      return next;
    });

    try {
      await setDoc(doc(db, 'clients', updatedClient.id), updatedClient);
      await createNotification(`Agent ${currentAgent.name} updated borrower details for ${updatedClient.name}`, 'edit');
    } catch (error) {
      console.warn('Note: client updated in local storage, cloud sync pending:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const clientToDelete = clients.find((c) => c.id === clientId);
    const clientName = clientToDelete ? clientToDelete.name : 'client';

    setClients((prev) => {
      const next = prev.filter((c) => c.id !== clientId);
      localStorage.setItem('gl_loans_clients', JSON.stringify(next));
      return next;
    });

    try {
      await deleteDoc(doc(db, 'clients', clientId));
      if (currentAgent) {
        await createNotification(`Agent ${currentAgent.name} deleted client "${clientName}" from the system`, 'edit');
      }
    } catch (error) {
      console.warn('Note: client deleted from local storage, cloud sync pending:', error);
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    if (!currentAgent) return;
    try {
      for (const notif of notifications) {
        if (!notif.readBy.includes(currentAgent.name)) {
          const updatedNotif = {
            ...notif,
            readBy: [...notif.readBy, currentAgent.name],
          };
          await setDoc(doc(db, 'notifications', notif.id), updatedNotif);
        }
      }
    } catch (e) {
      console.warn('Note: notifications read status marked locally, cloud sync pending:', e);
    }
  };

  if (!currentAgent) {
    return <LoginModal agents={agents} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        currentAgent={currentAgent}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onUpdateAgent={handleUpdateAgent}
        notifications={notifications}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        notificationPermission={notificationPermission}
        onRequestPermission={handleRequestNotificationPermission}
      />

      {/* Device Notification Permission Request Banner */}
      {showPermissionBanner && notificationPermission !== 'granted' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 sm:px-8 py-3 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </span>
            <div>
              <span className="font-bold text-white">Enable Device Notifications:</span> Receive instant push alerts directly on this phone or computer whenever any agent records payments or changes.
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRequestNotificationPermission}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Allow on this Device
            </button>
            <button
              onClick={() => setShowPermissionBanner(false)}
              className="text-slate-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Real-time Toast Alert for Live Collections */}
      {toast && (
        <aside
          aria-live="polite"
          className="fixed top-24 right-4 z-50 max-w-sm sm:max-w-md w-full bg-slate-900/95 border-2 border-amber-500/70 rounded-2xl shadow-2xl shadow-amber-500/20 p-4 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Live Device Alert
                  </span>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>
                <p className="text-sm font-bold text-white leading-snug">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
        {activeTab === 'dashboard' && <Dashboard clients={clients} setActiveTab={setActiveTab} />}
        {activeTab === 'today' && (
          <TodaysSheet
            clients={clients}
            currentAgent={currentAgent}
            onRecordPayment={handleRecordPayment}
            onDeleteClient={handleDeleteClient}
          />
        )}
        {activeTab === 'records' && (
          <RecordKeeping
            clients={clients}
            currentAgent={currentAgent}
          />
        )}
        {activeTab === 'clients' && (
          <AllClients
            clients={clients}
            currentAgent={currentAgent}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
          />
        )}
        {activeTab === 'new-loan' && (
          <NewLoanView
            currentAgent={currentAgent}
            onAddClient={handleAddClient}
            onSuccessRedirect={() => setActiveTab('today')}
          />
        )}
        {activeTab === 'logs' && <AuditLogs clients={clients} />}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 mb-14 lg:mb-0 text-center text-xs text-slate-500">
        G.L Alpha King Loans • Daily Mon–Fri Field Collection Sheet • Authorized Agents: Micheal Legend & Brian Nyimbili
      </footer>
    </div>
  );
}
