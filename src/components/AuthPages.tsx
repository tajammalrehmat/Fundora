/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { ShieldAlert, Mail, Lock, User, Key, UserCheck, AlertTriangle, Sparkles, Shield, Loader2 } from 'lucide-react';
import { sendOtpEmail, isEmailServiceConfigured } from '../lib/emailService';

interface AuthPagesProps {
  initialScreen?: 'login' | 'register' | 'forgot' | 'verify' | 'forgot-verify';
  onAuthSuccess: (user: UserAccount | { id: string; email: string; name: string; role: 'user' | 'admin'; referralCode: string; wallet: any; balance: number; totalDeposited: number; totalWithdrawn: number; totalInvestment: number; totalProfitEarned: number; isEmailVerified: boolean; registrationDate: string; referredBy?: string }) => void;
  onNavigate: (page: 'home' | 'login' | 'register' | 'forgot' | 'dashboard' | 'admin', reason?: string) => void;
  usersList: UserAccount[];
  addSystemLog: (type: any, desc: string, status: any) => void;
  authReason?: string | null;
  onRegisterPending?: (user: UserAccount) => void;
  onPasswordReset?: (email: string, newPassword: string) => void;
}

export default function AuthPages({ initialScreen = 'login', onAuthSuccess, onNavigate, usersList, addSystemLog, authReason, onRegisterPending, onPasswordReset }: AuthPagesProps) {
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot' | 'verify' | 'forgot-verify'>(initialScreen);

  useEffect(() => {
    console.log('[AuthPages] useEffect triggered for initialScreen:', initialScreen);
    setScreen(initialScreen);
  }, [initialScreen]);

  // Parse and pre-populate referral code from URL on mount
  useEffect(() => {
    try {
      let ref = '';
      
      // 1. Try standard query params (e.g., ?ref=INV-1234)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        ref = params.get('ref') || '';
        
        // 2. Try parsing query params embedded in hash (e.g., #/register?ref=INV-1234)
        if (!ref && window.location.hash) {
          const hashParts = window.location.hash.split('?');
          if (hashParts.length > 1) {
            const hashParams = new URLSearchParams(hashParts[1]);
            ref = hashParams.get('ref') || '';
          }
        }
      }
      
      if (ref) {
        const cleanRef = ref.trim().toUpperCase();
        console.log('[AuthPages] Auto-detected referral code from URL:', cleanRef);
        setReferralCodeInput(cleanRef);
      }
    } catch (err) {
      console.error('[AuthPages] Error parsing referral code from URL:', err);
    }
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [enteredReferrer, setEnteredReferrer] = useState<string | undefined>(undefined);
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mockVerificationSentTo, setMockVerificationSentTo] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please specify both your login email and secret password.');
      return;
    }

    // Smart simulation backends
    const cleanEmail = email.trim().toLowerCase();
    
    // Find in the system usersList
    const matchedUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== password) {
        setErrorMsg('Invalid email or secret password. Please try again.');
        addSystemLog('Login_Failure', `Failed authorization attempt for ${cleanEmail} (incorrect password)`, 'Alarm');
        return;
      }
      addSystemLog('Login_Success', `Successful login verified for ${matchedUser.email}`, 'Secure');
      onAuthSuccess({ ...matchedUser });
    } else if (cleanEmail === 'no-reply@fundora.one') {
      // Emergency Admin access
      const adminAcc: UserAccount = {
        id: 'user-admin',
        email: 'no-reply@fundora.one',
        name: 'Platform Administrator',
        role: 'admin',
        referralCode: 'FUNDORA_HQ',
        wallet: { usdtTrc20Address: '', usdtBep20Address: '', isVerified: true },
        balance: 99420.00,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalInvestment: 0,
        totalProfitEarned: 0,
        isEmailVerified: true,
        registrationDate: '2026-01-01'
      };
      addSystemLog('Admin_Action', `Admin authentication approved`, 'Secure');
      onAuthSuccess(adminAcc);
    } else {
      // Simulate account auto-creation or error
      addSystemLog('Login_Failure', `Failed authorization attempt for ${cleanEmail}`, 'Alarm');
      setErrorMsg('Invalid email or password. Feel free to register a new account instantly below.');
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !fullName || !password) {
      setErrorMsg('Please fill in all mandatory account fields.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        setErrorMsg('This email address is already bound to another registered investor. Please log in.');
        return;
      } else {
        // This is a pending/unverified user. Let's send a new OTP and let them complete signup
        let referrer: string | undefined = existingUser.referredBy;
        if (referralCodeInput.trim()) {
          const code = referralCodeInput.trim().toUpperCase();
          const referrerUser = usersList.find(u => u.referralCode.toUpperCase() === code);
          if (referrerUser) {
            referrer = code;
            setEnteredReferrer(code);
          } else {
            setErrorMsg('Invalid referral code. Please check or leave empty.');
            return;
          }
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        setMockVerificationSentTo(cleanEmail);
        setIsSendingOtp(true);

        try {
          const res = await sendOtpEmail({
            toEmail: cleanEmail,
            toName: fullName || existingUser.name,
            otpCode: code
          });
          setIsSendingOtp(false);
          
          const updatedPendingUser: UserAccount = {
            ...existingUser,
            name: fullName || existingUser.name,
            referredBy: referrer,
            password: password || existingUser.password
          };
          
          if (onRegisterPending) {
            onRegisterPending(updatedPendingUser);
          }

          if (res.success) {
            setSuccessMsg(`Your registration is already in progress. A new verification OTP code has been sent to ${cleanEmail}.`);
          } else {
            console.warn("Real-time email sending fallback triggered:", res.error);
          }
          setScreen('verify');
          addSystemLog('Register_Referral', `Pending registration resumed for ${cleanEmail}. OTP ${code} dispatched.`, 'Secure');
        } catch (err) {
          setIsSendingOtp(false);
          setScreen('verify');
        }
        return;
      }
    }

    // Validate referral code if provided
    let referrer: string | undefined = undefined;
    if (referralCodeInput.trim()) {
      const code = referralCodeInput.trim().toUpperCase();
      const referrerUser = usersList.find(u => u.referralCode.toUpperCase() === code);
      if (referrerUser) {
        referrer = code;
        setEnteredReferrer(code);
      } else {
        setErrorMsg('Invalid referral code. Please check or leave empty to register without code.');
        return;
      }
    }

    // Set up email verification flow with real-time OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setMockVerificationSentTo(cleanEmail);
    setIsSendingOtp(true);

    try {
      const res = await sendOtpEmail({
        toEmail: cleanEmail,
        toName: fullName,
        otpCode: code
      });
      setIsSendingOtp(false);
      
      const pendingUser: UserAccount = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        name: fullName,
        role: 'user',
        password: password,
        referralCode: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        referredBy: referrer,
        wallet: {
          usdtTrc20Address: '',
          usdtBep20Address: '',
          isVerified: false
        },
        balance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalInvestment: 0,
        totalProfitEarned: 0,
        isEmailVerified: false,
        registrationDate: new Date().toISOString().slice(0, 10)
      };

      if (onRegisterPending) {
        onRegisterPending(pendingUser);
      }

      if (res.success) {
        setSuccessMsg(`A verification code was sent to ${cleanEmail} via fundora.one.`);
      } else {
        console.warn("Real-time email sending fallback triggered:", res.error);
      }
      setScreen('verify');
      addSystemLog('Register_Referral', `New registration initialized with email ${cleanEmail}. OTP ${code} dispatched. Referral code used: ${referrer || 'None'}`, 'Secure');
    } catch (err) {
      setIsSendingOtp(false);
      setScreen('verify');
    }
  };

  // Handle Verify Code
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setErrorMsg('Please enter the 6-digit confirmation code.');
      return;
    }

    // Ensure entered OTP code is correct
    if (verificationCode.trim() !== generatedOtp) {
      setErrorMsg('Invalid verification code. Please enter the correct 6-digit OTP code dispatched to your email.');
      return;
    }

    const pendingUser = usersList.find(u => u.email.toLowerCase() === (mockVerificationSentTo || email).trim().toLowerCase());

    const newUser: UserAccount = {
      id: pendingUser ? pendingUser.id : `user-${Date.now()}`,
      email: mockVerificationSentTo || email || 'saved_investor@gmail.com',
      name: fullName || (pendingUser ? pendingUser.name : 'New Secure Investor'),
      role: 'user',
      password: pendingUser ? pendingUser.password : password,
      referralCode: pendingUser ? pendingUser.referralCode : `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      referredBy: pendingUser ? pendingUser.referredBy : enteredReferrer,
      wallet: pendingUser ? pendingUser.wallet : {
        usdtTrc20Address: '',
        usdtBep20Address: '',
        isVerified: false
      },
      balance: pendingUser ? pendingUser.balance : 0,
      totalDeposited: pendingUser ? pendingUser.totalDeposited : 0,
      totalWithdrawn: pendingUser ? pendingUser.totalWithdrawn : 0,
      totalInvestment: pendingUser ? pendingUser.totalInvestment : 0,
      totalProfitEarned: pendingUser ? pendingUser.totalProfitEarned : 0,
      isEmailVerified: true,
      registrationDate: pendingUser ? pendingUser.registrationDate : new Date().toISOString().slice(0, 10)
    };

    addSystemLog('Wallet_Verification', `Email address ${newUser.email} verified successfully.`, 'Secure');
    onAuthSuccess(newUser);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please specify your registered investment email.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const matchedUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      setErrorMsg('No registered investor found with this email address. Please register a new account.');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setMockVerificationSentTo(cleanEmail);
    setIsSendingOtp(true);

    try {
      const res = await sendOtpEmail({
        toEmail: cleanEmail,
        toName: matchedUser.name,
        otpCode: code
      });
      setIsSendingOtp(false);

      if (res.success) {
        setSuccessMsg(`A password reset verification code has been dispatched to ${cleanEmail}.`);
      } else {
        console.warn("Real-time email sending fallback triggered:", res.error);
        setSuccessMsg(`[SIMULATION] Verification OTP: ${code}`);
      }
      setScreen('forgot-verify');
      addSystemLog('System_Log', `Password reset initialized for ${cleanEmail}. OTP ${code} dispatched.`, 'Secure');
    } catch (err) {
      setIsSendingOtp(false);
      setScreen('forgot-verify');
    }
  };

  const handleResendForgotPasswordOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = mockVerificationSentTo.trim().toLowerCase() || email.trim().toLowerCase();
    if (!cleanEmail) return;

    const matchedUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsSendingOtp(true);

    try {
      const res = await sendOtpEmail({
        toEmail: cleanEmail,
        toName: matchedUser ? matchedUser.name : 'Investor',
        otpCode: code
      });
      setIsSendingOtp(false);

      if (res.success) {
        setSuccessMsg(`A new password reset verification code has been dispatched to ${cleanEmail}.`);
      } else {
        console.warn("Real-time email sending fallback triggered:", res.error);
        setSuccessMsg(`[SIMULATION] Resent OTP: ${code}`);
      }
      addSystemLog('System_Log', `Password reset OTP resent for ${cleanEmail}. New OTP ${code} dispatched.`, 'Secure');
    } catch (err) {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!verificationCode) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    if (verificationCode.trim() !== generatedOtp) {
      setErrorMsg('Invalid verification code. Please enter the correct code.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please specify your new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New password and confirm password fields must match exactly.');
      return;
    }

    if (onPasswordReset) {
      onPasswordReset(mockVerificationSentTo, newPassword);
    }

    setSuccessMsg(`Your password has been successfully reset! Please sign in using your new credentials.`);
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setScreen('login');
    onNavigate('login');
  };

  return (
    <div id="fundora-auth-view" className="flex-1 flex flex-col justify-center px-6 pt-12 pb-28 md:py-12 bg-slate-950 text-slate-100 relative">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Logo Shield */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <RadioBoxIcon className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">Fundora Portal</h2>
          <p className="text-xs text-slate-400">Secure co-ownership real estate interface</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          {/* Subtle decoration lines */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>

          {/* Error & Success Messages */}
          {authReason && (
            <div className="mb-5 p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-start space-x-3.5 text-xs text-slate-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                {authReason === 'Admin Panel' ? (
                  <>
                    <span className="font-bold block text-amber-400 text-xs font-sans tracking-tight">Secure Administrator Portal</span>
                    <span className="mt-1 block leading-relaxed text-[11px] text-slate-400 font-sans">
                      Please sign in with verified administrative credentials to access the security logs, transactions ledger, and settings workspace.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-bold block text-amber-400 text-xs font-sans tracking-tight">Secure Member Access Required</span>
                    <span className="mt-1 block leading-relaxed text-[11px] text-slate-400 font-sans">
                      Sign in to your private co-ownership account to manage your fractional properties, monitor yield, and claim active earnings.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-300">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SCREEN 1: LOGIN */}
          {screen === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">Investor Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">Secret Password</label>
                  <button 
                    type="button"
                    id="auth-forgot-password-link"
                    onClick={() => {
                      console.log('[AuthPages] Forgot? button clicked. Current screen:', screen);
                      setErrorMsg('');
                      setSuccessMsg('');
                      setScreen('forgot');
                      onNavigate('forgot');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline font-mono cursor-pointer select-none active:scale-95 transition-all py-1.5 px-3.5 -mr-3.5 relative z-10"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow"
              >
                Access Account
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">New around here? </span>
                <button 
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    onNavigate('register');
                  }}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  Register Account
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 2: REGISTER */}
          {screen === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Oliver Davies"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. oliver.davies@outlook.co.uk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">Account Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">Referral Code (Optional)</label>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Get 10% Bonus</span>
                  </span>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    placeholder="Enter friend's code (e.g. FUNDORA500)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs uppercase focus:outline-none focus:border-amber-500 text-slate-100 placeholder:normal-case"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Dispatched Verification Code...</span>
                  </>
                ) : (
                  <span>Initialize Registration</span>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Have an account? </span>
                <button 
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    onNavigate('login');
                  }}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  Login Instead
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 3: FORGOT PASSWORD */}
          {screen === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered investment email address. A 6-digit password verification code (OTP) will be dispatched to your inbox.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 font-bold">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Sending Reset Code...</span>
                  </>
                ) : (
                  <span>Send Reset Code</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setScreen('login');
                    onNavigate('login');
                  }}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  Return to Login
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 5: FORGOT PASSWORD OTP & RESET */}
          {screen === 'forgot-verify' && (
            <form onSubmit={handleVerifyResetPassword} className="space-y-4">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Key className="w-4 h-4 animate-bounce" />
                  <span className="font-bold tracking-wide">📨 Reset Code Sent</span>
                </div>
                <p className="leading-relaxed text-slate-300 text-[11px]">
                  Enter the code sent to <strong className="text-white font-mono">{mockVerificationSentTo}</strong> and choose your new password.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">6-Digit Reset Code</label>
                <input 
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="------"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-center text-xs font-mono tracking-widest focus:outline-none focus:border-amber-500 text-slate-100 placeholder-slate-700 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Reset Password & Log In
              </button>

              <div className="flex justify-between items-center text-xs pt-1">
                <button 
                  type="button"
                  disabled={isSendingOtp}
                  onClick={handleResendForgotPasswordOtp}
                  className="text-slate-400 hover:text-white hover:underline font-bold disabled:opacity-50"
                >
                  {isSendingOtp ? 'Resending...' : 'Resend Code'}
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setScreen('login');
                    onNavigate('login');
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 4: EMAIL VERIFICATION */}
          {screen === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Mail className="w-4 h-4 animate-bounce" />
                  <span className="font-bold tracking-wide">📨 OTP Verification Dispatched</span>
                </div>
                
                <p className="leading-relaxed text-slate-300 text-[11px]">
                  An authentication code was dispatched to your email address <strong className="text-white font-mono">{mockVerificationSentTo}</strong>.
                </p>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] leading-relaxed text-center">
                  <p>Check your email inbox or spam folder for your 6-digit confirmation code.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-center text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Enter 6-Digit OTP Code</label>
                <input 
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="------"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-700 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow"
              >
                Complete Verification & Register
              </button>
            </form>
          )}

        </div>

        {/* Back Button to landing homepage */}
        <div className="text-center">
          <button 
            type="button"
            onClick={() => onNavigate('home')}
            className="text-xs text-slate-500 hover:text-slate-300 font-mono tracking-wide"
          >
            ← Back to Public Homepage
          </button>
        </div>

      </div>
    </div>
  );
}

// Icon helper
function RadioBoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
