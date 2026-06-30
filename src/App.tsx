/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import MobileShell from './components/MobileShell';
import LandingPage from './components/LandingPage';
import AuthPages from './components/AuthPages';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import GlobalNavbar from './components/GlobalNavbar';
import { RealEstateProject, Transaction, UserAccount, InvestmentRecord, ProfitClaimRecord, SecurityLog, SystemSettings } from './types';
import { INITIAL_PROJECTS, INITIAL_USER, INITIAL_ADMIN, INITIAL_TRANSACTIONS, INITIAL_SECURITY_LOGS } from './data';
import { 
  seedInitialDataIfEmpty,
  loadProjectsFromFirebase,
  loadUsersFromFirebase,
  loadTransactionsFromFirebase,
  loadInvestmentsFromFirebase,
  loadClaimsFromFirebase,
  loadSecurityLogsFromFirebase,
  saveProjectToFirebase,
  saveUserToFirebase,
  saveTransactionToFirebase,
  saveInvestmentToFirebase,
  saveClaimToFirebase,
  saveSecurityLogToFirebase,
  deleteProjectFromFirebase,
  isFirebaseEnabled,
  loadSystemSettingsFromFirebase,
  saveSystemSettingsToFirebase
} from './lib/firebaseSync';

export default function App() {
  const [isFirebaseSynced, setIsFirebaseSynced] = useState<boolean>(false);
  const isInitialSyncRef = useRef(true);

  useEffect(() => {
    if (isFirebaseSynced) {
      const timer = setTimeout(() => {
        isInitialSyncRef.current = false;
      }, 1000); // 1s cooldown to prevent startup writes
      return () => clearTimeout(timer);
    }
  }, [isFirebaseSynced]);
  // Navigation states
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'register' | 'forgot' | 'dashboard' | 'admin'>('home');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'properties' | 'wallet' | 'claim' | 'referrals' | 'profile'>('overview');
  const [activeAdminTab, setActiveAdminTab] = useState<'stats' | 'deposits' | 'withdrawals' | 'projects' | 'users' | 'security'>('stats');
  const [scrollToAnchor, setScrollToAnchor] = useState<string | null>(null);
  const [authReason, setAuthReason] = useState<string | null>(null);

  // Core reactive data tables (Synchronized with localStorage)
  const [projectsList, setProjectsList] = useState<RealEstateProject[]>(() => {
    const saved = localStorage.getItem('inv_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [transactionsList, setTransactionsList] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('inv_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [usersListState, setUsersListState] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('inv_users');
    const list: UserAccount[] = saved ? JSON.parse(saved) : [INITIAL_USER, INITIAL_ADMIN];
    return list.map(u => u.id === 'user-admin' && u.email === 'admin@fundora.one' ? { ...u, email: 'no-reply@fundora.one' } : u);
  });

  const [activeUser, setActiveUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('inv_active_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id === 'user-admin' && parsed.email === 'admin@fundora.one') {
        return { ...parsed, email: 'no-reply@fundora.one' };
      }
      return parsed;
    } catch (_) {
      return null;
    }
  });

  // Robust URL Hash Routing Sync using Refs to prevent infinite loop / flickering
  const activeUserRef = useRef(activeUser);
  const currentPageRef = useRef(currentPage);
  const activeDashboardTabRef = useRef(activeDashboardTab);
  const activeAdminTabRef = useRef(activeAdminTab);
  const authReasonRef = useRef(authReason);

  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { activeDashboardTabRef.current = activeDashboardTab; }, [activeDashboardTab]);
  useEffect(() => { activeAdminTabRef.current = activeAdminTab; }, [activeAdminTab]);
  useEffect(() => { authReasonRef.current = authReason; }, [authReason]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const currentUser = activeUserRef.current;
      const currentPg = currentPageRef.current;
      const currentDashboardTab = activeDashboardTabRef.current;
      const currentAdminTab = activeAdminTabRef.current;
      const currentAuthReason = authReasonRef.current;
      console.log('[App] handleHashChange triggered. hash:', hash, 'currentPg:', currentPg);

      if (!hash || hash === '#/' || hash === '#/home') {
        if (currentPg !== 'home') setCurrentPage('home');
      } else if (hash === '#/login' || hash.startsWith('#/login')) {
        if (currentPg !== 'login') setCurrentPage('login');
      } else if (hash === '#/register' || hash.startsWith('#/register')) {
        if (currentPg !== 'register') setCurrentPage('register');
      } else if (hash === '#/forgot' || hash.startsWith('#/forgot')) {
        if (currentPg !== 'forgot') setCurrentPage('forgot');
      } else if (hash.startsWith('#/dashboard')) {
        const parts = hash.split('/');
        const tab = parts[2] as any;
        const validTabs = ['overview', 'properties', 'wallet', 'claim', 'referrals', 'profile'];
        
        // Authorization Guards
        if (!currentUser) {
          if (currentAuthReason !== 'Dashboard') setAuthReason('Dashboard');
          if (currentPg !== 'login') setCurrentPage('login');
          window.history.replaceState(null, '', '#/login');
          return;
        }
        if (currentUser.role === 'admin') {
          if (currentPg !== 'admin') setCurrentPage('admin');
          return;
        }

        if (currentPg !== 'dashboard') setCurrentPage('dashboard');
        if (validTabs.includes(tab)) {
          if (currentDashboardTab !== tab) setActiveDashboardTab(tab);
        } else {
          if (currentDashboardTab !== 'overview') setActiveDashboardTab('overview');
        }
      } else if (hash.startsWith('#/admin')) {
        const parts = hash.split('/');
        const tab = parts[2] as any;
        const validTabs = ['stats', 'deposits', 'withdrawals', 'projects', 'users', 'security'];

        // Authorization Guards
        if (!currentUser) {
          if (currentAuthReason !== 'Admin Panel') setAuthReason('Admin Panel');
          if (currentPg !== 'login') setCurrentPage('login');
          window.history.replaceState(null, '', '#/login');
          return;
        }
        if (currentUser.role !== 'admin') {
          if (currentPg !== 'dashboard') setCurrentPage('dashboard');
          return;
        }

        if (currentPg !== 'admin') setCurrentPage('admin');
        if (validTabs.includes(tab)) {
          if (currentAdminTab !== tab) setActiveAdminTab(tab);
        } else {
          if (currentAdminTab !== 'stats') setActiveAdminTab('stats');
        }
      }
    };

    // Run on mount or when key dependencies update
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    let newHash = '';
    if (currentPage === 'home') {
      newHash = '#/home';
    } else if (currentPage === 'login') {
      newHash = '#/login';
    } else if (currentPage === 'register') {
      newHash = '#/register';
    } else if (currentPage === 'forgot') {
      newHash = '#/forgot';
    } else if (currentPage === 'dashboard') {
      newHash = `#/dashboard/${activeDashboardTab}`;
    } else if (currentPage === 'admin') {
      newHash = `#/admin/${activeAdminTab}`;
    }

    // Preserve any existing query parameters from the current hash (e.g. ?ref=INV-5656)
    if (window.location.hash) {
      const parts = window.location.hash.split('?');
      if (parts.length > 1 && newHash && !newHash.includes('?')) {
        newHash = `${newHash}?${parts[1]}`;
      }
    }

    console.log('[App] hash update useEffect currentPage:', currentPage, 'currentHash:', window.location.hash, 'newHash:', newHash);
    if (window.location.hash !== newHash) {
      console.log('[App] Replacing history hash with:', newHash);
      window.history.replaceState(null, '', newHash);
    }
  }, [currentPage, activeDashboardTab, activeAdminTab]);

  const [investmentsList, setInvestmentsList] = useState<InvestmentRecord[]>(() => {
    const saved = localStorage.getItem('inv_investments');
    const defaultRecord: InvestmentRecord[] = [
      {
        id: 'inv-rec-101',
        userId: 'user-demo',
        userEmail: 'investor@example.com',
        projectId: 'proj-1',
        projectName: 'Canary Wharf Heights',
        sharesPurchased: 5,
        totalCost: 565.00,
        purchaseDate: '2026-06-16',
        dailyProfitRate: 2.50, // Yielding $2.50 USDT per day
        durationMonths: 18,
        remainingMonths: 14,
        status: 'Active'
      }
    ];
    return saved ? JSON.parse(saved) : defaultRecord;
  });

  const [claimsHistory, setClaimsHistory] = useState<ProfitClaimRecord[]>(() => {
    const saved = localStorage.getItem('inv_claims');
    const defaultClaims: ProfitClaimRecord[] = [
      {
        id: 'claim-rec-1',
        userId: 'user-demo',
        userEmail: 'investor@example.com',
        date: '2026-06-21',
        amount: 2.50,
        status: 'Claimed',
        claimedAt: '21:15'
      },
      {
        id: 'claim-rec-2',
        userId: 'user-demo',
        userEmail: 'investor@example.com',
        date: '2026-06-20',
        amount: 2.50,
        status: 'Expired' // A missed claim example
      }
    ];
    return saved ? JSON.parse(saved) : defaultClaims;
  });

  const [securityLogsList, setSecurityLogsList] = useState<SecurityLog[]>(() => {
    const saved = localStorage.getItem('inv_security_logs');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_LOGS;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('inv_system_settings');
    return saved ? JSON.parse(saved) : {
      id: 'default',
      usdtTrc20Address: 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy',
      usdtBep20Address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      scanGateTitle: 'Barcode Scanning Gateway',
      scanGateSubtitle: 'Dispatch on the matching blockchain. Tokens sent to mismatched networks are irreversibly lost.'
    };
  });

  // Real-time clock settings (starts matching real local timezone, updates dynamically)
  const [isTimeSimulated, setIsTimeSimulated] = useState<boolean>(false);
  const [clockOffset, setClockOffset] = useState<number>(() => {
    const saved = localStorage.getItem('inv_clock_offset');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [simulatedHour, setSimulatedHour] = useState<number>(() => {
    const savedOffset = localStorage.getItem('inv_clock_offset');
    const offset = savedOffset ? parseInt(savedOffset, 10) : 0;
    return new Date(Date.now() + offset).getHours();
  });
  const [simulatedMinute, setSimulatedMinute] = useState<number>(() => {
    const savedOffset = localStorage.getItem('inv_clock_offset');
    const offset = savedOffset ? parseInt(savedOffset, 10) : 0;
    return new Date(Date.now() + offset).getMinutes();
  });

  const getSecureServerTime = async (): Promise<Date> => {
    try {
      const response = await fetch('/?cb=' + Date.now(), { method: 'HEAD' });
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const d = new Date(dateHeader);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve local origin date header", e);
    }

    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { signal: AbortSignal.timeout(3000) });
      const data = await response.json();
      if (data && data.utc_datetime) {
        const d = new Date(data.utc_datetime);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve worldtimeapi datetime", e);
    }

    try {
      const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC', { signal: AbortSignal.timeout(3000) });
      const data = await response.json();
      if (data && data.dateTime) {
        const d = new Date(data.dateTime);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve timeapi.io datetime", e);
    }

    return new Date();
  };

  const syncSecureClock = async () => {
    const secureTime = await getSecureServerTime();
    const offset = secureTime.getTime() - Date.now();
    setClockOffset(offset);
    localStorage.setItem('inv_clock_offset', offset.toString());
  };

  useEffect(() => {
    syncSecureClock();
    const interval = setInterval(syncSecureClock, 45000); // Check server time every 45s
    return () => clearInterval(interval);
  }, []);

  // Custom setSimulatedHour wrapper
  const handleSetSimulatedHour = (hour: number) => {
    setIsTimeSimulated(false);
    const now = new Date(Date.now() + clockOffset);
    setSimulatedHour(now.getHours());
    setSimulatedMinute(now.getMinutes());
  };

  // Keep simulatedHour and simulatedMinute in sync with secure synchronized time
  useEffect(() => {
    const updateRealTime = () => {
      const now = new Date(Date.now() + clockOffset);
      setSimulatedHour(now.getHours());
      setSimulatedMinute(now.getMinutes());
    };

    updateRealTime(); // Run immediately

    const interval = setInterval(updateRealTime, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [clockOffset]);

  // Auto-Persist states to browser local storage & Firestore (Only after initial synchronization completes!)
  useEffect(() => {
    localStorage.setItem('inv_projects', JSON.stringify(projectsList));
    if (isFirebaseSynced && isFirebaseEnabled() && !isInitialSyncRef.current) {
      projectsList.forEach(proj => saveProjectToFirebase(proj));
    }
  }, [projectsList, isFirebaseSynced]);

  useEffect(() => {
    localStorage.setItem('inv_transactions', JSON.stringify(transactionsList));
    if (isFirebaseSynced && isFirebaseEnabled() && !isInitialSyncRef.current) {
      transactionsList.forEach(tx => saveTransactionToFirebase(tx));
    }
  }, [transactionsList, isFirebaseSynced]);

  useEffect(() => {
    localStorage.setItem('inv_users', JSON.stringify(usersListState));
    if (isFirebaseSynced && isFirebaseEnabled() && !isInitialSyncRef.current) {
      usersListState.forEach(user => saveUserToFirebase(user));
    }
  }, [usersListState, isFirebaseSynced]);

  useEffect(() => {
    localStorage.setItem('inv_active_user', activeUser ? JSON.stringify(activeUser) : '');
    if (isFirebaseSynced && isFirebaseEnabled() && activeUser && !isInitialSyncRef.current) {
      saveUserToFirebase(activeUser);
    }
  }, [activeUser, isFirebaseSynced]);

  useEffect(() => {
    localStorage.setItem('inv_investments', JSON.stringify(investmentsList));
    if (isFirebaseSynced && isFirebaseEnabled() && !isInitialSyncRef.current) {
      investmentsList.forEach(inv => saveInvestmentToFirebase(inv));
    }
  }, [investmentsList, isFirebaseSynced]);

  useEffect(() => {
    localStorage.setItem('inv_claims', JSON.stringify(claimsHistory));
    if (isFirebaseSynced && isFirebaseEnabled() && !isInitialSyncRef.current) {
      claimsHistory.forEach(cl => saveClaimToFirebase(cl));
    }
  }, [claimsHistory, isFirebaseSynced]);

  useEffect(() => {
    localStorage.setItem('inv_security_logs', JSON.stringify(securityLogsList));
    if (isFirebaseSynced && isFirebaseEnabled() && !isInitialSyncRef.current) {
      securityLogsList.forEach(log => saveSecurityLogToFirebase(log));
    }
  }, [securityLogsList, isFirebaseSynced]);

  useEffect(() => {
    localStorage.setItem('inv_system_settings', JSON.stringify(systemSettings));
    if (isFirebaseSynced && isFirebaseEnabled() && !isInitialSyncRef.current) {
      saveSystemSettingsToFirebase(systemSettings);
    }
  }, [systemSettings, isFirebaseSynced]);

  // Initial boot: Seed & Load everything from Firebase!
  useEffect(() => {
    const initializeFirebaseData = async () => {
      if (!isFirebaseEnabled()) {
        console.warn("Firebase is not active. Falling back entirely to local storage.");
        setIsFirebaseSynced(true);
        return;
      }

      console.log("Synchronizing with Firestore Database...");
      // Seed first if empty
      await seedInitialDataIfEmpty();

      // Load all collections
      try {
        const [projects, users, transactions, investments, claims, logs, settings] = await Promise.all([
          loadProjectsFromFirebase(),
          loadUsersFromFirebase(),
          loadTransactionsFromFirebase(),
          loadInvestmentsFromFirebase(),
          loadClaimsFromFirebase(),
          loadSecurityLogsFromFirebase(),
          loadSystemSettingsFromFirebase()
        ]);

        if (projects && projects.length > 0) setProjectsList(projects);
        if (users && users.length > 0) setUsersListState(users);
        if (transactions) setTransactionsList(transactions);
        if (investments) setInvestmentsList(investments);
        if (claims) setClaimsHistory(claims);
        if (logs) setSecurityLogsList(logs);
        if (settings) setSystemSettings(settings);

        // Also update active user from the fresh database if there was one saved in localStorage
        const savedActiveUser = localStorage.getItem('inv_active_user');
        if (savedActiveUser) {
          try {
            const parsed = JSON.parse(savedActiveUser);
            const freshUser = users.find(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
            if (freshUser) {
              setActiveUser(freshUser);
            } else {
              setActiveUser(parsed);
            }
          } catch (_) {
            // fallback
          }
        }

        console.log("Firestore Synchronized successfully!");
        setIsFirebaseSynced(true);
      } catch (err) {
        console.error("Failed to load records from Firestore on startup, using local storage", err);
        setIsFirebaseSynced(true); // proceed using local storage fallback
      }
    };

    initializeFirebaseData();
  }, []);

  // Clean up and migrate old Pakistani/South Asian cached values to UAE and UK defaults on startup
  useEffect(() => {
    const savedProjectsRaw = localStorage.getItem('inv_projects');
    if (savedProjectsRaw) {
      try {
        const parsed = JSON.parse(savedProjectsRaw);
        if (Array.isArray(parsed)) {
          const hasPakistaniData = parsed.some(p => 
            p.location?.toLowerCase().includes('pakistan') ||
            p.location?.toLowerCase().includes('karachi') ||
            p.location?.toLowerCase().includes('islamabad') ||
            p.location?.toLowerCase().includes('lahore') ||
            p.name?.toLowerCase().includes('pakistan') ||
            p.name?.toLowerCase().includes('karachi') ||
            p.name?.toLowerCase().includes('islamabad') ||
            p.name?.toLowerCase().includes('lahore')
          );
          
          if (hasPakistaniData) {
            localStorage.setItem('inv_projects', JSON.stringify(INITIAL_PROJECTS));
            setProjectsList(INITIAL_PROJECTS);
            
            localStorage.setItem('inv_users', JSON.stringify([INITIAL_USER, INITIAL_ADMIN]));
            setUsersListState([INITIAL_USER, INITIAL_ADMIN]);
            
            const activeUserRaw = localStorage.getItem('inv_active_user');
            if (activeUserRaw) {
              const u = JSON.parse(activeUserRaw);
              if (u && (u.name?.toLowerCase().includes('khan') || u.name?.toLowerCase().includes('pak') || u.email?.toLowerCase().includes('.pk'))) {
                localStorage.removeItem('inv_active_user');
                setActiveUser(null);
              }
            }
          }
        }
      } catch (err) {
        console.error("Migration error:", err);
      }
    }
  }, []);

  // Handle cross-page scrolling to landing page anchors
  useEffect(() => {
    if (currentPage === 'home' && scrollToAnchor) {
      const timer = setTimeout(() => {
        const element = document.getElementById(scrollToAnchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setScrollToAnchor(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentPage, scrollToAnchor]);

  // Append system security log function
  const addSystemLog = (eventType: any, description: string, status: any) => {
    const newLog: SecurityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      eventType,
      description,
      ipAddress: '198.51.100.45', // Standard Enterprise gateway IP
      status
    };
    setSecurityLogsList(prev => [newLog, ...prev]);
  };

  // Switch navigation pages safely
  const handlePageNavigation = (page: 'home' | 'login' | 'register' | 'forgot' | 'dashboard' | 'admin', reason?: string) => {
    console.log('[App] handlePageNavigation called with page:', page, 'reason:', reason);
    if (reason) {
      setAuthReason(reason);
    } else if (page === 'home' || page === 'login' || page === 'register' || page === 'forgot') {
      if (!reason) {
        setAuthReason(null);
      }
    }

    if ((page === 'dashboard' || page === 'admin') && !activeUser) {
      if (!reason) {
        setAuthReason('Dashboard');
      }
      setCurrentPage('login');
      return;
    }

    // Role security guards:
    if (activeUser) {
      if (activeUser.role === 'admin') {
        // Admins can never access standard user dashboard
        if (page === 'dashboard') {
          setCurrentPage('admin');
          return;
        }
      } else {
        // Regular users can never access admin compliance panel
        if (page === 'admin') {
          setCurrentPage('dashboard');
          return;
        }
      }
    }

    setCurrentPage(page);
  };

  const saveAndSyncUser = (user: UserAccount) => {
    if (isFirebaseEnabled()) {
      saveUserToFirebase(user);
    }
  };

  const handleUpdateAnyUser = (userId: string, updatedFields: Partial<UserAccount>) => {
    setUsersListState(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedU = { ...u, ...updatedFields };
        if (activeUser && activeUser.id === userId) {
          setActiveUser(updatedU);
        }
        saveAndSyncUser(updatedU);
        return updatedU;
      }
      return u;
    }));
  };

  // Successful Session Login/Register
  const handleAuthSuccess = (userAccount: UserAccount) => {
    setActiveUser(userAccount);

    // Save/update global users list
    setUsersListState(prev => {
      const exists = prev.some(u => u.email.toLowerCase() === userAccount.email.toLowerCase());
      if (exists) {
        return prev.map(u => u.email.toLowerCase() === userAccount.email.toLowerCase() ? { ...u, ...userAccount } : u);
      }
      return [...prev, userAccount];
    });

    saveAndSyncUser(userAccount);

    // Send verified user straight to dashboard, or admin straight to admin desk
    if (userAccount.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('dashboard');
    }
  };

  // Add pending register user to usersListState to allow resumption
  const handleRegisterPending = (pendingUser: UserAccount) => {
    setUsersListState(prev => {
      const exists = prev.some(u => u.email.toLowerCase() === pendingUser.email.toLowerCase());
      if (exists) {
        return prev.map(u => u.email.toLowerCase() === pendingUser.email.toLowerCase() ? { ...u, ...pendingUser } : u);
      }
      return [...prev, pendingUser];
    });

    saveAndSyncUser(pendingUser);
  };

  const handleResetPassword = (email: string, newPassword: string) => {
    setUsersListState(prev => prev.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        const updatedU = { ...u, password: newPassword };
        saveAndSyncUser(updatedU);
        return updatedU;
      }
      return u;
    }));
    addSystemLog('Secure', `Password updated successfully for ${email}.`, 'Secure');
  };

  const handleLogout = () => {
    addSystemLog('Login_Failure', `Active session for ${activeUser?.email || 'Guest'} disconnected.`, 'Secure');
    setActiveUser(null);
    setCurrentPage('home');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateAdmin = () => {
    setCurrentPage('admin');
  };

  // Wallet address link binding
  const handleBindWallet = (trc20: string, bep20: string) => {
    if (!activeUser) return;
    const updatedUser = {
      ...activeUser,
      wallet: {
        ...activeUser.wallet,
        usdtTrc20Address: trc20,
        usdtBep20Address: bep20,
        isVerified: true
      }
    };
    setActiveUser(updatedUser);
    setUsersListState(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
    saveAndSyncUser(updatedUser);
    addSystemLog('Wallet_Verification', `Cryptographic wallets bound & verified for ${updatedUser.email}. TRC20: ${trc20.slice(0, 6)}...`, 'Secure');
  };

  // Profile fields updating callback
  const handleUpdateUser = (updatedFields: Partial<UserAccount>) => {
    if (!activeUser) return;
    const updatedUser = { ...activeUser, ...updatedFields };
    setActiveUser(updatedUser);
    setUsersListState(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    saveAndSyncUser(updatedUser);
    addSystemLog('Wallet_Verification', `User profile updated for ${updatedUser.email}.`, 'Secure');
  };

  // Deposit Submit proof
  const handleSubmitDeposit = (amount: number, network: 'TRC20' | 'BEP20', txHash: string, proofImg: string) => {
    if (!activeUser) return;
    const newTx: Transaction = {
      id: `tx-dep-${Date.now()}`,
      userId: activeUser.id,
      userEmail: activeUser.email,
      type: 'Deposit',
      amount,
      network,
      txHash,
      proofImage: proofImg,
      walletAddress: network === 'TRC20' ? activeUser.wallet.usdtTrc20Address || 'TX1h2A9eFm7xKsZ8Jq9w' : activeUser.wallet.usdtBep20Address || '0x71C7656EC7ab88b0',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Pending',
      description: `Pending USDT ${network} Deposit proof manual verification.`
    };

    setTransactionsList(prev => [newTx, ...prev]);
    addSystemLog('Admin_Action', `Pending deposit request of $${amount} USDT submitted by ${activeUser.email}. Check ledger.`, 'Info');
  };

  // Create withdrawal Request
  const handleSubmitWithdrawal = (amount: number, network: 'TRC20' | 'BEP20', address: string) => {
    if (!activeUser) return;

    // Deduct available balance immediately (in lock reserve state)
    const updatedUser = {
      ...activeUser,
      balance: Math.max(0, activeUser.balance - amount),
      totalWithdrawn: activeUser.totalWithdrawn + amount
    };

    const feeAmount = Math.round((amount * 0.20) * 100) / 100;
    const netPayout = Math.max(0, amount - feeAmount);

    const newTx: Transaction = {
      id: `tx-wth-${Date.now()}`,
      userId: activeUser.id,
      userEmail: activeUser.email,
      type: 'Withdrawal',
      amount,
      network,
      walletAddress: address,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Pending',
      description: `USDT ${network} Withdrawal of $${amount.toFixed(2)} USDT. Net payout of $${netPayout.toFixed(2)} USDT (after 20% platform fee of $${feeAmount.toFixed(2)} USDT) pending administrative dispatch.`
    };

    setActiveUser(updatedUser);
    setUsersListState(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
    setTransactionsList(prev => [newTx, ...prev]);
    addSystemLog('Large_Withdrawal', `Withdrawal claim of $${amount} USDT submitted by ${activeUser.email}. Net payout $${netPayout} after 20% fee.`, 'Secure');
  };

  // Buy fractional shares
  const handlePurchaseShares = (projectId: string, sharesCount: number): { success: boolean; error?: string } => {
    if (!activeUser) return { success: false, error: 'Authorization error.' };

    const project = projectsList.find(p => p.id === projectId);
    if (!project) return { success: false, error: 'Property not found.' };

    if (project.availableShares < sharesCount) {
      return { success: false, error: 'Insufficient available shares currently on catalog.' };
    }

    const totalCost = sharesCount * project.pricePerShare;
    if (activeUser.balance < totalCost) {
      return { success: false, error: 'Insufficient wallet balances. Please deposit first.' };
    }

    // Deduct balance and update user stats
    const updatedUser: UserAccount = {
      ...activeUser,
      balance: Math.round((activeUser.balance - totalCost) * 100) / 100,
      totalInvestment: activeUser.totalInvestment + totalCost
    };

    // Update Project shares
    const updatedProject: RealEstateProject = {
      ...project,
      availableShares: project.availableShares - sharesCount,
      status: (project.availableShares - sharesCount) === 0 ? 'Sold Out' : 'Active'
    };

    // Build unique Investment Record
    const dailyProfitRate = Math.round((totalCost * ((project.expectedRoi / 100) / 365)) * 100) / 100;
    const newInvestment: InvestmentRecord = {
      id: `inv-${Date.now()}`,
      userId: activeUser.id,
      userEmail: activeUser.email,
      projectId: project.id,
      projectName: project.name,
      sharesPurchased: sharesCount,
      totalCost,
      purchaseDate: new Date().toISOString().slice(0, 10),
      dailyProfitRate,
      durationMonths: project.durationMonths,
      remainingMonths: project.durationMonths,
      status: 'Active'
    };

    // Build investment Transaction receipt
    const newTx: Transaction = {
      id: `tx-purch-${Date.now()}`,
      userId: activeUser.id,
      userEmail: activeUser.email,
      type: 'Investment',
      amount: totalCost,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Completed',
      description: `Purchased ${sharesCount} fractional shares in ${project.name}`
    };

    // Apply updates across lists
    setActiveUser(updatedUser);
    setUsersListState(usersListState.map(u => u.email === updatedUser.email ? updatedUser : u));
    setProjectsList(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setInvestmentsList(prev => [...prev, newInvestment]);
    setTransactionsList(prev => [newTx, ...prev]);

    addSystemLog('Large_Withdrawal', `Fractional buy complete on ${project.name}: ${sharesCount} shares worth $${totalCost} USDT.`, 'Secure');
    return { success: true };
  };

  // Confirm Deposit / Withdrawals in the back-office compliance console
  const handleApproveTransaction = (txId: string) => {
    const matchedTx = transactionsList.find(t => t.id === txId);
    if (!matchedTx) return;

    // Transition status to approved
    const updatedTx: Transaction = {
      ...matchedTx,
      status: 'Approved',
      description: matchedTx.type === 'Deposit' ? 'Deposit receipt matched & authorized.' : 'USDT Withdrawal dispatches processed.'
    };

    let extraTxs: Transaction[] = [];

    // Find the user who did the transaction
    const userObj = usersListState.find(u => u.id === matchedTx.userId);
    if (!userObj) return;

    // Check approved deposits count
    const approvedDepositsCount = transactionsList.filter(
      t => t.userId === userObj.id && t.type === 'Deposit' && t.status === 'Approved'
    ).length;

    const isFirstDeposit = matchedTx.type === 'Deposit' && approvedDepositsCount === 0 && matchedTx.amount >= 113;
    const bonusAmount = isFirstDeposit ? Math.round((matchedTx.amount * 0.10) * 100) / 100 : 0;

    let updatedUsers = usersListState.map(u => {
      if (u.id === matchedTx.userId) {
        if (matchedTx.type === 'Deposit') {
          const finalBalance = Math.round((u.balance + matchedTx.amount + bonusAmount) * 100) / 100;
          const updatedU = {
            ...u,
            balance: finalBalance,
            totalDeposited: u.totalDeposited + matchedTx.amount
          };
          
          if (isFirstDeposit && u.referredBy) {
            // Log referee transaction bonus receipt
            const refereeTx: Transaction = {
              id: `tx-bon-fnd-${Date.now()}`,
              userId: u.id,
              userEmail: u.email,
              type: 'Referral Bonus',
              amount: bonusAmount,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              status: 'Completed',
              description: `🎁 10% First deposit welcome bonus on your qualifying deposit of $${matchedTx.amount.toFixed(2)} USDT.`
            };
            extraTxs.push(refereeTx);
          }
          
          if (activeUser && activeUser.id === u.id) {
            setActiveUser(updatedU);
          }
          saveAndSyncUser(updatedU);
          return updatedU;
        }
        if (matchedTx.type === 'Withdrawal') {
          // Funds were already locked from balances. Just log dispatch check.
          const updatedU = {
            ...u,
            totalWithdrawn: u.totalWithdrawn + matchedTx.amount
          };
          if (activeUser && activeUser.id === u.id) {
            setActiveUser(updatedU);
          }
          saveAndSyncUser(updatedU);
          return updatedU;
        }
      }
      return u;
    });

    // If first deposit, also credit the referrer
    if (isFirstDeposit && userObj.referredBy && bonusAmount > 0) {
      const referralCodeClean = userObj.referredBy.trim().toUpperCase();
      const referrerUserIndex = updatedUsers.findIndex(u => u.referralCode.toUpperCase() === referralCodeClean);
      
      if (referrerUserIndex !== -1) {
        const referrer = updatedUsers[referrerUserIndex];
        const updatedReferrer: UserAccount = {
          ...referrer,
          balance: Math.round((referrer.balance + bonusAmount) * 100) / 100
        };
        updatedUsers[referrerUserIndex] = updatedReferrer;

        // Log referrer transaction bonus receipt
        const referrerTx: Transaction = {
          id: `tx-bon-ref-${Date.now()}`,
          userId: referrer.id,
          userEmail: referrer.email,
          type: 'Referral Bonus',
          amount: bonusAmount,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'Completed',
          description: `🎁 10% Referral partner bonus on ${userObj.email}'s first qualifying deposit.`
        };
        extraTxs.push(referrerTx);
        
        if (activeUser && activeUser.id === referrer.id) {
          setActiveUser(updatedReferrer);
        }
        saveAndSyncUser(updatedReferrer);
      }
    }

    setUsersListState(updatedUsers);

    setTransactionsList(prev => {
      const updatedList = prev.map(t => t.id === txId ? updatedTx : t);
      const combined = [...extraTxs, ...updatedList];
      combined.forEach(tx => saveTransactionToFirebase(tx));
      return combined;
    });

    addSystemLog('Admin_Action', `${updatedTx.type} ID ${txId} approved by compliance admin. Portfolio balances adjusted.`, 'Secure');
    if (extraTxs.length > 0) {
      addSystemLog('Register_Referral', `Dual 10% First Deposit Referral Bonus activated for ${matchedTx.userEmail} & sponsor!`, 'Secure');
    }
  };

  const handleRejectTransaction = (txId: string) => {
    const matchedTx = transactionsList.find(t => t.id === txId);
    if (!matchedTx) return;

    const updatedTx: Transaction = {
      ...matchedTx,
      status: 'Rejected',
      description: 'Transaction declined under secure FBR risk constraints.'
    };

    setTransactionsList(prev => {
      const updatedList = prev.map(t => t.id === txId ? updatedTx : t);
      updatedList.forEach(tx => saveTransactionToFirebase(tx));
      return updatedList;
    });

    // Refund withdrawals if rejected
    if (matchedTx.type === 'Withdrawal') {
      const updatedUsers = usersListState.map(u => {
        if (u.id === matchedTx.userId) {
          const updatedU = {
            ...u,
            balance: Math.round((u.balance + matchedTx.amount) * 100) / 100,
            totalWithdrawn: Math.max(0, u.totalWithdrawn - matchedTx.amount)
          };
          if (activeUser && activeUser.id === u.id) {
            setActiveUser(updatedU);
          }
          saveAndSyncUser(updatedU);
          return updatedU;
        }
        return u;
      });
      setUsersListState(updatedUsers);
    }

    addSystemLog('Admin_Action', `${matchedTx.type} ID ${txId} rejected by compliance admin under UK Companies House & FCA compliance guidelines.`, 'Alarm');
  };

  // Adjust user balance directly
  const handleAdjustUserFunds = (userId: string, amount: number, type: 'add' | 'deduct') => {
    setUsersListState(prev => prev.map(u => {
      if (u.id === userId) {
        const adjustment = type === 'add' ? amount : -amount;
        const finalBalance = Math.max(0, Math.round((u.balance + adjustment) * 100) / 100);
        const updatedU = {
          ...u,
          balance: finalBalance
        };
        if (activeUser && activeUser.id === u.id) {
          setActiveUser(updatedU);
        }
        return updatedU;
      }
      return u;
    }));

    const userObj = usersListState.find(u => u.id === userId);
    const userEmail = userObj ? userObj.email : 'Unknown';
    addSystemLog('Admin_Action', `Compliance Admin adjusted funds for ${userEmail}: ${type === 'add' ? 'Added' : 'Deducted'} $${amount.toFixed(2)} USDT.`, 'Secure');
  };

  // Unbind user wallet address
  const handleUnbindUserWallet = (userId: string, network: 'TRC20' | 'BEP20' | 'both') => {
    setUsersListState(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedWallet = { ...u.wallet };
        if (network === 'TRC20' || network === 'both') {
          updatedWallet.usdtTrc20Address = '';
        }
        if (network === 'BEP20' || network === 'both') {
          updatedWallet.usdtBep20Address = '';
        }
        if (!updatedWallet.usdtTrc20Address && !updatedWallet.usdtBep20Address) {
          updatedWallet.isVerified = false;
        }

        const updatedU = {
          ...u,
          wallet: updatedWallet
        };

        if (activeUser && activeUser.id === u.id) {
          setActiveUser(updatedU);
        }
        return updatedU;
      }
      return u;
    }));

    const userObj = usersListState.find(u => u.id === userId);
    const userEmail = userObj ? userObj.email : 'Unknown';
    addSystemLog('Admin_Action', `Compliance Admin reset/unbound ${network} wallet address for ${userEmail}.`, 'Secure');
  };

  // Update Barcode Scanning Gateway / Scan Gate settings
  const handleUpdateSystemSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    addSystemLog('Admin_Action', `Compliance Admin updated deposit scan gate settings. TRC20 [${newSettings.usdtTrc20Address}], BEP20 [${newSettings.usdtBep20Address}]`, 'Secure');
  };

  // Add new property options
  const handleAddProject = (newProj: RealEstateProject) => {
    setProjectsList(prev => [newProj, ...prev]);
    addSystemLog('Admin_Action', `New smart property listing online: ${newProj.name} listed with ${newProj.totalShares} shares.`, 'Secure');
  };

  const handleUpdateProjectRoi = (projectId: string, newRoi: number) => {
    setProjectsList(prev => prev.map(p => p.id === projectId ? { ...p, expectedRoi: newRoi } : p));
    
    // Recalibrate active investments
    setInvestmentsList(prev => prev.map(inv => {
      if (inv.projectId === projectId) {
        const newDailyProfit = Math.round((inv.totalCost * ((newRoi / 100) / 365)) * 100) / 100;
        return {
          ...inv,
          dailyProfitRate: newDailyProfit
        };
      }
      return inv;
    }));

    addSystemLog('Admin_Action', `Investment plan ${projectId} expected ROI updated to ${newRoi}%. Active investment payout rates recalibrated.`, 'Secure');
  };

  const handleUpdateProject = (updatedProj: RealEstateProject) => {
    setProjectsList(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    
    // Recalibrate active investments
    setInvestmentsList(prev => prev.map(inv => {
      if (inv.projectId === updatedProj.id) {
        const newDailyProfit = Math.round((inv.totalCost * ((updatedProj.expectedRoi / 100) / 365)) * 100) / 100;
        return {
          ...inv,
          projectName: updatedProj.name,
          dailyProfitRate: newDailyProfit
        };
      }
      return inv;
    }));

    addSystemLog('Admin_Action', `Property details updated for ${updatedProj.name}. Recalibrated active portfolios.`, 'Secure');
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectsList(prev => prev.filter(p => p.id !== projectId));
    if (isFirebaseEnabled()) {
      deleteProjectFromFirebase(projectId);
    }
    addSystemLog('Admin_Action', `Property listing ${projectId} deleted from catalog.`, 'Secure');
  };

  // Daily profit interactive Claim trigger
  const handleClaimDailyProfit = async () => {
    if (!activeUser) return { success: false, type: 'inactive_window' as const };

    // Fetch fresh secure time from the server/public API to prevent any client-side timezone/time spoofing!
    const secureNow = await getSecureServerTime();
    const currentHour = secureNow.getHours();
    const currentMinute = secureNow.getMinutes();
    const todayStr = secureNow.toISOString().slice(0, 10); // True UTC or server date, extremely secure!

    // Calculate sum of active investment yields for active user ONLY
    const userInvestments = investmentsList.filter(inv => inv.userId === activeUser.id || inv.userEmail?.toLowerCase() === activeUser.email.toLowerCase());
    const dailyProfitSum = userInvestments.reduce((sum, inv) => {
      const isActive = inv.status === 'Active' || inv.status === undefined;
      return isActive ? sum + inv.dailyProfitRate : sum;
    }, 0);

    if (dailyProfitSum === 0) {
      return { success: false, type: 'no_yield' as const };
    }

    // Ensure we are inside one of the two slots: 4:00 PM-5:00 PM (16) or 9:00 PM-10:00 PM (21)
    if (currentHour !== 16 && currentHour !== 21) {
      return { success: false, type: 'inactive_window' as const };
    }

    const currentSlot = currentHour;

    // Check if they already claimed today in this specific slot based on secure date
    const alreadyClaimed = claimsHistory.some(c => 
      (c.userId === activeUser.id || c.userEmail?.toLowerCase() === activeUser.email.toLowerCase()) &&
      c.date === todayStr && 
      c.status === 'Claimed' && 
      c.slot === currentSlot
    );
    if (alreadyClaimed) {
      return { success: false, type: 'already_claimed' as const };
    }

    // Update user balance
    const updatedUser = {
      ...activeUser,
      balance: Math.round((activeUser.balance + dailyProfitSum) * 100) / 100,
      totalProfitEarned: activeUser.totalProfitEarned + dailyProfitSum
    };

    // Log Claim Receipt Transaction
    const claimTx: Transaction = {
      id: `tx-claim-${Date.now()}`,
      userId: activeUser.id,
      userEmail: activeUser.email,
      type: 'Profit Claim',
      amount: dailyProfitSum,
      date: secureNow.toISOString().replace('T', ' ').slice(0, 16),
      status: 'Completed',
      description: `Dispatched fractional profit yield of $${dailyProfitSum.toFixed(2)} (${currentSlot === 16 ? '04:00 PM' : '09:00 PM'} Slot)`
    };

    // Add record to claims list
    const newClaimRecord: ProfitClaimRecord = {
      id: `claim-rec-${Date.now()}`,
      userId: activeUser.id,
      userEmail: activeUser.email,
      date: todayStr,
      amount: dailyProfitSum,
      status: 'Claimed',
      claimedAt: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
      slot: currentSlot
    };

    setActiveUser(updatedUser);
    setUsersListState(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
    setTransactionsList(prev => [claimTx, ...prev]);
    setClaimsHistory(prev => [newClaimRecord, ...prev]);

    addSystemLog('Large_Withdrawal', `Daily profit payout of $${dailyProfitSum} claims validated successfully at ${currentHour}:${currentMinute} in ${currentSlot === 16 ? '04:00 PM' : '09:00 PM'} slot.`, 'Secure');
    return { success: true, type: 'success' as const, amount: dailyProfitSum };
  };

  // Emergency early liquidation with 20% penalty
  const handleLiquidateInvestment = (investmentId: string) => {
    if (!activeUser) return { success: false, payout: 0 };

    const inv = investmentsList.find(i => i.id === investmentId);
    if (!inv || (inv.status !== 'Active' && inv.status !== undefined)) {
      return { success: false, payout: 0 };
    }

    const deduction = inv.totalCost * 0.20;
    const payout = Math.round((inv.totalCost - deduction) * 100) / 100;

    // Update user balance & total investment basis
    const updatedUser: UserAccount = {
      ...activeUser,
      balance: Math.round((activeUser.balance + payout) * 100) / 100,
      totalInvestment: Math.max(0, Math.round((activeUser.totalInvestment - inv.totalCost) * 100) / 100)
    };

    // Update investment status to 'Liquidated'
    const updatedInvestments = investmentsList.map(item => {
      if (item.id === investmentId) {
        return { ...item, status: 'Liquidated' as const };
      }
      return item;
    });

    // Re-add sold shares back to the property pool
    const updatedProjects = projectsList.map(p => {
      if (p.id === inv.projectId) {
        const restoredShares = p.availableShares + inv.sharesPurchased;
        return {
          ...p,
          availableShares: restoredShares,
          status: restoredShares > 0 ? 'Active' as const : p.status
        };
      }
      return p;
    });

    // Create a transaction receipt for the automatic liquidation
    const liquidationTx: Transaction = {
      id: `tx-liq-${Date.now()}`,
      userId: activeUser.id,
      userEmail: activeUser.email,
      type: 'Deposit',
      amount: payout,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Completed',
      description: `Emergency liquidation: sold ${inv.sharesPurchased} shares of ${inv.projectName} (-20% loss applied)`
    };

    setActiveUser(updatedUser);
    setUsersListState(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
    setInvestmentsList(updatedInvestments);
    setProjectsList(updatedProjects);
    setTransactionsList(prev => [liquidationTx, ...prev]);

    addSystemLog('Admin_Action', `User ${activeUser.email} early liquidated investment ${inv.id}. 20% loss deduction applied ($${deduction.toFixed(2)}), $${payout.toFixed(2)} refunded to main balance.`, 'Secure');

    return { success: true, payout };
  };

  // Simulated Daily/Monthly Rollover (Admin function)
  const handleSimulateDailyRollover = () => {
    // 1. Accrue daily yield for everyone
    // 2. If current time settings were NOT hour 21 (9-10 PM GMT) or user didn't claim: record missed claim!
    const dailyProfitSum = investmentsList.reduce((sum, inv) => {
      const isActive = inv.status === 'Active' || inv.status === undefined;
      return isActive ? sum + inv.dailyProfitRate : sum;
    }, 0);

    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const missedRecord: ProfitClaimRecord = {
      id: `claim-miss-${Date.now()}`,
      date: yesterdayStr,
      amount: dailyProfitSum > 0 ? dailyProfitSum : 2.50,
      status: 'Missed'
    };

    setClaimsHistory(prev => [missedRecord, ...prev]);

    // Plan duration decrement by 1 month for each daily simulation run
    let totalMaturedPrincipal = 0;
    const maturedPropertyNames: string[] = [];

    const updatedInvestments = investmentsList.map(inv => {
      const isActive = inv.status === 'Active' || inv.status === undefined;
      if (isActive) {
        const currentRemaining = inv.remainingMonths !== undefined ? inv.remainingMonths : (inv.durationMonths || 12);
        const newRemaining = Math.max(0, currentRemaining - 1);
        if (newRemaining === 0) {
          totalMaturedPrincipal += inv.totalCost;
          maturedPropertyNames.push(inv.projectName);
          return {
            ...inv,
            remainingMonths: 0,
            status: 'Completed' as const
          };
        }
        return {
          ...inv,
          remainingMonths: newRemaining,
          status: 'Active' as const
        };
      }
      return inv;
    });

    setInvestmentsList(updatedInvestments);

    // If active user has matured investments, automatically return principal to their main account balance
    if (totalMaturedPrincipal > 0 && activeUser) {
      const updatedUser = {
        ...activeUser,
        balance: Math.round((activeUser.balance + totalMaturedPrincipal) * 100) / 100,
        totalInvestment: Math.max(0, Math.round((activeUser.totalInvestment - totalMaturedPrincipal) * 100) / 100)
      };

      const refundTx: Transaction = {
        id: `tx-matured-refund-${Date.now()}`,
        userId: activeUser.id,
        userEmail: activeUser.email,
        type: 'Deposit',
        amount: totalMaturedPrincipal,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'Completed',
        description: `Principal returned automatically upon maturity for: ${maturedPropertyNames.join(', ')}`
      };

      setActiveUser(updatedUser);
      setUsersListState(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
      setTransactionsList(prev => [refundTx, ...prev]);

      addSystemLog('Admin_Action', `Automatic principal maturity payout completed: $${totalMaturedPrincipal.toFixed(2)} credited to ${activeUser.email} balance.`, 'Secure');
    } else {
      addSystemLog('Anti_Fraud_Trigger', `Timed Settlement Rollover ran: Recorded missed claims for uncollected portfolio queues.`, 'Secure');
    }
  };

  // Landing page interactive selection
  const handleSelectProjectFromLanding = (project: RealEstateProject) => {
    if (activeUser) {
      if (activeUser.role === 'admin') {
        setCurrentPage('admin');
      } else {
        setActiveDashboardTab('properties');
        setCurrentPage('dashboard');
        setTimeout(() => {
          const el = document.getElementById(`property-card-${project.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    } else {
      // Lead user automatically to registration as a secure pathway
      setCurrentPage('register');
    }
  };

  const getSimulatedTimeString = () => {
    const isPm = simulatedHour >= 12;
    const dispHour = simulatedHour % 12 === 0 ? 12 : simulatedHour % 12;
    return `${dispHour}:${simulatedMinute.toString().padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;
  };

  return (
    <MobileShell currentTimeString={getSimulatedTimeString()}>
      <GlobalNavbar 
        currentPage={currentPage}
        activeUser={activeUser}
        onNavigate={handlePageNavigation}
        onLogout={handleLogout}
        activeTab={activeDashboardTab}
        setActiveTab={setActiveDashboardTab}
        activeAdminTab={activeAdminTab}
        setActiveAdminTab={setActiveAdminTab}
        onSimulateDailyRollover={handleSimulateDailyRollover}
        setScrollToAnchor={setScrollToAnchor}
        simulatedHour={simulatedHour}
        simulatedMinute={simulatedMinute}
        investments={investmentsList}
        transactions={transactionsList}
      />

      {currentPage === 'home' && (
        <LandingPage 
          onNavigate={handlePageNavigation} 
          onSelectProject={handleSelectProjectFromLanding}
          activeUser={activeUser}
          allTransactions={transactionsList}
          allClaims={claimsHistory}
        />
      )}

      {(currentPage === 'login' || currentPage === 'register' || currentPage === 'forgot') && (
        <AuthPages 
          initialScreen={currentPage}
          onAuthSuccess={handleAuthSuccess}
          onNavigate={handlePageNavigation}
          usersList={usersListState}
          addSystemLog={addSystemLog}
          authReason={authReason}
          onRegisterPending={handleRegisterPending}
          onPasswordReset={handleResetPassword}
        />
      )}

      {currentPage === 'dashboard' && activeUser && (
        <UserDashboard 
          activeUser={activeUser}
          usersList={usersListState}
          projects={projectsList}
          transactions={transactionsList.filter(t => t.userId === activeUser.id || t.userEmail?.toLowerCase() === activeUser.email.toLowerCase())}
          investments={investmentsList.filter(i => i.userId === activeUser.id || i.userEmail?.toLowerCase() === activeUser.email.toLowerCase())}
          claimsHistory={claimsHistory.filter(c => c.userId === activeUser.id || c.userEmail?.toLowerCase() === activeUser.email.toLowerCase())}
          onLogout={handleLogout}
          onNavigateAdmin={handleNavigateAdmin}
          onBindWallet={handleBindWallet}
          onSubmitDeposit={handleSubmitDeposit}
          onSubmitWithdrawal={handleSubmitWithdrawal}
          onPurchaseShares={handlePurchaseShares}
          onClaimDailyProfit={handleClaimDailyProfit}
          onLiquidateInvestment={handleLiquidateInvestment}
          onUpdateUser={handleUpdateUser}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          setSimulatedHour={handleSetSimulatedHour}
          setSimulatedMinute={setSimulatedMinute}
          isTimeSimulated={isTimeSimulated}
          activeTab={activeDashboardTab}
          setActiveTab={setActiveDashboardTab}
          systemSettings={systemSettings}
        />
      )}

      {currentPage === 'admin' && (
        <AdminPanel 
          projects={projectsList}
          transactions={transactionsList}
          usersList={usersListState}
          securityLogs={securityLogsList}
          activeAdminTab={activeAdminTab}
          setActiveAdminTab={setActiveAdminTab}
          onBackToDashboard={activeUser ? handleBackToDashboard : () => setCurrentPage('home')}
          onApproveTransaction={handleApproveTransaction}
          onRejectTransaction={handleRejectTransaction}
          onAddProject={handleAddProject}
          onSimulateDailyRollover={handleSimulateDailyRollover}
          onUpdateProjectRoi={handleUpdateProjectRoi}
          onAdjustUserFunds={handleAdjustUserFunds}
          onUnbindUserWallet={handleUnbindUserWallet}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          systemSettings={systemSettings}
          onUpdateSystemSettings={handleUpdateSystemSettings}
          onUpdateUser={handleUpdateAnyUser}
          currentUser={activeUser}
        />
      )}
    </MobileShell>
  );
}
