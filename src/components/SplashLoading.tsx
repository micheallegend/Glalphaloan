import React, { useEffect, useState } from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface SplashLoadingProps {
  onFinish: () => void;
}

export const SplashLoading: React.FC<SplashLoadingProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      const finishTimer = setTimeout(() => {
        onFinish();
      }, 500);
      return () => clearTimeout(finishTimer);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center space-y-6 p-6 max-w-sm mx-auto">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-xl animate-pulse"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl border-2 border-amber-300/50 flex items-center justify-center shadow-2xl shadow-amber-500/40 text-slate-950 font-black text-5xl animate-bounce">
            👑
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kwacha Loans 💰</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">G.L Alpha King Loans</h1>
          <p className="text-xs text-slate-400">Daily Mon–Fri Field Collection Sheet System</p>
        </div>

        <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};
