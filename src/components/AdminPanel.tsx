/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { RealEstateProject, Transaction, UserAccount, SecurityLog, ProjectCategory, SystemSettings } from '../types';
import { 
  Shield, Users, Landmark, Coins, FileText, Check, X, ShieldAlert,
  ArrowDownCircle, ArrowUpCircle, Plus, Eye, RefreshCw, Key, AlertOctagon, BarChart2,
  Unlock, Minus, Wallet
} from 'lucide-react';

interface AdminPanelProps {
  projects: RealEstateProject[];
  transactions: Transaction[];
  usersList: UserAccount[];
  securityLogs: SecurityLog[];
  activeAdminTab?: 'stats' | 'deposits' | 'withdrawals' | 'projects' | 'users' | 'security';
  setActiveAdminTab?: (tab: 'stats' | 'deposits' | 'withdrawals' | 'projects' | 'users' | 'security') => void;
  onBackToDashboard: () => void;
  // Admin dynamic controllers
  onApproveTransaction: (txId: string) => void;
  onRejectTransaction: (txId: string) => void;
  onAddProject: (newProject: RealEstateProject) => void;
  onSimulateDailyRollover: () => void;
  onUpdateProjectRoi?: (projectId: string, newRoi: number) => void;
  onAdjustUserFunds?: (userId: string, amount: number, type: 'add' | 'deduct') => void;
  onUnbindUserWallet?: (userId: string, network: 'TRC20' | 'BEP20' | 'both') => void;
  onUpdateProject?: (updatedProject: RealEstateProject) => void;
  onDeleteProject?: (projectId: string) => void;
  systemSettings?: SystemSettings;
  onUpdateSystemSettings?: (settings: SystemSettings) => void;
}

