import React, { useState } from 'react';
import { Client, Agent } from '../types';
import { Users, Search, Filter, Phone, MapPin, Calendar, Edit3, Trash2, CheckCircle, ShieldCheck, Banknote, X } from 'lucide-react';

interface AllClientsProps {
  clients: Client[];
  currentAgent: Agent;
  onUpdateClient: (updatedClient: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

export const AllClients: React.FC<AllClientsProps> = ({ clients, currentAgent, onUpdateClient, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed' | 'Defaulted'>('All');
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const updated: Client = {
      ...editingClient,
      updatedByAgent: currentAgent.name,
      updatedAt: Date.now(),
    };

    onUpdateClient(updated);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Loan Portfolio & Borrower Records</span>
          </div>
          <h2 className="text-2xl font-black text-white">All Clients ({clients.length})</h2>
          <p className="text-slate-400 text-sm mt-1">
            Browse, inspect payment histories, and edit records with full agent accountability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active Loans</option>
            <option value="Completed">Completed</option>
            <option value="Defaulted">Defaulted</option>
          </select>
        </div>
      </div>

      {/* Clients Table / Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
            <p className="text-base font-semibold">No clients found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4">Borrower Name</th>
                  <th className="p-4">Business & Location</th>
                  <th className="p-4">Loan Details</th>
                  <th className="p-4">Progress / Repaid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Agent Stamp</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredClients.map((client, index) => {
                  const totalPaid = (client.payments || []).reduce((acc, p) => acc + (p.isNotPaid ? 0 : p.amount), 0);
                  const percent = Math.min(100, Math.round((totalPaid / client.totalPayable) * 100));

                  return (
                    <tr key={`client-${client.id}-${index}`} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-4">
                        <div className="font-bold text-white">{client.name}</div>
                        <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{client.phone}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-slate-300">{client.businessType}</div>
                        <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{client.address}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-amber-400">K{client.principal} Loan</div>
                        <div className="text-xs text-slate-400">
                          Daily: K{client.dailyAmount} • Total: K{client.totalPayable}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs font-semibold text-white">
                          K{totalPaid} <span className="text-slate-500 font-normal">/ K{client.totalPayable}</span>
                        </div>
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden mt-1 border border-slate-700">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            client.status === 'Active'
                              ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                              : client.status === 'Completed'
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/15 border border-red-500/30 text-red-400'
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="text-xs font-medium text-slate-300 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
                          <span>{client.createdByAgent}</span>
                        </div>
                        {client.updatedByAgent && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Edited by {client.updatedByAgent}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setViewingClient(client)}
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          History
                        </button>
                        <button
                          onClick={() => setEditingClient(client)}
                          className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client History Modal */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Borrower Profile & Audit History</div>
                <h3 className="text-xl font-bold text-white mt-0.5">{viewingClient.name}</h3>
                <p className="text-xs text-slate-400">{viewingClient.businessType} • {viewingClient.phone}</p>
              </div>
              <button
                onClick={() => setViewingClient(null)}
                className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Principal Loan</div>
                  <div className="text-lg font-bold text-white">K{viewingClient.principal}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Daily Rate</div>
                  <div className="text-lg font-bold text-amber-400">K{viewingClient.dailyAmount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Total Payable</div>
                  <div className="text-lg font-bold text-white">K{viewingClient.totalPayable}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Status</div>
                  <div className="text-lg font-bold text-emerald-400">{viewingClient.status}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-3">Payment Collection History</h4>
                {(!viewingClient.payments || viewingClient.payments.length === 0) ? (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-800/30 rounded-xl border border-slate-800">
                    No payments recorded for this client yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {viewingClient.payments.map((p, pIdx) => (
                      <div key={`payment-${p.id}-${pIdx}`} className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">+K{p.amount}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Date: {p.date} • Collected by <span className="text-amber-400 font-medium">{p.agentName}</span>
                          </div>
                          {p.notes && <div className="text-[11px] text-slate-500 mt-1">{p.notes}</div>}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingClient(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Edit Client & Loan Record</div>
                <h3 className="text-xl font-bold text-white mt-0.5">{editingClient.name}</h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Borrower Full Name</label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Business Type</label>
                  <input
                    type="text"
                    value={editingClient.businessType}
                    onChange={(e) => setEditingClient({ ...editingClient, businessType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Address / Location</label>
                <input
                  type="text"
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Principal (K)</label>
                  <input
                    type="number"
                    value={editingClient.principal}
                    onChange={(e) => setEditingClient({ ...editingClient, principal: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Daily Amount (K)</label>
                  <input
                    type="number"
                    value={editingClient.dailyAmount}
                    onChange={(e) => setEditingClient({ ...editingClient, dailyAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                  <select
                    value={editingClient.status}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Defaulted">Defaulted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Editing Agent (Will be recorded)</label>
                <input
                  type="text"
                  value={currentAgent.name}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-amber-400 font-semibold text-sm cursor-not-allowed"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
