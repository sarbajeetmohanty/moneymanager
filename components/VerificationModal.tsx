
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
  const [step, setStep] = useState(0); // 0: Form, 1: First Warning, 2: Final Warning

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return alert("Please enter a valid 10-digit mobile number.");
    if (!upi.includes('@')) return alert("Please enter a valid UPI ID (e.g. name@bank).");

    if (step < 2) {
      setStep(prev => prev + 1);
      return;
    }

    const res = await api.updateProfile(user.id, { phoneNumber: phone, upiId: upi, isVerified: true }, "dummy");
    if (res.success) {
      onVerified({ ...user, phoneNumber: phone, upiId: upi, isVerified: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-2xl p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
        
        {step > 0 ? (
          <div className="text-center space-y-8">
            <div className={`w-24 h-24 ${step === 1 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 transform rotate-6 shadow-xl`}>
              <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {step === 1 ? 'Warning 1 of 2' : 'Final Warning 2 of 2'}
            </h2>
            <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">
              {step === 1 
                ? "If the Phone or UPI ID is incorrect, your payments will fail permanently. Are you absolutely sure these details are correct?" 
                : "This is your LAST chance. Incorrect data cannot be easily changed later for security reasons. Confirm your identity node?"}
            </p>
            <div className="space-y-3">
              <button onClick={handleVerify} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px]">
                {step === 1 ? 'Yes, I am sure' : 'Confirm & Link Node'}
              </button>
              <button onClick={() => setStep(0)} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-500">Back to Edit</button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-2xl shadow-indigo-500/30">
                <i className="fa-solid fa-user-check text-3xl"></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Verify Identity</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Required for Secure Transactions</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Phone (10 Digits)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">+91</span>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 pl-16 pr-6 font-black text-indigo-900 dark:text-white placeholder:text-slate-200" 
                    placeholder="00000 00000" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Payment UPI ID</label>
                <input 
                  type="text" 
                  value={upi} 
                  onChange={(e) => setUpi(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 px-8 font-black text-indigo-900 dark:text-white placeholder:text-slate-200" 
                  placeholder="yourname@bank" 
                  required 
                />
              </div>

              <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px] mt-4">
                Verify My Data
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
