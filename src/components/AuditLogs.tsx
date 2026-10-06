import React from 'react';
import { Client } from '../types';
import { History, ShieldCheck, CheckCircle2, UserPlus, FileEdit } from 'lucide-react';

interface AuditLogsProps {
  clients: Client[];
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ clients }) => {
  // Collect all payment records and client creation/update logs
  const allPayments = clients.flatMap((c) =>
    (c.payments || []).map((p, idx) => ({
      id: `${p.id}-${idx}`,
      type: 'Payment Collection',
      description: `Collected K${p.amount} from ${c.name}`,
      agentName: p.agentName,
      timestamp: p.timestamp,
      date: p.date,
      details: p.notes || `Daily Mon-Fri installment`,
    }))
  );

  const clientCreations = clients.map((c, idx) => ({
    id: `create-${c.id}-${idx}`,
    type: 'Loan Disbursed',
    description: `Disbursed K${c.principal} loan to ${c.name} (${c.businessType})`,
    agentName: c.createdByAgent,
    timestamp: c.createdAt,
    date: c.startDate,
    details: `Total Payable: K${c.totalPayable} (${c.totalDays} days)`,
  }));

  const clientUpdates = clients
    .filter((c) => c.updatedByAgent && c.updatedAt)
    .map((c, idx) => ({
      id: `update-${c.id}-${idx}`,
      type: 'Record Edited',
      description: `Updated loan/client record for ${c.name}`,
      agentName: c.updatedByAgent || 'Unknown',
      timestamp: c.updatedAt || 0,
      date: new Date(c.updatedAt || Date.now()).toISOString().split('T')[0],
      details: `Status: ${c.status}`,
    }));

  const combinedLogs = [...allPayments, ...clientCreations, ...clientUpdates].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Agent Accountability & Audit Trail</span>
          </div>
          <h2 className="text-2xl font-black text-white">Agent Audit Logs</h2>
          <p className="text-slate-400 text-sm mt-1">
            Complete history of every action, collection, and edit performed by Micheal Legend and Brian Nyimbili.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
        {combinedLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
            <p className="text-sm font-semibold">No audit logs recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {combinedLogs.map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                    {log.type === 'Payment Collection' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : log.type === 'Loan Disbursed' ? (
                      <UserPlus className="w-5 h-5 text-amber-400" />
                    ) : (
                      <FileEdit className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                        {log.type}
                      </span>
                      <span className="text-xs text-slate-400">{log.date}</span>
                    </div>
                    <div className="font-bold text-white text-base mt-1">{log.description}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{log.details}</div>
                  </div>
                </div>

                <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">{log.agentName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
