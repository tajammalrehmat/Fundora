/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { RealEstateProject, Transaction, UserAccount, InvestmentRecord, ProfitClaimRecord, getAvatarBgClass, getInvestorTier, SystemSettings } from '../types';
import { 
  TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Users, Percent, Gift, Clock,
  Building, MapPin, Search, Filter, ShieldCheck, ChevronRight, Calculator, CheckCircle2,
  AlertTriangle, Copy, Trash, Upload, Landmark, Sparkles, RefreshCw, X, ChevronDown, Award,
  FileText, Plus, User, Lock, Check, Crown, Shield
} from 'lucide-react';

interface UserDashboardProps {
  activeUser: UserAccount;
  usersList?: UserAccount[];
  projects: RealEstateProject[];
  transactions: Transaction[];
  investments: InvestmentRecord[];
  claimsHistory: ProfitClaimRecord[];
  onLogout: () => void;
  onNavigateAdmin: () => void;
  // Transactions
  onBindWallet: (trc20: string, bep20: string) => void;
  onSubmitDeposit: (amount: number, network: 'TRC20' | 'BEP20', txHash: string, proofImg: string) => void;
  onSubmitWithdrawal: (amount: number, network: 'TRC20' | 'BEP20', address: string) => void;
  onPurchaseShares: (projectId: string, sharesCount: number) => { success: boolean; error?: string };
  onClaimDailyProfit: () => Promise<{ success: boolean; type: 'no_yield' | 'inactive_window' | 'already_claimed' | 'success'; amount?: number }> | { success: boolean; type: 'no_yield' | 'inactive_window' | 'already_claimed' | 'success'; amount?: number };
  onLiquidateInvestment: (investmentId: string) => { success: boolean; payout: number };
  onUpdateUser: (fields: Partial<UserAccount>) => void;
  // Simulated clock properties
  simulatedHour: number;
  simulatedMinute: number;
  setSimulatedHour: (hr: number) => void;
  setSimulatedMinute: (min: number) => void;
  isTimeSimulated?: boolean;
  // Sync tab state
  activeTab?: 'overview' | 'properties' | 'wallet' | 'claim' | 'referrals' | 'profile';
  setActiveTab?: (tab: 'overview' | 'properties' | 'wallet' | 'claim' | 'referrals' | 'profile') => void;
  systemSettings?: SystemSettings;
}

