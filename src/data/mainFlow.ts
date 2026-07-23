export interface LegacyModule {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  available: boolean;
}

export const mainFlowModules: LegacyModule[] = [
  {
    id: 'auth',
    title: 'Sign In / Register',
    description: 'Enter the system with your personal account or create a new one.',
    actionLabel: 'Open Form',
    available: true,
  },
  {
    id: 'profile',
    title: 'Personal Profile',
    description: 'View your account details and login session status.',
    actionLabel: 'View Now',
    available: true,
  },
  {
    id: 'wallet',
    title: 'Wallet Balance',
    description: 'Check your balance and historical transaction records.',
    actionLabel: 'View Wallet',
    available: true,
  },
  {
    id: 'buildings',
    title: 'Parking & Buildings',
    description: 'List active parking lots, building levels, and parking slots.',
    actionLabel: 'Browse Buildings',
    available: true,
  },
  {
    id: 'packages',
    title: 'Pricing & Packages',
    description: 'Explore flexible hourly or monthly parking package prices.',
    actionLabel: 'Buy Package',
    available: true,
  },
  {
    id: 'feedback',
    title: 'Customer Feedback',
    description: 'View verified feedback and rate your parking experiences.',
    actionLabel: 'View Feedback',
    available: true,
  },
  {
    id: 'sessions',
    title: 'Parking Sessions',
    description: 'Track real-time vehicle entries, exits, and parking history.',
    actionLabel: 'View History',
    available: true,
  },
  {
    id: 'payments',
    title: 'Payments Center',
    description: 'Pay parking fees, tickings, and monthly subscription packages.',
    actionLabel: 'View Subscriptions',
    available: true,
  },
  {
    id: 'notifications',
    title: 'Notifications Hub',
    description: 'Receive real-time alerts and scheduled reminders from the system.',
    actionLabel: 'View Notifications',
    available: true,
  },
];
