import React, { useState, useEffect } from 'react';
import { Agent, Client } from './types';
import { INITIAL_CLIENTS } from './data/mockData';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SplashLoading } from './components/SplashLoading';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TodaysSheet } from './components/TodaysSheet';
import { AllClients } from './components/AllClients';
import { NewLoanView } from './components/NewLoanView';
import { AuditLogs } from './components/AuditLogs';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(() => {
    const saved = localStorage.getItem('gl_loans_agent');
    return saved ? JSON.parse(saved) : null;
  });
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'today' | 'clients' | 'new-loan' | 'logs'>('dashboard');

  useEffect(() => {
    if (currentAgent) {
      localStorage.setItem('gl_loans_agent', JSON.stringify(currentAgent));
    } else {
      localStorage.removeItem('gl_loans_agent');
    }
  }, [currentAgent]);

  // Sync with Firestore in real-time
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
        } else {
          // Seed initial clients if collection is empty
          INITIAL_CLIENTS.forEach(async (client) => {
            await setDoc(doc(db, 'clients', client.id), client);
          });
          setClients(INITIAL_CLIENTS);
        }
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
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
    localStorage.removeItem('gl_loans_agent');
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setCurrentAgent(updatedAgent);
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

    try {
      await setDoc(doc(db, 'clients', clientId), updatedClient);
    } catch (error) {
      console.error('Error recording payment to Firestore:', error);
    }
  };

  const handleAddClient = async (newClient: Client) => {
    try {
      await setDoc(doc(db, 'clients', newClient.id), newClient);
    } catch (error) {
      console.error('Error adding client to Firestore:', error);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      await setDoc(doc(db, 'clients', updatedClient.id), updatedClient);
    } catch (error) {
      console.error('Error updating client in Firestore:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteDoc(doc(db, 'clients', clientId));
    } catch (error) {
      console.error('Error deleting client from Firestore:', error);
    }
  };

  if (!currentAgent) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        currentAgent={currentAgent}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onUpdateAgent={handleUpdateAgent}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard clients={clients} setActiveTab={setActiveTab} />}
        {activeTab === 'today' && (
          <TodaysSheet
            clients={clients}
            currentAgent={currentAgent}
            onRecordPayment={handleRecordPayment}
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

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        G.L Alpha King Loans • Daily Mon–Fri Field Collection Sheet • Authorized Agents: Micheal Legend & Brian Nyimbili
      </footer>
    </div>
  );
}