export default function UserDashboard({
  activeUser,
  usersList = [],
  projects,
  transactions,
  investments,
  claimsHistory,
  onLogout,
  onNavigateAdmin,
  onBindWallet,
  onSubmitDeposit,
  onSubmitWithdrawal,
  onPurchaseShares,
  onClaimDailyProfit,
  onLiquidateInvestment,
  onUpdateUser,
  simulatedHour,
  simulatedMinute,
  setSimulatedHour,
  setSimulatedMinute,
  isTimeSimulated = false,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  systemSettings = {
    id: 'default',
    usdtTrc20Address: 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy',
    usdtBep20Address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    scanGateTitle: 'Barcode Scanning Gateway',
    scanGateSubtitle: 'Dispatch on the matching blockchain. Tokens sent to mismatched networks are irreversibly lost.',
    usdtTrc20QrCode: '',
    usdtBep20QrCode: ''
  }
}: UserDashboardProps) {
  // Current Tab state
  const [internalActiveTab, setInternalActiveTab] = useState<'overview' | 'properties' | 'wallet' | 'claim' | 'referrals' | 'profile'>('overview');
  const activeTab = (externalActiveTab !== undefined ? externalActiveTab : internalActiveTab) || 'overview';
  const setActiveTab = externalSetActiveTab !== undefined ? externalSetActiveTab : setInternalActiveTab;

  const [confirmLiquidateId, setConfirmLiquidateId] = useState<string | null>(null);

  // Custom Inline notifications status
  const [dashboardStatus, setDashboardStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setDashboardStatus({ message, type });
    setTimeout(() => {
      setDashboardStatus(null);
    }, 6000);
  };

  // Properties filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'roi' | 'price' | 'shares'>('roi');

  // Investment Calculator Drawer / modal state
  const [selectedProjectForCalc, setSelectedProjectForCalc] = useState<RealEstateProject | null>(null);
  const [calculatorShares, setCalculatorShares] = useState<number>(1);

  // Wallet Setup Inputs
  const [trcLink, setTrcLink] = useState(activeUser.wallet.usdtTrc20Address || '');
  const [bepLink, setBepLink] = useState(activeUser.wallet.usdtBep20Address || '');

  React.useEffect(() => {
    setTrcLink(activeUser.wallet.usdtTrc20Address || '');
    setBepLink(activeUser.wallet.usdtBep20Address || '');
    setWithdrawAddressInput(activeUser.wallet.usdtTrc20Address || '');
  }, [activeUser.wallet.usdtTrc20Address, activeUser.wallet.usdtBep20Address]);
  const [isBindingOpen, setIsBindingOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Deposit Form Info
  const [depositAmount, setDepositAmount] = useState<number>(113);
  const [depositNetwork, setDepositNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [depositHashInput, setDepositHashInput] = useState('');
  const [depositProofInput, setDepositProofInput] = useState(''); // Text representation / simulated file
  const [depositSuccessMsg, setDepositSuccessMsg] = useState('');
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Withdrawal Form Info
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [withdrawNetwork, setWithdrawNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [withdrawAddressInput, setWithdrawAddressInput] = useState(activeUser.wallet.usdtTrc20Address || '');
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState('');
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');

  // Copy helpers
  const [copiedText, setCopiedText] = useState('');
  const [walletSubTab, setWalletSubTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [claimPopup, setClaimPopup] = useState<{
    isOpen: boolean;
    type: 'no_yield' | 'inactive_window' | 'already_claimed' | 'success';
    amount?: number;
  } | null>(null);

  const [isClaiming, setIsClaiming] = useState(false);

  // Profile and Security local states
  const [profileName, setProfileName] = useState(activeUser.name || '');
  const [profileAvatar, setProfileAvatar] = useState(activeUser.avatarUrl || 'gradient-1');
  const [profileStatus, setProfileStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Change password states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // KYC Verification States
  const [kycFullNameInput, setKycFullNameInput] = useState(activeUser.kycFullName || '');
  const [kycCountryInput, setKycCountryInput] = useState(activeUser.kycCountry || '');
  const [kycDocType, setKycDocType] = useState(activeUser.kycDocumentType || 'Passport');
  const [kycFileName, setKycFileName] = useState('');
  const [isKycDragging, setIsKycDragging] = useState(false);
  const [kycStatus, setKycStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // 10 Key Dashboard Cards calculation:
  // 1. Total Investment: sum of cost in investmentRecords
  const calculatedTotalInvest = useMemo(() => {
    return investments.reduce((sum, inv) => sum + inv.totalCost, 0);
  }, [investments]);

  // 2. Daily Profit (Accumulated from active investments based on ROI percentage scaled to 1 day)
  const calculatedDailyProfit = useMemo(() => {
    return investments.reduce((sum, inv) => {
      return sum + inv.dailyProfitRate;
    }, 0);
  }, [investments]);

  // 3. Total Profit Earned (claims history count)
  const totalProfitEarnedAmount = useMemo(() => {
    return claimsHistory
      .filter(c => c.status === 'Claimed')
      .reduce((sum, c) => sum + c.amount, 0) + activeUser.totalProfitEarned;
  }, [claimsHistory, activeUser.totalProfitEarned]);

  // 4. Total Deposits
  const totalDepositsSum = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Deposit' && t.status === 'Approved')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // 5. Total Withdrawals
  const totalWithdrawalsSum = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Withdrawal' && t.status === 'Approved')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // 6. Available Balance (from user profile)
  const availableUserBalance = activeUser.balance;

  // 7. Missed Claims
  const missedClaimsCount = useMemo(() => {
    return claimsHistory.filter(c => c.status === 'Missed' || c.status === 'Expired').length;
  }, [claimsHistory]);

  // 8. Active Projects count
  const activeProjectsCount = useMemo(() => {
    return new Set(investments.map(i => i.projectId)).size;
  }, [investments]);

  // 9. Referral Earnings (sum of Completed Referral Bonus transactions)
  const referralEarningsSum = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Referral Bonus' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // 10. Total Referrals (from completed transactions or pre-simulated logs)
  const userReferrals = useMemo(() => {
    return usersList.filter(u => u.referredBy === activeUser.referralCode);
  }, [usersList, activeUser.referralCode]);

  const totalReferralsCount = useMemo(() => {
    return userReferrals.length;
  }, [userReferrals]);

  // Dynamic automatically calculated Investor Tier (Shield / Badge system)
  const userTier = useMemo(() => {
    return getInvestorTier(calculatedTotalInvest, totalReferralsCount);
  }, [calculatedTotalInvest, totalReferralsCount]);

  // Is Profit claims window active (04:00 PM to 05:00 PM, or 09:00 PM to 10:00 PM)
  const isClaimWindowActive = useMemo(() => {
    return simulatedHour === 16 || simulatedHour === 21;
  }, [simulatedHour]);

  // Filter projects list
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    }).sort((a, b) => {
      if (sortBy === 'roi') return b.expectedRoi - a.expectedRoi;
      if (sortBy === 'price') return a.pricePerShare - b.pricePerShare;
      if (sortBy === 'shares') return b.availableShares - a.availableShares;
      return 0;
    });
  }, [projects, searchQuery, selectedCategory, sortBy]);

  // Calculate Calculator specific yields
  const { calculatorCost, calculatorEstimatedMthly } = useMemo(() => {
    if (!selectedProjectForCalc) return { calculatorCost: 0, calculatorEstimatedMthly: 0 };
    const cost = calculatorShares * selectedProjectForCalc.pricePerShare;
    // Estimated monthly yield is: Cost * (ROI / 12)
    const mthly = cost * ((selectedProjectForCalc.expectedRoi / 100) / 12);
    return { calculatorCost: cost, calculatorEstimatedMthly: mthly };
  }, [selectedProjectForCalc, calculatorShares]);

   const handleApplyWalletBinding = (e: React.FormEvent) => {
    e.preventDefault();
    onBindWallet(trcLink, bepLink);
    setIsBindingOpen(false);
    showStatus("USDT TRC20 & BEP20 wallet addresses bound successfully!", "success");
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSuccessMsg('');
    if (!depositHashInput || depositHashInput.trim().length < 8) {
      showStatus("Please enter a valid USDT transaction TxID hash to allow node verification.", "error");
      return;
    }
    onSubmitDeposit(
      depositAmount,
      depositNetwork,
      depositHashInput,
      depositProofInput || 'screenshot_proof_simulated.png'
    );
    setDepositSuccessMsg("Your deposit proof has been received! Our blockchain auditors will brief confirmation logs shortly.");
    showStatus("Deposit receipt logged under status: PENDING verification.", "success");
    setDepositHashInput('');
    setDepositProofInput('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDepositProofInput(file.name);
    setIsAnalyzingReceipt(true);
    showStatus(`Uploading "${file.name}" for scan...`, "info");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        try {
          const response = await fetch('/api/analyze-receipt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              base64Data,
              mimeType: file.type,
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned error status: ${response.status}`);
          }

          const result = await response.json();
          if (result.success && result.data) {
            const { txid, amount, network } = result.data;
            let matchMessage = "";

            if (txid) {
              setDepositHashInput(txid);
              matchMessage += `TxID (${txid.slice(0, 10)}...) `;
            }

            if (amount !== undefined && amount !== null && !isNaN(amount)) {
              setDepositAmount(Number(amount));
              matchMessage += `Amount (${amount} USDT) `;
            }

            if (network === 'TRC20' || network === 'BEP20') {
              setDepositNetwork(network);
              matchMessage += `Network (${network}) `;
            }

            if (matchMessage) {
              showStatus(`✨ AI auto-fetched: ${matchMessage} from screenshot!`, "success");
            } else {
              showStatus(`✓ Image "${file.name}" uploaded. No specific details were auto-extracted.`, "success");
            }
          } else {
            showStatus(`✓ Image "${file.name}" uploaded as payment proof.`, "success");
          }
        } catch (apiErr: any) {
          console.error("API error during receipt analysis:", apiErr);
          showStatus(`✓ Image "${file.name}" attached. (AI auto-fetch unavailable, please type TxID/amount manually)`, "info");
        } finally {
          setIsAnalyzingReceipt(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("FileReader error:", err);
      setIsAnalyzingReceipt(false);
      showStatus("Failed to read selected screenshot file.", "error");
    }
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg('');
    setWithdrawSuccessMsg('');

    if (withdrawAmount > availableUserBalance) {
      setWithdrawErrorMsg("Insufficient active funds. You cannot withdraw more than your available balance.");
      showStatus("Withdrawal rejected: Insufficient available balance.", "error");
      return;
    }
    if (withdrawAmount < 10) {
      setWithdrawErrorMsg("The minimum allowed withdrawal on TRC20/BEP20 is $10 USDT.");
      showStatus("Withdrawal rejected: Amount below minimum check.", "error");
      return;
    }
    if (!withdrawAddressInput || withdrawAddressInput.length < 10) {
      setWithdrawErrorMsg("Please provide a certified destination USDT address.");
      showStatus("Withdrawal rejected: Wallet address destination required.", "error");
      return;
    }

    onSubmitWithdrawal(withdrawAmount, withdrawNetwork, withdrawAddressInput);
    setWithdrawSuccessMsg("Your withdrawal claim was logged! Pending inspection, your funds are securely reserved under audit lock.");
    showStatus("Withdrawal request created successfully! Funds in reserve lock.", "success");
  };

  const handleCalculatorPurchase = () => {
    if (!selectedProjectForCalc) return;
    const res = onPurchaseShares(selectedProjectForCalc.id, calculatorShares);
    if (res.success) {
      showStatus(`Purchase Success! Acquired co-ownership shares of ${selectedProjectForCalc.name}. Check your active holdings in Overview.`, "success");
      setSelectedProjectForCalc(null);
    } else {
      showStatus(`Share Purchase Rejected: ${res.error}`, "error");
    }
  };

  return (
    <div id="fundora-portal-layout" className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc] text-slate-800">
      
      {/* 0. Professional Desktop Sidebar (visible on screens >= md) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-100 border-r border-slate-900 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Sidenav Header */}
        <div className="p-5 border-b border-slate-900 flex items-center space-x-2.5 bg-slate-950">
          <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-emerald-500 rounded-lg text-slate-950 font-black">
            <Building className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-white tracking-widest text-sm font-mono block">FUNDORA</span>
            <span className="text-[8px] text-amber-400 font-mono tracking-wider block leading-none font-bold">FRACTIONAL REAL ESTATE</span>
          </div>
        </div>

        {/* User Account widget */}
        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-xs text-emerald-450 uppercase">
            {activeUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-slate-100 leading-none truncate">{activeUser.name}</span>
              <span className="px-1 py-0.5 bg-emerald-500/25 text-[7px] font-mono font-bold text-emerald-400 uppercase tracking-wider rounded shrink-0">
                VERIFIED
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-tight block truncate mt-0.5">{activeUser.email}</span>
          </div>
        </div>

        {/* Sim Clock widget for layout reference */}
        <div className="p-4 border-b border-slate-900 text-[11px] font-mono space-y-1.5 bg-slate-900/5">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Clock className="w-3.5 h-3.5 animate-pulse text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-300">Clock HUD:</span>
          </div>
          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-white font-bold tracking-widest text-center">
            {simulatedHour.toString().padStart(2, '0')}:{simulatedMinute.toString().padStart(2, '0')}
          </div>
          <div className="flex items-center justify-between gap-1 mt-2">
            <span className="text-[9px] text-slate-500">Status:</span>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-900/30 rounded">
              🟢 SECURE LIVE SYNC
            </span>
          </div>
        </div>

        {/* Sidebar Sidenav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 bg-slate-950">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'properties'
                ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Properties</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'wallet'
                ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>
          <button
            onClick={() => setActiveTab('claim')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'claim'
                ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Claim Daily</span>
            </div>
            {isClaimWindowActive && (
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'referrals'
                ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & Referrals</span>
          </button>
        </nav>

        {/* Separator */}
        <div className="border-t border-slate-900/60 my-3 mx-4"></div>

        {/* Dedicated Separate Profile Button Card */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-white shadow-sm'
                : 'border-slate-900/50 bg-slate-950/40 hover:bg-slate-900/30 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase shrink-0 relative ${getAvatarBgClass(userTier.id)}`}>
                {activeUser.email.slice(0, 2)}
                {/* Dynamic mini shield icon overlay */}
                <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-950 border border-slate-900 shadow-sm ${userTier.color}`}>
                  {userTier.id === 'tier-5' ? <Crown className="w-2 h-2" /> : <Shield className="w-2 h-2" />}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-[11px] font-black truncate leading-tight ${activeTab === 'profile' ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-100'}`}>{activeUser.name || 'Investor'}</span>
                <span className={`text-[8.5px] font-mono tracking-wider flex items-center gap-1 font-bold ${userTier.color}`}>
                  <span className="w-1 h-1 bg-current rounded-full animate-pulse"></span>
                  {userTier.name}
                </span>
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform ${activeTab === 'profile' ? 'rotate-90 text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Sidenav bottom commands */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 space-y-2">
          {activeUser.role === 'admin' && (
            <button
              onClick={onNavigateAdmin}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase rounded-lg tracking-wider transition-all block text-center"
            >
              👑 Portal Admin Desk
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-lg tracking-wider transition-all block text-center border border-slate-800"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Content panel wrapper (flex layout starts here) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 2. Mini Timing Settlement Warning Bar (visible everywhere) */}
        <div className="bg-[#0f172a] text-white px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
          <div className="flex items-center space-x-2 text-[#10b981]">
            <Clock className="w-3.5 h-3.5 animate-pulse text-[#10b981] shrink-0" />
            <span className="font-semibold text-slate-300">
              Settlement claim clock (4PM-5PM & 9PM-10PM):
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-705 text-white font-bold tracking-widest">
              {simulatedHour.toString().padStart(2, '0')}:{simulatedMinute.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Timetravel controller for evaluating the 4 PM and 9 PM constraint */}
          <div className="flex items-center space-x-1.5 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30">
            <span className="text-[9.5px] text-emerald-400 font-bold uppercase tracking-wider">
              🔒 SECURED TIME ENGINE
            </span>
          </div>
        </div>

        {/* 3. Mobile-only Tab bar selectors */}
        <nav className="bg-white border-b border-slate-200 px-1 py-1.5 flex md:hidden justify-between items-center shadow-xs">
          <button
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 border-b-2 text-[9px] font-extrabold uppercase tracking-wide transition-colors ${
              activeTab === 'overview' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span>Overview</span>
          </button>
          <button
            id="tab-properties"
            onClick={() => setActiveTab('properties')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 border-b-2 text-[9px] font-extrabold uppercase tracking-wide transition-colors ${
              activeTab === 'properties' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Building className="w-4 h-4 mb-0.5" />
            <span>Projects</span>
          </button>
          <button
            id="tab-wallet"
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 border-b-2 text-[9px] font-extrabold uppercase tracking-wide transition-colors ${
              activeTab === 'wallet' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Wallet className="w-4 h-4 mb-0.5" />
            <span>Wallet</span>
          </button>
          <button
            id="tab-claim"
            onClick={() => setActiveTab('claim')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 border-b-2 text-[9px] font-extrabold uppercase tracking-wide transition-colors relative ${
              activeTab === 'claim' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Percent className="w-4 h-4 mb-0.5 text-amber-500" />
            <span>Claim</span>
            {isClaimWindowActive && (
              <span className="absolute top-1 right-2.5 w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping"></span>
            )}
          </button>
          <button
            id="tab-referrals"
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 border-b-2 text-[9px] font-extrabold uppercase tracking-wide transition-colors ${
              activeTab === 'referrals' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Referrals</span>
          </button>
        </nav>

        {/* 4. Active Tab Stage */}
        <div className="p-4 pb-36 md:pb-8 space-y-6 flex-1 overflow-y-auto">

          {/* Elegant Custom Status Notification Banner */}
          {dashboardStatus && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fadeIn shadow-md transition-all ${
              dashboardStatus.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : dashboardStatus.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}>
              {dashboardStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : dashboardStatus.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-semibold leading-relaxed">{dashboardStatus.message}</p>
              </div>
              <button 
                onClick={() => setDashboardStatus(null)}
                className="text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Welcome banner */}
            <div className="bg-[#0f172a] text-white p-5 rounded-[1.25rem] border border-slate-850 flex justify-between items-center relative overflow-hidden shadow-md">
              <div className="relative z-10">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Welcome to Fundora Portal 
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                </h3>
                <p className="text-[10px] text-slate-300 leading-normal max-w-sm mt-1">
                  Leverage co-ownership and watch your fractional shares build value. Bind your TRC20/BEP20 cryptographic keys below to initialize wire transfers.
                </p>
              </div>
              <div className="text-right shrink-0 relative z-10 font-mono">
                <span className="text-[9px] text-slate-400 uppercase block">My Code</span>
                <span className="text-xs font-bold text-amber-400 tracking-wider">{activeUser.referralCode}</span>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Quick action bindings */}
            {(!activeUser.wallet.usdtTrc20Address && !activeUser.wallet.usdtBep20Address) && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[1.25rem] flex items-center justify-between gap-2.5 shadow-xs">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-800 block">Crypto Wallet Not Configured</span>
                  <p className="text-[9px] text-amber-700">Setup your USDT TRC20/BEP20 keys to receive authorized yields.</p>
                </div>
                <button
                  id="open-bind-wallet-btn"
                  onClick={() => setIsBindingOpen(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-bold uppercase rounded-lg shrink-0 tracking-wider transition-all shadow-xs"
                >
                  Bind Wallet
                </button>
              </div>
            )}

            {/* Wallet addresses bind modal box */}
            {isBindingOpen && (
              <div className="p-5 bg-white border border-slate-200 rounded-[1.25rem] space-y-3 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">🔒 Bind Investment Wallets</span>
                  <button onClick={() => setIsBindingOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Provide your destination public keys. No password required. We only use these addresses to routing your verified yield withdrawals.
                </p>
                <form onSubmit={handleApplyWalletBinding} className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">USDT Address (TRC20 Network)</span>
                    <input 
                      type="text"
                      required
                      value={trcLink}
                      onChange={(e) => setTrcLink(e.target.value)}
                      placeholder="e.g. TX1h2A9eFm7xKsZ8Jq9w..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">USDT Address (BEP20 Network)</span>
                    <input 
                      type="text"
                      required
                      value={bepLink}
                      onChange={(e) => setBepLink(e.target.value)}
                      placeholder="e.g. 0x71C7656EC7ab88b0..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs tracking-wider uppercase shadow-xs transition-colors"
                  >
                    Save & Authenticate Addresses
                  </button>
                </form>
              </div>
            )}

            {/* THE 10 DASHBOARD CARDS */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">📊 Investor Live Statistics</h4>
              
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Total Investment */}
                <div id="card-total-investment" className="bg-white border border-[#e2e8f0] border-l-4 border-amber-500 rounded-[1.25rem] p-4 space-y-1 hover:border-amber-400 hover:shadow-xs transition-all text-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Investment</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-black text-slate-900 font-mono">${calculatedTotalInvest.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 block font-mono">📋 {investments.length} Share Receipts</span>
                </div>

                {/* 2. Daily Profit */}
                <div id="card-daily-profit" className="bg-white border border-[#e2e8f0] rounded-[1.25rem] p-4 space-y-1 hover:border-emerald-500 transition-all relative overflow-hidden text-slate-800">
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-[10px] text-slate-400 font-medium block">Daily Profit Avg</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-black text-emerald-600 font-mono">+${calculatedDailyProfit.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 block font-mono">Credited daily 9-10PM</span>
                </div>

                {/* 3. Total Profit Earned */}
                <div id="card-total-profit" className="bg-white border border-[#e2e8f0] rounded-[1.25rem] p-4 space-y-1 hover:border-[#10b981] hover:shadow-xs transition-all text-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Profit Earned</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-slate-900 font-mono">${totalProfitEarnedAmount.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-slate-550 block font-mono">Collected into Bal</span>
                </div>

                {/* 4. Total Deposits */}
                <div id="card-total-deposits" className="bg-white border border-[#e2e8f0] rounded-[1.25rem] p-4 space-y-1 hover:border-slate-300 transition-all text-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Deposits</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-slate-700 font-mono">${(activeUser.totalDeposited + totalDepositsSum).toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono">USD Wire Equivalent</span>
                </div>

                {/* 5. Total Withdrawals */}
                <div id="card-total-withdrawals" className="bg-white border border-[#e2e8f0] rounded-[1.25rem] p-4 space-y-1 hover:border-slate-300 transition-all text-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Withdrawals</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-slate-700 font-mono">${(activeUser.totalWithdrawn + totalWithdrawalsSum).toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono">TRC20/BEP20 Paid</span>
                </div>

                {/* 6. Available Balance */}
                <div id="card-available-balance" className="bg-[#0f172a] text-white border border-slate-800 rounded-[1.25rem] p-4 space-y-1 hover:border-amber-500 transition-all relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                  <span className="text-[10px] text-amber-400 font-medium font-mono uppercase tracking-wider block">Available Balance</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-black text-amber-300 font-mono">${availableUserBalance.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-amber-500/80 block font-mono">Ready to Invest or Withdraw</span>
                </div>

                {/* 7. Missed Claims */}
                <div id="card-missed-claims" className="bg-white border border-slate-200 border-l-4 border-rose-500 rounded-[1.25rem] p-4 space-y-1 hover:border-rose-400 transition-all text-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium block">Missed Claims</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-rose-600 font-mono">{missedClaimsCount} Daily Claims</span>
                  </div>
                  <span className="text-[9px] text-rose-500 block font-mono">Expired due to window close</span>
                </div>

                {/* 8. Active Projects */}
                <div id="card-active-projects" className="bg-white border border-[#e2e8f0] rounded-[1.25rem] p-4 space-y-1 text-slate-800 transition-all">
                  <span className="text-[10px] text-slate-400 font-medium block">Active Projects Bound</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-slate-800 font-mono">{activeProjectsCount} Locations</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono">Residential & Comm</span>
                </div>

                {/* 9. Referral Earnings */}
                <div id="card-referral-earnings" className="bg-white border border-[#e2e8f0] rounded-[1.25rem] p-4 space-y-1 text-slate-800 transition-all">
                  <span className="text-[10px] text-slate-400 font-medium block">Referral Earnings</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-emerald-600 font-mono">${referralEarningsSum.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 block font-mono">10% Dynamic triggers paid</span>
                </div>

                {/* 10. Total Referrals */}
                <div id="card-total-referrals" className="bg-white border border-[#e2e8f0] rounded-[1.25rem] p-4 space-y-1 text-slate-800 transition-all">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Referrals</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-slate-800 font-mono">{totalReferralsCount} Signups</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono">Unique code binding</span>
                </div>

              </div>
            </div>

            {/* Portfolio detail list */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">💼 My Portfolio Holdings</h4>
              
              {investments.length === 0 ? (
                <div className="text-center py-8 bg-white border border-slate-200 rounded-[1.25rem] text-slate-500 text-xs shadow-xs">
                  <p>You do not have any active fractional shares yet.</p>
                  <button 
                    onClick={() => setActiveTab('properties')}
                    className="mt-3 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-bold uppercase rounded-lg text-[10px] tracking-wider transition-colors"
                  >
                    View Property Catalogs
                  </button>
                </div>
              ) : (
                <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-[1.25rem] font-mono text-[11px] shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold text-center">
                        <th className="p-3 text-left animate-none">Property Location Name</th>
                        <th className="p-3 animate-none">Shares & Status</th>
                        <th className="p-3 animate-none">Cost Basis</th>
                        <th className="p-3 animate-none">Time Left</th>
                        <th className="p-3 text-emerald-600 animate-none">Daily Payout</th>
                        <th className="p-3 text-slate-600 animate-none">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-center text-slate-700">
                      {investments.map((inv) => {
                        const isCompleted = inv.status === 'Completed';
                        const isLiquidated = inv.status === 'Liquidated';
                        const isActive = !isCompleted && !isLiquidated;

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-left font-sans font-bold text-slate-800 text-[12px]">
                              {inv.projectName}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-slate-800 font-bold">{inv.sharesPurchased} Shs</span>
                                {isCompleted && (
                                  <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                    Matured
                                  </span>
                                )}
                                {isLiquidated && (
                                  <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                    Liquidated
                                  </span>
                                )}
                                {isActive && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                    Active
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-650 font-medium">
                              ${inv.totalCost.toFixed(2)}
                            </td>
                            <td className="p-3 font-semibold text-slate-600">
                              {isActive ? (
                                <div className="space-y-0.5">
                                  <span className="text-amber-600">{inv.remainingMonths !== undefined ? inv.remainingMonths : (inv.durationMonths || 12)} mos left</span>
                                  <span className="block text-[9px] text-slate-400">of {inv.durationMonths || 12} mos</span>
                                </div>
                              ) : isCompleted ? (
                                <span className="text-sky-600 font-bold">Matured (100% Paid)</span>
                              ) : (
                                <span className="text-slate-400">Terminated</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-emerald-600">
                              {isActive ? `+$${inv.dailyProfitRate.toFixed(2)} /day` : '$0.00'}
                            </td>
                            <td className="p-3">
                              {isActive ? (
                                confirmLiquidateId === inv.id ? (
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = onLiquidateInvestment(inv.id);
                                        if (res && res.success) {
                                          showStatus(`Successfully sold shares! $${res.payout.toFixed(2)} USDT added to your balance (with 20% loss deduction).`, "success");
                                        } else {
                                          showStatus("Unable to liquidate shares at this time.", "error");
                                        }
                                        setConfirmLiquidateId(null);
                                      }}
                                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[9px] uppercase cursor-pointer transition-colors shrink-0"
                                    >
                                      Yes, Sell (-20%)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmLiquidateId(null)}
                                      className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[9px] uppercase cursor-pointer transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmLiquidateId(inv.id)}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[9px] uppercase tracking-wide cursor-pointer transition-colors"
                                    title="Sell your shares early with a 20% deduction"
                                  >
                                    Sell Shares
                                  </button>
                                )
                              ) : (
                                <span className="text-slate-400 font-medium">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('properties')}
                className="p-4 bg-white border border-slate-200 hover:border-[#10b981] rounded-[1.25rem] text-left space-y-2 group transition-all shadow-xs"
              >
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl w-max"><Building className="w-4 h-4" /></div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 font-sans group-hover:text-emerald-600 block">Buy Fractional Shares</span>
                  <span className="text-[9px] text-slate-500 block leading-tight">Explore the properties catalog and start earning capital yields right away.</span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('wallet')}
                className="p-4 bg-white border border-slate-200 hover:border-[#10b981] rounded-[1.25rem] text-left space-y-2 group transition-all shadow-xs"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl w-max"><Wallet className="w-4 h-4" /></div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 font-sans group-hover:text-emerald-600 block">Binance Transfers Hub</span>
                  <span className="text-[9px] text-slate-500 block leading-tight">Deposit coins via secure TRC20/BEP20 or submit custom withdrawal requests.</span>
                </div>
              </button>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: PROPERTIES ==================== */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            
            {/* Catalog search tools */}
            <div className="bg-white border border-slate-200 p-5 rounded-[1.25rem] space-y-3.5 shadow-sm text-slate-800">
              <div className="flex flex-col sm:flex-row gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search locations or project names..."
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Sort selector */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">SortBy:</span>
                  <select 
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-250 text-xs rounded-xl p-2.5 text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="roi">Expected Yield (High to Low)</option>
                    <option value="price">Share Price (Low to High)</option>
                    <option value="shares">Available Shares</option>
                  </select>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Category:</span>
                {['All', 'Residential', 'Commercial', 'Luxury', 'Co-Living'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                      selectedCategory === cat 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Properties Cards list */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id}
                  className="bg-white border border-[#e2e8f0] rounded-[1.25rem] overflow-hidden hover:border-[#10b981] shadow-sm hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  {/* Image and Category */}
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <img 
                      src={project.imageUrl} 
                      alt={project.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700 text-[9px] font-bold font-mono tracking-wider text-amber-400">
                      {project.category.toUpperCase()}
                    </div>
                    {project.status === 'Sold Out' && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-4 py-2 bg-red-500/80 border border-red-500 text-white font-mono font-bold tracking-widest text-xs uppercase rounded-lg">
                          SOLDOUT
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono tracking-tight">
                        <MapPin className="w-3 text-emerald-600" />
                        <span>{project.location}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 font-sans truncate">{project.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center font-mono text-[10px] border border-slate-200">
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase">Yield ROI</span>
                        <span className="text-xs font-bold text-emerald-600">+{project.expectedRoi}% /yr</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase">Share Price</span>
                        <span className="text-xs font-bold text-emerald-600">${project.pricePerShare}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase">Duration</span>
                        <span className="text-xs font-bold text-emerald-600">{project.durationMonths || 12} Mos</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between text-slate-500">
                        <span>Available: {project.availableShares} / {project.totalShares} shs</span>
                        <span className="font-bold text-emerald-600">
                          {project.status === 'Sold Out' ? '100% Sold' : `${Math.round(((project.totalShares - project.availableShares) / project.totalShares) * 100)}%`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="bg-[#10b981] h-full rounded-full"
                          style={{ width: `${project.status === 'Sold Out' ? 100 : ((project.totalShares - project.availableShares) / project.totalShares) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Documents List */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="block text-[9px] font-mono uppercase text-slate-400 mb-1.5 font-bold">📂 Secured Legal Documents</span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                        {project.documents.map((doc, dIdx) => (
                          <span 
                            key={dIdx}
                            className="bg-slate-50 border border-slate-200 hover:border-emerald-500 cursor-pointer p-1 rounded-lg text-slate-600 flex items-center gap-1 shrink-0 transition-colors"
                            onClick={() => showStatus(`Inquiry Logged: Downloading certified legal prospectus template of ${doc}. Approved by regulatory bodies.`, "info")}
                          >
                            <FileText className="w-2.5 h-2.5 text-[#10b981]" />
                            <span>{doc}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buy CTA button with math calculator selection */}
                    {project.status === 'Active' ? (
                      <button
                        id={`project-calc-btn-${project.id}`}
                        onClick={() => {
                          setSelectedProjectForCalc(project);
                          setCalculatorShares(1);
                        }}
                        className="w-full py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Calculate & Purchase Shares</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-400 font-bold rounded-xl text-xs uppercase tracking-wider cursor-not-allowed"
                      >
                        Property Unavailable
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* INVESTMENT DRAWER MODAL POPUP */}
            {selectedProjectForCalc && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white border border-slate-200 rounded-[1.25rem] p-6 max-w-sm w-full space-y-4 shadow-xl relative text-slate-850">
                  
                  <button 
                    onClick={() => setSelectedProjectForCalc(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest font-bold">Fractional Share Calculator</span>
                    <h5 className="font-sans font-bold text-slate-900 text-sm leading-tight truncate">
                      {selectedProjectForCalc.name}
                    </h5>
                    <span className="text-[10px] text-slate-500 block font-mono">Price Per Share: <strong className="text-slate-800">${selectedProjectForCalc.pricePerShare} USDT</strong></span>
                  </div>

                  {/* Calculator visual settings */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    
                    <div className="space-y-1 text-center font-mono">
                      <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400">Select Shares Quantity</span>
                      
                      {/* Plus minus manual input */}
                      <div className="flex items-center justify-center space-x-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setCalculatorShares(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center font-bold font-mono text-sm text-slate-705"
                        >
                          -
                        </button>
                        
                        <input 
                          type="number"
                          min={1}
                          max={selectedProjectForCalc.availableShares}
                          value={calculatorShares}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCalculatorShares(isNaN(val) ? 1 : Math.max(1, val));
                          }}
                          className="w-16 bg-white border border-slate-250 text-center text-sm font-mono font-bold text-slate-800 p-1 rounded-lg focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => setCalculatorShares(prev => Math.min(selectedProjectForCalc.availableShares, prev + 1))}
                          className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center font-bold font-mono text-sm text-slate-705"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Selection Presets */}
                    <div className="grid grid-cols-5 gap-1 pt-1 text-center font-mono">
                      {[1, 2, 5, 10, 50].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCalculatorShares(Math.min(selectedProjectForCalc.availableShares, num))}
                          className={`p-1 border text-[9px] font-bold rounded-lg ${
                            calculatorShares === num 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {num} Shs
                        </button>
                      ))}
                    </div>

                    {/* Auto Calculation outputs */}
                    <div className="border-t border-slate-200 pt-2 space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Total Cost Basis:</span>
                        <span className="font-bold text-slate-900">${calculatorCost.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Expected Yield ({selectedProjectForCalc.expectedRoi}%):</span>
                        <span className="font-bold text-emerald-600">+${(calculatorCost * (selectedProjectForCalc.expectedRoi / 100)).toFixed(2)} /yr</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Estimated monthly profit:</span>
                        <span className="font-bold text-emerald-600">+${calculatorEstimatedMthly.toFixed(2)} /m</span>
                      </div>
                      <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-1">
                        <span>My Wallet Balance:</span>
                        <span className="font-bold text-amber-600">${availableUserBalance.toFixed(2)} USDT</span>
                      </div>
                    </div>

                  </div>

                  {/* Anti-Fraud Check alert indicator */}
                  {calculatorCost >= 113 && activeUser.referredBy && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[9px] font-mono text-emerald-800">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dual 10% referral bonus (${(calculatorCost * 0.1).toFixed(2)}) will trigger successfully!</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      id="confirm-share-purchase-cta"
                      onClick={handleCalculatorPurchase}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase rounded-lg text-[10px] tracking-wider shadow-xs transition-colors"
                    >
                      Process Secure Purchase
                    </button>
                    <button
                      onClick={() => setSelectedProjectForCalc(null)}
                      className="w-full py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase transition-colors"
                    >
                      Cancel Purchase
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

                 {/* ==================== TAB 3: WALLET & DEPOSITS ==================== */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">

            {/* INTEGRATED WALLET BINDING CENTER */}
            <div className="bg-white border border-slate-200 rounded-[1.25rem] p-5 space-y-4 shadow-sm text-slate-800 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-sans font-bold text-slate-900">Cryptographic Identity Binding</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Verify and bind your designated receiving credentials</span>
                  </div>
                </div>
                <div className="hidden sm:block text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Secure Node Locks
                </div>
              </div>

              {/* Bound networks list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* TRC20 Binding Card */}
                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500">USDT (TRC20 Network)</span>
                    {activeUser.wallet.usdtTrc20Address ? (
                      <span className="text-[8px] font-bold uppercase font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Active Bound
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold uppercase font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Unconfigured
                      </span>
                    )}
                  </div>
                  {activeUser.wallet.usdtTrc20Address ? (
                    <div className="space-y-2">
                      <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-slate-800 truncate flex items-center justify-between gap-1.5">
                        <span className="truncate">{activeUser.wallet.usdtTrc20Address}</span>
                        <button 
                          onClick={() => triggerCopy(activeUser.wallet.usdtTrc20Address || '', 'trc_wallet_copy')}
                          className="text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                          title="Copy Address"
                        >
                          {copiedText === 'trc_wallet_copy' ? (
                            <span className="text-[9px] text-[#10b981] font-bold uppercase font-sans">Copied</span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Paste TRC20 Wallet Address (e.g. TX...)"
                        value={trcLink}
                        onChange={(e) => setTrcLink(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 placeholder:text-slate-350 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* BEP20 Binding Card */}
                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500">USDT (BEP20 Network)</span>
                    {activeUser.wallet.usdtBep20Address ? (
                      <span className="text-[8px] font-bold uppercase font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Active Bound
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold uppercase font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Unconfigured
                      </span>
                    )}
                  </div>
                  {activeUser.wallet.usdtBep20Address ? (
                    <div className="space-y-2">
                      <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-slate-800 truncate flex items-center justify-between gap-1.5">
                        <span className="truncate">{activeUser.wallet.usdtBep20Address}</span>
                        <button 
                          onClick={() => triggerCopy(activeUser.wallet.usdtBep20Address || '', 'bep_wallet_copy')}
                          className="text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                          title="Copy Address"
                        >
                          {copiedText === 'bep_wallet_copy' ? (
                            <span className="text-[9px] text-[#10b981] font-bold uppercase font-sans">Copied</span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Paste BEP20 Wallet Address (e.g. 0x...)"
                        value={bepLink}
                        onChange={(e) => setBepLink(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 placeholder:text-slate-350 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Inline Save button if any is unbound */}
              {(!activeUser.wallet.usdtTrc20Address || !activeUser.wallet.usdtBep20Address) && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      if (!trcLink && !bepLink) {
                        showStatus("Please paste a wallet address for at least one network.", "error");
                        return;
                      }
                      onBindWallet(trcLink || activeUser.wallet.usdtTrc20Address || '', bepLink || activeUser.wallet.usdtBep20Address || '');
                      showStatus("Wallet addresses bound and verified securely! You can use them to auto-fill withdrawals instantly.", "success");
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase shadow-xs transition-colors cursor-pointer animate-pulse"
                  >
                    💾 Bind Cryptographic Addresses
                  </button>
                </div>
              )}
            </div>

            {/* SUB-MENU SELECTION KEYPAD FOR WALLET OPERATIONS */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-205 w-full sm:w-max gap-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setWalletSubTab('deposit');
                  showStatus("Activated Deposit Portal View", "info");
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-sans font-extrabold uppercase transition-all duration-200 cursor-pointer ${
                  walletSubTab === 'deposit'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-bold bg-transparent'
                }`}
              >
                <ArrowDownCircle className={`w-4 h-4 ${walletSubTab === 'deposit' ? 'text-white' : 'text-slate-500'}`} />
                📥 Deposit Hub
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletSubTab('withdraw');
                  showStatus("Activated Withdrawal Liquidation Terminal", "info");
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-sans font-extrabold uppercase transition-all duration-250 cursor-pointer ${
                  walletSubTab === 'withdraw'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-bold bg-transparent'
                }`}
              >
                <ArrowUpCircle className={`w-4 h-4 ${walletSubTab === 'withdraw' ? 'text-white' : 'text-slate-605'}`} />
                📤 Withdrawal Hub
              </button>
            </div>

            {walletSubTab === 'deposit' ? (
              /* LEFT COLUMN: USDT DEPOSIT PORTAL GATEWAY */
              <div id="binance-deposit-module" className="bg-white border border-slate-200 rounded-[1.25rem] p-5 space-y-4 shadow-sm text-slate-800 animate-fadeIn w-full max-w-2xl">
                <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 shrink-0">
                    <ArrowDownCircle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-sans font-bold text-slate-900">Binance Secure Deposit Hub</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Credit portfolios via on-chain smart verification</span>
                  </div>
                </div>

                {depositSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-xs text-emerald-800 leading-normal font-sans shadow-xs">
                    ✨ {depositSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs font-mono">
                  
                  {/* Network Toggles with visuals (TRC20 vs BEP20) */}
                  <div className="space-y-1.5 font-mono">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">USDT Blockchain Network Selection</span>
                    <div className="grid grid-cols-2 gap-3.5">
                      
                      {/* TRC20 Card Selector */}
                      <div 
                        onClick={() => {
                          setDepositNetwork('TRC20');
                          showStatus("Switched payment destination to Tron blockchain (TRC20).", "info");
                        }}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                          depositNetwork === 'TRC20'
                            ? 'bg-amber-50/40 border-amber-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="font-bold text-slate-900 block font-sans">USDT - TRC20</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5">Tron Mainnet Token</span>
                      </div>

                      {/* BEP20 Card Selector */}
                      <div 
                        onClick={() => {
                          setDepositNetwork('BEP20');
                          showStatus("Switched payment destination to Binance Smart Chain (BEP20).", "info");
                        }}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                          depositNetwork === 'BEP20'
                            ? 'bg-emerald-50/40 border-emerald-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="font-bold text-slate-900 block font-sans">USDT - BEP20</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5">BNB Smart Chain (BSC)</span>
                      </div>

                    </div>
                  </div>

                  {/* Deposit Amount configuration */}
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">USDT Deposit Quantity</span>
                      <span className="text-[9px] text-[#10b981] font-bold">Estimated shares: {(depositAmount / 113).toFixed(2)} Slots</span>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                      <input 
                        type="number"
                        required
                        min={10}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-7 pr-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>

                    {/* Preconfigured amount shortcut blocks */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[50, 100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setDepositAmount(amt);
                            showStatus(`Deposit set to $${amt} USDT. (Estimates ${Math.floor(amt / 113)} share packages)`, "info");
                          }}
                          className={`px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[10px] text-[10px] font-bold cursor-pointer ${
                            depositAmount === amt ? 'bg-amber-100 text-amber-850 border-amber-300' : 'text-slate-600'
                          }`}
                        >
                          +${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Invoice card containing visual invoice details and copy tools */}
                  <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-900 space-y-3 font-mono">
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="w-full truncate">
                        <span className="text-[8px] text-amber-400 uppercase block font-bold tracking-widest leading-none mb-1">Company Wallet Contract</span>
                        <span className={`text-[10px] select-all block truncate font-mono ${
                          (depositNetwork === 'TRC20' ? systemSettings.usdtTrc20Address : systemSettings.usdtBep20Address)
                            ? 'text-slate-350'
                            : 'text-red-400 italic font-sans font-bold'
                        }`}>
                          {(depositNetwork === 'TRC20' 
                            ? (systemSettings.usdtTrc20Address || '') 
                            : (systemSettings.usdtBep20Address || '')) || '⚠️ Wallet not configured by admin'}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        disabled={!(depositNetwork === 'TRC20' ? systemSettings.usdtTrc20Address : systemSettings.usdtBep20Address)}
                        onClick={() => triggerCopy(
                          depositNetwork === 'TRC20' 
                            ? (systemSettings.usdtTrc20Address || '') 
                            : (systemSettings.usdtBep20Address || ''),
                          'address'
                        )}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[9px] uppercase border border-slate-800 text-amber-400 font-bold tracking-wider shrink-0 shadow-xs transition-colors cursor-pointer"
                      >
                        {copiedText === 'address' ? 'Copied' : 'Copy Key'}
                      </button>
                    </div>

                    {/* QR Code container with laser tracker */}
                    <div className="flex items-center space-x-3.5 bg-slate-900/60 p-3 text-[9px] text-slate-400 rounded-lg border border-slate-900/80">
                      <div className="w-12 h-12 bg-white p-0.5 rounded shrink-0 flex items-center justify-center border border-slate-700 relative overflow-hidden select-none">
                        {depositNetwork === 'TRC20' ? (
                          systemSettings.usdtTrc20QrCode ? (
                            <img 
                              src={systemSettings.usdtTrc20QrCode} 
                              alt="USDT TRC20 QR Code"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : systemSettings.usdtTrc20Address ? (
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(systemSettings.usdtTrc20Address)}`} 
                              alt="USDT TRC20 QR Code"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-[8px] text-slate-500 text-center flex items-center justify-center h-full">No QR</div>
                          )
                        ) : (
                          systemSettings.usdtBep20QrCode ? (
                            <img 
                              src={systemSettings.usdtBep20QrCode} 
                              alt="USDT BEP20 QR Code"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : systemSettings.usdtBep20Address ? (
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(systemSettings.usdtBep20Address)}`} 
                              alt="USDT BEP20 QR Code"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-[8px] text-slate-500 text-center flex items-center justify-center h-full">No QR</div>
                          )
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-300 block uppercase text-[8px] tracking-wider text-amber-400 font-sans">
                          {systemSettings.scanGateTitle || 'Barcode Scanning Gateway'}
                        </span>
                        <span className="text-[8px] text-slate-400">
                          {systemSettings.scanGateSubtitle || 'Dispatch on the matching blockchain. Tokens sent to mismatched networks are irreversibly lost.'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Transaction ID Hash submission */}
                  <div className="space-y-1.5 font-mono">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Transaction Hash (TxID)</span>
                    <input 
                      type="text"
                      required
                      value={depositHashInput}
                      onChange={(e) => setDepositHashInput(e.target.value)}
                      placeholder="Paste TxID hash (e.g. ce880bceef92987...)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  {/* Interactive proof of payment slip uploader */}
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Payment Receipt Proof</span>
                    
                    {/* Hidden Native File Input */}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div 
                      onClick={() => {
                        if (!isAnalyzingReceipt) {
                          fileInputRef.current?.click();
                        }
                      }}
                      className="border border-dashed border-slate-250 hover:border-amber-500 bg-slate-50/50 hover:bg-slate-100/50 p-4 rounded-xl text-center space-y-1.5 cursor-pointer transition-all relative overflow-hidden"
                    >
                      {isAnalyzingReceipt ? (
                        <div className="py-2 space-y-2 flex flex-col items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-amber-600 font-bold block uppercase tracking-wider animate-pulse">Scanning Receipt...</span>
                            <span className="text-[8px] text-slate-400 block">Extracting transaction hash, amount & network</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mx-auto text-amber-500" />
                          <div>
                            {depositProofInput ? (
                              <div className="space-y-1">
                                <span className="text-[10px] text-emerald-600 font-bold block">✓ {depositProofInput}</span>
                                <span className="text-[8px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest inline-block font-black">Ready for audit dispatch</span>
                              </div>
                            ) : (
                              <>
                                <span className="text-[10px] text-slate-705 font-bold block">Click to upload snapshot receipt</span>
                                <span className="text-[8px] text-slate-400 block">Upload transaction screenshot from your device</span>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-white font-bold uppercase rounded-xl text-[10px] tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    🚀 Broadcast Payment Receipt to Auditors
                  </button>

                </form>
              </div>
            ) : (
              /* RIGHT COLUMN: USDT WITHDRAWAL requested TERMINAL */
              <div id="binance-withdrawal-module" className="bg-white border border-slate-200 rounded-[1.25rem] p-5 space-y-4 shadow-sm text-slate-800 animate-fadeIn w-full max-w-2xl">
                <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
                    <ArrowUpCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-sans font-bold text-slate-900">Withdrawal Liquidation Terminal</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Acquire payouts immediately into your personal secure wallet</span>
                  </div>
                </div>

                {/* Available Balance gloss card display */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Liquidation Funds</span>
                    <span className="text-xl font-mono font-extrabold text-slate-900 block leading-tight">
                      ${availableUserBalance.toFixed(2)} <span className="text-xs text-slate-450 font-normal">USDT</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 font-mono uppercase font-black px-1.5 py-0.5 rounded border border-emerald-200 block">
                      ✓ Audited Liquid
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono block mt-1">Ready for instant dispatch</span>
                  </div>
                </div>

                {withdrawErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-800 font-mono shadow-xs font-bold">
                    ⚠️ {withdrawErrorMsg}
                  </div>
                )}

                {withdrawSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-xs text-emerald-800 leading-normal font-sans shadow-xs font-bold">
                    ✨ {withdrawSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs font-mono">
                  
                  {/* Withdrawal amount selection */}
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Withdrawal Quantity</span>
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawAmount(Math.max(10, Math.floor(availableUserBalance)));
                          showStatus(`Available balance of $${Math.floor(availableUserBalance)} USDT selected.`, "info");
                        }}
                        className="text-[9px] text-emerald-600 font-black hover:underline focus:outline-none cursor-pointer"
                      >
                        ⚡ Use Max Liquid
                      </button>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                      <input 
                        type="number"
                        required
                        min={10}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-7 pr-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Network selection for Withdrawal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 font-mono">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">USDT Network Chain</span>
                      <select 
                        value={withdrawNetwork}
                        onChange={(e: any) => {
                          const net = e.target.value;
                          setWithdrawNetwork(net);
                          const addr = net === 'TRC20' ? activeUser.wallet.usdtTrc20Address : activeUser.wallet.usdtBep20Address;
                          setWithdrawAddressInput(addr || '');
                          showStatus(`Updated liquidation pipeline to ${net} network.`, "info");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="TRC20">USDT (TRC20 Network)</option>
                        <option value="BEP20">USDT (BEP20 Network)</option>
                      </select>
                    </div>

                    {/* Live Processing fee and Net Payout simulation display */}
                    <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl flex flex-col justify-center text-[9px] leading-relaxed">
                      <div className="flex justify-between text-slate-500 font-mono">
                        <span>Platform Withdrawal Fee (20%):</span>
                        <span className="font-semibold text-rose-600">-${(withdrawAmount * 0.20).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-0.5 mt-0.5">
                        <span>Net Payout Liquidity:</span>
                        <span className="text-emerald-600 font-mono font-bold">
                          ${Math.max(0, withdrawAmount * 0.80).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recipient custom address with Auto-fill helper from bounds! */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Destination Crypto Address</span>
                      
                      {/* Interactive Auto-fetch bound button */}
                      <button
                        type="button"
                        onClick={() => {
                          const boundAddress = withdrawNetwork === 'TRC20' 
                            ? activeUser.wallet.usdtTrc20Address 
                            : activeUser.wallet.usdtBep20Address;
                          if (!boundAddress) {
                            showStatus(`You have not bound an address for the ${withdrawNetwork} network yet. Please configure it above first.`, "error");
                            return;
                          }
                          setWithdrawAddressInput(boundAddress);
                          showStatus(`Auto-fetched verified bound address for ${withdrawNetwork} successfully.`, "success");
                        }}
                        className="text-[9px] text-[#10b981] font-black hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        🔗 Auto-Fetch Bound Address
                      </button>
                    </div>

                    <input 
                      type="text"
                      required
                      value={withdrawAddressInput}
                      onChange={(e) => setWithdrawAddressInput(e.target.value)}
                      placeholder={`Paste certified USDT ${withdrawNetwork} recipient address`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />

                    {/* Auto-fill banner alert of critical safety */}
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-1.5 text-[8.5px] text-amber-800 leading-normal font-sans">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        Verify the destination string explicitly before dispatching. Blockchain transfers executed on faulty receiving targets are permanent and unrecoverable.
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase rounded-xl text-[10px] tracking-wider transition-all shadow-md cursor-pointer animate-pulse"
                  >
                    Initiate Safe Vault Withdrawal
                  </button>

                </form>
              </div>
            )}

            {/* History ledger container */}
            <div id="binance-ledger-module" className="space-y-2">
              <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">📋 Ledger History Log</h4>
              
              <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-[1.25rem] font-mono text-[10px] shadow-sm">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[9px] font-bold text-center">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-center">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-550/30 text-slate-700">
                        <td className="p-3 text-left text-slate-400 text-[9px] whitespace-nowrap">{tx.date}</td>
                        <td className="p-3 text-left text-slate-800 font-sans font-bold">{tx.type}</td>
                        <td className="p-3 font-bold text-slate-700">${tx.amount.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] tracking-wider font-extrabold uppercase ${
                            tx.status === 'Approved' || tx.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-rose-100 text-red-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 4: timed CLAIM CENTER ==================== */}
        {activeTab === 'claim' && (
          <div className="space-y-6">

            {/* Timed Claim rules and digital timer */}
            <div className="bg-white border border-slate-200 rounded-[1.25rem] p-5 space-y-4 shadow-sm text-slate-850">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-bold text-slate-900">Profit Claim Center</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Real-time smart contract settlement desk</span>
                </div>
              </div>

              {/* Rules block */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                <span className="font-bold text-slate-800 block uppercase font-mono tracking-wider text-[10px]">Claims Window Constraints</span>
                <p>
                  1. Profit payouts are accrued dynamically to portfolios but are only claimable twice daily: between <strong className="text-slate-900 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-300">04:00 PM and 05:00 PM</strong>, and again between <strong className="text-slate-900 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-300">09:00 PM and 10:00 PM</strong>.
                </p>
                <p>
                  2. If you do not claim within these hourly timelines, your profit <strong className="text-rose-600 font-semibold">expires automatically</strong> for that slot and is permanently unrecoverable.
                </p>
              </div>

              {/* Live Simulated clock display */}
              <div className="p-5 bg-[#0f172a] rounded-xl border border-slate-800 text-center space-y-2">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold block">Current System Clock HUD</span>
                <div className="text-3xl font-black text-white font-mono tracking-wider animate-pulse">
                  {simulatedHour.toString().padStart(2, '0')}:{simulatedMinute.toString().padStart(2, '0')}
                </div>
                <div className="flex items-center justify-center space-x-1.5 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-slate-400">Local evaluation timezone lock</span>
                </div>
              </div>

              {/* Payout actions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-4">
                
                <div className="text-center font-mono">
                  <span className="text-slate-500 text-[9px] uppercase block font-bold">Yield pool ready today</span>
                  <span className="text-2xl font-black text-emerald-600 font-sans mt-0.5 block">
                    {calculatedDailyProfit > 0 ? `$${calculatedDailyProfit.toFixed(2)} USDT` : '$0.00 USDT'}
                  </span>
                </div>

                <button
                  id="claim-profit-button-interactive"
                  disabled={isClaiming}
                  onClick={async () => {
                    if (isClaiming) return;
                    setIsClaiming(true);
                    try {
                      const res = await onClaimDailyProfit();
                      setClaimPopup({
                        isOpen: true,
                        type: res.type,
                        amount: res.amount
                      });
                    } catch (err) {
                      console.error("Claim error", err);
                      setClaimPopup({
                        isOpen: true,
                        type: 'inactive_window',
                        amount: 0
                      });
                    } finally {
                      setIsClaiming(false);
                    }
                  }}
                  className={`relative overflow-hidden w-full py-5 px-8 font-extrabold rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 group cursor-pointer ${
                    isClaiming
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                      : isClaimWindowActive 
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-white shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)] hover:shadow-[0_20px_35px_-6px_rgba(16,185,129,0.65)] hover:-translate-y-0.5' 
                        : 'bg-slate-100 hover:bg-slate-1.5 text-slate-400 border border-slate-200/80 shadow-inner'
                  }`}
                >
                  {/* Subtle shining light sweep effect */}
                  {isClaimWindowActive && !isClaiming && (
                    <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shimmer" />
                  )}

                  {isClaiming ? (
                    <>
                      <Clock className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                      <span className="font-sans font-black tracking-widest text-[13px]">
                        Verifying Secure NTP Clock...
                      </span>
                    </>
                  ) : isClaimWindowActive ? (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                      <span className="font-sans font-black tracking-widest text-[13px] drop-shadow-sm">
                        Collect Profit ({simulatedHour === 16 ? '04:00 PM' : '09:00 PM'} Slot)
                      </span>
                      {/* Active green breathing beacon indicator */}
                      <span className="relative flex h-2.5 w-2.5 ml-1 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="font-sans font-bold tracking-wider text-[11px] text-slate-500">
                        Closed (04:00 PM - 05:00 PM & 09:00 PM - 10:00 PM)
                      </span>
                    </>
                  )}
                </button>
                {!isClaimWindowActive && (
                  <p className="text-center text-[10px] text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                    * Note: This settlement clock uses secure synchronized real-time. Please revisit when the clock reaches 04:00 PM or 09:00 PM in your localized slot.
                  </p>
                )}

              </div>

            </div>

            {/* Claims History */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">⏳ Expired / Missed Claims History</h4>
              
              <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-[1.25rem] font-mono text-[10px] shadow-sm">
                <table className="w-full text-left border-collapse min-w-[400px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[8px] font-bold text-center">
                      <th className="p-3 text-left">Date Grid</th>
                      <th className="p-3">Yield Amount</th>
                      <th className="p-3">Settlement Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-center text-slate-705">
                    {claimsHistory.map((cl) => (
                      <tr key={cl.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-left text-[9px] text-slate-450">{cl.date}</td>
                        <td className="p-3 font-semibold text-slate-800">${cl.amount.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] tracking-wide font-extrabold uppercase ${
                            cl.status === 'Claimed' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {cl.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {claimsHistory.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-5 text-center text-slate-400 font-sans">
                          No previous missed claims recorded for this cycle. All verified settlements running green.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: REFERRAL CENTER ==================== */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">

            {/* Referral Dashboard structure */}
            <div className="bg-white border border-slate-200 rounded-[1.25rem] p-5 space-y-4 shadow-sm text-slate-800">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-bold text-slate-900">Dynamic 10% Referral Engine</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Commission loops for active investment groups</span>
                </div>
              </div>

              {/* Dual commission rules banner info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 leading-relaxed text-xs text-slate-650">
                <span className="font-bold text-slate-800 block uppercase font-mono tracking-wider text-[9px] text-emerald-600">How the Flow triggers</span>
                <p>
                  - Share your referral link / code with fellow associates.
                </p>
                <p>
                  - Once they register and complete their first qualifying investment of at least <strong>$113 USDT</strong> (approx 1 share Emaar):
                </p>
                <div className="grid grid-cols-2 gap-2 text-center font-mono py-1">
                  <div className="p-2 bg-emerald-100/40 border border-emerald-200 rounded-lg">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">Referrer receives</span>
                    <span className="text-xs font-bold text-emerald-700">🎁 10% Cash Reward</span>
                  </div>
                  <div className="p-2 bg-emerald-100/40 border border-emerald-200 rounded-lg">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">New investor receives</span>
                    <span className="text-xs font-bold text-emerald-700">🎁 10% Cash Reward</span>
                  </div>
                </div>
                <p className="text-[9px] text-rose-600">
                  * Note: Registration only does not award anything. Bonuses trigger securely upon first investment verification.
                </p>
              </div>

              {/* My Credentials layout */}
              <div className="space-y-3 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">My Personal code</span>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 pt-1">
                      <span className="text-emerald-700 font-bold select-all">{activeUser.referralCode}</span>
                      <button 
                        type="button"
                        onClick={() => triggerCopy(activeUser.referralCode, 'code')}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[8px] text-slate-500 uppercase block font-bold font-mono">Referral Earnings</span>
                    <div className="text-xs font-bold text-emerald-600 pt-1 text-right">
                      ${referralEarningsSum.toFixed(2)} USDT
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">Automated Invitation Link</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1">
                    <span className="truncate pr-2 select-all">https://fundora.one/join?ref={activeUser.referralCode}</span>
                    <button 
                      type="button" 
                      onClick={() => triggerCopy(`https://fundora.one/join?ref=${activeUser.referralCode}`, 'link')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] rounded text-emerald-600 font-bold shrink-0 shadow-xs cursor-pointer transition-colors"
                    >
                      {copiedText === 'link' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Referrals ledger log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">👥 My Associates Referral log</h4>
                <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold sm:hidden">Swipe left to scroll ↔</span>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-[1.25rem] shadow-sm overflow-hidden w-full">
                <div className="overflow-x-auto w-full block scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full font-mono text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[8px] font-bold text-center">
                        <th className="p-3 text-left">Associates Email Address</th>
                        <th className="p-3 text-center">Bonus Paid</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-center text-slate-705">
                      {userReferrals.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-slate-400 font-sans">
                            No partners or associates referred yet. Share your link above to build your team!
                          </td>
                        </tr>
                      ) : (
                        userReferrals.map((referredUser) => {
                          // Try to find the referral bonus transaction in the user's transactions list
                          const bonusTx = transactions.find(t => t.type === 'Referral Bonus' && t.description?.toLowerCase().includes(referredUser.email.toLowerCase()));
                          const bonusPaid = bonusTx ? bonusTx.amount : 0;
                          const hasInvested = referredUser.totalInvestment > 0 || (bonusTx && bonusTx.status === 'Completed');
                          
                          return (
                            <tr key={referredUser.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-left font-sans text-slate-800 whitespace-nowrap">{referredUser.email}</td>
                              <td className="p-3 font-semibold text-emerald-600 whitespace-nowrap">${bonusPaid.toFixed(2)} USDT</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[8px] tracking-wide font-extrabold uppercase inline-block ${hasInvested ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500 animate-pulse'}`}>
                                  {hasInvested ? 'Active Profit' : 'Pending Purchase'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 6: MY PROFILE & SECURITY ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">

            {/* Profile Intro */}
            <div className="bg-white border border-slate-200 rounded-[1.25rem] p-5 shadow-sm text-slate-800 space-y-4">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-bold text-slate-900">My Profile & Account Security</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Manage your personal details, secure your account credentials, and complete identity verification (KYC).</span>
                </div>
              </div>

              {/* Grid Layout: Profile Details + Avatar selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Profile Details */}
                <div className="space-y-4">
                  <span className="font-bold text-slate-800 block uppercase font-mono tracking-wider text-[9px] text-emerald-600">Personal Account Details</span>
                  
                  {profileStatus && (
                    <div className={`p-3 rounded-lg text-xs ${profileStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                      {profileStatus.message}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Display Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-850 bg-white animate-fadeIn"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address (Read-only)</label>
                      <input
                        type="email"
                        value={activeUser.email}
                        disabled
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 bg-slate-50 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <span className="text-slate-400 block mb-0.5">Registration Date</span>
                        <span className="font-bold text-slate-700">{activeUser.registrationDate}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <span className="text-slate-400 block mb-0.5">Account Status</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          Active State
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!profileName.trim()) {
                          setProfileStatus({ message: 'Display Name cannot be empty.', type: 'error' });
                          return;
                        }
                        onUpdateUser({ name: profileName, avatarUrl: profileAvatar });
                        setProfileStatus({ message: 'Profile details saved successfully.', type: 'success' });
                        setTimeout(() => setProfileStatus(null), 3000);
                      }}
                      className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200"
                    >
                      Save Account Details
                    </button>
                  </div>
                </div>

                {/* Dynamic Automatic Shield & Rank Status Hub */}
                <div className="space-y-4">
                  <span className="font-bold text-slate-800 block uppercase font-mono tracking-wider text-[9px] text-emerald-600">Dynamic Investor Shield & Rank Status</span>
                  
                  {/* Current Active Rank Badge Card */}
                  <div className={`p-5 rounded-2xl border bg-slate-950 text-white relative overflow-hidden shadow-lg ${userTier.borderColor}`}>
                    {/* Abstract background light effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="flex items-start gap-4">
                      {/* Giant Dynamic Avatar with Badge Icon Overlay */}
                      <div className="relative shrink-0">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black uppercase shadow-inner ${getAvatarBgClass(userTier.id)}`}>
                          {activeUser.email.slice(0, 2)}
                        </div>
                        {/* Huge Shield Badge */}
                        <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-950 border-2 border-slate-900 shadow-md ${userTier.color}`}>
                          {userTier.id === 'tier-5' ? (
                            <Crown className="w-5 h-5 animate-bounce" />
                          ) : userTier.id === 'tier-4' ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : userTier.id === 'tier-3' ? (
                            <Sparkles className="w-5 h-5" />
                          ) : userTier.id === 'tier-2' ? (
                            <Award className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400 block">Current Associate Rank</span>
                        <h4 className={`text-base font-bold font-sans tracking-tight ${userTier.color}`}>
                          {userTier.name}
                        </h4>
                      </div>
                    </div>

                    {/* Stats display inside card */}
                    <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/5 font-mono text-[9px]">
                      <div className="bg-white/5 p-2 rounded-xl">
                        <span className="text-slate-400 block mb-0.5">Total Investments</span>
                        <span className="font-bold text-slate-100 text-xs font-mono text-emerald-400">${calculatedTotalInvest.toFixed(2)} USDT</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl">
                        <span className="text-slate-400 block mb-0.5">Verified Associates</span>
                        <span className="font-bold text-slate-100 text-xs font-mono text-sky-450">{totalReferralsCount} Partners</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Rank progress tracking */}
                  {userTier.nextTier ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 font-bold uppercase">Progress to {userTier.nextTier.name}</span>
                        <span className="text-emerald-600 font-extrabold font-mono">
                          {Math.min(100, Math.round(((calculatedTotalInvest / userTier.nextTier.reqInvest) * 50) + ((totalReferralsCount / userTier.nextTier.reqRefs) * 50)))}%
                        </span>
                      </div>
                      
                      {/* Custom Dual Progress Bar */}
                      <div className="space-y-2">
                        {/* Investment criteria */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                            <span>Investments: ${calculatedTotalInvest.toFixed(0)} / ${userTier.nextTier.reqInvest}</span>
                            <span>{calculatedTotalInvest >= userTier.nextTier.reqInvest ? '🟢 Completed' : '⏳ Pending'}</span>
                          </div>
                          <div className="w-full bg-slate-250 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (calculatedTotalInvest / userTier.nextTier.reqInvest) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Referral criteria */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                            <span>Referrals: {totalReferralsCount} / {userTier.nextTier.reqRefs}</span>
                            <span>{totalReferralsCount >= userTier.nextTier.reqRefs ? '🟢 Completed' : '⏳ Pending'}</span>
                          </div>
                          <div className="w-full bg-slate-250 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-sky-450 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (totalReferralsCount / userTier.nextTier.reqRefs) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex gap-2.5 items-start">
                      <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase block">Pinnacle Status Reached</span>
                        <p className="text-[9px] text-amber-700 leading-normal font-medium">
                          You are currently a Crown Ambassador. You have unlocked all priority nodes, prestige referral rewards, and high-yield offshore allocations!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Active Rank Privileges */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <span className="font-bold text-slate-500 block uppercase font-mono tracking-wider text-[8px]">Active Tier Privileges ({userTier.name})</span>
                    <ul className="space-y-1.5">
                      {userTier.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[10px] text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </div>

            {/* KYC Identity Verification Module */}
            <div className="bg-white border border-slate-200 rounded-[1.25rem] p-5 shadow-sm text-slate-800 space-y-4">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-bold text-slate-900">Identity Verification (KYC Hub)</h4>
                  <span className="text-[10px] text-slate-500 font-mono">KYC compliance is mandated by real estate authorities to prevent anti-money laundering (AML).</span>
                </div>
              </div>

              {/* Status display */}
              {activeUser.kycStatus === 'Verified' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-extrabold tracking-widest text-emerald-600 uppercase">Cryptographic Consent Active</span>
                    <h4 className="font-sans font-black text-slate-900 text-base">Congratulations! Your Identity is Fully Verified</h4>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Level 1 identity auditing is complete. Limits have been completely unlocked on all property purchases, withdrawals, and referral payouts.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto font-mono text-[10px] text-left">
                    <div className="p-2.5 bg-white border border-emerald-100 rounded-xl">
                      <span className="text-slate-400 block">Verified Name</span>
                      <span className="font-bold text-slate-800 truncate block">{activeUser.kycFullName || activeUser.name}</span>
                    </div>
                    <div className="p-2.5 bg-white border border-emerald-100 rounded-xl">
                      <span className="text-slate-400 block">Verified Country</span>
                      <span className="font-bold text-slate-800 truncate block">{activeUser.kycCountry || 'International'}</span>
                    </div>
                    <div className="p-2.5 bg-white border border-emerald-100 rounded-xl">
                      <span className="text-slate-400 block">Document Type</span>
                      <span className="font-bold text-slate-800 truncate block">{activeUser.kycDocumentType || 'Passport'}</span>
                    </div>
                  </div>
                </div>
              ) : activeUser.kycStatus === 'Under Review' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <Clock className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-extrabold tracking-widest text-amber-600 uppercase">Documents Under Review</span>
                    <h4 className="font-sans font-black text-slate-900 text-base">KYC Identity Audit Pending</h4>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Our compliance specialists are verifying your uploaded identity papers. Audits are processed daily within 1-2 hours. No action is required.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto font-mono text-[10px] text-left">
                    <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                      <span className="text-slate-400 block">Submitted Name</span>
                      <span className="font-bold text-slate-800 truncate block">{activeUser.kycFullName}</span>
                    </div>
                    <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                      <span className="text-slate-400 block">Country Node</span>
                      <span className="font-bold text-slate-800 truncate block">{activeUser.kycCountry}</span>
                    </div>
                    <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                      <span className="text-slate-400 block">Audited Document</span>
                      <span className="font-bold text-slate-800 truncate block">{activeUser.kycDocumentType}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 pt-1">
                  
                  <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Action Required: KYC Papers Missing</span>
                    </div>
                    <p className="text-amber-800 leading-normal text-[11px]">
                      Your account identity verification is currently unverified. Please submit your identity papers to unlock full withdraw access and premium high-yield Canary Wharf shares.
                    </p>
                  </div>

                  {kycStatus && (
                    <div className={`p-3 rounded-xl text-xs ${kycStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                      {kycStatus.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Information form fields */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Legal Full Name</label>
                        <input
                          type="text"
                          value={kycFullNameInput}
                          onChange={(e) => setKycFullNameInput(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-850"
                          placeholder="As printed on passport / ID card"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Country of Residence</label>
                          <input
                            type="text"
                            value={kycCountryInput}
                            onChange={(e) => setKycCountryInput(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-850"
                            placeholder="e.g. United Kingdom"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Document Type</label>
                          <select
                            value={kycDocType}
                            onChange={(e) => setKycDocType(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-850 bg-white"
                          >
                            <option value="Passport">Passport</option>
                            <option value="National ID Card">National ID Card</option>
                            <option value="Driver's License">Driver's License</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Drag and Drop area */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Upload Scanned Document Copy</label>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsKycDragging(true);
                        }}
                        onDragLeave={() => setIsKycDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsKycDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            setKycFileName(file.name);
                          }
                        }}
                        onClick={() => {
                          const mockFiles = ['passport_scan_hd.jpg', 'national_identity_card.pdf', 'drivers_license_valid.png'];
                          const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
                          setKycFileName(randomFile);
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 select-none min-h-[140px] ${
                          isKycDragging 
                            ? 'border-emerald-500 bg-emerald-50/30' 
                            : kycFileName 
                              ? 'border-emerald-400 bg-emerald-50/10' 
                              : 'border-slate-250 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        {kycFileName ? (
                          <>
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="block text-xs font-black text-slate-850">Document Attached Successfully</span>
                              <span className="block text-[10px] font-mono text-emerald-700">{kycFileName}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">Click again to replace file</span>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="block text-xs font-black text-slate-800">Drag & Drop Scanned Document here</span>
                              <p className="text-[10px] text-slate-500 leading-normal font-sans max-w-xs mx-auto">
                                or <strong className="text-emerald-600">Click here to select document</strong> from file directory
                              </p>
                            </div>
                            <span className="text-[8px] text-slate-400 font-mono">Supports PNG, JPG, PDF up to 10MB</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  <button
                    onClick={() => {
                      if (!kycFullNameInput.trim() || !kycCountryInput.trim()) {
                        setKycStatus({ message: 'Please enter your Legal Full Name and Country of Residence.', type: 'error' });
                        return;
                      }
                      if (!kycFileName) {
                        setKycStatus({ message: 'Please upload or click to attach your Scanned Document.', type: 'error' });
                        return;
                      }
                      onUpdateUser({
                        kycStatus: 'Under Review',
                        kycFullName: kycFullNameInput,
                        kycCountry: kycCountryInput,
                        kycDocumentType: kycDocType
                      });
                      setKycStatus({ message: 'Success! Your identity documents have been submitted and are under review.', type: 'success' });
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Submit KYC Auditing Papers
                  </button>

                </div>
              )}

            </div>

            {/* Change Password Card */}
            <div className="bg-white border border-slate-200 rounded-[1.25rem] p-5 shadow-sm text-slate-800 space-y-4">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-bold text-slate-900">Change Security Password</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Ensure your investment vault remains protected by a cryptographic private key password.</span>
                </div>
              </div>

              {passwordStatus && (
                <div className={`p-3 rounded-xl text-xs ${passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {passwordStatus.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-850"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Security Password</label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-850"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-850"
                    placeholder="Re-type new password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (!currentPasswordInput) {
                      setPasswordStatus({ message: 'Please specify your current valid password.', type: 'error' });
                      return;
                    }
                    if (newPasswordInput.length < 6) {
                      setPasswordStatus({ message: 'New security password must be at least 6 characters long.', type: 'error' });
                      return;
                    }
                    if (newPasswordInput !== confirmPasswordInput) {
                      setPasswordStatus({ message: 'New passwords do not match. Please verify your typing.', type: 'error' });
                      return;
                    }
                    onUpdateUser({ password: newPasswordInput });
                    setPasswordStatus({ message: 'Security password changed successfully! Your account remains securely logged in.', type: 'success' });
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                    setTimeout(() => setPasswordStatus(null), 4000);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Confirm Password Update
                </button>
              </div>

            </div>

          </div>
        )}
        
      {/* Quick Actions overlay/modal */}
      {quickActionsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          {/* Backdrop closer */}
          <div className="absolute inset-0" onClick={() => setQuickActionsOpen(false)}></div>
          
          <div className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-[1.5rem] sm:rounded-[1.25rem] p-6 shadow-xl text-slate-850 animate-slideUp">
            
            <button 
              onClick={() => setQuickActionsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>

            <div className="space-y-1.5 pb-3 border-b border-slate-100">
              <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest font-bold block">Transfer Operations</span>
              <h4 className="font-sans font-extrabold text-slate-900 text-base leading-tight">
                Quick Transaction Desk
              </h4>
              <p className="text-[11px] text-slate-500 font-sans font-medium">
                Select your preferred transfer node. Approved settlements execute seamlessly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6">
              {/* Deposit option */}
              <button
                onClick={() => {
                  setQuickActionsOpen(false);
                  setActiveTab('wallet');
                  setTimeout(() => {
                    document.getElementById('binance-deposit-module')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 120);
                }}
                className="flex flex-col items-center justify-center p-5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-150 hover:border-emerald-300 rounded-2xl transition-all group cursor-pointer text-center space-y-3"
              >
                <div className="p-3 bg-emerald-500 rounded-full text-white shadow-md shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                  <ArrowDownCircle className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <span className="block text-xs font-black uppercase text-slate-900 tracking-wider">Deposit Funds</span>
                  <span className="block text-[9px] text-emerald-700 font-mono mt-0.5">TRC20 / BEP20</span>
                </div>
              </button>

              {/* Withdraw option */}
              <button
                onClick={() => {
                  setQuickActionsOpen(false);
                  setActiveTab('wallet');
                  setTimeout(() => {
                    document.getElementById('binance-withdrawal-module')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 120);
                }}
                className="flex flex-col items-center justify-center p-5 bg-amber-50/70 hover:bg-amber-100 border border-amber-150 hover:border-amber-300 rounded-2xl transition-all group cursor-pointer text-center space-y-3"
              >
                <div className="p-3 bg-amber-500 rounded-full text-slate-950 shadow-md shadow-amber-500/10 group-hover:scale-110 transition-transform">
                  <ArrowUpCircle className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <span className="block text-xs font-black uppercase text-slate-900 tracking-wider">Withdraw USDT</span>
                  <span className="block text-[9px] text-amber-700 font-mono mt-0.5">TRC20 / BEP20</span>
                </div>
              </button>
            </div>

            {/* Account Stats readout */}
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-semibold">Active Capital:</span>
              <span className="font-bold text-emerald-600">${availableUserBalance.toFixed(2)} USDT</span>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 text-[9px] text-slate-400 text-center flex items-center justify-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Symmetric Cryptographic Escrow Active</span>
            </div>

          </div>
        </div>
      )}

      {/* Custom Yield Claim Popup Modal */}
      {claimPopup && claimPopup.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop closer */}
          <div className="absolute inset-0" onClick={() => setClaimPopup(null)}></div>
          
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-2xl text-slate-850 animate-fadeIn text-center space-y-4">
            
            <button 
              onClick={() => setClaimPopup(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>

            {claimPopup.type === 'success' && (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest font-black block">Settlement Success</span>
                  <h4 className="font-sans font-black text-slate-900 text-lg">🎉 Claim Complete!</h4>
                </div>
                <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl font-mono text-center space-y-1">
                  <span className="text-[9px] text-emerald-700 block uppercase font-bold">Credited Amount</span>
                  <span className="text-2xl font-black text-emerald-600">${claimPopup.amount?.toFixed(2)} USDT</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  The daily fractional yield payouts have been successfully computed and credited to your main USDT wallet balance.
                </p>
                <button
                  onClick={() => setClaimPopup(null)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-emerald-600/10"
                >
                  Confirm & Dismiss
                </button>
              </div>
            )}

            {claimPopup.type === 'already_claimed' && (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  <Award className="w-7 h-7 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-amber-600 uppercase tracking-widest font-black block">Ledger Verification</span>
                  <h4 className="font-sans font-black text-slate-900 text-lg">🔒 Already Claimed For This Window</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  You have already claimed your fractional yield for this active slot. The ledger has locked this claim epoch securely.
                </p>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-[10px] font-mono text-slate-600">
                  <span>Next payout cycles are available daily at <strong className="text-emerald-600">04:00 PM</strong> and <strong className="text-emerald-600">09:00 PM</strong>.</span>
                </div>
                <button
                  onClick={() => setClaimPopup(null)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200"
                >
                  Understand & Close
                </button>
              </div>
            )}

            {claimPopup.type === 'inactive_window' && (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                  <Clock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-rose-600 uppercase tracking-widest font-black block">Timezone Lock Error</span>
                  <h4 className="font-sans font-black text-slate-900 text-lg">⏳ Claim Window Closed / Expired</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  The yield settlement windows are only open twice daily between <strong className="text-slate-800">04:00 PM - 05:00 PM</strong> and <strong className="text-slate-800">09:00 PM - 10:00 PM</strong>.
                </p>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-mono text-rose-800 text-left space-y-1.5">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>How to unlock right now:</span>
                  </div>
                  <p className="leading-normal text-xs font-sans text-rose-950 font-normal">
                    Adjust the <strong>"Set Simulated Hour"</strong> dropdown in the top header bar to <strong>"16" (04:15 PM)</strong> or <strong>"21" (09:15 PM)</strong> to claim instantly.
                  </p>
                </div>
                <button
                  onClick={() => setClaimPopup(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200"
                >
                  Acknowledge
                </button>
              </div>
            )}

            {claimPopup.type === 'no_yield' && (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-amber-600 uppercase tracking-widest font-black block">Verification Info</span>
                  <h4 className="font-sans font-black text-slate-900 text-lg">❌ No Active Yield Found</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  You do not have any active property fractional shares to generate payout yields.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  Explore available prime listings and acquire shares to begin earning dynamic daily cash rewards.
                </p>
                <button
                  onClick={() => {
                    setClaimPopup(null);
                    setActiveTab('properties');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5" />
                  Explore Properties Tab
                </button>
              </div>
            )}

          </div>
        </div>
      )}

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
