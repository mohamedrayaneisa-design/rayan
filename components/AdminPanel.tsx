import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User as UserIcon, Check, X, ShieldAlert, Loader2, ShieldCheck, Mail, Key, Search, UserCog, Database } from 'lucide-react';
import { dbService } from '../services/dbService';
import { soundService } from '../services/soundService';
import { User } from '../types';
import { API_BASE_URL } from '../config';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Technicien');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setError('Veuillez remplir tous les champs');
      soundService.playError();
      return;
    }

    // Confirmation Dialog
    soundService.playClick();
    if (!window.confirm(`Confirmez-vous la création de l'utilisateur "${newUsername}" avec le rôle "${newRole}" ?`)) {
        return;
    }

    setLoading(true);
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
        });
        const data = await response.json();
        if (data.success) {
          soundService.playSuccess();
          setNewUsername('');
          setNewPassword('');
          setNewRole('Technicien');
          setShowAddForm(false);
          setError('');
          loadUsers();
        } else {
          setError(data.message || 'Erreur lors de la création');
          soundService.playError();
        }
      } catch (err) {
        setError('Erreur de connexion');
        soundService.playError();
      }
      setLoading(false);
    }, 800);
  };

  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      soundService.playError();
      return;
    }
    
    soundService.playClick();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'opérateur "${username}" ?`)) {
      fetch(`${API_BASE_URL}/api/users/${username}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            soundService.playSuccess();
            loadUsers();
          }
        });
    }
  };

  const toggleRole = (username: string, currentRole: string) => {
    if (username === 'admin') return;
    
    soundService.playClick();
    const nextRole = currentRole === 'Super Admin' ? 'Technicien' : 'Super Admin';
    fetch(`${API_BASE_URL}/api/users/${username}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          soundService.playSuccess();
          loadUsers();
        }
      });
  };

  return (
    <div className="flex-grow overflow-hidden flex flex-col p-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <ShieldCheck className="w-8 h-8 animate-pulse-soft" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                Centre d'Administration
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.25em]">Système Actif</p>
                </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                    type="text"
                    placeholder="Rechercher opérateurs..."
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-bold tracking-wider text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all hover:bg-slate-900/80"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Glass Button: Add Operator */}
            <button 
                onClick={() => { soundService.playClick(); setShowAddForm(true); }}
                className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600/20 backdrop-blur-lg border border-indigo-500/30 text-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_8px_32px_0_rgba(79,70,229,0.2)] hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-600/30 hover:border-indigo-400/50 group active:scale-95 hover:-translate-y-0.5"
            >
                <div className="p-1 bg-white/20 rounded-full">
                    <UserPlus className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </div>
                Ajouter Opérateur
            </button>

            {/* Glass Button: Bulk Import */}
            <button 
                onClick={() => { soundService.playClick(); setShowBulkForm(true); }}
                className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600/20 backdrop-blur-lg border border-emerald-500/30 text-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_8px_32px_0_rgba(16,185,129,0.2)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-600/30 hover:border-emerald-400/50 group active:scale-95 hover:-translate-y-0.5"
            >
                <div className="p-1 bg-white/20 rounded-full">
                    <Database className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </div>
                Importation Massive
            </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-4 pb-10">
        {filteredUsers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-white/5 rounded-[2rem]">
                <UserIcon className="w-12 h-12 text-slate-700 mb-4 opacity-50" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Aucun opérateur trouvé</p>
            </div>
        ) : (
            filteredUsers.map((u, idx) => {
                const isSuperAdmin = u.role === 'Super Admin' || u.username === 'admin';
                return (
                    <div 
                        key={u.username}
                        className="glass-card p-6 rounded-[1.5rem] flex flex-col sm:flex-row items-center justify-between group animate-fade-in-up border-white/5 hover:border-indigo-500/30 relative overflow-hidden transition-all duration-500 hover:bg-slate-900"
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        {isSuperAdmin && <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] translate-x-10 -translate-y-10 pointer-events-none"></div>}
                        
                        <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-inner ${isSuperAdmin ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800/50 border-white/5 text-slate-400 group-hover:bg-indigo-500/5 group-hover:text-indigo-300'}`}>
                                <UserIcon className={`w-6 h-6 transition-transform duration-500 ${isSuperAdmin ? 'animate-pulse-soft' : 'group-hover:scale-110'}`} />
                            </div>
                            
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="text-lg font-black text-white tracking-tight leading-none mb-2 group-hover:text-indigo-400 transition-colors flex items-center justify-center sm:justify-start gap-2">
                                    {u.username}
                                    {isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                                </h3>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.1em] border shadow-sm transition-colors ${isSuperAdmin ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800 text-slate-500 border-white/5 group-hover:bg-slate-700'}`}>
                                        {u.role || 'Technicien'}
                                    </span>
                                    <span className="text-[9px] text-slate-600 font-mono tracking-tighter opacity-70 flex items-center gap-1">
                                        <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                                        Créé: {new Date(u.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6 sm:mt-0 relative z-10 w-full sm:w-auto justify-center sm:justify-end">
                            {/* Glass Button: Role */}
                            <button 
                                onClick={() => toggleRole(u.username, u.role || '')}
                                disabled={u.username === 'admin'}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-400/30 hover:bg-indigo-500/10 transition-all disabled:opacity-20 group/role active:scale-95 shadow-lg"
                                title="Modifier le rôle"
                            >
                                <UserCog className="w-4 h-4 group-hover/role:rotate-12 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">Rôle</span>
                            </button>
                            
                            {/* Glass Button: Delete */}
                            <button 
                                onClick={() => handleDeleteUser(u.username)}
                                disabled={u.username === 'admin'}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-400/30 hover:bg-rose-500/10 transition-all disabled:opacity-20 group/del active:scale-95 shadow-lg"
                                title="Supprimer l'utilisateur"
                            >
                                <Trash2 className="w-4 h-4 group-hover/del:scale-110 group-hover/del:rotate-6 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">Supprimer</span>
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Bulk Add Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setShowBulkForm(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up ring-1 ring-white/5">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                    <Database className="w-6 h-6 text-emerald-500" />
                    Importation Massive
                </h3>
                <button onClick={() => { soundService.playClick(); setShowBulkForm(false); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"><X /></button>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Format attendu :</p>
                    <code className="text-[10px] text-emerald-400 font-mono block">utilisateur:motdepasse:role</code>
                    <p className="text-[9px] text-slate-500 mt-2 italic">Exemple : hicham:pass123:Technicien (un par ligne)</p>
                </div>

                <div className="space-y-5">
                    <textarea 
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        className="w-full h-48 bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-mono text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                        placeholder="user1:pass1:Technicien&#10;user2:pass2:Super Admin"
                    />

                    {error && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black text-center uppercase tracking-[0.2em] animate-pulse">
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={async () => {
                            if (!bulkText.trim()) return;
                            setLoading(true);
                            setError('');
                            const lines = bulkText.trim().split('\n');
                            const usersToCreate = lines.map(line => {
                                const [username, password, role] = line.split(':');
                                return { username: username?.trim(), password: password?.trim(), role: role?.trim() || 'Technicien' };
                            }).filter(u => u.username && u.password);

                            try {
                                const res = await fetch(`${API_BASE_URL}/api/auth/register/bulk`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ users: usersToCreate })
                                });
                                const data = await res.json();
                                if (data.success) {
                                    soundService.playSuccess();
                                    setBulkText('');
                                    setShowBulkForm(false);
                                    loadUsers();
                                } else {
                                    setError(data.message || 'Erreur lors de l\'importation');
                                    soundService.playError();
                                }
                            } catch (e) {
                                setError('Erreur de connexion');
                                soundService.playError();
                            }
                            setLoading(false);
                        }}
                        disabled={loading}
                        className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all group active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border border-emerald-400/20 hover:shadow-[0_25px_50px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Importer {bulkText.trim().split('\n').filter(l => l.includes(':')).length} Opérateurs</>}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
      {showAddForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setShowAddForm(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up ring-1 ring-white/5">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                    <UserPlus className="w-6 h-6 text-indigo-500" />
                    Nouvel Opérateur
                </h3>
                <button onClick={() => { soundService.playClick(); setShowAddForm(false); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"><X /></button>
                </div>

                <form onSubmit={handleAddUser} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                            <Mail className="w-3 h-3" /> Identifiant
                        </label>
                        <input 
                            type="text" 
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner focus:bg-slate-800"
                            placeholder="ex: hicham_pro"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                            <Key className="w-3 h-3" /> Mot de Passe
                        </label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner focus:bg-slate-800"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Rôle Système
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => { soundService.playHover(); setNewRole('Technicien'); }}
                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-2 ${newRole === 'Technicien' ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20 hover:bg-slate-800'}`}
                            >
                                <UserIcon className="w-4 h-4" />
                                Technicien
                            </button>
                            <button 
                                type="button"
                                onClick={() => { soundService.playHover(); setNewRole('Super Admin'); }}
                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-2 ${newRole === 'Super Admin' ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20 hover:bg-slate-800'}`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Super Admin
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black text-center uppercase tracking-[0.2em] animate-pulse">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all group active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border border-indigo-400/20 hover:shadow-[0_25px_50px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Confirmer Accès</>}
                    </button>
                </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;