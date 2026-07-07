import type { LucideIcon } from 'lucide-react';
import {
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Building2,
  Ticket,
  CalendarClock,
  ScanLine,
  CreditCard,
  BellRing,
  Star,
} from 'lucide-react';

export const navigationLinks = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#gioi-thieu' },
  { label: 'Solutions', href: '#giai-phap' },
  { label: 'Services', href: '#dich-vu' },
  { label: 'Contact', href: '#lien-he' },
];

export const moduleIcons: Record<string, LucideIcon> = {
  auth: ShieldCheck,
  profile: CheckCircle2,
  wallet: Wallet,
  buildings: Building2,
  packages: Ticket,
  reservations: CalendarClock,
  sessions: ScanLine,
  payments: CreditCard,
  notifications: BellRing,
  feedback: Star,
};
