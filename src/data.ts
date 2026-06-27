/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RealEstateProject, UserAccount, Transaction, SecurityLog } from './types';

export const INITIAL_PROJECTS: RealEstateProject[] = [
  {
    id: 'proj-1',
    name: 'Canary Wharf Heights',
    location: 'Canary Wharf, London, UK',
    category: 'Residential',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    totalShares: 1500,
    availableShares: 412,
    pricePerShare: 113, // Matches standard example
    expectedRoi: 16.5,
    durationMonths: 18,
    description: 'Canary Wharf Heights sets a new benchmark for luxury high-rise living with panoramic views of the River Thames. It features private elevators, climate-controlled infinity spas, and direct access to London\'s pre-eminent financial hub.',
    status: 'Active',
    documents: ['Brochure_CanaryWharf.pdf', 'UK_Land_Registry_Approval.pdf', 'NOC_London_Municipality.pdf']
  },
  {
    id: 'proj-2',
    name: 'The Bishopsgate Corporate Plaza',
    location: 'Bishopsgate, London, UK',
    category: 'Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    totalShares: 2000,
    availableShares: 210,
    pricePerShare: 250,
    expectedRoi: 19.2,
    durationMonths: 24,
    description: 'An elite, high-visibility commercial workspace within the heart of London\'s financial district. Fully leased by tier-1 institutional and fintech companies, offering a steady and secure monthly yield.',
    status: 'Active',
    documents: ['Plaza_MasterPlan.pdf', 'UK_Companies_House_Consent.pdf', 'Commercial_Lease_Agreement.pdf']
  },
  {
    id: 'proj-3',
    name: 'Kensington Palace Gardens Suites',
    location: 'Kensington, London, UK',
    category: 'Luxury',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    totalShares: 1000,
    availableShares: 0, // Sold Out example
    pricePerShare: 150,
    expectedRoi: 14.8,
    durationMonths: 12,
    description: 'Luxurious fully-furnished serviced studio apartments managed by a premium London hospitality chain. It offers a hassle-free, fully managed luxury residential yield with exceptional occupancy rates.',
    status: 'Sold Out',
    documents: ['Suite_Specs_Kensington.pdf', 'UK_Building_Permit.pdf']
  },
  {
    id: 'proj-4',
    name: 'Manchester MediaCity Smart Living',
    location: 'MediaCity, Manchester, UK',
    category: 'Co-Living',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    totalShares: 1200,
    availableShares: 875,
    pricePerShare: 113,
    expectedRoi: 15.0,
    durationMonths: 15,
    description: 'A modern, tech-enabled micro-housing and co-living space designed specifically for UK tech professionals and digital entrepreneurs. Featuring dual gigabit fiber connections, collaborative hubs, and low carbon energy ratings.',
    status: 'Active',
    documents: ['CoLiving_Investment_Memo.pdf', 'UK_Environmental_Assessment.pdf']
  },
  {
    id: 'proj-5',
    name: 'Birmingham Commercial Atrium',
    location: 'Bullring, Birmingham, UK',
    category: 'Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1554469384-e58fa16e2d09?auto=format&fit=crop&w=800&q=80',
    totalShares: 800,
    availableShares: 800, // Upcoming/Just Added
    pricePerShare: 125,
    expectedRoi: 17.8,
    durationMonths: 20,
    description: 'A state-of-the-art retail atrium featuring premium shopping units and high-footfall dining zones in the heart of Birmingham\'s vibrant commercial zone.',
    status: 'Upcoming',
    documents: ['Atrium_Feasibility_Study.pdf', 'UK_Development_Approval.pdf']
  },
  {
    id: 'proj-6',
    name: 'Emaar Downtown Boulevard Suites',
    location: 'Downtown Dubai, UAE',
    category: 'Luxury',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    totalShares: 1800,
    availableShares: 920,
    pricePerShare: 113,
    expectedRoi: 18.5,
    durationMonths: 24,
    description: 'Ultra-luxurious serviced apartments situated directly opposite Burj Khalifa. Managed by the Emaar hospitality group, offering premium tax-free rental yields and high-frequency capital appreciation.',
    status: 'Active',
    documents: ['Emaar_Downtown_Specs.pdf', 'Dubai_DLD_Approval.pdf', 'NOC_Emaar_Properties.pdf']
  },
  {
    id: 'proj-7',
    name: 'Dubai Marina Horizon Tower',
    location: 'Dubai Marina, UAE',
    category: 'Residential',
    imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80',
    totalShares: 1400,
    availableShares: 550,
    pricePerShare: 150,
    expectedRoi: 16.2,
    durationMonths: 18,
    description: 'Breathtaking high-rise residential complex located on the Dubai Marina waterfront. Enjoy high occupancy levels driven by expatriate business professionals and luxury holiday travelers.',
    status: 'Active',
    documents: ['Marina_Horizon_Brochure.pdf', 'Dubai_Land_Department_NOC.pdf']
  }
];

export const INITIAL_USER: UserAccount = {
  id: 'user-demo',
  email: 'investor@example.com',
  name: 'Alex Mercer',
  role: 'user',
  referralCode: 'FUNDORA500',
  referredBy: 'ADMIN100',
  wallet: {
    usdtTrc20Address: 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy',
    usdtBep20Address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    isVerified: true
  },
  balance: 350.00,
  totalDeposited: 1200.00,
  totalWithdrawn: 150.00,
  totalInvestment: 700.00,
  totalProfitEarned: 132.50,
  isEmailVerified: true,
  registrationDate: '2026-04-10'
};