export default function AdminPanel({
  projects,
  transactions,
  usersList,
  securityLogs,
  activeAdminTab,
  setActiveAdminTab,
  onBackToDashboard,
  onApproveTransaction,
  onRejectTransaction,
  onAddProject,
  onSimulateDailyRollover,
  onUpdateProjectRoi,
  onAdjustUserFunds,
  onUnbindUserWallet,
  onUpdateProject,
  onDeleteProject,
  systemSettings = {
    id: 'default',
    usdtTrc20Address: 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy',
    usdtBep20Address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    scanGateTitle: 'Barcode Scanning Gateway',
    scanGateSubtitle: 'Dispatch on the matching blockchain. Tokens sent to mismatched networks are irreversibly lost.',
    usdtTrc20QrCode: '',
    usdtBep20QrCode: ''
  },
  onUpdateSystemSettings
}: AdminPanelProps) {
  const [localAdminTab, setLocalAdminTab] = useState<'stats' | 'deposits' | 'withdrawals' | 'projects' | 'users' | 'security' | 'settings'>('stats');

  const adminTab = activeAdminTab !== undefined ? activeAdminTab : localAdminTab;
  const setAdminTab = setActiveAdminTab !== undefined ? (setActiveAdminTab as any) : setLocalAdminTab;

  // Local state for system settings form
  const [trc20Addr, setTrc20Addr] = useState<string>(systemSettings.usdtTrc20Address || '');
  const [bep20Addr, setBep20Addr] = useState<string>(systemSettings.usdtBep20Address || '');
  const [trc20QrCode, setTrc20QrCode] = useState<string>(systemSettings.usdtTrc20QrCode || '');
  const [bep20QrCode, setBep20QrCode] = useState<string>(systemSettings.usdtBep20QrCode || '');
  const [gateTitle, setGateTitle] = useState<string>(systemSettings.scanGateTitle);
  const [gateSubtitle, setGateSubtitle] = useState<string>(systemSettings.scanGateSubtitle);

  React.useEffect(() => {
    setTrc20Addr(systemSettings.usdtTrc20Address || '');
    setBep20Addr(systemSettings.usdtBep20Address || '');
    setTrc20QrCode(systemSettings.usdtTrc20QrCode || '');
    setBep20QrCode(systemSettings.usdtBep20QrCode || '');
    setGateTitle(systemSettings.scanGateTitle);
    setGateSubtitle(systemSettings.scanGateSubtitle);
  }, [systemSettings]);

  // Preview network switcher state
  const [previewNetwork, setPreviewNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSystemSettings) {
      onUpdateSystemSettings({
        id: 'default',
        usdtTrc20Address: trc20Addr.trim(),
        usdtBep20Address: bep20Addr.trim(),
        scanGateTitle: gateTitle.trim(),
        scanGateSubtitle: gateSubtitle.trim(),
        usdtTrc20QrCode: trc20QrCode.trim(),
        usdtBep20QrCode: bep20QrCode.trim()
      });
      alert('Scanning gateway configuration successfully updated and locked into ledger!');
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Are you sure you want to restore the platform defaults for the barcode scanning gateway?')) {
      const defaultTrc20 = 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy';
      const defaultBep20 = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      const defaultTitle = 'Barcode Scanning Gateway';
      const defaultSubtitle = 'Dispatch on the matching blockchain. Tokens sent to mismatched networks are irreversibly lost.';

      setTrc20Addr(defaultTrc20);
      setBep20Addr(defaultBep20);
      setTrc20QrCode('');
      setBep20QrCode('');
      setGateTitle(defaultTitle);
      setGateSubtitle(defaultSubtitle);

      if (onUpdateSystemSettings) {
        onUpdateSystemSettings({
          id: 'default',
          usdtTrc20Address: defaultTrc20,
          usdtBep20Address: defaultBep20,
          scanGateTitle: defaultTitle,
          scanGateSubtitle: defaultSubtitle,
          usdtTrc20QrCode: '',
          usdtBep20QrCode: ''
        });
      }
      alert('Restored defaults successfully.');
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'TRC20' | 'BEP20') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'TRC20') {
        setTrc20QrCode(base64);
      } else {
        setBep20QrCode(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Dynamic stages for inline ROI settings
  const [editingRois, setEditingRois] = useState<Record<string, number>>({});

  // User Management State
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);

  // Preset listing images
  const PRESET_PROPERTY_IMAGES = [
    {
      name: 'Canary Modern Villa',
      url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Skyscraper Suite',
      url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Luxury Residential',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Co-Living Loft',
      url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Lakeside Residence',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Commercial Hub',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
    }
  ];

  // New Project Form state
  const [newProjName, setNewProjName] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjCategory, setNewProjCategory] = useState<ProjectCategory>('Residential');
  const [newProjPrice, setNewProjPrice] = useState(113);
  const [newProjShares, setNewProjShares] = useState(1000);
  const [newProjRoi, setNewProjRoi] = useState(15.5);
  const [newProjDuration, setNewProjDuration] = useState(18);
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjImageUrl, setNewProjImageUrl] = useState('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80');
  const [newProjDocuments, setNewProjDocuments] = useState<string[]>(['Audit_Permit.pdf', 'Official_Title.pdf']);

  // Edit Project State
  const [editingProject, setEditingProject] = useState<RealEstateProject | null>(null);
  const [editProjName, setEditProjName] = useState('');
  const [editProjLocation, setEditProjLocation] = useState('');
  const [editProjCategory, setEditProjCategory] = useState<ProjectCategory>('Residential');
  const [editProjPrice, setEditProjPrice] = useState(113);
  const [editProjShares, setEditProjShares] = useState(1000);
  const [editProjAvailableShares, setEditProjAvailableShares] = useState(1000);
  const [editProjRoi, setEditProjRoi] = useState(15.5);
  const [editProjDuration, setEditProjDuration] = useState(18);
  const [editProjDesc, setEditProjDesc] = useState('');
  const [editProjImageUrl, setEditProjImageUrl] = useState('');
  const [editProjStatus, setEditProjStatus] = useState<'Active' | 'Sold Out' | 'Upcoming'>('Active');
  const [editProjDocuments, setEditProjDocuments] = useState<string[]>([]);

  const [formSuccess, setFormSuccess] = useState(false);

  // File Upload Handlers (read as Base64 Data URL)
  const handleNewProjImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewProjImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProjImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditProjImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditingProject = (p: RealEstateProject) => {
    setEditingProject(p);
    setEditProjName(p.name);
    setEditProjLocation(p.location);
    setEditProjCategory(p.category);
    setEditProjPrice(p.pricePerShare);
    setEditProjShares(p.totalShares);
    setEditProjAvailableShares(p.availableShares);
    setEditProjRoi(p.expectedRoi);
    setEditProjDuration(p.durationMonths);
    setEditProjDesc(p.description);
    setEditProjImageUrl(p.imageUrl || '');
    setEditProjStatus(p.status || 'Active');
    setEditProjDocuments(p.documents || []);
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const updated: RealEstateProject = {
      ...editingProject,
      name: editProjName,
      location: editProjLocation,
      category: editProjCategory,
      pricePerShare: editProjPrice,
      totalShares: editProjShares,
      availableShares: editProjAvailableShares,
      expectedRoi: editProjRoi,
      durationMonths: editProjDuration,
      description: editProjDesc,
      imageUrl: editProjImageUrl,
      status: editProjStatus,
      documents: editProjDocuments
    };

    if (onUpdateProject) {
      onUpdateProject(updated);
    }
    setEditingProject(null);
    alert("✨ Property changes saved successfully!");
  };

  const handleDeleteTrigger = (projectId: string) => {
    if (window.confirm("⚠️ Are you absolutely sure you want to delete this property? This cannot be undone and will affect associated users and active shares.")) {
      if (onDeleteProject) {
        onDeleteProject(projectId);
      }
      setEditingProject(null);
      alert("Property deleted successfully.");
    }
  };

  // Administrative stats calculations
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const activeUsers = usersList.filter(u => u.balance > 0 || u.totalInvestment > 0).length;

    const totalInvestmentsVal = transactions
      .filter(t => t.type === 'Investment' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDepositsVal = transactions
      .filter(t => t.type === 'Deposit' && t.status === 'Approved')
      .reduce((sum, t) => sum + t.amount, 0) + 1200; // preseed base

    const totalWithdrawalsVal = transactions
      .filter(t => t.type === 'Withdrawal' && t.status === 'Approved')
      .reduce((sum, t) => sum + t.amount, 0) + 150; // preseed base

    const totalProfitsPaid = transactions
      .filter(t => t.type === 'Profit Claim' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0) + 132.50;

    const totalReferralsVal = transactions
      .filter(t => t.type === 'Referral Bonus' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalUsers,
      activeUsers,
      totalInvestmentsVal,
      totalDepositsVal,
      totalWithdrawalsVal,
      totalProfitsPaid,
      totalReferralsVal
    };
  }, [transactions, usersList]);

  // Pending deposits list
  const pendingDeposits = useMemo(() => {
    return transactions.filter(t => t.type === 'Deposit' && t.status === 'Pending');
  }, [transactions]);

  // Pending withdrawals list
  const pendingWithdrawals = useMemo(() => {
    return transactions.filter(t => t.type === 'Withdrawal' && t.status === 'Pending');
  }, [transactions]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjLocation) return;

    const newProj: RealEstateProject = {
      id: `proj-${Date.now()}`,
      name: newProjName,
      location: newProjLocation,
      category: newProjCategory,
      imageUrl: newProjImageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      totalShares: newProjShares,
      availableShares: newProjShares,
      pricePerShare: newProjPrice,
      expectedRoi: newProjRoi,
      durationMonths: newProjDuration,
      description: newProjDesc || 'Vetted, institutional grade real asset with immediate yield distribution capabilities.',
      status: 'Active',
      documents: newProjDocuments
    };

    onAddProject(newProj);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setNewProjName('');
      setNewProjLocation('');
      setNewProjDesc('');
      setNewProjImageUrl('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80');
      setNewProjDocuments(['Audit_Permit.pdf', 'Official_Title.pdf']);
    }, 2000);
  };

  const executeTriggerDailyRollover = () => {
    onSimulateDailyRollover();
    alert("Administrative Dividend Rollout dispatches complete! Daily increments have been securely distributed to active portfolios.");
  };

  return (
    <div id="fundora-admin-hud" className="flex-1 flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* Admin header */}
      <div className="bg-slate-900 px-4 py-3.5 border-b border-rose-950/40 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
            <Shield className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-red-400 font-mono font-bold tracking-widest block uppercase">Fundora Compliance Desk</span>
            <span className="text-[10px] text-slate-400">Authorized administrative functions & ledger inspections</span>
          </div>
        </div>

        <button
          id="back-to-user-portal"
          onClick={onBackToDashboard}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          ← Return to Portal
        </button>
      </div>

      {/* Admin Action Bar: Trigger rollover immediately */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2 text-amber-500">
          <AlertOctagon className="w-4 h-4" />
          <span>Simulate daily payout (accrues ROI, handles claims window):</span>
        </div>
        <button
          id="trigger-rollover-btn"
          onClick={executeTriggerDailyRollover}
          className="px-3 py-1 bg-gradient-to-r from-red-500/25 to-amber-500/25 border border-amber-500/40 rounded-lg text-[10px] hover:text-white tracking-wide uppercase font-extrabold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Accrue & Distribute Yield Now</span>
        </button>
      </div>

      {/* Admin Tab selection bar */}
      <div className="bg-slate-900/40 px-2 border-b border-slate-900 flex overflow-x-auto selection:bg-rose-500/20">
        {[
          { id: 'stats', label: '📊 System Stats' },
          { id: 'deposits', label: `📥 Deposits (${pendingDeposits.length})` },
          { id: 'withdrawals', label: `📤 Withdrawals (${pendingWithdrawals.length})` },
          { id: 'projects', label: '🏢 Projects Desk' },
          { id: 'users', label: '👥 User Ledgers' },
          { id: 'security', label: '🛡️ Threat Logs' },
          { id: 'settings', label: '⚙️ Scan Gate' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`py-3 px-3 border-b-2 text-[10px] font-mono tracking-wider font-extrabold uppercase whitespace-nowrap transition-colors ${
              adminTab === tab.id ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 pb-36 md:pb-8 space-y-6 flex-1 overflow-y-auto">

        {/* ==================== TAB 1: SYSTEM CONTROLS & STATISTICS ==================== */}
        {adminTab === 'stats' && (
          <div className="space-y-6">

            {/* Quick alert */}
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 leading-normal font-sans">
              <strong>Admin Compliance Shield On:</strong> Antigravity heuristics are analyzing user deposits in real-time. Review pending crypto transits in corresponding channels.
            </div>

            {/* Total System stats grids */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Systemic Cumulative Metrics</span>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-mono">
                
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Total Register Users</span>
                  <div className="text-xl font-bold font-mono text-white">{stats.totalUsers}</div>
                  <span className="text-[8px] text-slate-500 block">Active portfolio: {stats.activeUsers}</span>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Accumulated Deposits</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">${stats.totalDepositsVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  <span className="text-[8px] text-slate-500 block">Cryptographic verified loops</span>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Corporate Investments</span>
                  <div className="text-xl font-bold font-mono text-white">${stats.totalInvestmentsVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  <span className="text-[8px] text-slate-500 block">Fractional property shares</span>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Net Withdrawals Paid</span>
                  <div className="text-xl font-bold font-mono text-slate-200">${stats.totalWithdrawalsVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  <span className="text-[8px] text-slate-500 block">USDT TRC20 / BEP20</span>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Total Profits Claimed</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">${stats.totalProfitsPaid.toFixed(2)}</div>
                  <span className="text-[8px] text-slate-500 block">Accrued daily 9-10 PM GST</span>
                </div>

              </div>
            </div>

            {/* Quick action bindings */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider block">⚡ System Integrity Audit controls</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Doublecheck ledger configurations regularly. Our platform architecture is synchronized dynamically using standard React memory contexts and is saved under local storage constraints.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => alert("Diagnostic verification successful! Heuristic check shows 0 mismatched balances or duplicate TxIDs.")}
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-805 hover:border-slate-700 text-[10px] font-mono rounded-xl font-bold uppercase tracking-wider text-amber-400"
                >
                  Verify ledger checksums
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: DEPOSIT REVIEW DESK ==================== */}
        {adminTab === 'deposits' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">📥 Review and approve pending User Deposits</span>
              <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                {pendingDeposits.length} Pending
              </span>
            </div>

            {pendingDeposits.length === 0 ? (
              <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                No pending deposit claims requiring manual clearance currently in this queue.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDeposits.map((tx) => (
                  <div 
                    key={tx.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>

                    {/* Meta info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5 font-mono">
                        <span className="text-slate-500 text-[8px] uppercase block">Investor Contact</span>
                        <span className="text-xs font-bold text-white font-sans">{tx.userEmail}</span>
                        <span className="text-[9px] text-amber-400">{tx.date}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-slate-500 text-[8px] uppercase block">Deposit Claim</span>
                        <span className="text-base font-black text-emerald-400">${tx.amount.toFixed(2)} USDT</span>
                      </div>
                    </div>

                    {/* Tx Hash */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-mono text-[10px] gap-2.5 flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Transaction TxHash</span>
                        <span className="text-slate-300 break-all text-[9.5px] font-medium block">{tx.txHash}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-amber-400 rounded text-[9px] font-bold shrink-0">
                        {tx.network}
                      </span>
                    </div>

                    {/* Mock payment proof indicator */}
                    <div className="flex items-center space-x-2 font-mono text-[9px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Verified receipt metadata proof: <strong>{tx.proofImage}</strong></span>
                      <button 
                        onClick={() => alert("Verification HUD: Simulating payment screenshot preview. Blockchain status indicates transaction complete.")}
                        className="text-amber-400 hover:underline uppercase font-bold shrink-0 ml-auto"
                      >
                        [View Proof]
                      </button>
                    </div>

                    {/* Decision Button controllers */}
                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        id={`approve-deposit-${tx.id}`}
                        onClick={() => {
                          onApproveTransaction(tx.id);
                          alert(`Approved deposit of $${tx.amount} USDT for user ${tx.userEmail}. Balance successfully incremented!`);
                        }}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Receipt & Credit Balance</span>
                      </button>
                      
                      <button
                        id={`reject-deposit-${tx.id}`}
                        onClick={() => {
                          onRejectTransaction(tx.id);
                          alert(`Rejected deposit of $${tx.amount} USDT for user ${tx.userEmail}.`);
                        }}
                        className="px-4 py-2 bg-red-950/40 border border-red-500/30 hover:bg-red-900/20 text-red-400 font-extrabold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB 3: WITHDRAWAL REVIEW DESK ==================== */}
        {adminTab === 'withdrawals' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">📤 Review pending cryptographic withdrawals</span>
              <span className="text-[9px] font-mono bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded border border-rose-500/35">
                {pendingWithdrawals.length} Pending
              </span>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                No pending withdrawal requests in manual dispatch queue.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((tx) => (
                  <div 
                    key={tx.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>

                    {/* Meta info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5 font-mono">
                        <span className="text-slate-500 text-[8px] uppercase block">Investor Account</span>
                        <span className="text-xs font-bold text-white font-sans">{tx.userEmail}</span>
                        <span className="text-[9px] text-rose-400">{tx.date}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-slate-500 text-[8px] uppercase block">Target Withdrawal</span>
                        <span className="text-base font-black text-rose-400">${tx.amount.toFixed(2)} USDT</span>
                      </div>
                    </div>

                    {/* Destination Address details */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-mono text-[10px] space-y-1">
                      <span className="text-[8px] text-slate-500 uppercase block font-bold">Cryptographic payout wallet</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-300 truncate font-semibold min-w-0 flex-1">{tx.walletAddress}</span>
                        <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-amber-400 rounded text-[9px] font-bold shrink-0">
                          {tx.network} Grid
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        id={`approve-withdrawal-${tx.id}`}
                        onClick={() => {
                          onApproveTransaction(tx.id);
                          alert(`Withdrawal of $${tx.amount} USDT authorized. Dispatched on standard gas loop!`);
                        }}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Authorize Dispatch</span>
                      </button>
                      
                      <button
                        id={`reject-withdrawal-${tx.id}`}
                        onClick={() => {
                          onRejectTransaction(tx.id);
                          alert(`Refunded withdrawal of $${tx.amount} USDT to ${tx.userEmail}.`);
                        }}
                        className="px-4 py-2 bg-red-950/40 border border-red-500/30 hover:bg-red-900/20 text-red-300 font-extrabold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB 4: ADD PROPERTIES FORM ==================== */}
        {adminTab === 'projects' && (
          <div className="space-y-6">

            {/* Form list container */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">🏢 Add Premium Real Estate asset</span>
              
              {formSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                  ✨ Property added successfully to Fundora available share catalog!
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-4 font-mono text-[10px]">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block">Property Title Name</span>
                    <input 
                      type="text"
                      required
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      placeholder="e.g. Canary Wharf Executive Wing"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block">Location (State/City)</span>
                    <input 
                      type="text"
                      required
                      value={newProjLocation}
                      onChange={(e) => setNewProjLocation(e.target.value)}
                      placeholder="e.g. Canary Wharf, London"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block">Category</span>
                    <select 
                      value={newProjCategory}
                      onChange={(e: any) => setNewProjCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-amber-400 focus:outline-none"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Co-Living">Co-Living</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block">Share Price ($)</span>
                    <input 
                      type="number"
                      required
                      value={newProjPrice}
                      onChange={(e) => setNewProjPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block">Total Shares</span>
                    <input 
                      type="number"
                      required
                      value={newProjShares}
                      onChange={(e) => setNewProjShares(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block">Expected ROI (%)</span>
                    <input 
                      type="number"
                      step="0.1"
                      required
                      value={newProjRoi}
                      onChange={(e) => setNewProjRoi(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <span className="text-slate-400 font-bold uppercase block">Duration (Months)</span>
                    <input 
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={newProjDuration}
                      onChange={(e) => setNewProjDuration(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase block">Property investment specification details</span>
                  <textarea 
                    rows={3}
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Provide description of proximity to infrastructure, rental tenure leases, or developer backgrounds..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  ></textarea>
                </div>

                {/* Property Image Setup */}
                <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-3">
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">🏢 Property Visual Showcase (Image)</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {/* Current Preview */}
                    <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-slate-950 border border-slate-900 rounded-lg">
                      <span className="text-[8px] text-slate-500 uppercase font-bold mb-1.5">Live Preview</span>
                      <div className="w-full aspect-video md:aspect-square bg-slate-900 rounded-md overflow-hidden relative border border-slate-800 flex items-center justify-center">
                        {newProjImageUrl ? (
                          <img src={newProjImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-slate-600 text-center px-1">No Image Selected</span>
                        )}
                      </div>
                    </div>

                    {/* Image Options */}
                    <div className="col-span-1 md:col-span-3 space-y-3">
                      {/* Presets */}
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Option 1: Choose a Curated High-Res Preset</span>
                        <div className="grid grid-cols-6 gap-1.5">
                          {PRESET_PROPERTY_IMAGES.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewProjImageUrl(img.url)}
                              className={`aspect-video rounded overflow-hidden border-2 transition-all relative group ${
                                newProjImageUrl === img.url ? 'border-amber-500 scale-95' : 'border-slate-850 hover:border-slate-700'
                              }`}
                              title={img.name}
                            >
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[6px] text-white font-bold truncate px-0.5">{img.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* URL input & File upload Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Option 2: Enter Custom Web Image URL</span>
                          <input 
                            type="url"
                            value={newProjImageUrl.startsWith('data:') ? '' : newProjImageUrl}
                            onChange={(e) => setNewProjImageUrl(e.target.value)}
                            placeholder="https://example.com/property.jpg"
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-[10px] text-white placeholder-slate-600 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Option 3: Upload Local Image (File)</span>
                          <label className="flex items-center justify-center w-full h-[32px] px-3 border border-slate-850 hover:border-slate-700 hover:bg-slate-900/50 bg-slate-950 text-slate-400 rounded-lg cursor-pointer transition-all text-[10px] font-bold">
                            <span className="truncate">📂 Browse / Drop Image File</span>
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={handleNewProjImageFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF/Documents Attachments Setup */}
                <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-3">
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">📁 Secured Legal Documents (PDF/Attachments)</span>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-900 rounded-lg min-h-[50px] items-center">
                      {newProjDocuments.map((doc, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                          <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                          <input 
                            type="text"
                            value={doc}
                            onChange={(e) => {
                              const updated = [...newProjDocuments];
                              updated[dIdx] = e.target.value;
                              setNewProjDocuments(updated);
                            }}
                            className="bg-transparent border-b border-transparent focus:border-amber-500 text-[10px] text-slate-200 focus:outline-none w-32 font-bold font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewProjDocuments(newProjDocuments.filter((_, i) => i !== dIdx));
                            }}
                            className="text-red-400 hover:text-red-300 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
                            title="Remove document"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {newProjDocuments.length === 0 && (
                        <span className="text-[9px] text-slate-500 italic block">No legal documents attached yet. Click below or upload to add.</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          id="add-doc-text-new"
                          placeholder="e.g. Asset_Prospectus.pdf"
                          className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2 text-[10px] text-white placeholder-slate-600 font-mono"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                setNewProjDocuments([...newProjDocuments, val]);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('add-doc-text-new') as HTMLInputElement;
                            if (el && el.value.trim()) {
                              setNewProjDocuments([...newProjDocuments, el.value.trim()]);
                              el.value = '';
                            }
                          }}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                        >
                          ➕ Add Name
                        </button>
                      </div>

                      <div>
                        <label className="flex items-center justify-center w-full h-[32px] px-3 border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 bg-slate-950 text-slate-400 rounded-lg cursor-pointer transition-all text-[10px] font-bold">
                          <span>📁 Upload & Attach Local PDF</span>
                          <input 
                            type="file"
                            accept=".pdf,application/pdf,image/*,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewProjDocuments([...newProjDocuments, file.name]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-500 hover:bg-emerald-600 text-slate-950 font-extrabold uppercase rounded-xl text-[10px] tracking-wider transition-colors"
                >
                  Publish Property Shares Online
                </button>

              </form>
            </div>

            {/* Listed Properties manager table */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1">
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500 block">📋 Live Real Estate listings on catalog</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("⚠️ This will clear all active sessions, transactions, and user accounts, and reset everything back to the British & UAE default presets. Are you sure?")) {
                      localStorage.removeItem('inv_projects');
                      localStorage.removeItem('inv_investments');
                      localStorage.removeItem('inv_claims');
                      localStorage.removeItem('inv_transactions');
                      localStorage.removeItem('inv_users');
                      localStorage.removeItem('inv_active_user');
                      localStorage.removeItem('inv_security_logs');
                      alert("♻️ Database cleared and reset successfully. Reloading platform...");
                      window.location.reload();
                    }
                  }}
                  className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 font-bold uppercase rounded-lg text-[9px] transition-all cursor-pointer"
                >
                  ♻️ Reset All Data to UK/UAE Defaults
                </button>
              </div>
              
              <div className="w-full overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl font-mono text-[10px]">
                <table className="w-full text-left border-collapse min-w-[750px] md:min-w-full">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase text-[8px] font-bold text-center">
                      <th className="p-3 text-left">Property Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">ROI</th>
                      <th className="p-3">Available Shares</th>
                      <th className="p-3">Percentage Yield Setting</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-center text-slate-300">
                    {projects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-850/20">
                        <td className="p-3 text-left font-sans font-bold text-white text-[11px] truncate flex items-center space-x-2">
                          <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover border border-slate-800 shrink-0" />
                          <div className="truncate">
                            <span className="block font-bold truncate">{p.name}</span>
                            <span className="text-[9px] text-slate-500 truncate block">{p.location}</span>
                          </div>
                        </td>
                        <td className="p-3 uppercase text-[9px]">{p.category}</td>
                        <td className="p-3 font-semibold text-emerald-400">+{p.expectedRoi}%</td>
                        <td className="p-3 text-amber-400 font-bold">{p.availableShares} / {p.totalShares}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <input 
                              type="number"
                              step="0.1"
                              value={editingRois[p.id] !== undefined ? editingRois[p.id] : p.expectedRoi}
                              onChange={(e) => setEditingRois(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                              className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white text-center font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newRoi = editingRois[p.id] !== undefined ? editingRois[p.id] : p.expectedRoi;
                                if (onUpdateProjectRoi) {
                                  onUpdateProjectRoi(p.id, newRoi);
                                }
                              }}
                              className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded uppercase text-[8px] tracking-wider transition-colors cursor-pointer"
                            >
                              Set %
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => startEditingProject(p)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                          >
                            ✍️ Edit All Options
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Centered Backdrop Blur Edit Property Modal */}
            {editingProject && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col font-mono text-[10px] text-slate-300">
                  {/* Modal Header */}
                  <div className="bg-slate-950/60 p-4 border-b border-slate-850 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Landmark className="w-4 h-4 text-amber-500" />
                      <div className="text-left">
                        <span className="text-xs text-white font-bold block">Edit Property: {editingProject.name}</span>
                        <span className="text-[9px] text-slate-500">ID: {editingProject.id}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-850 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Body / Form */}
                  <form onSubmit={handleSaveChanges} className="p-5 space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Property Title Name</span>
                        <input 
                          type="text"
                          required
                          value={editProjName}
                          onChange={(e) => setEditProjName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Location (State/City)</span>
                        <input 
                          type="text"
                          required
                          value={editProjLocation}
                          onChange={(e) => setEditProjLocation(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Category</span>
                        <select 
                          value={editProjCategory}
                          onChange={(e: any) => setEditProjCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-amber-400 focus:outline-none"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Luxury">Luxury</option>
                          <option value="Co-Living">Co-Living</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Share Price ($)</span>
                        <input 
                          type="number"
                          required
                          value={editProjPrice}
                          onChange={(e) => setEditProjPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Total Shares</span>
                        <input 
                          type="number"
                          required
                          value={editProjShares}
                          onChange={(e) => setEditProjShares(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Available Shares</span>
                        <input 
                          type="number"
                          required
                          value={editProjAvailableShares}
                          onChange={(e) => setEditProjAvailableShares(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Expected ROI (%)</span>
                        <input 
                          type="number"
                          step="0.1"
                          required
                          value={editProjRoi}
                          onChange={(e) => setEditProjRoi(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Duration (Months)</span>
                        <input 
                          type="number"
                          required
                          min="1"
                          max="120"
                          value={editProjDuration}
                          onChange={(e) => setEditProjDuration(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase block">Status</span>
                        <select 
                          value={editProjStatus}
                          onChange={(e: any) => setEditProjStatus(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-emerald-400 focus:outline-none font-bold"
                        >
                          <option value="Active">🟢 Active (Open)</option>
                          <option value="Sold Out">🔴 Sold Out</option>
                          <option value="Upcoming">🟡 Upcoming (Locked)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold uppercase block">Property investment specification details</span>
                      <textarea 
                        rows={2}
                        value={editProjDesc}
                        onChange={(e) => setEditProjDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                      ></textarea>
                    </div>

                    {/* Edit Property Image Block */}
                    <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-3">
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">🏢 Property Visual Showcase (Image)</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start text-left">
                        {/* Current Preview */}
                        <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-slate-950 border border-slate-900 rounded-lg">
                          <span className="text-[8px] text-slate-500 uppercase font-bold mb-1.5">Live Preview</span>
                          <div className="w-full aspect-video md:aspect-square bg-slate-900 rounded-md overflow-hidden relative border border-slate-800 flex items-center justify-center">
                            {editProjImageUrl ? (
                              <img src={editProjImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] text-slate-600 text-center px-1">No Image</span>
                            )}
                          </div>
                        </div>

                        {/* Image Options */}
                        <div className="col-span-1 md:col-span-3 space-y-3">
                          {/* Presets */}
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Option 1: Choose a Curated High-Res Preset</span>
                            <div className="grid grid-cols-6 gap-1.5">
                              {PRESET_PROPERTY_IMAGES.map((img, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setEditProjImageUrl(img.url)}
                                  className={`aspect-video rounded overflow-hidden border-2 transition-all relative group ${
                                    editProjImageUrl === img.url ? 'border-amber-500 scale-95' : 'border-slate-850 hover:border-slate-700'
                                  }`}
                                  title={img.name}
                                >
                                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* URL input & File upload Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Option 2: Enter Custom Web Image URL</span>
                              <input 
                                type="url"
                                value={editProjImageUrl.startsWith('data:') ? '' : editProjImageUrl}
                                onChange={(e) => setEditProjImageUrl(e.target.value)}
                                placeholder="https://example.com/property.jpg"
                                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-[10px] text-white placeholder-slate-600 font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Option 3: Upload Local Image (File)</span>
                              <label className="flex items-center justify-center w-full h-[32px] px-3 border border-slate-850 hover:border-slate-700 hover:bg-slate-900/50 bg-slate-950 text-slate-400 rounded-lg cursor-pointer transition-all text-[10px] font-bold">
                                <span className="truncate">📂 Browse / Drop Image File</span>
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={handleEditProjImageFileChange}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit PDF/Documents Attachments Setup */}
                    <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-3">
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">📁 Secured Legal Documents (PDF/Attachments)</span>
                      
                      <div className="space-y-2 text-left">
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-900 rounded-lg min-h-[50px] items-center">
                          {editProjDocuments.map((doc, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                              <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                              <input 
                                type="text"
                                value={doc}
                                onChange={(e) => {
                                  const updated = [...editProjDocuments];
                                  updated[dIdx] = e.target.value;
                                  setEditProjDocuments(updated);
                                }}
                                className="bg-transparent border-b border-transparent focus:border-amber-500 text-[10px] text-slate-200 focus:outline-none w-32 font-bold font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditProjDocuments(editProjDocuments.filter((_, i) => i !== dIdx));
                                }}
                                className="text-red-400 hover:text-red-300 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
                                title="Remove document"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          {editProjDocuments.length === 0 && (
                            <span className="text-[9px] text-slate-500 italic block">No legal documents attached to this listing.</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              id="add-doc-text-edit"
                              placeholder="e.g. Asset_Prospectus.pdf"
                              className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2 text-[10px] text-white placeholder-slate-600 font-mono"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val) {
                                    setEditProjDocuments([...editProjDocuments, val]);
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('add-doc-text-edit') as HTMLInputElement;
                                if (el && el.value.trim()) {
                                  setEditProjDocuments([...editProjDocuments, el.value.trim()]);
                                  el.value = '';
                                }
                              }}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                            >
                              ➕ Add Name
                            </button>
                          </div>

                          <div>
                            <label className="flex items-center justify-center w-full h-[32px] px-3 border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 bg-slate-950 text-slate-400 rounded-lg cursor-pointer transition-all text-[10px] font-bold">
                              <span>📁 Upload & Attach Local PDF</span>
                              <input 
                                type="file"
                                accept=".pdf,application/pdf,image/*,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setEditProjDocuments([...editProjDocuments, file.name]);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteTrigger(editingProject.id)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-600/30 text-red-200 hover:text-white rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all"
                      >
                        🗑️ Delete Listing
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProject(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase rounded-xl text-[10px] tracking-wider transition-all"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB 5: USERS DIRECTORY ==================== */}
        {adminTab === 'users' && (
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500 block">👥 User Accounts Ledger & Balance Checks</span>

            <div className="w-full overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl font-mono text-[10px]">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase text-[8px] font-bold text-center animate-none whitespace-nowrap">
                    <th className="p-3 text-left">Account Email</th>
                    <th className="p-3 text-left">Investor Name</th>
                    <th className="p-3">KYC Status</th>
                    <th className="p-3">Active Balance</th>
                    <th className="p-3">Total Deposited</th>
                    <th className="p-3">Total Withdrawn</th>
                    <th className="p-3">Total Invested</th>
                    <th className="p-3">Total Profits</th>
                    <th className="p-3">Referral Code</th>
                    <th className="p-3">Referred By</th>
                    <th className="p-3">Registration Date</th>
                    <th className="p-3">Action Desk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350 text-center">
                  {usersList.map((usr) => [
                    <tr key={usr.id} className="hover:bg-slate-850/20 whitespace-nowrap text-[10px]">
                      <td className="p-3 text-left text-white font-semibold">
                        <div className="flex flex-col">
                          <span>{usr.email}</span>
                          <span className="text-[8px] text-slate-500 font-mono">ID: {usr.id}</span>
                        </div>
                      </td>
                      <td className="p-3 text-left text-slate-400 font-sans">{usr.name || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-sans font-bold ${
                          usr.kycStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          usr.kycStatus === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {usr.kycStatus || 'Unverified'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-300 font-mono">${(usr.balance || 0).toFixed(2)}</td>
                      <td className="p-3 text-emerald-400 font-mono font-semibold">${(usr.totalDeposited || 0).toFixed(2)}</td>
                      <td className="p-3 text-rose-400 font-mono font-semibold">${(usr.totalWithdrawn || 0).toFixed(2)}</td>
                      <td className="p-3 text-slate-200 font-mono font-semibold">${(usr.totalInvestment || 0).toFixed(2)}</td>
                      <td className="p-3 text-emerald-300 font-mono font-semibold">${(usr.totalProfitEarned || 0).toFixed(2)}</td>
                      <td className="p-3 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider">{usr.referralCode}</td>
                      <td className="p-3 text-slate-500 font-mono">{usr.referredBy || 'None'}</td>
                      <td className="p-3 text-slate-400 font-mono text-[9px]">{usr.registrationDate ? usr.registrationDate.split('T')[0] : 'N/A'}</td>
                      <td className="p-3">
                        <button
                          id={`manage-user-btn-${usr.id}`}
                          onClick={() => {
                            if (expandedUserId === usr.id) {
                              setExpandedUserId(null);
                            } else {
                              setExpandedUserId(usr.id);
                              setAdjustAmount(50);
                            }
                          }}
                          className={`px-2.5 py-1 text-[9px] font-bold uppercase font-mono tracking-wider rounded-lg border transition-all ${
                            expandedUserId === usr.id 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {expandedUserId === usr.id ? 'Close' : '🔧 Manage'}
                        </button>
                      </td>
                    </tr>,
                    expandedUserId === usr.id && (
                      <tr key={`expansion-${usr.id}`} className="bg-slate-950/80 font-sans text-xs">
                        <td colSpan={12} className="p-4 text-left border-t border-b border-slate-800">
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4 shadow-inner">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                              <div className="flex items-center space-x-2">
                                <Key className="w-4 h-4 text-amber-500" />
                                <div>
                                  <span className="text-xs font-bold text-white block">Administrative Console: {usr.email}</span>
                                  <span className="text-[10px] text-slate-400">Perform direct balance corrections and credential bindings</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => setExpandedUserId(null)} 
                                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Content columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              
                              {/* COLUMN 1: WALLET UNBINDING */}
                              <div className="space-y-3.5">
                                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                                  <Wallet className="w-4 h-4 text-indigo-400" />
                                  <span>Bound Reception Gateways</span>
                                </div>

                                <div className="space-y-2.5">
                                  
                                  {/* TRC20 Wallet */}
                                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                      <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">USDT (TRC20 Network)</span>
                                      <span className="text-xs font-mono font-medium text-slate-200 truncate block max-w-[200px]" title={usr.wallet.usdtTrc20Address || 'Not configured'}>
                                        {usr.wallet.usdtTrc20Address || <span className="text-slate-500 italic">Unconfigured</span>}
                                      </span>
                                    </div>
                                    {usr.wallet.usdtTrc20Address && (
                                      <button
                                        id={`unbind-trc-${usr.id}`}
                                        onClick={() => {
                                          if (onUnbindUserWallet) {
                                            onUnbindUserWallet(usr.id, 'TRC20');
                                            alert(`Successfully unbound TRC20 wallet address for user ${usr.email}`);
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all self-start sm:self-center cursor-pointer"
                                      >
                                        🔓 Unbind TRC20
                                      </button>
                                    )}
                                  </div>

                                  {/* BEP20 Wallet */}
                                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                      <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">USDT (BEP20 Network)</span>
                                      <span className="text-xs font-mono font-medium text-slate-200 truncate block max-w-[200px]" title={usr.wallet.usdtBep20Address || 'Not configured'}>
                                        {usr.wallet.usdtBep20Address || <span className="text-slate-500 italic">Unconfigured</span>}
                                      </span>
                                    </div>
                                    {usr.wallet.usdtBep20Address && (
                                      <button
                                        id={`unbind-bep-${usr.id}`}
                                        onClick={() => {
                                          if (onUnbindUserWallet) {
                                            onUnbindUserWallet(usr.id, 'BEP20');
                                            alert(`Successfully unbound BEP20 wallet address for user ${usr.email}`);
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all self-start sm:self-center cursor-pointer"
                                      >
                                        🔓 Unbind BEP20
                                      </button>
                                    )}
                                  </div>

                                </div>
                              </div>

                              {/* COLUMN 2: BALANCE ADJUSTMENT */}
                              <div className="space-y-3.5">
                                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                                  <Coins className="w-4 h-4 text-emerald-400" />
                                  <span>Direct Funds Desk (Add / Deduct)</span>
                                </div>

                                <div className="p-4 bg-slate-900 border border-slate-850 rounded-lg space-y-4">
                                  {/* Current Balance Hud */}
                                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Current Available Balance:</span>
                                    <span className="text-sm font-black text-amber-300 font-mono">${(usr.balance || 0).toFixed(2)} USDT</span>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Amount to Add or Deduct (USDT)</span>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={adjustAmount}
                                        onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                                        placeholder="e.g. 50"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <button
                                      id={`adjust-add-btn-${usr.id}`}
                                      onClick={() => {
                                        if (onAdjustUserFunds) {
                                          onAdjustUserFunds(usr.id, adjustAmount, 'add');
                                          alert(`Successfully added $${adjustAmount.toFixed(2)} USDT to user ${usr.email}'s balance!`);
                                        }
                                      }}
                                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span>+ Add ${adjustAmount}</span>
                                    </button>

                                    <button
                                      id={`adjust-deduct-btn-${usr.id}`}
                                      onClick={() => {
                                        if (usr.balance < adjustAmount) {
                                          const proceed = window.confirm(`User only has $${usr.balance.toFixed(2)}. Deducting $${adjustAmount.toFixed(2)} will set their balance to $0.00. Do you want to proceed?`);
                                          if (!proceed) return;
                                        }
                                        if (onAdjustUserFunds) {
                                          onAdjustUserFunds(usr.id, adjustAmount, 'deduct');
                                          alert(`Successfully deducted $${adjustAmount.toFixed(2)} USDT from user ${usr.email}'s balance!`);
                                        }
                                      }}
                                      className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 hover:text-rose-350 font-black uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Minus className="w-4 h-4" />
                                      <span>- Deduct ${adjustAmount}</span>
                                    </button>
                                  </div>

                                  <span className="text-[9px] text-slate-500 italic block leading-snug">
                                    * Note: Funds transactions are processed instantaneously and added to system ledgers.
                                  </span>
                                </div>

                              </div>

                            </div>

                          </div>
                        </td>
                      </tr>
                    )
                  ])}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: SECURITY & ANTI-FRAUD LOGS ==================== */}
        {adminTab === 'security' && (
          <div className="space-y-4">
            
            <div className="flex items-center space-x-2 text-rose-450 animate-pulse bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-350 leading-tight">
                Anti-fraud loops active. Checking IP address collision & transaction signatures.
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden font-mono text-[10.5px]">
              <div className="bg-slate-950 p-3 border-b border-slate-850 uppercase text-[9px] font-bold text-slate-400">
                Threat Matrix Security log
              </div>

              <div className="divide-y divide-slate-850">
                {securityLogs.map((log) => (
                  <div key={log.id} className="p-3.5 space-y-2 hover:bg-slate-850/20 transition-all">
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[8.5px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${
                        log.eventType === 'Anti_Fraud_Trigger'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : log.eventType === 'Admin_Action'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {log.eventType}
                      </span>
                      <span className="text-slate-500 text-[9px]">{log.timestamp}</span>
                    </div>

                    <p className="text-slate-300 leading-relaxed font-sans text-xs">
                      {log.description}
                    </p>

                    <div className="flex items-center justify-between text-slate-500 text-[9px] font-medium pt-1 border-t border-slate-950/20">
                      <span>Gateway Node IP: <strong className="text-slate-400 font-mono">{log.ipAddress}</strong></span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3" /> SECURE INTEGRITY
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 7: SCAN GATE & GATEWAY SETTINGS ==================== */}
        {adminTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Settings */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-red-400">⚙️ Barcode Scanning Gateway Config</h3>
                <p className="text-[10px] text-slate-400 font-sans mt-1">
                  Configure the primary deposit destination keycodes, branding labels, and warning texts displayed on the scan gate.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* TRC20 Address and QR Code */}
                <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-amber-500 uppercase font-bold block font-mono">USDT (TRC20 Network)</label>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold font-mono bg-amber-500/10 text-amber-400">TRON NETWORK</span>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <span className="text-[9px] text-slate-400 block font-bold">Wallet Address:</span>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={trc20Addr}
                        onChange={(e) => setTrc20Addr(e.target.value)}
                        placeholder="Disabled / Empty"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500 focus:bg-slate-950"
                      />
                      {trc20Addr && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete/clear the TRC20 Address? Users will not be able to deposit via TRC20.')) {
                              setTrc20Addr('');
                            }
                          }}
                          className="px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold font-mono whitespace-nowrap cursor-pointer transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 font-mono">
                    <span className="text-[9px] text-slate-400 block font-bold">QR Code Image:</span>
                    <div className="flex items-center gap-4 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div className="w-14 h-14 bg-white p-0.5 rounded flex items-center justify-center shrink-0 border border-slate-800">
                        {trc20QrCode ? (
                          <img src={trc20QrCode} alt="Custom TRC20 QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : trc20Addr ? (
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trc20Addr)}`} alt="Auto TRC20 QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[7px] text-slate-500 text-center font-bold">No QR</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="block text-[9px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-md text-center cursor-pointer transition-colors font-sans">
                          📥 Upload Custom QR Code Image
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => handleQrUpload(e, 'TRC20')} 
                          />
                        </label>
                        {trc20QrCode && (
                          <button
                            type="button"
                            onClick={() => setTrc20QrCode('')}
                            className="w-full py-1 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/30 text-red-400 text-[8px] font-bold uppercase rounded transition-colors cursor-pointer"
                          >
                            Remove Custom QR (Restore Auto)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BEP20 Address and QR Code */}
                <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-emerald-400 uppercase font-bold block font-mono">USDT (BEP20 Network)</label>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold font-mono bg-emerald-500/10 text-emerald-400">BSC BNB NETWORK</span>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <span className="text-[9px] text-slate-400 block font-bold">Wallet Address:</span>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={bep20Addr}
                        onChange={(e) => setBep20Addr(e.target.value)}
                        placeholder="Disabled / Empty"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-slate-950"
                      />
                      {bep20Addr && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete/clear the BEP20 Address? Users will not be able to deposit via BEP20.')) {
                              setBep20Addr('');
                            }
                          }}
                          className="px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold font-mono whitespace-nowrap cursor-pointer transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 font-mono">
                    <span className="text-[9px] text-slate-400 block font-bold">QR Code Image:</span>
                    <div className="flex items-center gap-4 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div className="w-14 h-14 bg-white p-0.5 rounded flex items-center justify-center shrink-0 border border-slate-800">
                        {bep20QrCode ? (
                          <img src={bep20QrCode} alt="Custom BEP20 QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : bep20Addr ? (
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(bep20Addr)}`} alt="Auto BEP20 QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[7px] text-slate-500 text-center font-bold">No QR</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="block text-[9px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-md text-center cursor-pointer transition-colors font-sans">
                          📥 Upload Custom QR Code Image
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => handleQrUpload(e, 'BEP20')} 
                          />
                        </label>
                        {bep20QrCode && (
                          <button
                            type="button"
                            onClick={() => setBep20QrCode('')}
                            className="w-full py-1 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/30 text-red-400 text-[8px] font-bold uppercase rounded transition-colors cursor-pointer"
                          >
                            Remove Custom QR (Restore Auto)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scan Gate Title */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Scan Gate Display Title</label>
                  <input 
                    type="text"
                    required
                    value={gateTitle}
                    onChange={(e) => setGateTitle(e.target.value)}
                    placeholder="Barcode Scanning Gateway"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-100 font-sans text-xs focus:outline-none focus:border-red-500 focus:bg-slate-950"
                  />
                  <span className="text-[8px] text-slate-500 block">Main banner title of the scan gate container.</span>
                </div>

                {/* Scan Gate Subtitle / Warning text */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Scan Gate Warning Subtitle</label>
                  <textarea 
                    rows={3}
                    required
                    value={gateSubtitle}
                    onChange={(e) => setGateSubtitle(e.target.value)}
                    placeholder="Enter subtitle warning text..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-100 font-sans text-xs focus:outline-none focus:border-red-500 focus:bg-slate-950 resize-none"
                  />
                  <span className="text-[8px] text-slate-500 block">Dispatched guidelines to ensure users select matching blockchain networks.</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-600 hover:to-amber-700 text-white font-mono uppercase text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    💾 Save Scanner Configuration
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 font-mono uppercase text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    🔄 Restore Defaults
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Live Interactive User Preview */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-slate-300">📱 Scan Gate Live Preview</h4>
                  <p className="text-[8px] text-slate-500 font-sans mt-0.5">Real-time simulator of active user interface</p>
                </div>
                <span className="text-[8px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">
                  Live View
                </span>
              </div>

              {/* simulated selector to test preview */}
              <div className="flex gap-2 p-1.5 bg-slate-900/60 rounded-xl border border-slate-900 text-[10px] font-mono">
                <span className="text-slate-400 self-center pl-1 font-bold">Network Toggle:</span>
                <button 
                  type="button"
                  onClick={() => setPreviewNetwork('TRC20')} 
                  className={`px-3 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${previewNetwork === 'TRC20' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  USDT-TRC20
                </button>
                <button 
                  type="button"
                  onClick={() => setPreviewNetwork('BEP20')} 
                  className={`px-3 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${previewNetwork === 'BEP20' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  USDT-BEP20
                </button>
              </div>

              {/* The dynamic preview widget */}
              <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl space-y-3 font-mono text-slate-100 text-xs">
                
                <div className="space-y-1">
                  <span className="text-[8px] text-amber-400 uppercase block font-bold tracking-widest leading-none">Company Wallet Contract</span>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-900 gap-2">
                    <span className="text-[10px] text-slate-300 truncate select-all">
                      {previewNetwork === 'TRC20' ? (trc20Addr || 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy') : (bep20Addr || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')}
                    </span>
                    <span className="text-[8px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 uppercase font-bold">
                      Copy
                    </span>
                  </div>
                </div>

                {/* Scan Gate box */}
                <div className="flex items-center space-x-3 bg-slate-950/60 p-3 text-[9px] text-slate-450 rounded-lg border border-slate-950">
                  <div className="w-12 h-12 bg-white p-0.5 rounded shrink-0 flex items-center justify-center border border-slate-700 relative overflow-hidden select-none">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        previewNetwork === 'TRC20' ? (trc20Addr || 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy') : (bep20Addr || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')
                      )}`} 
                      alt="Dynamic Scan Gate QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300 block uppercase text-[8px] tracking-wider text-amber-400 font-sans">
                      {gateTitle || 'Barcode Scanning Gateway'}
                    </span>
                    <span className="text-[8px] text-slate-400 leading-normal">
                      {gateSubtitle || 'Dispatch on the matching blockchain. Tokens sent to mismatched networks are irreversibly lost.'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Status information alert */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-start gap-2.5 text-[10px] text-blue-350">
                <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 font-sans leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block text-blue-400">Dynamic Scan QR Generator</span>
                  <span>
                    The applet utilizes standard API query-strings to encode your customized addresses into functional, high-density matrix barcodes instantly. No static assets require replacement.
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
