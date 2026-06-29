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
  { label: 'Trang chủ', href: '#top' },
  { label: 'Giới thiệu', href: '#gioi-thieu' },
  { label: 'Giải pháp', href: '#giai-phap' },
  { label: 'Dịch vụ', href: '#dich-vu' },
  { label: 'Liên hệ', href: '#lien-he' },
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