export const INITIAL_ADMIN: UserAccount = {
  id: 'user-admin',
  email: 'admin@fundora.one',
  name: 'Platform Administrator',
  role: 'admin',
  referralCode: 'FUNDORA_HQ',
  wallet: {
    usdtTrc20Address: '',
    usdtBep20Address: '',
    isVerified: true
  },
  balance: 99420.00,
  totalDeposited: 0,
  totalWithdrawn: 0,
  totalInvestment: 0,
  totalProfitEarned: 0,
  isEmailVerified: true,
  registrationDate: '2026-01-01'
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-201',
    userId: 'user-demo',
    userEmail: 'investor@example.com',
    type: 'Deposit',
    amount: 1000.0,
    date: '2026-06-15 14:10',
    status: 'Approved',
    txHash: 'df8a149c4021bb55e7178a9c336b9e82103fca913ac6be0b5c1901a18bc00ea2',
    network: 'TRC20',
    walletAddress: 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy',
    description: 'USDT TRC20 Deposit'
  },
  {
    id: 'tx-202',
    userId: 'user-demo',
    userEmail: 'investor@example.com',
    type: 'Investment',
    amount: 565.0, // 5 shares of Emaar @ 113
    date: '2026-06-16 09:22',
    status: 'Completed',
    description: 'Purchased 5 shares of Canary Wharf Heights'
  },
  {
    id: 'tx-203',
    userId: 'user-demo',
    userEmail: 'investor@example.com',
    type: 'Withdrawal',
    amount: 150.0,
    date: '2026-06-18 17:45',
    status: 'Approved',
    txHash: '0x9924a7bc901a348ae88cd90fbc9821abd0192e10e928abceef987ade984bcb92',
    network: 'BEP20',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    description: 'USDT BEP20 Withdrawal'
  },
  {
    id: 'tx-204',
    userId: 'user-demo',
    userEmail: 'investor@example.com',
    type: 'Deposit',
    amount: 200.0,
    date: '2026-06-20 12:00',
    status: 'Approved',
    txHash: 'ca880bceef92987ade984bcb92abdf8a149c4021bb55e7178a9c336b9e82103f',
    network: 'TRC20',
    walletAddress: 'TX1h2A9eFm7xKsZ8Jq9wDpBcNdKyLmTqRy',
    description: 'USDT TRC20 Deposit'
  },
  {
    id: 'tx-205',
    userId: 'user-demo',
    userEmail: 'investor@example.com',
    type: 'Investment',
    amount: 135.0, // 1 share of other or fractional allocation
    date: '2026-06-21 15:30',
    status: 'Completed',
    description: 'Purchased 1 share of Canary Wharf Heights plus gas fee'
  },
  {
    id: 'tx-206',
    userId: 'user-demo',
    userEmail: 'investor@example.com',
    type: 'Profit Claim',
    amount: 12.50,
    date: '2026-06-21 21:15',
    status: 'Completed',
    description: 'Daily profit claimed successfully'
  }
];

export const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-22 12:01',
    eventType: 'Login_Success',
    description: 'Successful authentication for investor@example.com. JWT generated.',
    ipAddress: '198.51.100.45',
    status: 'Secure'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-22 10:45',
    eventType: 'Wallet_Verification',
    description: 'TRC20 Wallet bound and verified by platform smart check.',
    ipAddress: '198.51.100.45',
    status: 'Secure'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-21 22:50',
    eventType: 'Anti_Fraud_Trigger',
    description: 'IP check: No concurrent multiple logins detected for active session.',
    ipAddress: '198.51.100.45',
    status: 'Secure'
  },
  {
    id: 'log-4',
    timestamp: '2026-06-20 23:30',
    eventType: 'Large_Withdrawal',
    description: 'Automated limit trigger checked: Withdrawal amount $150.0 is within threshold.',
    ipAddress: '198.51.100.45',
    status: 'Secure'
  }
];

export const FAQS = [
  {
    q: 'How does fractional real estate investing work?',
    a: 'We divide premium physical properties (residential apartment buildings, corporate offices, smart housing) into fractional shares. By purchasing a share, you gain fractional beneficial ownership of that title and are legally entitled to receive the corresponding rental yield and capital appreciation.'
  },
  {
    q: 'What is the minimum investment amount?',
    a: 'The minimum investment is exactly one share of a property. Our default target share price is set to $113, allowing retail investors to participate in prime institutional-grade property assets.'
  },
  {
    q: 'At what time can I claim my daily profit distribution?',
    a: 'To optimize liquidity settlements, profits can be claimed twice daily: between 04:00 PM and 05:00 PM, and again between 09:00 PM and 10:00 PM. If you do not press the Collect button during either of these 1-hour windows, the profit for that specific slot will expire and cannot be retrieved.'
  },
  {
    q: 'How does the 10% referral flow reward work?',
    a: 'When someone completes a registration using your unique referral code and builds their first investment of at least 1 share worth $113 or more (qualifying investment): both you (the referrer) and your friend (the referee) instantly receive a cash bonus equal to 10% of their investment size in your main balances.'
  },
  {
    q: 'How long do deposit and withdrawal approvals take?',
    a: 'USDT TRC20 and BEP20 deposits are automatically verified after transaction hash input or processed within minutes. Withdrawals are authorized by our compliance desk three times a day to maintain anti-fraud protocols, taking typically 1 to 4 hours.'
  }
];

export const STATIC_REPORTS = {
  totalInvestors: 14890,
  totalProperties: 12,
  totalInvestment: 38450110,
  totalProfitDistributed: 4290880
};
