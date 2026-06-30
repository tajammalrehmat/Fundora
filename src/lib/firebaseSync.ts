/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  getDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { 
  INITIAL_PROJECTS, 
  INITIAL_USER, 
  INITIAL_ADMIN, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SECURITY_LOGS 
} from '../data';
import { 
  RealEstateProject, 
  UserAccount, 
  Transaction, 
  InvestmentRecord, 
  ProfitClaimRecord, 
  SecurityLog,
  SystemSettings
} from '../types';

// Helper to check if Firebase is correctly configured and working
export const isFirebaseEnabled = (): boolean => {
  return !!db;
};

// Seed initial data if the Firestore collections are completely empty
export const seedInitialDataIfEmpty = async () => {
  if (!isFirebaseEnabled()) return;

  try {
    // 1. Projects
    const projectsCol = collection(db, 'projects');
    const projectsSnapshot = await getDocs(projectsCol);
    if (projectsSnapshot.empty) {
      console.log('Seeding initial projects to Firestore...');
      for (const proj of INITIAL_PROJECTS) {
        await setDoc(doc(db, 'projects', proj.id), proj);
      }
    }

    // 2. Users
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    if (usersSnapshot.empty) {
      console.log('Seeding initial users to Firestore...');
      await setDoc(doc(db, 'users', INITIAL_USER.id), INITIAL_USER);
      await setDoc(doc(db, 'users', INITIAL_ADMIN.id), INITIAL_ADMIN);
    }

    // 3. Transactions
    const txCol = collection(db, 'transactions');
    const txSnapshot = await getDocs(txCol);
    if (txSnapshot.empty) {
      console.log('Seeding initial transactions to Firestore...');
      for (const tx of INITIAL_TRANSACTIONS) {
        await setDoc(doc(db, 'transactions', tx.id), tx);
      }
    }

    // 4. Security Logs
    const logsCol = collection(db, 'security_logs');
    const logsSnapshot = await getDocs(logsCol);
    if (logsSnapshot.empty) {
      console.log('Seeding initial security logs to Firestore...');
      for (const log of INITIAL_SECURITY_LOGS) {
        await setDoc(doc(db, 'security_logs', log.id), log);
      }
    }

    // 5. Investments Default
    const invCol = collection(db, 'investments');
    const invSnapshot = await getDocs(invCol);
    if (invSnapshot.empty) {
      console.log('Seeding initial default investments to Firestore...');
      const defaultRecord: InvestmentRecord = {
        id: 'inv-rec-101',
        userId: 'user-demo',
        userEmail: 'investor@example.com',
        projectId: 'proj-1',
        projectName: 'Canary Wharf Heights',
        sharesPurchased: 5,
        totalCost: 565.00,
        purchaseDate: '2026-06-16',
        dailyProfitRate: 2.50,
        durationMonths: 18,
        remainingMonths: 14,
        status: 'Active'
      };
      await setDoc(doc(db, 'investments', defaultRecord.id), defaultRecord);
    }

    // 6. Claims Default
    const claimsCol = collection(db, 'claims');
    const claimsSnapshot = await getDocs(claimsCol);
    if (claimsSnapshot.empty) {
      console.log('Seeding initial claims history to Firestore...');
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
          status: 'Expired'
        }
      ];
      for (const cl of defaultClaims) {
        await setDoc(doc(db, 'claims', cl.id), cl);
      }
    }

    console.log('Firestore initialization & seeding successfully finished.');
  } catch (error) {
    console.error('Error during Firestore seeding:', error);
  }
};

// Generic Load functions (can be used to pull initial snapshots or fall back to local storage)
export const loadProjectsFromFirebase = async (): Promise<RealEstateProject[]> => {
  if (!isFirebaseEnabled()) return INITIAL_PROJECTS;
  try {
    const snapshot = await getDocs(collection(db, 'projects'));
    if (snapshot.empty) return INITIAL_PROJECTS;
    return snapshot.docs.map(d => d.data() as RealEstateProject);
  } catch (e) {
    console.error('Error loading projects from Firebase:', e);
    return INITIAL_PROJECTS;
  }
};

export const loadUsersFromFirebase = async (): Promise<UserAccount[]> => {
  if (!isFirebaseEnabled()) return [INITIAL_USER, INITIAL_ADMIN];
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    if (snapshot.empty) return [INITIAL_USER, INITIAL_ADMIN];
    const users = snapshot.docs.map(d => d.data() as UserAccount);
    
    // Automatically migrate old admin email to no-reply@fundora.one if found
    let migrated = false;
    const migratedUsers = users.map(u => {
      if (u.id === 'user-admin' && u.email === 'admin@fundora.one') {
        migrated = true;
        return { ...u, email: 'no-reply@fundora.one' };
      }
      return u;
    });

    if (migrated) {
      const adminUserObj = migratedUsers.find(u => u.id === 'user-admin');
      if (adminUserObj) {
        // Save the updated user back to Firebase
        await setDoc(doc(db, 'users', adminUserObj.id), adminUserObj);
      }
    }

    return migratedUsers;
  } catch (e) {
    console.error('Error loading users from Firebase:', e);
    return [INITIAL_USER, INITIAL_ADMIN];
  }
};

