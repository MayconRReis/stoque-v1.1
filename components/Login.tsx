import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    try {
      await supabaseService.signIn(username, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Nome ou senha incorretos. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-600/30">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[48px] p-8 md:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-900/40 mb-6">
              <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="24" width="32" height="8" rx="3" fill="white"/>
                <rect x="4" y="12" width="18" height="8" rx="3" fill="white"/>
                <path d="M28 10V20M23 15H33" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Stoque<span className="text-blue-500">+</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Ybera Paris</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome de Usuário</label>
              <div className="relative group">
                <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome de acesso"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-5 text-white font-bold focus:border-blue-600 outline-none transition-all placeholder:text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Senha</label>
              <div className="relative group">
                <i className="fa-solid fa-lock absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-5 text-white font-bold focus:border-blue-600 outline-none transition-all placeholder:text-slate-800"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 active:scale-[0.98]"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <>Entrar no Sistema <i className="fa-solid fa-arrow-right"></i></>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              Acesso Restrito ao Depósito G0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
