import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Shield, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Loader2,
  Lock,
  Mail,
  User as UserTypeIcon,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '../services/supabaseService';
import { User as AppUser } from '../types';

interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'operator';
  active: boolean;
  createdAt: string;
}

export const UserManager: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form state
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'operator'>('operator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getProfiles();
      setProfiles(data as any);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleToggleActive = async (profile: Profile) => {
    try {
      await supabaseService.updateProfile(profile.id, { active: !profile.active });
      loadProfiles();
    } catch (error) {
      console.error('Error toggling profile status:', error);
    }
  };

  const handleRoleChange = async (profile: Profile, newRole: 'admin' | 'operator') => {
    try {
      await supabaseService.updateProfile(profile.id, { role: newRole });
      loadProfiles();
    } catch (error) {
      console.error('Error changing profile role:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await supabaseService.signUpNewUser(newUsername, newName, newPassword, newRole);
      setIsAddModalOpen(false);
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      setNewRole('operator');
      loadProfiles();
    } catch (error: any) {
      console.error('Error adding user:', error);
      setFormError(error.message || 'Erro ao criar usuário. Verifique se o nome de acesso já existe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            Gerenciar Usuários
            <span className="text-blue-500 text-sm font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 tracking-normal">
              {profiles.length}
            </span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Controle de acesso e níveis de permissão do sistema</p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95"
        >
          <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
          Novo Usuário
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
          <Search className="w-5 h-5" />
        </div>
        <input 
          type="text"
          placeholder="Buscar por nome ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[2rem] pl-14 pr-8 py-5 text-white font-bold focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 grayscale opacity-50">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando perfis...</p>
            </div>
          ) : filteredProfiles.map((profile) => (
            <motion.div
              key={profile.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`group bg-slate-900/60 backdrop-blur-md border rounded-[2.5rem] p-8 transition-all hover:bg-slate-900/80 ${
                !profile.active ? 'border-slate-800 opacity-60 grayscale' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl ${
                  profile.role === 'admin' 
                    ? 'bg-amber-500/10 text-amber-500 shadow-amber-900/20' 
                    : 'bg-blue-500/10 text-blue-500 shadow-blue-900/20'
                }`}>
                  {profile.role === 'admin' ? <ShieldCheck className="w-8 h-8" /> : <UserIcon className="w-8 h-8" />}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleActive(profile)}
                    title={profile.active ? "Desativar usuário" : "Ativar usuário"}
                    className={`p-3 rounded-2xl transition-all ${
                      profile.active 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                    }`}
                  >
                    {profile.active ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-black text-white tracking-tight truncate">{profile.name}</h3>
                   {!profile.active && <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase">Inativo</span>}
                </div>
                <p className="text-[10px] text-slate-500 font-mono tracking-tight truncate">{profile.id}</p>
              </div>

              <div className="flex items-center gap-2 mb-8">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                  profile.role === 'admin' 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {profile.role === 'admin' ? 'Administrador' : 'Operador'}
                </span>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/50 px-3 py-1 rounded-full">
                  CRIADO EM {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-6 border-t border-slate-800/50 flex gap-3">
                <button 
                   onClick={() => handleRoleChange(profile, profile.role === 'admin' ? 'operator' : 'admin')}
                   className="flex-1 flex items-center justify-center gap-2 bg-slate-950/50 hover:bg-slate-950 text-slate-400 hover:text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-800/30"
                >
                  {profile.role === 'admin' ? <UserIcon className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Mudar p/ {profile.role === 'admin' ? 'Operador' : 'Admin'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20">
                      <UserPlus className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tighter">Novo Usuário</h2>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cadastro de Acesso</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-950 text-slate-500 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddUser} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome Completo</label>
                    <div className="relative group">
                      <UserTypeIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nome do colaborador"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-5 text-white font-bold focus:border-blue-600 outline-none transition-all placeholder:text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome de Acesso</label>
                      <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="usuario.acesso"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-5 text-white font-bold focus:border-blue-600 outline-none transition-all placeholder:text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Senha Inicial</label>
                      <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-5 text-white font-bold focus:border-blue-600 outline-none transition-all placeholder:text-slate-800"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Perfil de Acesso</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setNewRole('operator')}
                        className={`flex items-center justify-center gap-3 p-5 rounded-3xl border transition-all ${
                          newRole === 'operator' 
                            ? 'bg-blue-600/10 border-blue-600 text-blue-500' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <UserIcon className="w-5 h-5" />
                        <span className="font-black text-xs uppercase tracking-widest">Operador</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewRole('admin')}
                        className={`flex items-center justify-center gap-3 p-5 rounded-3xl border transition-all ${
                          newRole === 'admin' 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-black text-xs uppercase tracking-widest">Admin</span>
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
                      <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <p className="text-[11px] font-bold text-red-500 uppercase leading-snug">{formError}</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-6 bg-slate-950 hover:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-[0.3em] rounded-3xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:bg-slate-800 disabled:text-slate-600"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Criar Usuário <ChevronRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