export const loadTransactionsFromFirebase = async (): Promise<Transaction[]> => {
  if (!isFirebaseEnabled()) return INITIAL_TRANSACTIONS;
  try {
    const snapshot = await getDocs(collection(db, 'transactions'));
    if (snapshot.empty) return INITIAL_TRANSACTIONS;
    // Sort transactions by date descending or ID
    const txs = snapshot.docs.map(d => d.data() as Transaction);
    return txs.sort((a, b) => b.date.localeCompare(a.date));
  } catch (e) {
    console.error('Error loading transactions from Firebase:', e);
    return INITIAL_TRANSACTIONS;
  }
};

export const loadInvestmentsFromFirebase = async (): Promise<InvestmentRecord[]> => {
  if (!isFirebaseEnabled()) return [];
  try {
    const snapshot = await getDocs(collection(db, 'investments'));
    return snapshot.docs.map(d => d.data() as InvestmentRecord);
  } catch (e) {
    console.error('Error loading investments from Firebase:', e);
    return [];
  }
};

export const loadClaimsFromFirebase = async (): Promise<ProfitClaimRecord[]> => {
  if (!isFirebaseEnabled()) return [];
  try {
    const snapshot = await getDocs(collection(db, 'claims'));
    return snapshot.docs.map(d => d.data() as ProfitClaimRecord);
  } catch (e) {
    console.error('Error loading claims from Firebase:', e);
    return [];
  }
};

export const loadSecurityLogsFromFirebase = async (): Promise<SecurityLog[]> => {
  if (!isFirebaseEnabled()) return INITIAL_SECURITY_LOGS;
  try {
    const snapshot = await getDocs(collection(db, 'security_logs'));
    if (snapshot.empty) return INITIAL_SECURITY_LOGS;
    const logs = snapshot.docs.map(d => d.data() as SecurityLog);
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (e) {
    console.error('Error loading security logs from Firebase:', e);
    return INITIAL_SECURITY_LOGS;
  }
};

// Write helpers for real-time synchronization
export const saveProjectToFirebase = async (proj: RealEstateProject) => {
  if (!isFirebaseEnabled()) return;
  try {
    await setDoc(doc(db, 'projects', proj.id), proj);
  } catch (e) {
    console.error('Failed to save project to Firebase:', e);
  }
};

export const saveUserToFirebase = async (user: UserAccount) => {
  if (!isFirebaseEnabled()) return;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (e) {
    console.error('Failed to save user to Firebase:', e);
  }
};

export const saveTransactionToFirebase = async (tx: Transaction) => {
  if (!isFirebaseEnabled()) return;
  try {
    await setDoc(doc(db, 'transactions', tx.id), tx);
  } catch (e) {
    console.error('Failed to save transaction to Firebase:', e);
  }
};

export const saveInvestmentToFirebase = async (inv: InvestmentRecord) => {
  if (!isFirebaseEnabled()) return;
  try {
    await setDoc(doc(db, 'investments', inv.id), inv);
  } catch (e) {
    console.error('Failed to save investment to Firebase:', e);
  }
};

export const saveClaimToFirebase = async (claim: ProfitClaimRecord) => {
  if (!isFirebaseEnabled()) return;
  try {
    await setDoc(doc(db, 'claims', claim.id), claim);
  } catch (e) {
    console.error('Failed to save claim to Firebase:', e);
  }
};

export const saveSecurityLogToFirebase = async (log: SecurityLog) => {
  if (!isFirebaseEnabled()) return;
  try {
    await setDoc(doc(db, 'security_logs', log.id), log);
  } catch (e) {
    console.error('Failed to save security log to Firebase:', e);
  }
};

// Deletions / Batch updaters (For admin dashboard actions)
export const deleteProjectFromFirebase = async (id: string) => {
  if (!isFirebaseEnabled()) return;
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (e) {
    console.error('Failed to delete project from Firebase:', e);
  }
};

export const loadSystemSettingsFromFirebase = async (): Promise<SystemSettings> => {
  const defaultSettings: SystemSettings = {
    id: 'default',
    usdtTrc20Address: 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy',
    usdtBep20Address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    scanGateTitle: 'Barcode Scanning Gateway',
    scanGateSubtitle: 'Dispatch on the matching blockchain. Tokens sent to mismatched networks are irreversibly lost.'
  };

  if (!isFirebaseEnabled()) return defaultSettings;
  try {
    const docRef = doc(db, 'system_settings', 'default');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SystemSettings;
    } else {
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }
  } catch (e) {
    console.error('Error loading system settings from Firebase:', e);
    return defaultSettings;
  }
};

export const saveSystemSettingsToFirebase = async (settings: SystemSettings) => {
  if (!isFirebaseEnabled()) return;
  try {
    await setDoc(doc(db, 'system_settings', 'default'), settings);
  } catch (e) {
    console.error('Failed to save system settings to Firebase:', e);
  }
};

