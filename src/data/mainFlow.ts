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
    actionLabel: 'Coming Soon',
    available: false,
  },
  {
    id: 'buildings',
    title: 'Parking & Buildings',
    description: 'List active parking lots, building levels, and parking slots.',
    actionLabel: 'Coming Soon',
    available: false,
  },
  {
    id: 'reservations',
    title: 'Advanced Reservation',
    description: 'Pre-book a premium parking space according to your needs.',
    actionLabel: 'Book Now',
    available: true,
  },
  {
    id: 'sessions',
    title: 'Parking Sessions',
    description: 'Track real-time vehicle entries, exits, and parking history.',
    actionLabel: 'Coming Soon',
    available: false,
  },
  {
    id: 'payments',
    title: 'Payments Center',
    description: 'Pay parking fees, tickings, and monthly subscription packages.',
    actionLabel: 'Coming Soon',
    available: false,
  },
  {
    id: 'notifications',
    title: 'Notifications Hub',
    description: 'Receive real-time alerts and scheduled reminders from the system.',
    actionLabel: 'Coming Soon',
    available: false,
  },
];
