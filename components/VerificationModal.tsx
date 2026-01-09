
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface VerificationModalProps {
  user: User;
  onVerified: (updatedUser: User) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ user, onVerified }) => {
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [upi, setUpi] = useState(user.upiId || '');
  const [step, setStep] = useState(0); // 0: Input, 1: Warning 1, 2: Final Warning

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return alert("Please enter exactly 10 digits.");
    if (!upi.includes('@')) return alert("Invalid UPI format (e.g. name@bank)");

    if (step < 2) {
      setStep(prev => prev + 1);
      return;
    }

    const res = await api.updateProfile(user.id, { phoneNumber: phone, upiId: upi, isVerified: true }, "dummy");
    if (res.success) {
      onVerified({ ...user, phoneNumber: phone, upiId: upi, isVerified: true });
    } else {
      alert(res.error || "Linking failed. Try again.");
      setStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
        {step > 0 ? (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className={`w-24 h-24 ${step === 1 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 transform rotate-6 shadow-xl`}>
              <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {step === 1 ? 'Alert: Step 1 of 2' : 'Critical: Final Check'}
            </h2>
            <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">
              {step === 1 
                ? "Incorrect Phone or UPI details will lock you out of payments. Double check every digit!" 
                : "This is your last confirmation. We will link this identity to your wallet permanently."}
            </p>
            <div className="space-y-3">
              <button onClick={handleVerify} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px]">
                {step === 1 ? 'Details are Correct' : 'Confirm & Finalize Node'}
              </button>
              <button onClick={() => setStep(0)} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-500">Back to Edit</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-2xl">
                <i className="fa-solid fa-id-card-clip text-3xl"></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Verify Identity</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Linking Payment Node</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">+91</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 pl-16 pr-6 font-black dark:text-white" placeholder="00000 00000" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Payment UPI ID</label>
                <input type="text" value={upi} onChange={(e) => setUpi(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 px-8 font-black dark:text-white" placeholder="name@bank" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px]">Link Identification</button>
          </form>
        )}
      </div>
    </div>
  );
};
