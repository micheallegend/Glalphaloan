import React, { useState } from 'react';
import { Agent } from '../types';
import { User, KeyRound, Lock, Image as ImageIcon, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

interface AgentSettingsModalProps {
  currentAgent: Agent;
  onUpdateAgent: (updatedAgent: Agent) => void;
  onClose: () => void;
}

export const AgentSettingsModal: React.FC<AgentSettingsModalProps> = ({ currentAgent, onUpdateAgent, onClose }) => {
  const [newPin, setNewPin] = useState(currentAgent.pin);
  const [newPassword, setNewPassword] = useState(currentAgent.password);
  const [photoUrl, setPhotoUrl] = useState(currentAgent.photoUrl || '');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Agent = {
      ...currentAgent,
      pin: newPin.trim(),
      password: newPassword.trim(),
      photoUrl: photoUrl.trim(),
    };

    onUpdateAgent(updated);
    setSuccessMsg('Agent security settings & photo updated successfully!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Agent Security & Profile</div>
            <h3 className="text-xl font-bold text-white mt-0.5">{currentAgent.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="m-6 mb-0 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center space-x-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt={currentAgent.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-amber-400">{currentAgent.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-300">Agent Photo Preview</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Provide a photo URL or avatar image link below.</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Agent Photo URL / Avatar</span>
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or image link"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>New Security PIN</span>
            </label>
            <input
              type="text"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter new PIN"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>New Password</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
  );
};
