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
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate inputs
    if (phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      setStep(0);
      return;
    }
    if (!upi.includes('@')) {
      alert("Please enter a valid UPI ID (e.g. name@bank).");
      setStep(0);
      return;
    }

    // Step progression logic
    if (step < 2) {
      setStep(prev => prev + 1);
      return;
    }

    // Final execution step
    setIsVerifying(true);
    
    try {
      // The 'verify_mode' bypass key allows updating sensitive phone/upi fields 
      // during the initial verification without checking a non-existent password.
      const res = await api.updateProfile(user.id, { 
        phoneNumber: phone, 
        upiId: upi, 
        isVerified: true 
      }, "verify_mode");
      
      if (res.success) {
        // Success: pass updated user back to App.tsx to close modal and update state
        onVerified({ ...user, phoneNumber: phone, upiId: upi, isVerified: true });
      } else {
        alert(res.error || "Verification update failed on server.");
        setIsVerifying(false);
        setStep(0); // Reset on failure to allow corrections
      }
    } catch (err) {
      alert("Verification service unavailable. Check connection.");
      setIsVerifying(false);
      setStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] xs:rounded-[3.8rem] p-9 xs:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500 border border-white/10">
        
        {step > 0 ? (
          <div className="text-center space-y-7 xs:space-y-9">
            <div className={`w-20 h-20 xs:w-24 xs:h-24 ${step === 1 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 transform rotate-6 shadow-2xl`}>
              <i className="fa-solid fa-triangle-exclamation text-3xl xs:text-4xl"></i>
            </div>
            <h2 className="text-xl xs:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {step === 1 ? 'Step 2: Confirmation' : 'Step 3: Identity Link'}
            </h2>
            <p className="text-slate-400 text-[11px] xs:text-xs font-bold leading-relaxed px-2">
              {step === 1 
                ? "Double check your details. If the UPI ID or Mobile Number is incorrect, payments will fail indefinitely." 
                : "Final chance. This identity profile will be locked for security after linking. Proceed to synchronize?"}
            </p>
            <div className="space-y-3 pt-2">
              <button 
                onClick={() => handleVerify()} 
                disabled={isVerifying}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 xs:py-6 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
              >
                {isVerifying ? 'SECURE LINKING...' : (step === 1 ? 'YES, DATA IS CORRECT' : 'LINK NODE NOW')}
              </button>
              <button 
                onClick={() => setStep(0)} 
                disabled={isVerifying}
                className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-500 active:scale-90 transition-all py-2 disabled:opacity-30"
              >
                Back to Edit
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-10 xs:mb-12">
              <div className="w-16 h-16 xs:w-20 xs:h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)]">
                <i className="fa-solid fa-id-card-clip text-2xl xs:text-3xl"></i>
              </div>
              <h2 className="text-2xl xs:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Verify Identity</h2>
              <p className="text-slate-400 text-[9px] xs:text-[10px] font-black uppercase tracking-[0.3em] mt-3">Link Node to Wealth OS</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Primary Mobile</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">+91</span>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-3xl py-5 xs:py-6 pl-14 xs:pl-16 pr-6 font-black text-slate-900 dark:text-white shadow-inner border border-transparent focus:border-indigo-500 outline-none transition-all" 
                    placeholder="00000 00000" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Payment UPI ID</label>
                <input 
                  type="text" 
                  value={upi} 
                  onChange={(e) => setUpi(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-3xl py-5 xs:py-6 px-6 xs:px-8 font-black text-slate-900 dark:text-white shadow-inner border border-transparent focus:border-indigo-500 outline-none transition-all" 
                  placeholder="yourname@bank" 
                  required 
                />
              </div>

              <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 xs:py-6 rounded-3xl shadow-2xl active:scale-95 transition-all uppercase tracking-[0.3em] text-[10px] mt-6">
                Start Verification
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
