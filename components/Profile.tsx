
import React, { useState, useRef } from 'react';
import { User, Category, AppMode } from '../types';
import { api } from '../services/api';
import { useApp } from '../App';

interface ProfileProps {
  user: User;
  setUser: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  const { showToast } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [reframing, setReframing] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [appearanceTab, setAppearanceTab] = useState<'Colors' | 'UX'>('Colors');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    'indigo', 'rose', 'emerald', 'amber', 'violet', 
    'sky', 'cyan', 'fuchsia', 'pink', 'orange', 
    'lime', 'teal', 'slate', 'zinc', 'neutral'
  ];

  const presets = [
    { id: 'modern', name: 'Modern' }, { id: 'glass', name: 'Glass' }, { id: 'void', name: 'Void' },
    { id: 'cyber', name: 'Cyber' }, { id: 'neumorphic', name: 'Soft 3D' }, { id: 'pastel', name: 'Pastel' },
    { id: 'midnight', name: 'Midnight' }, { id: 'brutalist', name: 'Brutal' }, { id: 'retro', name: 'Retro' },
    { id: 'aurora', name: 'Aurora' }, { id: 'deepsea', name: 'Ocean' }, { id: 'sunset', name: 'Warm' },
    { id: 'forest', name: 'Forest' }, { id: 'monochrome', name: 'Mono' }, { id: 'royal', name: 'Royal' },
    { id: 'paper', name: 'Paper' }, { id: 'neon', name: 'Glow' }, { id: 'soft', name: 'Focus' },
    { id: 'quartz', name: 'Quartz' }, { id: 'obsidian', name: 'Stone' }
  ];

  const handleUpdate = async (field: string, promptText: string, isSensitive = false, isNumeric = false) => {
    const newValue = window.prompt(promptText, (user as any)[field] || '');
    if (newValue === null || newValue === '') return;

    let confirmPass = "dummy";
    if (isSensitive) {
      confirmPass = window.prompt("Confirm current password to save sensitive changes:") || "";
      if (!confirmPass) return;
    }

    setSyncing(true);
    let updateVal: any = isNumeric ? parseFloat(newValue) || 0 : newValue;
    const res = await api.updateProfile(user.id, { [field]: updateVal }, confirmPass);
    if (res.success) {
      const updatedUser = { ...user, [field]: updateVal } as User;
      setUser(updatedUser);
      localStorage.setItem('ff_user', JSON.stringify(updatedUser));
      showToast("Updated successfully", "success");
    } else {
      showToast(res.error || "Update failed", "error");
    }
    setSyncing(false);
  };

  const updateAppearance = async (field: 'theme' | 'stylePreset', value: string) => {
    setSyncing(true);
    const res = await api.updateProfile(user.id, { [field]: value }, "dummy");
    if (res.success) {
      const updatedUser = { ...user, [field]: value } as User;
      setUser(updatedUser);
      localStorage.setItem('ff_user', JSON.stringify(updatedUser));
    }
    setSyncing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReframing(event.target?.result as string);
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const savePhoto = async () => {
    if (!reframing) return;
    setSyncing(true);
    const res = await api.updateProfile(user.id, { photoURL: reframing }, "dummy");
    if (res.success) {
      const updatedUser = { ...user, photoURL: reframing };
      setUser(updatedUser);
      localStorage.setItem('ff_user', JSON.stringify(updatedUser));
      showToast("Photo updated", "success");
      setReframing(null);
    }
    setSyncing(false);
  };

  const toggleDarkMode = () => {
    const newMode: AppMode = user.mode === 'dark' ? 'light' : 'dark';
    const updatedUser: User = { ...user, mode: newMode };
    setUser(updatedUser);
    localStorage.setItem('ff_user', JSON.stringify(updatedUser));
    api.updateProfile(user.id, { mode: newMode }, "dummy");
  };

  return (
    <div className="space-y-8 pb-48 animate-in fade-in duration-700">
      {/* Profile Header */}
      <div className="card-ui bg-white dark:bg-slate-900 p-10 text-center relative shadow-xl overflow-hidden">
        {reframing ? (
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reframe Your Photo</h3>
            <div className="relative w-48 h-48 mx-auto rounded-[3rem] overflow-hidden border-4 border-indigo-600 shadow-2xl">
              <img src={reframing} className="w-full h-full object-cover" style={{ transform: `scale(${zoom})` }} alt="Crop" />
            </div>
            <div className="px-6 space-y-2">
               <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReframing(null)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
              <button onClick={savePhoto} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Apply</button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative w-40 h-40 mx-auto mb-6 group">
              <div className="w-full h-full rounded-[3.5rem] bg-slate-100 dark:bg-slate-800 border-8 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center font-black text-5xl text-slate-300 overflow-hidden">
                {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" /> : user.username[0].toUpperCase()}
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-xl flex items-center justify-center active:scale-75 transition-all"><i className="fa-solid fa-camera text-sm"></i></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{user.username}</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest opacity-60 mb-8">{user.email}</p>
            <button onClick={toggleDarkMode} className="w-full py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all">
              <i className={`fa-solid ${user.mode === 'dark' ? 'fa-sun' : 'fa-moon'} mr-3`}></i>
              {user.mode === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </>
        )}
      </div>

      {/* Appearance Customizer (Colors & UX) */}
      <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
             <i className="fa-solid fa-wand-magic-sparkles text-[12px]"></i> Appearance
          </h3>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
            <button onClick={() => setAppearanceTab('Colors')} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase transition-all ${appearanceTab === 'Colors' ? 'bg-white dark:bg-slate-900 text-indigo-500 shadow-sm' : 'text-slate-400'}`}>15 Colors</button>
            <button onClick={() => setAppearanceTab('UX')} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase transition-all ${appearanceTab === 'UX' ? 'bg-white dark:bg-slate-900 text-indigo-500 shadow-sm' : 'text-slate-400'}`}>20 Styles</button>
          </div>
        </div>

        {appearanceTab === 'Colors' ? (
          <div className="grid grid-cols-5 gap-4">
            {colors.map(c => (
              <button 
                key={c} 
                onClick={() => updateAppearance('theme', c)}
                className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-75 ${user.theme === c ? 'ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-slate-900' : ''}`}
                title={c}
              >
                <div className={`w-full h-full rounded-2xl shadow-lg ${c === 'neutral' ? 'bg-neutral-800' : `bg-${c}-600`}`}></div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {presets.map(p => (
              <button 
                key={p.id} 
                onClick={() => updateAppearance('stylePreset', p.id)}
                className={`flex flex-col items-center gap-3 group transition-all active:scale-90`}
              >
                <div className={`w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 transition-all flex items-center justify-center ${user.stylePreset === p.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg' : 'border-transparent opacity-60'}`}>
                   <div className={`w-4 h-4 rounded-full ${user.stylePreset === p.id ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`}></div>
                </div>
                <span className={`text-[7px] font-black uppercase tracking-tight ${user.stylePreset === p.id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-xl space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4 flex items-center gap-2">
           <i className="fa-solid fa-shield-halved text-[12px]"></i> Security & Profile
        </h3>
        <SettingRow label="User Name" value={user.username} onClick={() => handleUpdate('username', 'Change display name:')} />
        <SettingRow label="Email (Sensitive)" value={user.email} onClick={() => handleUpdate('email', 'Change email (requires password):', true)} isSensitive />
        <SettingRow label="Phone Number" value={user.phoneNumber || 'Not Set'} onClick={() => handleUpdate('phoneNumber', '10-digit mobile number:', true)} isSensitive />
        <SettingRow label="UPI Payment ID" value={user.upiId || 'Add your ID'} onClick={() => handleUpdate('upiId', 'UPI Address (e.g. name@bank):')} />
        <SettingRow label="Monthly Budget" value={`₹${(user.budget || 0).toLocaleString()}`} onClick={() => handleUpdate('budget', 'Set monthly spending limit:', false, true)} />
        <SettingRow label="Change Password" value="••••••••" onClick={() => handleUpdate('password', 'Set new password:', true)} isSensitive />
      </div>
    </div>
  );
};

const SettingRow = ({ label, value, onClick, isSensitive }: any) => (
  <div onClick={onClick} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] group">
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        {isSensitive && <i className="fa-solid fa-lock text-[8px] text-indigo-400 opacity-50"></i>}
      </div>
      <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">{value}</p>
    </div>
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 group-hover:text-indigo-400 transition-colors"><i className="fa-solid fa-pen-to-square text-[12px]"></i></div>
  </div>
);
